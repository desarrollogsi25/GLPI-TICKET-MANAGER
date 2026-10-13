# Call Centre — Business Questions (Resolved)

ISO Header: Business Scope

**Status:** All questions resolved by the business on **2026-10-13**. No question
remains pending.

The decisions are recorded in
[ADR-004](../01-architecture/decisions/ADR-004-call-center-scope.md) (scope),
[ADR-005](../01-architecture/decisions/ADR-005-external-requester-model.md)
(external requesters) and
[ADR-006](../01-architecture/decisions/ADR-006-self-assign-and-solution-required.md)
(self-assign + mandatory solution). The consolidated view is
[`call-center-gap-analysis.md`](call-center-gap-analysis.md).

The six business answers (referenced below as **answer 1–6**):

1. External requesters arrive **per call**; no recurring-caller grouping.
2. Groups are **dynamic**, per `glpi_groups`.
3. Channels are **dynamic**, per `glpi_requesttypes` (`is_active = 1`).
4. The agent view is **only** the request list + detail; no full history.
5. **Self-assign**: the technician claims the ticket (already in group + entity).
6. Closing **requires a written solution** — no closing without a solution.

## 1. External caller identity — resolved

1. **How must an agent identify an external caller?**
   **Resolved (answer 1, ADR-005):** identify by **name + phone**, recorded in the
   ticket `content` header (`Llamante: <nombre> · Tel: <teléfono> · Empresa: <opcional>`).
   **Email is optional** and goes in `alternative_email`. Company is optional in the
   same header. No reference-number field is required.
2. **Recurring or anonymous per call?**
   **Resolved (answer 1):** **per call** — there is no recurring-caller grouping.
   Each external caller is represented on the ticket, not as a shared identity.
3. **If recurring, reliable match key?**
   **Resolved (answer 1):** **N/A — not recurring.** If the business ever needs
   cross-ticket caller identity, migrate to a real account per caller (ADR-005,
   Option A).
4. **Is an email always available?**
   **Resolved (answers 1 + ADR-005):** no. Hence Option D keeps the email optional
   (`alternative_email`) and carries the mandatory identity (name/phone) in
   `content`.

## 2. Entry channels — resolved

5. **Which channels must the form offer?**
   **Resolved (answer 3):** the list is **dynamic** — read `glpi_requesttypes`
   `WHERE is_active = 1`. The business curates the active set in the GLPI UI; no
   channels are hardcoded.
6. **Is there a default channel?**
   **Resolved (answer 3):** no fixed default is required; the active catalogue is
   the source of truth. The agent picks from the active list.

## 3. Groups and assignment — resolved

7. **Are the groups already defined?**
   **Resolved (answer 2):** groups are **dynamic**, per `glpi_groups` — the business
   registers and maintains them in the GLPI UI. The code never hardcodes names.
   (At investigation time the table had 0 rows; that is data, not a blocker.)
8. **Group *and* technician, or group only?**
   **Resolved (answer 5, ADR-006):** the ticket is owned by a **group**, and a
   technician in that group **self-assigns** (`claim`), which assigns it to them
   (`glpi_tickets_users.type = 2`). So: group first, then a technician via
   self-assign.
9. **Can an agent re-assign between groups? Who authorises?**
   **Resolved (scope):** re-assignment **between groups** is **not** in this phase
   (ADR-006, *Out of scope*). No cross-group re-assignment flow is built, so no
   authorisation rule is defined.
10. **Multi-group, or exactly one?**
    **Resolved (scope, ADR-006):** **one** assigned group per ticket.
11. **Are group members notified on assignment?**
    **Resolved (scope):** notifications are **out of scope** (no email integration),
    so GLPI `is_notify` is not configured.

## 4. Ticket lifecycle — resolved

12. **What statuses are used in practice?**
    **Resolved (answers 5–6, ADR-006):** the flow is **New(1) → Assigned(2) →
    Solved(5)**. A solution is mandatory to leave Assigned for Solved.
13. **When is a ticket "done"?**
    **Resolved (answer 6, ADR-006):** when a **written solution** exists
    (`glpi_itilsolutions`) and the ticket is set to Solved. The API refuses
    `status = 5` without a solution row (**422**).

## 5. Out of scope — confirmed

14. **Shifts / rosters** — **confirmed out of scope.**
15. **N1/N2/N3 escalation tiers** — **confirmed out of scope**; **flat groups only.**
16. **SLA** — **out of scope.** No target date committed; revisit explicitly if the
    business defines targets.
17. **CTI / telephony integration and email collection** — **confirmed out of scope.**
    Channels are entered manually.
18. **Reporting/dashboards** — **confirmed out of scope.** The system stays
    actionable only; BI reads the database externally.
