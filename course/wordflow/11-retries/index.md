# 11 · Retries in depth

> A real word that isn't in the puzzle earns a bonus. Checking it means calling an unreliable dictionary service, and the game must handle every way it fails.

- Course: [Wordflow: Learn Temporal by Building a Word Game](https://syntaxsugar.io/course/wordflow/index.md)
- Section: Lessons
- Author: Michael Jones
- Updated: 2026-10-05
- URL: https://syntaxsugar.io/course/wordflow/11-retries/

**Goal:** a real word that isn't in the puzzle earns a bonus. Checking it means calling an unreliable dictionary service, and the game must handle every way it fails.

## Concepts

**Retry policy.** Controls how an Activity is retried:

| Field | Meaning | Default |
|---|---|---|
| Initial interval | Wait before the first retry | 1 s |
| Backoff coefficient | Multiplier for each later wait | 2 |
| Maximum interval | Cap on the wait | 100 × initial |
| Maximum attempts | Total attempts; 0 means no limit | 0 |
| Non-retryable error types | Error types that are never retried | none |

**Timeouts.**

| Timeout | Limits |
|---|---|
| Start-To-Close | One attempt. |
| Schedule-To-Close | The whole Activity, including every retry and wait. |
| Heartbeat | Time between heartbeats from a long-running Activity. Used in the Pick First exercise. |

**Not every response is an error.** A `404` from the dictionary means "not a word". That's a valid answer, not a failure.

**Fail gracefully.** If the dictionary can't answer in time, the guess still counts. It's simply not a bonus. The Workflow catches the Activity's final error and moves on.

## Patterns

- [Fixed Count Retries](https://docs.temporal.io/design-patterns/fixed-count-retries): at most 5 attempts.
- [Fixed Wall-Time Retries](https://docs.temporal.io/design-patterns/fixed-wall-time-retries): give up after 10 seconds in total, because a player is waiting.
- [Delayed Retry](https://docs.temporal.io/design-patterns/delayed-retry): when the service says `429 Retry-After: 3`, wait exactly that long.
- [Non-Retryable Errors](https://docs.temporal.io/design-patterns/non-retryable-errors): a `401` won't fix itself.

## What you'll build

- A `LookupWord` Activity that calls `GET /services/dictionary/words/{word}`:
  - `200`: true. `404`: false.
  - `401`: non-retryable error.
  - `429`: retryable error with the next retry delay set from `Retry-After`.
  - Anything else: retryable error.
- The Worker gets the services URL from `SERVICES_URL`, defaulting to `http://localhost:8080/services`.
- An `isRealWord` helper: Start-To-Close 2 s, Schedule-To-Close 10 s, retries starting at 500 ms, doubling, at most 5 attempts. Any final error means false.
- In the `guess` handler: if the outcome is "not in puzzle", the word is real, and the game isn't over, mark it as a bonus.

## Build it

**Go:**

### 1. The Activity

Create `app/activities/dictionary.go`:

```go
package activities

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"go.temporal.io/sdk/temporal"
)

// DictionaryActivities call the dictionary service over HTTP.
type DictionaryActivities struct {
	BaseURL string
	HTTP    *http.Client
}

// LookupWord reports whether word is a real word.
func (a *DictionaryActivities) LookupWord(ctx context.Context, word string) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, a.BaseURL+"/words/"+url.PathEscape(word), nil)
	if err != nil {
		return false, err
	}
	resp, err := a.HTTP.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return true, nil
	case http.StatusNotFound:
		return false, nil
	case http.StatusUnauthorized:
		// Retrying will not fix bad credentials.
		return false, temporal.NewNonRetryableApplicationError("dictionary rejected our credentials", "unauthorized", nil)
	case http.StatusTooManyRequests:
		// Wait as long as the service asks before the next attempt.
		seconds, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
		return false, temporal.NewApplicationErrorWithOptions("dictionary rate limit", "rate_limited", temporal.ApplicationErrorOptions{
			NextRetryDelay: time.Duration(seconds) * time.Second,
		})
	default:
		return false, fmt.Errorf("dictionary returned %d", resp.StatusCode)
	}
}
```

- Use the Activity's `ctx` for the request. When the attempt times out, the request is cancelled.
- `NextRetryDelay` replaces the retry policy's wait for the next attempt only.
- Instead of making the error non-retryable in the Activity, you could list `"unauthorized"` in the retry policy's `NonRetryableErrorTypes`. Use the Activity when the error is always permanent, and the policy when it depends on the caller.

### 2. Register it

In `app/cmd/worker/main.go`, import `"net/http"` and `"os"`, then:

```go
	servicesURL := os.Getenv("SERVICES_URL")
	if servicesURL == "" {
		servicesURL = "http://localhost:8080/services"
	}
```

```go
	w.RegisterActivity(&activities.DictionaryActivities{BaseURL: servicesURL + "/dictionary", HTTP: http.DefaultClient})
```

Configuration belongs in the Worker and Activities. Workflow code can't read environment variables.

### 3. Call it

In `app/workflows/game.go`, import `"go.temporal.io/sdk/temporal"` and add:

```go
// isRealWord asks the dictionary service. If it cannot answer in time, the
// guess simply does not earn a bonus.
func isRealWord(ctx workflow.Context, word string) bool {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout:    2 * time.Second,  // one attempt
		ScheduleToCloseTimeout: 10 * time.Second, // every attempt: the player is waiting
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    500 * time.Millisecond,
			BackoffCoefficient: 2,
			MaximumAttempts:    5,
		},
	})
	var a *activities.DictionaryActivities
	var valid bool
	if err := workflow.ExecuteActivity(ctx, a.LookupWord, game.Normalize(word)).Get(ctx, &valid); err != nil {
		workflow.GetLogger(ctx).Warn("dictionary lookup failed", "word", word, "error", err)
		return false
	}
	return valid
}
```

In the `guess` handler, after `state.Guess`:

```go
			outcome := state.Guess(guess.Word, workflow.Now(ctx))
			if outcome == game.OutcomeNotInPuzzle && isRealWord(ctx, guess.Word) && !state.Over() {
				state.MarkBonus(guess.Word)
				outcome = game.OutcomeBonus
			}
```

The handler holds the lock while the lookup runs, so other guesses wait their turn. The clock doesn't wait, so check `state.Over()` after the lookup.

### 4. Run it

```sh
make clean-workflows
```

Restart the Worker. Compare with `solutions/11`.



## Check it

Run `make clean-workflows` and restart the Worker. Pick a mode in the **External services** panel, then guess a real word that isn't in the puzzle. Each puzzle file lists some under `extras`. Watch the server log, which prints every dictionary request, and the pending Activity in the Temporal UI.

| Mode | What the service does | What you should see |
|---|---|---|
| `ok` | Answers | **Bonus** right away. |
| `flaky` | 2 of every 3 requests fail with `500` | **Bonus** within about 1.5 s. The log shows up to 3 requests: fail, fail, ok. |
| `slow` | Takes 3 s | Each attempt times out at 2 s. After 10 s the total limit is hit and it's **Not in puzzle**. |
| `rate_limited` | Every other request is `429 Retry-After: 3` | **Bonus**, either right away or after exactly 3 s. Guess a few words to see both. |
| `down` | `503` | 5 attempts over about 7.5 s, then **Not in puzzle**. |
| `unauthorized` | `401` | **Not in puzzle** right away. One request, no retries. |

- [ ] Each row behaves as described.

  *[Image: A bonus word]*

- [ ] While a lookup is retrying, the Temporal UI shows the pending Activity's attempt number and last failure.

  *[Image: A pending Activity that's retrying]*

- [ ] In every mode the game keeps working. The Worker logs a warning when a lookup gives up.

Set the mode back to `ok` when you're done.
