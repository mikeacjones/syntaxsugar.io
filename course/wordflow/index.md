# Wordflow: Learn Temporal by Building a Word Game

> A hands-on Temporal course: build the backend of a timed word game one concept at a time, from your first Workflow through Signals, Updates, Timers, Entity Workflows, Continue-As-New, and versioning.

- Author: Michael Jones
- Published: 2026-10-17
- Updated: 2026-10-05
- Tags: Temporal, Course, Go
- Languages: Go
- Source: https://github.com/mikeacjones/temporal-course-wordflow
- URL: https://syntaxsugar.io/course/wordflow/

You'll build the backend of Wordflow, a timed word game, one Temporal concept at a time. The web app and HTTP routing are already written. You write the Workflows, Activities, and Worker, plus the API code that uses the Temporal Client to start, signal, query, and update Workflows.

Each lesson adds one feature to the game and teaches the concept behind it. By the end you'll have used the [Temporal design patterns](https://docs.temporal.io/design-patterns) that come up most in real systems.

**You need:** a GitHub account, and to be comfortable in the language you choose. No Temporal experience needed.

## Start

1. Pick a language. Each one lives on its own branch:

   | Language | Branch |
   |---|---|
   | Go | [`go`](https://github.com/mikeacjones/temporal-course-wordflow/tree/go) |
   | Python | `python` (coming soon) |

2. Switch to that branch on GitHub, then choose **Code → Codespaces → Create codespace on `<branch>`**. Setup takes a few minutes.
3. The course opens in a browser tab once the Codespace is ready. If it doesn't, open the **Ports** tab and open **Course** (port 8000). Each lesson page shows the concepts, the build steps for your language, and a checklist that remembers your progress.

You can also read the lessons here on GitHub, starting with [`course/00-setup`](/course/wordflow/00-setup/).

The `main` branch only has the shared material (lesson text, web app, puzzles), so it won't run on its own.

## How each lesson works

- `README.md` explains the concept and what you'll build. It is the same for every language.
- `build.md` walks you through the code in your language.
- **Check it** tells you what you should see in the game and in the Temporal UI. If you see it, move on.
- You write all your code in `app/`. Each lesson's finished code is in `solutions/NN/`. Run a solution with `make worker S=NN` and `make server S=NN` to compare.

## Lessons

| # | Lesson | What you add | Concepts and patterns |
|---|---|---|---|
| 00 | [Setup](/course/wordflow/00-setup/) | Nothing yet | Temporal Service, Temporal UI, the project |
| 01 | [Your first Workflow](/course/wordflow/01-first-workflow/) | Start a game | Workflow, Worker, Task Queue, Client, Workflow ID |
| 02 | [Activities](/course/wordflow/02-activities/) | Load puzzles from storage | Activity, retries, timeouts, determinism, non-retryable errors |
| 03 | [Signals and Queries](/course/wordflow/03-signals-and-queries/) | Guess words, see the board | Long-running Workflow, Signal, Query |
| 04 | [Updates](/course/wordflow/04-updates/) | Instant guess results | Update, validator, Update-with-Start, Request-Response via Updates, Early Return |
| 05 | [Durable Timers](/course/wordflow/05-timers/) | A game clock you can extend | Timer, cancellation, Updatable Timer |
| 06 | [Entity Workflows](/course/wordflow/06-entity-workflows/) | Players with points | Entity Workflow, ID conflict policy |
| 07 | [Child Workflows](/course/wordflow/07-child-workflows/) | Players start their own games | Child Workflow, parent close policy |
| 08 | [Workflow to Workflow](/course/wordflow/08-workflow-to-workflow/) | Hints that cost points | Activity Dependency Injection, idempotent Updates, Workflow mutex |
| 09 | [Signal-with-Start](/course/wordflow/09-signal-with-start/) | A global leaderboard | Signal-with-Start, singleton Workflow |
| 10 | [Continue-As-New](/course/wordflow/10-continue-as-new/) | Players who play forever | Event History limits, Continue-As-New |
| 11 | [Retries in depth](/course/wordflow/11-retries/) | Bonus words from a flaky dictionary | Retry policies, Fixed Count, Fixed Wall-Time, Delayed Retry, Non-Retryable Errors |
| 12 | [Determinism and replay](/course/wordflow/12-determinism-and-replay/) | An activity feed, and a broken deploy | Replay, nondeterminism errors, replay testing |
| 13 | [Versioning](/course/wordflow/13-versioning/) | Ship the change safely | Patching with `GetVersion`, Worker Versioning |

Optional exercises, after Lesson 13:

| Exercise | What you add | Pattern |
|---|---|---|
| [Saga](/course/wordflow/saga/) | Gift points to a friend | Saga, compensation |
| [Pick First](/course/wordflow/pick-first/) | Race two dictionary regions | Pick First, cancellation |
| [Approval](/course/wordflow/approval/) | Players submit puzzles for review | Parallel Execution, Approval |
| [Schedules](/course/wordflow/schedules/) | Puzzle of the day | Schedules, Delayed Start |

## Reference

- [API and Temporal names](/course/wordflow/contract/)
- [Temporal documentation](https://docs.temporal.io/)
- [Design patterns](https://docs.temporal.io/design-patterns)
