# 02 · Activities

> The Workflow loads its own puzzle, so the API only passes a puzzle ID.

- Course: [Wordflow: Learn Temporal by Building a Word Game](https://syntaxsugar.io/course/wordflow/index.md)
- Section: Lessons
- Author: Michael Jones
- Updated: 2026-10-05
- URL: https://syntaxsugar.io/course/wordflow/02-activities/

**Goal:** the Workflow loads its own puzzle, so the API only passes a puzzle ID.

## Concepts

**Activity.** A normal function for work that touches the outside world: files, databases, HTTP calls. Workflows can't do this work directly because it isn't deterministic. A Workflow asks for an Activity to run. A Worker runs it, and the result is recorded in the Event History. When the Workflow is re-run, it reads the recorded result instead of calling the Activity again.

**Timeouts.** Every Activity needs a **Start-To-Close** timeout: the longest one attempt may take. If an attempt runs longer, it fails and Temporal retries it.

**Retries.** Failed Activities are retried automatically. The default policy retries forever, waiting 1 s, then 2 s, 4 s, and so on, up to 100 s between attempts. Retries don't add events to the history. You see one `ActivityTaskStarted` event that records the final attempt number.

**Non-retryable errors.** Some failures will never succeed on retry. Asking for a puzzle that doesn't exist is one. Mark these errors **non-retryable** and the Activity fails at once.

**Dependencies.** Activities get their dependencies, such as the puzzle store, when the Worker starts. Workflows never touch them.

## Patterns

- [Non-Retryable Errors](https://docs.temporal.io/design-patterns/non-retryable-errors)
- [Activity Dependency Injection](https://docs.temporal.io/design-patterns/activity-dependency-injection) (first look; Lesson 8 goes further)

## What you'll build

- A `LoadPuzzle` Activity that reads from the puzzle store. A missing puzzle is a non-retryable error.
- `GameWorkflow` takes `{puzzleId}` and calls `LoadPuzzle` with a 5-second Start-To-Close timeout.
- The Worker registers the Activity with a puzzle store.
- `StartGame` passes the puzzle ID instead of the puzzle.

## Build it

**Go:**

### 1. The Activity

Create `app/activities/puzzles.go`:

```go
// Package activities holds code that talks to the outside world.
package activities

import (
	"context"
	"errors"

	"go.temporal.io/sdk/temporal"

	"wordflow/internal/game"
	"wordflow/internal/puzzles"
)

// PuzzleActivities gets its dependencies when the Worker starts.
type PuzzleActivities struct {
	Store *puzzles.Store
}

func (a *PuzzleActivities) LoadPuzzle(ctx context.Context, puzzleID string) (game.Puzzle, error) {
	puzzle, err := a.Store.Get(puzzleID)
	if errors.Is(err, puzzles.ErrNotFound) {
		return game.Puzzle{}, temporal.NewNonRetryableApplicationError("no puzzle named "+puzzleID, "puzzle_not_found", err)
	}
	return puzzle, err
}
```

- Activities are plain Go. They take a normal `context.Context`.
- Methods on a struct are a simple way to give Activities their dependencies. The Activity type name is the method name, `LoadPuzzle`.
- Any other error is retryable. An application error has a message and a type, and both show up in the Temporal UI.

### 2. Pass an ID, not a puzzle

In `app/shared/shared.go`, change the input. You can also remove the `internal/game` import, since nothing else uses it yet:

```go
type GameInput struct {
	PuzzleID string `json:"puzzleId"`
}
```

### 3. Call the Activity from the Workflow

Replace `app/workflows/game.go`:

```go
package workflows

import (
	"time"

	"go.temporal.io/sdk/workflow"

	"wordflow/app/activities"
	"wordflow/app/shared"
	"wordflow/internal/game"
)

// GameWorkflow loads a puzzle and returns the first view of a new game.
func GameWorkflow(ctx workflow.Context, input shared.GameInput) (game.View, error) {
	gameID := workflow.GetInfo(ctx).WorkflowExecution.ID

	puzzle, err := loadPuzzle(ctx, input.PuzzleID)
	if err != nil {
		return game.View{}, err
	}

	state := game.NewState(gameID, "", puzzle, workflow.Now(ctx))
	return state.View(), nil
}

func loadPuzzle(ctx workflow.Context, puzzleID string) (game.Puzzle, error) {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 5 * time.Second,
	})
	var a *activities.PuzzleActivities
	var puzzle game.Puzzle
	err := workflow.ExecuteActivity(ctx, a.LoadPuzzle, puzzleID).Get(ctx, &puzzle)
	return puzzle, err
}
```

- `WithActivityOptions` returns a context that carries the timeout and retry policy.
- `var a *activities.PuzzleActivities` is a nil pointer. It is only used so that `a.LoadPuzzle` gives the Activity's name and type checking. The real struct lives in the Worker.
- `ExecuteActivity` returns a Future. `Get` waits for the result.
- Returning the error fails the Workflow. Because the Activity error is non-retryable, that happens on the first attempt.

### 4. Register the Activity

In `app/cmd/worker/main.go`, after `RegisterWorkflow`:

```go
	w.RegisterActivity(&activities.PuzzleActivities{Store: puzzles.NewStore()})
```

Add imports for `"wordflow/app/activities"` and `"wordflow/internal/puzzles"`. Registering a struct registers each of its exported methods as an Activity.

### 5. Update the API

In `StartGame`, delete the `a.Puzzles.Get` call and pass the ID:

```go
	run, err := a.Temporal.ExecuteWorkflow(ctx, options, workflows.GameWorkflow, shared.GameInput{PuzzleID: req.PuzzleID})
```

### 6. Run it

Restart the Worker and the server. Compare with `solutions/02`.



## Check it

- [ ] Starting a game works as before.
- [ ] In the Temporal UI, the Workflow's input is `{"puzzleId": "..."}`, with no answers.
- [ ] The history has `ActivityTaskScheduled`, `ActivityTaskStarted`, and `ActivityTaskCompleted` for `LoadPuzzle`. The puzzle is in the completed event's result.
- [ ] Restart the Worker with `PUZZLES_FAIL_FIRST=2 make worker`. The puzzle store now fails its first two reads. Start a game. It takes about 3 seconds: a 1 s wait, then a 2 s wait, then success.
- [ ] Open that Workflow. `ActivityTaskStarted` shows `attempt: 3`, and there is still only one of each Activity event. Click the Activity to see the last failure.

  *[Image: LoadPuzzle succeeded on attempt 3]*

- [ ] Start a Workflow for a puzzle that doesn't exist (the API checks for this, so use the CLI):

  ```sh
  temporal workflow start --type GameWorkflow --task-queue wordflow \
    --workflow-id bad-puzzle --input '{"puzzleId":"nope"}'
  ```

  It fails at once with `no puzzle named nope`, after one attempt.

  *[Image: The Workflow failed with a non-retryable error]*

Restart the Worker with plain `make worker` when you're done.
