# Rotating Temporal Cloud Credentials with an Entity Workflow

> Every Temporal Cloud API key and mTLS certificate expires. Here's a pattern that gives each Namespace its own long-lived Workflow to renew its Worker credential before it runs out, validate it, and hand it off to your key store, all without putting a single secret in Event History.

- Author: Michael Jones
- Published: 2026-10-17
- Tags: temporal, temporal-cloud, security, vault, go
- URL: https://syntaxsugar.io/post/2026/rotate-temporal-cloud-credentials/

Picture this. It's 2:47 AM on a Saturday, and your phone is doing the thing where it vibrates itself off the nightstand.

The payments team's dashboard is a wall of red. Every Worker on the `payments` Namespace is logging `Unauthenticated`. Workflows aren't failing, exactly; they're just... sitting there. Orders aren't getting charged. Refunds aren't going out. Somewhere, a queue of very patient Workflow Tasks is waiting for a Worker that will never come.

You check the deploy log. Nothing shipped. You check Temporal Cloud's status page. All green. You restart the Workers, because of course you do. Still `Unauthenticated`.

Forty-five minutes in, someone finally asks the right question: *"Hey, when does our API key expire?"*

It expired at midnight UTC. Three months ago, someone set a calendar reminder to renew it. That someone changed teams in August. The reminder is still faithfully firing, every morning, into an inbox nobody reads. Temporal Cloud even sent expiry notifications, and they went to the exact same inbox.

*[Image: Me, reading the Slack thread about the API key]*

So you create a new key in the UI at 3:40 AM, paste it into the secret store, and roll the Workers. Problem solved... today. But let's talk about solving the root problem.

The outage was never a Temporal problem. Every Temporal Cloud API key expires, and so does every mTLS certificate (or at least they _really, really should_ before security comes down). The real problem is that if you miss a renewal, every Worker on the Namespace loses its connection. This should be fully automated, and something you trust to never fail.

---

# Why Not Just Use Cron?

Credential rotation looks like a scheduled job, but it's really a long-running, stateful problem. A credential issued today might not need attention for 30 or 90 days, and every Namespace has its own clock.

A cron job or a scheduled Lambda doesn't hold state between runs, so you'd need a database to track each Namespace's expiry, plus logic to decide which ones are due, plus retry handling, plus a way to see what happened last time. At that point you've built a worse workflow engine.

This is what the **entity Workflow** pattern is for. You dedicate one Workflow Execution to one thing (here, one Namespace's Worker credential) and give it a Workflow ID derived from that thing's name. Temporal persists the state, so the Workflow can sleep on a durable Timer for weeks without using any compute, then wake up exactly when it needs to. Worker restarts and deploys don't matter.

---

# The Shape of It

One Workflow per Namespace, with the ID `credential-rotation:<namespace>`. Each run does one thing: wait until the credential is close to expiry, rotate it (retrying in the same run until it works), then Continue-As-New.

```mermaid
flowchart TB
  accTitle: One rotation cycle
  accDescr: The rotation Workflow sleeps until the lead time before expiry, then issues, validates, and publishes a new credential to Vault. A failure is reported and retried in the same run; only a successful rotation continues as new.
  wait["Durable Timer<br/>expiry − lead time"]
  ca["EnsureCaTrusted<br/>(mTLS only)"]
  issue["IssueCredential<br/>→ staged path"]
  validate["ValidateCredential<br/>(optional)"]
  publish["PublishCredential<br/>staged → live path"]
  alert["ReportRotationFailure<br/>retry in 1h"]
  can["Continue-As-New"]
  vault["Vault<br/>KV + PKI"]
  sync["Secret sync<br/>(ESO / VSO)"]
  workers["Namespace<br/>Workers"]

  wait --> ca --> issue --> validate --> publish --> can
  issue -. "any step fails" .-> alert
  validate -. "any step fails" .-> alert
  alert -- "same run,<br/>wait 1h" --> wait
  can -- "next run" --> wait
  publish --> vault
  vault --> sync --> workers

  class wait,can workflow
  class ca,issue,validate,publish activity
  class alert pain
  class vault,sync external
  class workers app
```

The defaults are: rotate 10 days before expiry, issue credentials that last 30 days, retry a failed attempt after 1 hour. Operators can override any of those per Namespace with a Signal. I'd keep the lead time around 10 days: long enough that a rotation that starts failing on a Friday afternoon survives a long weekend and still gets fixed before anything expires.

The whole Workflow is one loop: wait until the rotation is due, try it, and either continue as new or go back to waiting for the retry.

```go
var retryAt *time.Time // set after a failed attempt
for {
	waitUntilDue(ctx, &in, retryAt, rotateNow, updateSettings) // Timer raced against two Signals

	rotationID := workflow.Now(ctx).UTC().Format("20060102T150405Z")
	issued, failedStep, err := rotate(ctx, in, rotationID)
	if err == nil {
		in.Current = CredentialState{CredentialID: issued.CredentialID, ExpiresAt: issued.ExpiresAt}
		break
	}

	// Stay in this run: the failed attempt's Activities and errors remain in Event History.
	next := workflow.Now(ctx).Add(in.Settings.RetryInterval)
	retryAt = &next
	reportFailure(ctx, in, rotationID, failedStep, next, err)
}
return workflow.NewContinueAsNewError(ctx, CredentialRotationWorkflow, in)
```

And deciding *when* to rotate is three lines of logic:

```go
func nextRotationAt(in RotationInput, retryAt *time.Time, now time.Time) time.Time {
	switch {
	case retryAt != nil: // a failed attempt scheduled a retry
		return *retryAt
	case in.Current.ExpiresAt.IsZero(): // newly enrolled, expiry unknown
		return now
	default:
		return in.Current.ExpiresAt.Add(-in.Settings.RotateBefore)
	}
}
```

The Workflow never fails on its own, and it only continues as new after a rotation *succeeds*. Each run covers one credential's lifetime, so Event History stays tiny no matter how many years the Namespace lives.

---

# Five Decisions That Make It Safe

The Workflow itself is small. What makes the pattern worth writing up is the handful of choices around it.

## 1. Never delete the old credential

Temporal Cloud lets more than one credential be valid at once: a Service Account can hold several unexpired API keys, and a Namespace can trust several CAs. The pattern leans on that overlap. It **adds** the new credential while the old one is still valid and never revokes anything. The old credential just expires on its own schedule.

That means there's no moment where every Worker has to switch at once. A Worker that's slow to reload keeps working on the old credential until it catches up.

## 2. Keep secrets out of Event History

Temporal stores Activity inputs and results in Event History. If `IssueCredential` returned a fresh API key, that key would now live in your Workflow history forever.

So the Activities only ever pass **paths and metadata** back to the Workflow. `IssueCredential` writes the token or private key straight to a staged path in Vault (`temporal/<namespace>/staged/<rotation-id>`) and returns the credential ID, expiry, and that path. The secret exists only inside the Activity and in Vault.

## 3. Prove it works before any Worker sees it

Temporal Cloud can take a few minutes to accept a new API key. If a Worker picked it up before then, it'd fail to connect. So between issuing and publishing there's an optional `ValidateCredential` step that builds a client with the *staged* credential and calls `DescribeNamespace`.

The trick is in the retry policy: validation has **no attempt limit**, just a 5-minute Schedule-To-Close Timeout. Temporal keeps retrying until Cloud accepts the credential or the window closes. If validation fails, `PublishCredential` never runs, and the unverified credential never reaches Workers.

For Namespaces where Workers need to start Workflows, there's also an opt-in write probe that spins up a throwaway Worker on a per-rotation Task Queue and runs one tiny Workflow. A read-only check can pass even when the credential lacks write permission, so it's worth deciding per Namespace which checks you actually need.

## 4. Roll CAs forward before leaf certificates

mTLS has two rotations hiding in it. The leaf certificate each Worker presents is short-lived and cheap to renew. The CA certificate changes rarely, maybe yearly. But when your PKI starts issuing from a new CA, the Namespace has to trust that CA *before* any leaf signed by it can connect.

So for mTLS, every rotation starts with `EnsureCaTrusted`. It compares the PKI's current CA against the Namespace's accepted bundle by SHA-256 fingerprint. Usually it's already there and the Activity is a no-op. When it isn't, the Activity keeps every still-valid CA, drops expired ones, appends the new one, and calls `UpdateNamespace` with the `ResourceVersion` it just read, so a concurrent change gets rejected and retried instead of clobbered.

(If Terraform manages your Namespace, decide who owns that CA bundle. Otherwise the next `terraform apply` can quietly remove the CA the Workflow just added.)

## 5. Failures go to a human, then retry

Any step that fails after its retries sends a JSON report to a webhook (your incident or ticketing system) with the Namespace, the failed step, the error, and, most importantly, when the *current* credential expires. Whoever picks it up knows exactly how much runway they have. Then the Workflow waits an hour and tries again, **in the same run**.

That last part matters more than it looks. Continue-As-New starts a fresh run with an empty Event History. If the Workflow continued as new after a failure, the on-call engineer would open it and find... a Workflow happily sleeping on a Timer, with the evidence of what broke sitting in a closed run they have to go dig up. Instead, the failing Activity, its error, and every retry are right there in the current run's history. Continue-As-New only happens once a rotation fully succeeds, which is the natural checkpoint anyway.

If the alert webhook itself is down, the Workflow logs it and moves on. An alerting problem should never take down the rotation.

---

# The Fun Edge Case

The Cloud Ops API shows an API key token exactly once, in the `CreateApiKey` response. So what happens if the Worker crashes *after* Cloud creates the key but *before* the Activity writes it to Vault?

Nobody can read that token again, and the Activity's retry creates a second key. That's fine: the orphaned key is never used and expires on its own. But a Service Account can only hold 20 unexpired keys, so keep credential lifetimes short enough that the occasional orphan never adds up to that limit.

I like this one because it's a good example of the pattern's general philosophy: rather than trying to make a non-idempotent external call idempotent, make the failure mode harmless.

---

# Enrolling and Operating

Enrollment is just starting the Workflow with `WorkflowIDConflictPolicy = USE_EXISTING`:

```go
run, err := c.ExecuteWorkflow(ctx, client.StartWorkflowOptions{
	ID:                       rotation.WorkflowID(in.Namespace), // credential-rotation:<namespace>
	TaskQueue:                rotation.TaskQueue,
	WorkflowIDConflictPolicy: enumspb.WORKFLOW_ID_CONFLICT_POLICY_USE_EXISTING,
}, rotation.CredentialRotationWorkflow, in)
```

That makes it safe to run from a pipeline every time you create a Namespace. If the Workflow already exists, you just get the running one back.

Day-to-day, it's all Queries and Signals:

```bash
# What's the current credential, when's the next rotation, how did the last one go?
temporal workflow query --workflow-id credential-rotation:payments.a1b2c --name status

# Suspect a leak? Rotate right now.
temporal workflow signal --workflow-id credential-rotation:payments.a1b2c --name rotate-now
```

A few operational notes worth calling out:

- **Run the rotation Workers in a different Namespace** from the ones they manage. You don't want a credential problem on a managed Namespace to take out the thing that fixes credential problems.
- **The Workflow's job ends at the key store.** Delivery to Workers is External Secrets Operator or Vault Secrets Operator's job. Mount the secret as **files**, not env vars: Kubernetes updates mounted files when a Secret changes but never touches env vars in a running container. Then either reload the credential in-process (every SDK except Rust can swap the API key or mTLS cert on a live client) or trigger a rolling restart.
- **Add an independent backstop.** The Workflow reports its own failures, but it can't report anything if its Workers aren't running. Route Temporal Cloud's built-in expiry notifications somewhere on-call actually looks, and consider a scheduled check that alerts when any Namespace's `Current.ExpiresAt` is closer than the lead time.

---

# Testing a 30-Day Cycle in Under a Second

The Temporal test framework skips time while the Workflow waits on a Timer, so you can mock the Activities and test an entire rotation cycle instantly. The test I care about most makes `ValidateCredential` fail for the whole first attempt, then pass on the retry, and asserts:

- `PublishCredential` is **not** called for the failed attempt
- `ReportRotationFailure` is called exactly once
- while the retry is pending, the `status` Query shows the failure, the old credential still current, and the next attempt one hour out
- the retry runs an hour later in the **same run**, and only after it succeeds does the Workflow continue as new

That's the core guarantee of the whole pattern in one test: an unverified credential never reaches a Worker, somebody finds out, and the evidence is still there when they look.

---

# Wrap Up

| | By hand | Entity Workflow |
|---|---|---|
| **Tracking expiry** | Spreadsheet, calendar, inbox | Durable Timer per Namespace |
| **Bad credential on Workers** | Possible if you rush | Validated before publish |
| **Cutover** | Everyone at once | Old and new overlap |
| **CA rollover** | Separate manual process | Checked before every mTLS rotation |
| **Failures** | Discovered at outage time | Alert with time-to-expiry, auto-retry, full history kept in the run |
| **Audit trail** | Whoever remembers | Event History + `status` Query |

The thing I keep coming back to is how little code the Workflow actually is. Most of the value is in the boundaries: what crosses into Event History, what gets published when, and what's allowed to fail. Temporal handles the long sleep, the retries, and the bookkeeping; you just decide where the lines go.
