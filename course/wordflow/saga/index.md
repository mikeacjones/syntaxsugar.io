# Extra · Saga

> Players can gift points to each other. If the gift can't be delivered, the sender gets their points back.

- Course: [Wordflow: Learn Temporal by Building a Word Game](https://syntaxsugar.io/course/wordflow/index.md)
- Section: Optional exercises
- Author: Michael Jones
- Updated: 2026-10-05
- URL: https://syntaxsugar.io/course/wordflow/saga/

**Goal:** players can gift points to each other. If the gift can't be delivered, the sender gets their points back.

## Concepts

**No transactions across Workflows.** A gift changes two Player Workflows. There's no way to change both in one step: the first can succeed and the second fail.

**Saga.** Run the steps in order. After each step succeeds, record a **compensation** that undoes it. If a later step fails, run the recorded compensations in reverse order.

**Compensations must finish.** They're Activities, so they're retried. Make them safe to repeat. Run them in a context that isn't cancelled, so they still run if the Workflow itself is cancelled.

**IDs for each step.** Each step's Update ID is built from the transfer's Run ID and the step name. A retried step can't apply twice, but two gifts between the same players are still separate.

## Patterns

- [Saga](https://docs.temporal.io/design-patterns/saga-pattern)

## What you'll build

- `withdraw` and `deposit` Updates on `PlayerWorkflow`, with validators.
- `Withdraw` and `Deposit` Activities. A rejection or a missing player is non-retryable.
- `TransferPointsWorkflow`: withdraw from the sender, record "refund the sender", deposit to the recipient. On failure, run the compensations.
- A small command-line client that runs a transfer and prints the result.

## Build it

**Go:**

Start from your Lesson 13 code. The finished code for every extra is in `solutions/extras`.

### 1. Names

Create `app/shared/extras.go`. The other extras add to it as well:

```go
package shared

// Extra: Saga. PlayerWorkflow Updates used to move points between players.
const (
	UpdateWithdraw = "withdraw"
	UpdateDeposit  = "deposit"
)

type PointsInput struct {
	Amount int `json:"amount"`
}

type PointsActivityInput struct {
	PlayerID string `json:"playerId"`
	Amount   int    `json:"amount"`
	UpdateID string `json:"updateId"`
}

type TransferInput struct {
	From   string `json:"from"`
	To     string `json:"to"`
	Amount int    `json:"amount"`
}
```

### 2. Player Updates

In `app/workflows/player.go`, after `spendPoints`:

```go
	err = workflow.SetUpdateHandlerWithOptions(ctx, shared.UpdateWithdraw,
		func(ctx workflow.Context, input shared.PointsInput) (game.PlayerView, error) {
			player.Withdraw(input.Amount)
			return player.View(), nil
		},
		workflow.UpdateHandlerOptions{
			Validator: func(ctx workflow.Context, input shared.PointsInput) error {
				return player.CheckWithdraw(input.Amount)
			},
		},
	)
	if err != nil {
		return err
	}

	err = workflow.SetUpdateHandlerWithOptions(ctx, shared.UpdateDeposit,
		func(ctx workflow.Context, input shared.PointsInput) (game.PlayerView, error) {
			player.Credit(input.Amount)
			return player.View(), nil
		},
		workflow.UpdateHandlerOptions{
			Validator: func(ctx workflow.Context, input shared.PointsInput) error {
				return player.CheckCredit(input.Amount)
			},
		},
	)
	if err != nil {
		return err
	}
```

### 3. Activities

In `app/activities/players.go`, import `"go.temporal.io/api/serviceerror"` and add:

```go
// Withdraw takes points from a player.
func (a *PlayerActivities) Withdraw(ctx context.Context, input shared.PointsActivityInput) error {
	return a.changePoints(ctx, shared.UpdateWithdraw, input)
}

// Deposit gives points to a player.
func (a *PlayerActivities) Deposit(ctx context.Context, input shared.PointsActivityInput) error {
	return a.changePoints(ctx, shared.UpdateDeposit, input)
}

func (a *PlayerActivities) changePoints(ctx context.Context, update string, input shared.PointsActivityInput) error {
	handle, err := a.Client.UpdateWorkflow(ctx, client.UpdateWorkflowOptions{
		WorkflowID:   shared.PlayerWorkflowID(input.PlayerID),
		UpdateID:     input.UpdateID,
		UpdateName:   update,
		Args:         []any{shared.PointsInput{Amount: input.Amount}},
		WaitForStage: client.WorkflowUpdateStageCompleted,
	})
	if err == nil {
		err = handle.Get(ctx, nil)
	}

	var appErr *temporal.ApplicationError
	var notFound *serviceerror.NotFound
	switch {
	case errors.As(err, &appErr):
		return temporal.NewNonRetryableApplicationError(appErr.Message(), appErr.Type(), err)
	case errors.As(err, &notFound):
		return temporal.NewNonRetryableApplicationError("no player named "+input.PlayerID, "player_not_found", err)
	}
	return err
}
```

### 4. The Saga

Create `app/workflows/transfer.go`:

```go
package workflows

import (
	"time"

	"go.temporal.io/sdk/workflow"

	"wordflow/app/activities"
	"wordflow/app/shared"
)

// TransferPointsWorkflow gifts points from one player to another. Each step
// that succeeds adds a compensation. If a later step fails, the compensations
// run in reverse order.
func TransferPointsWorkflow(ctx workflow.Context, input shared.TransferInput) (err error) {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	})
	// The Run ID is unique to this transfer, even when the Workflow ID is reused.
	transferID := workflow.GetInfo(ctx).WorkflowExecution.RunID
	points := func(playerID, step string) shared.PointsActivityInput {
		return shared.PointsActivityInput{PlayerID: playerID, Amount: input.Amount, UpdateID: transferID + "-" + step}
	}
	var a *activities.PlayerActivities

	var compensations []func(workflow.Context) error
	defer func() {
		if err == nil {
			return
		}
		// Compensate even if this Workflow was canceled.
		ctx, _ := workflow.NewDisconnectedContext(ctx)
		for i := len(compensations) - 1; i >= 0; i-- {
			if cerr := compensations[i](ctx); cerr != nil {
				workflow.GetLogger(ctx).Error("compensation failed", "error", cerr)
			}
		}
	}()

	if err := workflow.ExecuteActivity(ctx, a.Withdraw, points(input.From, "withdraw")).Get(ctx, nil); err != nil {
		return err
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(ctx, a.Deposit, points(input.From, "refund")).Get(ctx, nil)
	})

	return workflow.ExecuteActivity(ctx, a.Deposit, points(input.To, "deposit")).Get(ctx, nil)
}
```

- The named result `err` lets the deferred function see how the Workflow ended.
- `NewDisconnectedContext` gives a context that isn't cancelled when the Workflow is.
- With two steps, the list holds one compensation. The structure stays the same as you add steps.

Register it in the Worker and in `app/cmd/replay/main.go`:

```go
	w.RegisterWorkflow(workflows.TransferPointsWorkflow)
```

### 5. A client

Create `app/cmd/gift/main.go`:

```go
// Command gift moves points from one player to another.
//
//	go run ./app/cmd/gift -from alice -to bob -amount 5
package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"go.temporal.io/sdk/client"

	"wordflow/app/shared"
	"wordflow/app/workflows"
)

func main() {
	from := flag.String("from", "", "player giving points")
	to := flag.String("to", "", "player receiving points")
	amount := flag.Int("amount", 0, "points to give")
	flag.Parse()

	c, err := client.Dial(client.Options{})
	if err != nil {
		log.Fatalln("unable to connect to Temporal:", err)
	}
	defer c.Close()

	ctx := context.Background()
	run, err := c.ExecuteWorkflow(ctx, client.StartWorkflowOptions{
		ID:        fmt.Sprintf("gift-%s-%s", *from, *to),
		TaskQueue: shared.TaskQueue,
	}, workflows.TransferPointsWorkflow, shared.TransferInput{From: *from, To: *to, Amount: *amount})
	if err != nil {
		log.Fatalln("unable to start transfer:", err)
	}
	fmt.Println("started", run.GetID(), run.GetRunID())

	if err := run.Get(ctx, nil); err != nil {
		log.Fatalln("transfer failed:", err)
	}
	fmt.Printf("%s gave %s %d points\n", *from, *to, *amount)
}
```

### 6. Run it

`PlayerWorkflow` only gained handlers, which don't produce commands, so running players replay fine. Restart the Worker, then:

```sh
go run ./app/cmd/gift -from alice -to bob -amount 5
go run ./app/cmd/gift -from alice -to nobody -amount 5
go run ./app/cmd/gift -from alice -to bob -amount 100
```



## Check it

Join as `alice` and `bob` first.

- [ ] Gift 5 points from `alice` to `bob`. It succeeds, and the player panels show 15 and 25.
- [ ] Gift 5 from `alice` to `nobody`. It fails with **no player named nobody**, and Alice still has 15. The transfer's history shows `Withdraw` completed, `Deposit` failed, and then a second `Deposit`, the refund, completed.

  *[Image: Withdraw, a failed Deposit, then the refund]*

- [ ] Gift 100 from `alice`. It fails with **not enough points**. Nothing was withdrawn, so there's nothing to compensate.
- [ ] Gift 3 from `alice` to `bob` again. It succeeds: a new run with new Update IDs.
