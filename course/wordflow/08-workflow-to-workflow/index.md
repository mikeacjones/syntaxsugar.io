# 08 · Workflow to Workflow

> Hints. The first two are free. After that, each costs a player 10 points, paid by the Player Workflow.

- Course: [Wordflow: Learn Temporal by Building a Word Game](https://syntaxsugar.io/course/wordflow/index.md)
- Section: Lessons
- Author: Michael Jones
- Updated: 2026-10-05
- URL: https://syntaxsugar.io/course/wordflow/08-workflow-to-workflow/

**Goal:** hints. The first two are free. After that, each costs a player 10 points, paid by the Player Workflow.

## Concepts

**Workflows can't call the Client.** A Client call is a network call, so it isn't deterministic. To send a message to another Workflow, a Workflow runs an Activity, and the Activity uses a Client. The Worker gives the Activity its Client when it starts. That's dependency injection, the same as the puzzle store in Lesson 2.

**Errors that mean "no".** When the Player rejects a payment (not enough points), the Activity gets an application error. Retrying won't change the answer, so the Activity makes it non-retryable.

**Idempotency across Workflows.** An Activity can run more than once. For example, a Worker crash after the Update succeeded but before the result was recorded causes a retry. If each attempt sent a new Update, the player could pay twice. Instead, the Update ID is derived from the hint request's own Update ID. Every retry of the same hint sends the same Update ID, and the Player de-duplicates it.

**Handlers interleave.** While the `hint` handler waits for its Activity, other handlers run. A guess could finish the game in the middle of a hint. A Workflow **mutex** makes the handlers that touch the game take turns. After getting the lock, re-check the rules: the validator ran before the wait.

## Patterns

- [Activity Dependency Injection](https://docs.temporal.io/design-patterns/activity-dependency-injection)
- [Non-Retryable Errors](https://docs.temporal.io/design-patterns/non-retryable-errors)

## What you'll build

- A `spendPoints` Update on `PlayerWorkflow`. Its validator checks the game is the player's active game and that the player has enough points.
- A `SpendPoints` Activity that sends that Update with a Client, using the Update ID it's given.
- A `hint` Update on `GameWorkflow`: lock, re-check, pay if it's not free, reveal a letter.
- The `guess` handler takes the same lock.
- `UseHint` in the API sends the `hint` Update.

## Build it

**Go:**

### 1. Names and types

In `app/shared/shared.go`, add `UpdateHint = "hint"` to the Game names and `UpdateSpendPoints = "spendPoints"` to the Player names. Then add:

```go
type SpendPointsInput struct {
	GameID string `json:"gameId"`
	Amount int    `json:"amount"`
}

type SpendPointsResult struct {
	Remaining int `json:"remaining"`
}

type SpendPointsActivityInput struct {
	PlayerID string `json:"playerId"`
	GameID   string `json:"gameId"`
	Amount   int    `json:"amount"`
	UpdateID string `json:"updateId"`
}
```

### 2. The Player accepts payments

In `app/workflows/player.go`, after the `startGame` handler:

```go
	err = workflow.SetUpdateHandlerWithOptions(ctx, shared.UpdateSpendPoints,
		func(ctx workflow.Context, input shared.SpendPointsInput) (shared.SpendPointsResult, error) {
			player.Spend(input.Amount)
			return shared.SpendPointsResult{Remaining: player.Points}, nil
		},
		workflow.UpdateHandlerOptions{
			Validator: func(ctx workflow.Context, input shared.SpendPointsInput) error {
				return player.CheckSpend(input.GameID, input.Amount)
			},
		},
	)
	if err != nil {
		return err
	}
```

### 3. An Activity with a Client

Create `app/activities/players.go`:

```go
package activities

import (
	"context"
	"errors"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/temporal"

	"wordflow/app/shared"
)

// PlayerActivities send messages to Player Workflows using a Temporal Client.
type PlayerActivities struct {
	Client client.Client
}

// SpendPoints asks a Player Workflow to spend points.
func (a *PlayerActivities) SpendPoints(ctx context.Context, input shared.SpendPointsActivityInput) (shared.SpendPointsResult, error) {
	handle, err := a.Client.UpdateWorkflow(ctx, client.UpdateWorkflowOptions{
		WorkflowID:   shared.PlayerWorkflowID(input.PlayerID),
		UpdateID:     input.UpdateID,
		UpdateName:   shared.UpdateSpendPoints,
		Args:         []any{shared.SpendPointsInput{GameID: input.GameID, Amount: input.Amount}},
		WaitForStage: client.WorkflowUpdateStageCompleted,
	})
	var result shared.SpendPointsResult
	if err == nil {
		err = handle.Get(ctx, &result)
	}

	var appErr *temporal.ApplicationError
	if errors.As(err, &appErr) {
		// The Player said no. Asking again will get the same answer.
		return result, temporal.NewNonRetryableApplicationError(appErr.Message(), appErr.Type(), err)
	}
	return result, err
}
```

The Activity uses the same API as your HTTP code. Network errors stay retryable.

Register it in `app/cmd/worker/main.go`, passing the Worker's Client:

```go
	w.RegisterActivity(&activities.PlayerActivities{Client: c})
```

### 4. The hint Update

In `app/workflows/game.go`, create a mutex after `var state *game.State`:

```go
	// Handlers that block (on an Activity) take this lock so they run one at a time.
	lock := workflow.NewMutex(ctx)
```

At the top of the `guess` handler, take it:

```go
			if err := lock.Lock(ctx); err != nil {
				return game.GuessResult{}, err
			}
			defer lock.Unlock()
```

Register `hint` with the other handlers:

```go
	err = workflow.SetUpdateHandlerWithOptions(ctx, shared.UpdateHint,
		func(ctx workflow.Context) (game.HintResult, error) {
			if err := lock.Lock(ctx); err != nil {
				return game.HintResult{}, err
			}
			defer lock.Unlock()

			// The game may have changed while this handler waited for the lock.
			if err := state.CheckHint(); err != nil {
				return game.HintResult{}, err
			}
			cost := state.NextHintCost()
			if cost > 0 {
				if err := spendPoints(ctx, state, cost); err != nil {
					return game.HintResult{}, err
				}
			}
			if err := state.RevealLetter(workflow.Now(ctx)); err != nil {
				return game.HintResult{}, err
			}
			return game.HintResult{PointsSpent: cost, Game: state.View()}, nil
		},
		workflow.UpdateHandlerOptions{
			Validator: func(ctx workflow.Context) error {
				if err := checkLoaded(state); err != nil {
					return err
				}
				return state.CheckHint()
			},
		},
	)
	if err != nil {
		return game.Result{}, err
	}
```

Add the helper:

```go
// spendPoints asks the player's Workflow to pay for a hint.
func spendPoints(ctx workflow.Context, state *game.State, amount int) error {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	})
	input := shared.SpendPointsActivityInput{
		PlayerID: state.PlayerID,
		GameID:   state.GameID,
		Amount:   amount,
		// Same hint request, same Update ID: a retried Activity cannot charge twice.
		UpdateID: state.GameID + "-hint-" + workflow.GetCurrentUpdateInfo(ctx).ID,
	}
	var a *activities.PlayerActivities
	return workflow.ExecuteActivity(ctx, a.SpendPoints, input).Get(ctx, nil)
}
```

- `workflow.Mutex` is safe in Workflow code. `sync.Mutex` is not.
- `GetCurrentUpdateInfo(ctx).ID` is the ID of the `hint` Update being handled: the API's request ID.
- The guest check is in `CheckHint`, so guests never reach `spendPoints`.

### 5. The API

```go
func (a *API) UseHint(ctx context.Context, req httpapi.GameRequest) (game.HintResult, error) {
	handle, err := a.Temporal.UpdateWorkflow(ctx, client.UpdateWorkflowOptions{
		WorkflowID:   req.GameID,
		UpdateID:     req.RequestID,
		UpdateName:   shared.UpdateHint,
		WaitForStage: client.WorkflowUpdateStageCompleted,
	})
	if err != nil {
		return game.HintResult{}, err
	}
	var result game.HintResult
	err = handle.Get(ctx, &result)
	return result, err
}
```

### 6. Run it

```sh
make clean-workflows
```

Restart the Worker and the server. Compare with `solutions/08`.



## Check it

Run `make clean-workflows`, restart the Worker and the server, and join again.

- [ ] Click **Hint** twice. Each reveals a letter and costs nothing.
- [ ] Click **Hint** again. It reveals a letter and the player panel drops by 10 points. The game's history has a `SpendPoints` Activity. `player-alice` has a `spendPoints` Update with an ID ending in `-hint-<hint Update ID>`.

  *[Image: A paid hint]*

  *[Image: The SpendPoints Activity in the game's history]*

  *[Image: The spendPoints Update in the player's history]*

- [ ] Keep buying hints until you have fewer than 10 points. You get **not enough points**. The `SpendPoints` Activity failed after one attempt, and no letter was revealed.
- [ ] As a guest, the third hint says **guests only get 2 free hints**, and no Activity runs.

## Think about it

The lock stops a guess from ending the game mid-hint, but the clock doesn't take the lock. If the game times out while `SpendPoints` runs, the player has paid and the reveal fails. Two Workflows can't change state in one step. The [Saga exercise](/course/wordflow/saga/) shows how to undo a step when a later one fails.
