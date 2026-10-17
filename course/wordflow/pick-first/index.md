# Extra · Pick First

> The dictionary has two regions, and each is slow at random. Ask both, use whichever answers first, and cancel the other.

- Course: [Wordflow: Learn Temporal by Building a Word Game](https://syntaxsugar.io/course/wordflow/index.md)
- Section: Optional exercises
- Author: Michael Jones
- Updated: 2026-10-05
- URL: https://syntaxsugar.io/course/wordflow/pick-first/

**Goal:** the dictionary has two regions, and each is slow at random. Ask both, use whichever answers first, and cancel the other.

## Concepts

**Run in parallel, take the first.** Start several Activities without waiting, then wait for whichever finishes first.

**Cancel the rest.** Cancel the scope the other Activities were started in. The Workflow records the cancel request and moves on.

**Activities learn about cancellation from heartbeats.** A running Activity is just your code on a Worker. It only finds out it was cancelled when it sends a heartbeat and the reply says so. Then its context is cancelled, which also aborts its HTTP request. Activities that should stop early must heartbeat and have a heartbeat timeout.

**This changes running games.** The `guess` handler now produces different commands. Wrap the change in a version check, as in Lesson 13.

## Patterns

- [Pick First](https://docs.temporal.io/design-patterns/pick-first)

## What you'll build

- The dictionary service takes `?region=NAME` and adds 0–1.5 s of random latency.
- A `LookupWordIn` Activity that sends the region and heartbeats while it waits.
- `isRealWordFastest`: start a lookup in `east` and `west`, wait for the first, cancel the other.
- A `race-dictionary` version check that chooses between the old single lookup and the race.

## Build it

**Go:**

The dictionary service already supports `?region=NAME`.

### 1. Input

Add to `app/shared/extras.go`:

```go
// Extra: Pick First.
type LookupInput struct {
	Word   string `json:"word"`
	Region string `json:"region"`
}
```

### 2. A region-aware Activity

In `app/activities/dictionary.go`, rename the body of `LookupWord` to a private `lookup` that takes a region, then add `LookupWordIn`. Import `"go.temporal.io/sdk/activity"` and `"wordflow/app/shared"`:

```go
func (a *DictionaryActivities) LookupWord(ctx context.Context, word string) (bool, error) {
	return a.lookup(ctx, word, "")
}

// LookupWordIn asks one region of the dictionary. Canceling ctx abandons the
// request.
func (a *DictionaryActivities) LookupWordIn(ctx context.Context, input shared.LookupInput) (bool, error) {
	// A running Activity learns it was canceled from a heartbeat response.
	done := make(chan struct{})
	defer close(done)
	go func() {
		ticker := time.NewTicker(200 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				activity.RecordHeartbeat(ctx)
			case <-done:
				return
			}
		}
	}()
	return a.lookup(ctx, input.Word, input.Region)
}

func (a *DictionaryActivities) lookup(ctx context.Context, word, region string) (bool, error) {
	u := a.BaseURL + "/words/" + url.PathEscape(word)
	if region != "" {
		u += "?region=" + url.QueryEscape(region)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	// ... the rest of the old LookupWord, unchanged
}
```

Goroutines are fine in Activities. Only Workflow code has restrictions. The SDK throttles heartbeats, so calling `RecordHeartbeat` often is cheap.

### 3. Race the regions

Create `app/workflows/pickfirst.go`:

```go
package workflows

import (
	"time"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"

	"wordflow/app/activities"
	"wordflow/app/shared"
	"wordflow/internal/game"
)

var dictionaryRegions = []string{"east", "west"}

// checkDictionary chooses how to look a word up. Games that started before
// the race existed keep making a single lookup.
func checkDictionary(ctx workflow.Context, word string) bool {
	if workflow.GetVersion(ctx, "race-dictionary", workflow.DefaultVersion, 1) == workflow.DefaultVersion {
		return isRealWord(ctx, word)
	}
	return isRealWordFastest(ctx, word)
}

// isRealWordFastest asks every region at once, takes the first answer, and
// cancels the rest.
func isRealWordFastest(ctx workflow.Context, word string) bool {
	ctx, cancel := workflow.WithCancel(ctx)
	defer cancel()

	var a *activities.DictionaryActivities
	selector := workflow.NewSelector(ctx)
	var valid bool
	var err error
	for _, region := range dictionaryRegions {
		regionCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
			Summary:                "lookup in " + region,
			StartToCloseTimeout:    2 * time.Second,
			ScheduleToCloseTimeout: 10 * time.Second,
			HeartbeatTimeout:       time.Second,
			RetryPolicy: &temporal.RetryPolicy{
				InitialInterval:    500 * time.Millisecond,
				BackoffCoefficient: 2,
				MaximumAttempts:    5,
			},
		})
		future := workflow.ExecuteActivity(regionCtx, a.LookupWordIn, shared.LookupInput{Word: game.Normalize(word), Region: region})
		selector.AddFuture(future, func(f workflow.Future) {
			err = f.Get(ctx, &valid)
		})
	}
	selector.Select(ctx)

	if err != nil {
		workflow.GetLogger(ctx).Warn("dictionary lookup failed", "word", word, "error", err)
		return false
	}
	return valid
}
```

- `workflow.Selector` is the Workflow-safe `select`. `Select` runs the callback of the first Future that's ready.
- `defer cancel()` cancels the losing Activity when the function returns.
- `GetVersion` can be called inside a handler. It only runs when a guess needs a lookup, which is deterministic.
- The slice gives a fixed order. Ranging over a map here would not be deterministic.

In the `guess` handler in `game.go`, call `checkDictionary` instead of `isRealWord`:

```go
			if outcome == game.OutcomeNotInPuzzle && checkDictionary(ctx, guess.Word) && !state.Over() {
```

### 4. Run it

Restart the Worker.



## Check it

- [ ] Start a new game and guess a few bonus words. They're still marked as bonuses.
- [ ] The server log shows both regions for each word: one answers, and the other logs **caller gave up** a moment later.
- [ ] The game's history shows two `ActivityTaskScheduled` events labelled **lookup in east** and **lookup in west**, one completed, and `ActivityTaskCancelRequested` for the other.

  *[Image: Two regional lookups: one wins, the other is cancelled]*

- [ ] A game that started before the change still makes one lookup per word.
