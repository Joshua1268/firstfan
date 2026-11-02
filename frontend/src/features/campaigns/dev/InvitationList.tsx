import { StatusPill } from "@/ui/StatusPill";
import { INVITATION_STATUS } from "../status";
import type { InvitationRow } from "../types";

export function InvitationList({ invitations }: { invitations: InvitationRow[] }) {
  return (
    <section aria-labelledby="invitations-title" className="flex flex-col gap-5">
      <h2
        id="invitations-title"
        className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink"
      >
        Invitations
      </h2>
      <ul aria-label="Invitations" className="flex flex-col gap-3">
        {invitations.map((invitation) => {
          const status = INVITATION_STATUS[invitation.status];
          return (
            <li
              key={invitation.id}
              className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface/60 px-5 py-4"
            >
              <span className="text-[17px] font-semibold text-ink [overflow-wrap:anywhere]">
                {invitation.tester.first_name}
              </span>
              <span className="text-[14px] text-ink-muted">
                {invitation.steps_done} sur {invitation.steps_total} étape{invitation.steps_total > 1 ? "s" : ""}
              </span>
              <span className="ml-auto">
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
