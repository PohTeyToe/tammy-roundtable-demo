# New Transaction Flow Design

## Goal

Build one small Google-native artifact Tammy can safely show on May 21, 2026:

`accepted offer received -> operator starts transaction package -> folders, reminders, draft email, trade-record output`

## Implementation choices

- bound Apps Script project attached to the workbook
- dedicated demo folder, form, and calendar
- Gmail draft only
- sheet-first UI with a custom menu
- one seeded completed sample plus one live happy-path sample
- deterministic templates were the first scaffold, but they no longer satisfy the committed finish line once both the draft-email and trade-record steps require real runtime AI behavior
- the old trade-record shape also no longer satisfies the target because it starts from structured intake fields instead of extracting from uploaded source documents
- the canonical document-entry seam is now manual Drive drop plus sheet action, not Google Form file upload
- the accepted source-format boundary is now broader than PDF-only, which increases the implementation gap again
- the recommended default for that broader boundary is still narrow: PDFs, images, and straightforward text-document reads only
- the extraction step is also expected to run against an explicitly chosen file, not whichever file looks newest
- the canonical place to persist that choice is now a sheet column on the transaction row, not a runtime prompt
- the AI runtime boundary is now one shared call surface for both required AI steps, not two separate ad hoc integrations
- the success contract is now one clean run for one transaction where both AI steps complete, not two separate partial wins
- the AI config boundary is now one documented project-local seam, not per-function setup drift
- the extraction quality bar is now a required minimum field set, not a vague best-effort parse
- the chosen threshold is now brokerage-operable detail, not a thin core-only extract
- the condition requirement inside that threshold is now one extracted condition pair, not full condition completeness
- the email AI step is now expected to read both the source document and the normalized extracted fields, not just one or the other
- the extraction failure contract is now hard fail plus explicit missing-field reporting, not soft continuation
- the failure-report surface is now durable row state plus action-log detail, not just a transient alert
- the operator-supervision model is now review-before-draft, but manual correction cannot be part of the canonical success path
- the review seam is now a sheet status transition, not an inline prompt hidden inside one click
- the phase model is now explicit: extract first, stop in review state, then generate the draft after approval
- the generic pre-extraction state should now be `Extraction Required`, with `Extracted` treated as transient machine completion before the stable `Ready For Review` stop
- the approval meaning is now narrow: approve extracted facts first, then review draft wording later as a separate concern
- the draft safety boundary remains `draft only`, but it is no longer being treated as a second formal success gate
- the review surface now needs to include not just normalized fields, but compact evidence that ties those fields back to the extraction run and chosen source file
- that evidence bar is now operator-usable context, not just bare run metadata
- the review gate is now enforceable: rejection stops the flow instead of allowing draft generation off disapproved facts
- that rejected-review stop should now be named `Review Rejected` rather than left implicit
- rejected review outcomes now recover by rerunning extraction on the same row, not by spawning duplicate transaction rows
- retries now replace the row's live extraction state while attempt history is pushed into logs rather than row bloat
- the source-file seam now needs both operator-friendly linkability and system-stable file identity
- source-file drift is now an explicit operator decision point, not something the workflow silently absorbs
- the operator surface should now mirror the phase model directly instead of relying on one inference-heavy command
- the default supporting recovery controls should now be `Reject Review` and `Reverse Approval` instead of hidden manual status edits
- review approval should be undoable before draft generation so the supervision gate stays practical instead of brittle
- undoing approval now means re-entering the review state with the same extraction snapshot, not silently forcing a new extraction
- changing the chosen source file during review now invalidates the existing extraction snapshot instead of letting mismatched facts linger on the row
- that invalidation should now be represented by a specific `Source Changed` status rather than a generic reset
- draft completion should now land on a concrete `Draft Generated` state rather than a broader business-readiness label
- the draft-result seam now needs both operator-friendly linkability and system-stable draft identity
- repeat draft runs should now be treated as refreshes of the same artifact, not as a branching pile of new drafts
- draft-model/config drift should now be treated as a draft-layer concern, not as automatic invalidation of already approved extracted facts
- extraction-model/config drift should now be treated as approval-invalidating because it changes the fact-generation layer the operator originally reviewed
- draft-layer failures should now be recoverable without redoing fact approval, as long as the approved extraction state still matches the source
- those draft-layer failures should surface as a distinct `Draft Failed` state rather than as a review problem
- successful retries should restore the row to its clean current-state label rather than leaving recovery history in the primary status
- once the source artifact changes after draft generation, both AI outputs should be considered stale and the row should re-enter the cycle through `Source Changed`
- the row-vs-log split now depends on an attempt-aware history model rather than a flat list of generic steps
- that history model should track one chosen-source transaction cycle at a time rather than assigning unrelated attempt IDs to each phase
- new attempt identity should now be reserved for real fact-generation context changes, not ordinary review or draft-layer recovery
- the row surface should now expose only the currently active attempt while leaving older attempt lineage to the log
- attempt identity should now favor system-stable IDs while still giving the operator a simpler display label when useful
- successful completion should not erase current attempt provenance from the row because the latest state still came from a specific cycle
- the row should now make that current cycle readable at a glance by showing both the stable ID and the simpler attempt number
- that simpler attempt number should now be local to the transaction row rather than a global workbook counter
- the log should now favor self-contained event rows by repeating source identity wherever it materially affects interpretation
- the log baseline should now be explicit: timestamp, transaction, attempt, phase, status, source identity, output reference, summary, and error
- a blank source reference should now be treated as immediate lineage invalidation, not as a harmless cosmetic edit
- that invalidation should now land in a `Source Missing` state so the operator knows the next move is reselection, not just generic recovery
- once in `Source Missing`, the workflow should restart through extraction rather than trying to resume review or draft on broken lineage
- attempt lineage should now reset only through explicit workflow rules, not through manual clearing of the current attempt field
- human-friendly attempt numbering should now stay trustworthy by being derived from real row history rather than edited by hand
- canonical extracted facts should now stay trustworthy by separating human notes from the system-owned output fields
- operator commentary should now have a first-class row field instead of leaking into extracted data or ad hoc cell annotations
- that commentary surface should now track the current attempt only, so stale notes do not silently survive into a new extraction cycle
- that same commentary surface should now remain available across extraction, review, and draft-layer recovery instead of stopping at review-only notes
- that single commentary surface should now gain a lightweight phase cue instead of fragmenting into separate note fields
- that phase cue should now be derived from current workflow state rather than manually maintained by the operator

## Rerun policy

- normal generate blocks duplicate package creation
- explicit rerun reuses the existing folder and existing calendar events when possible
- rerun preserves an existing draft if one is already stored

## Fallback policy

- seeded completed sample remains available even if live auth or live execution is flaky
- docs and dashboard links explain the exact safe path Tammy can present
