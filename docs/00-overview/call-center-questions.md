# Call Centre — Open Questions for the Business

ISO Header: Business Scope

These questions block concrete design decisions (see
[`call-center-gap-analysis.md`](call-center-gap-analysis.md) and
[`../01-architecture/decisions/ADR-004-call-center-scope.md`](../01-architecture/decisions/ADR-004-call-center-scope.md)).
They are grouped by the decision they unblock. Nothing here is answered yet.

## 1. External caller identity

1. **How must an agent identify an external caller?** Which fields are mandatory vs
   optional, and in what format:
   - name (single field or first/last?)
   - phone
   - email
   - company / organisation
   - any reference number / extension?
2. **Are external callers recurring or anonymous per call?**
   - Recurring → we need to recognise the same caller across tickets (today: impossible
     with the generic-user pattern, which collapses everyone onto one account).
   - Anonymous per call → a generic "External Caller" account is enough.
3. **If recurring: what is the reliable match key?** (email? phone? a case number?)
   The choice determines whether `alternative_email` is sufficient or we need a real
   account/contact per caller.
4. **Is an email always available for an external caller?** If not,
   `alternative_email` (which requires one) is not a universal mechanism and the
   generic-user pattern must be used for the rest.

> This is the question that decides PASO 3-B vs 3-C. We deliberately do **not** choose.

## 2. Entry channels

5. **Which channels must the ticket form offer?** GLPI ships
   `Helpdesk(1)`, `E-Mail(2)`, `Phone(3)`, `Direct(4)`, `Written(5)`, `Other(6)`.
   The call centre only uses manual channels; confirm the final list — e.g. keep
   `Phone`, `Direct` (in person), `Other` (chat), and drop `E-Mail`.
6. **Is there a default channel** when the agent does not pick one?

## 3. Groups and assignment

7. **Are the groups already defined by the business?** If yes, list them (name +
   what each one covers). Today the database has **0** groups.
8. **Can a ticket be assigned to a group *and* a technician at the same time, or only
   to a group?**
   - Group only → the whole team picks from the group queue.
   - Group + technician → one person owns it inside the group.
9. **Can an agent re-assign a ticket between groups?** If so, **who authorises** it and
   is a reason/comment required?
10. **Can a ticket be assigned to more than one group** (multi-group), or exactly one?
11. **Are group members explicitly notified** on assignment (GLPI `is_notify`)?

## 4. Ticket lifecycle (light touch)

12. **What statuses are used in practice?** GLPI defaults are New(1), Assigned(2),
    Planned(3), Pending(4), Solved(5), Closed(6). Are `Planned`/`Pending` in use, or is
    the flow simply New → Assigned → Solved?
13. **When is a ticket considered "done"** for the call centre (agent sets Solved, or a
    supervisor closes it)?

## 5. Out of scope (confirm to keep them out)

14. **Shifts / rosters** — confirm definitively out of scope.
15. **N1/N2/N3 escalation tiers** — confirm the call centre uses flat groups only, with
    no escalation level.
16. **SLA** — beyond "pending", is there a target date for the business to define it?
    (We will not build it until then.)
17. **CTI / telephony integration and email collection** — confirm out of scope.
18. **Reporting/dashboards** — confirm the system stays actionable only and BI reads the
    database externally.
