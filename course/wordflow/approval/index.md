# Extra · Approval

> Players submit new puzzles. Every word is checked against the dictionary at once, then a person approves or rejects the puzzle before it's published.

- Course: [Wordflow: Learn Temporal by Building a Word Game](https://syntaxsugar.io/course/wordflow/index.md)
- Section: Optional exercises
- Author: Michael Jones
- Updated: 2026-10-05
- URL: https://syntaxsugar.io/course/wordflow/approval/

**Goal:** players submit new puzzles. Every word is checked against the dictionary at once, then a person approves or rejects the puzzle before it's published.

## Concepts

**Parallel Execution.** Start all the Activities first, then wait for each result. Eight lookups take about as long as one.

**Approval.** A Workflow waits for a person's decision, as a Signal, with a deadline. Waiting a day costs nothing: no Worker is busy, and the Timer lives in the Temporal Service.

**Status from a Query.** The submitter or reviewer can check progress at any time without changing anything.

## Patterns

- [Parallel Execution](https://docs.temporal.io/design-patterns/parallel-execution)
- [Approval](https://docs.temporal.io/design-patterns/approval)

## What you'll build

- `PuzzleSubmissionWorkflow`, with Workflow ID `submission-<puzzleId>`:
  1. Check the puzzle's shape with the provided rules.
  2. Look up every word in parallel, and note any the dictionary doesn't know.
  3. Wait for a `review` Signal (`{approved, reviewer, note}`) or 24 hours.
  4. If approved, save the puzzle with a `SavePuzzle` Activity and announce it.
- A `submission` Query that returns the status, the unknown words, and the review.
- A command that submits a puzzle file.

## Build it

**Go:**

The provided code includes `game.ValidatePuzzle` and `Store.Save`.

### 1. Names

Add to `app/shared/extras.go`, and import `"wordflow/internal/game"`:

```go
// Extra: Approval.
const (
	SignalReview    = "review"
	QuerySubmission = "submission"
)

func SubmissionWorkflowID(puzzleID string) string {
	return "submission-" + puzzleID
}

type SubmissionInput struct {
	Puzzle game.Puzzle `json:"puzzle"`
}

type ReviewInput struct {
	Approved bool   `json:"approved"`
	Reviewer string `json:"reviewer"`
	Note     string `json:"note,omitempty"`
}

type SubmissionView struct {
	Status       string       `json:"status"`
	UnknownWords []string     `json:"unknownWords,omitempty"`
	Review       *ReviewInput `json:"review,omitempty"`
}
```

### 2. Save Activity

In `app/activities/puzzles.go`:

```go
// SavePuzzle publishes a puzzle so it can be played.
func (a *PuzzleActivities) SavePuzzle(ctx context.Context, puzzle game.Puzzle) error {
	return a.Store.Save(puzzle)
}
```

### 3. The Workflow

Create `app/workflows/submission.go`:

```go
package workflows

import (
	"time"

	"go.temporal.io/sdk/workflow"

	"wordflow/app/activities"
	"wordflow/app/shared"
	"wordflow/internal/game"
)

const reviewTimeout = 24 * time.Hour

// PuzzleSubmissionWorkflow checks a submitted puzzle, waits for a person to
// approve it, then publishes it.
func PuzzleSubmissionWorkflow(ctx workflow.Context, input shared.SubmissionInput) (shared.SubmissionView, error) {
	puzzle := input.Puzzle
	view := shared.SubmissionView{Status: "checking"}
	err := workflow.SetQueryHandler(ctx, shared.QuerySubmission, func() (shared.SubmissionView, error) {
		return view, nil
	})
	if err != nil {
		return view, err
	}

	if err := game.ValidatePuzzle(puzzle); err != nil {
		view.Status = "invalid"
		return view, err
	}

	// Parallel Execution: start every lookup, then collect the results.
	lookupCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 2 * time.Second,
	})
	var a *activities.DictionaryActivities
	lookups := make([]workflow.Future, len(puzzle.Words))
	for i, word := range puzzle.Words {
		lookups[i] = workflow.ExecuteActivity(lookupCtx, a.LookupWord, word)
	}
	for i, lookup := range lookups {
		var valid bool
		if err := lookup.Get(ctx, &valid); err != nil {
			return view, err
		}
		if !valid {
			view.UnknownWords = append(view.UnknownWords, puzzle.Words[i])
		}
	}

	// Approval: wait for a review Signal, or give up after reviewTimeout.
	view.Status = "awaiting_review"
	var review shared.ReviewInput
	reviewed := false
	timerCtx, cancelTimer := workflow.WithCancel(ctx)
	timer := workflow.NewTimerWithOptions(timerCtx, reviewTimeout, workflow.TimerOptions{Summary: "review deadline"})
	selector := workflow.NewSelector(ctx)
	selector.AddReceive(workflow.GetSignalChannel(ctx, shared.SignalReview), func(c workflow.ReceiveChannel, more bool) {
		c.Receive(ctx, &review)
		reviewed = true
	})
	selector.AddFuture(timer, func(workflow.Future) {})
	selector.Select(ctx)
	cancelTimer()

	if !reviewed {
		view.Status = "expired"
		return view, nil
	}
	view.Review = &review
	if !review.Approved {
		view.Status = "rejected"
		return view, nil
	}

	saveCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 5 * time.Second,
	})
	var p *activities.PuzzleActivities
	if err := workflow.ExecuteActivity(saveCtx, p.SavePuzzle, puzzle).Get(ctx, nil); err != nil {
		return view, err
	}
	view.Status = "published"
	announce(ctx, "New puzzle: "+puzzle.Title+", approved by "+review.Reviewer)
	return view, nil
}
```

- `ValidatePuzzle` is pure, deterministic code, so it runs in the Workflow. No Activity is needed.
- All the `ExecuteActivity` calls happen before the first `Get`, so all the lookups are scheduled together.
- `AddReceive` and `AddFuture` on one Selector means "whichever comes first": the Signal or the Timer.

Register it in the Worker and the replayer:

```go
	w.RegisterWorkflow(workflows.PuzzleSubmissionWorkflow)
```

### 4. A client

Create `app/cmd/submit/main.go`:

```go
// Command submit sends a new puzzle for review.
//
//	go run ./app/cmd/submit submissions/bread.json
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"go.temporal.io/sdk/client"

	"wordflow/app/shared"
	"wordflow/app/workflows"
	"wordflow/internal/game"
)

func main() {
	if len(os.Args) != 2 {
		log.Fatalln("usage: submit PUZZLE.json")
	}
	data, err := os.ReadFile(os.Args[1])
	if err != nil {
		log.Fatalln(err)
	}
	var puzzle game.Puzzle
	if err := json.Unmarshal(data, &puzzle); err != nil {
		log.Fatalln("bad puzzle file:", err)
	}

	c, err := client.Dial(client.Options{})
	if err != nil {
		log.Fatalln("unable to connect to Temporal:", err)
	}
	defer c.Close()

	id := shared.SubmissionWorkflowID(puzzle.ID)
	_, err = c.ExecuteWorkflow(context.Background(), client.StartWorkflowOptions{
		ID:        id,
		TaskQueue: shared.TaskQueue,
	}, workflows.PuzzleSubmissionWorkflow, shared.SubmissionInput{Puzzle: puzzle})
	if err != nil {
		log.Fatalln("unable to submit:", err)
	}
	fmt.Println("submitted", id)
	fmt.Printf("check it:  temporal workflow query --workflow-id %s --name %s\n", id, shared.QuerySubmission)
	fmt.Printf("approve:   temporal workflow signal --workflow-id %s --name %s --input '{\"approved\":true,\"reviewer\":\"you\"}'\n", id, shared.SignalReview)
}
```

### 5. Run it

Restart the Worker, then:

```sh
go run ./app/cmd/submit submissions/bread.json
temporal workflow query --workflow-id submission-bread --name submission
temporal workflow signal --workflow-id submission-bread --name review \
  --input '{"approved":true,"reviewer":"you"}'
temporal workflow result --workflow-id submission-bread
```

The reviewer here is the Temporal CLI. In a real app, it would be an admin page calling `SignalWorkflow`.



## Check it

- [ ] Submit `submissions/bread.json`. The `submission` Query returns `awaiting_review`.
- [ ] In the history, eight `ActivityTaskScheduled` events come before any `ActivityTaskCompleted`, then a `TimerStarted` labelled **review deadline**.

  *[Image: Eight lookups scheduled in parallel]*

- [ ] Send the `review` Signal with `{"approved": true, "reviewer": "you"}`. The Timer is cancelled, the puzzle is saved, the feed shows **New puzzle: Bread, approved by you**, and **Bread** appears in the puzzle list.

  *[Image: The review Signal cancels the Timer]*

- [ ] Copy the file, change its `id` to `bread-2`, and add the word `DRAEB`. Submit it. The Query shows `DRAEB` under `unknownWords`. Reject it, and the Workflow completes with status `rejected`.

Delete `puzzles/bread.json` afterwards if you want the original puzzle list back.
