// Real, actual Council contact details — several error messages across
// the app say "contact the Council office" without ever giving anyone a
// way to actually do that. This is the single source of truth for that
// information; update here if the office's details ever change rather
// than hunting down copies elsewhere.
export const SNMC_CONTACT = {
  phone: "4325897 / 4300015",
  mobile: "2533702 / 2532219",
  address: "Global Village, Block A, Room 5, Mont Fleuri",
  email: "RegistrarSNMC@health.gov.sc",
  emailAlt: "AdminSNMC@health.gov.sc",
};

export function ContactFooter() {
  return (
    <footer className="border-t border-council-navy/10 mt-auto py-6 px-6">
      <div className="max-w-4xl mx-auto text-center font-body text-xs text-council-ink/50 space-y-1">
        <p className="font-medium text-council-ink/70">Seychelles Nurses &amp; Midwives Council</p>
        <p>{SNMC_CONTACT.address}</p>
        <p>
          Tel: {SNMC_CONTACT.phone} · Mobile: {SNMC_CONTACT.mobile}
        </p>
        <p>
          <a href={`mailto:${SNMC_CONTACT.email}`} className="underline hover:text-council-cyan">
            {SNMC_CONTACT.email}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${SNMC_CONTACT.emailAlt}`} className="underline hover:text-council-cyan">
            {SNMC_CONTACT.emailAlt}
          </a>
        </p>
      </div>
    </footer>
  );
}
