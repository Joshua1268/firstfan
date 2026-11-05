import { TesterHome } from "@/features/accounts/TesterHome";
import { InvitationList } from "@/features/campaigns/tester/InvitationList";
import { BalanceLink } from "@/features/payments/BalanceLink";

export default function TesterSpace() {
  return (
    <TesterHome>
      <BalanceLink />
      <InvitationList />
    </TesterHome>
  );
}
