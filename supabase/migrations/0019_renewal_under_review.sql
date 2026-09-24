-- Section 10 asks for a fuller status vocabulary (Not Started, Renewal
-- Due, Submitted, Under Review, Approved, Rejected, Completed). Not
-- Started/Renewal Due are computed display labels, not real rows here
-- (there's nothing to store until someone actually submits a renewal —
-- see the Licence Expiry page for that "hasn't submitted yet" signal).
-- Approved and Completed are treated as the same thing in this system
-- deliberately, not an oversight: approving a renewal already applies
-- the new expiry date atomically, so there's no separate "completed"
-- step to model — a rename would be more disruptive than valuable here.
--
-- What genuinely didn't exist before: a real "Under Review" state
-- between Submitted and the final decision.

alter table license_renewals drop constraint if exists license_renewals_status_check;
alter table license_renewals add constraint license_renewals_status_check
  check (status in ('Pending','Under Review','Approved','Rejected'));
