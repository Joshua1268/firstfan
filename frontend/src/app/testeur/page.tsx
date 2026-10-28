import { TesterHome } from "@/features/accounts/TesterHome";
import { InvitationList } from "@/features/campaigns/tester/InvitationList";

export default function TesterSpace() {
  return (
    <TesterHome>
      <InvitationList />
    </TesterHome>
  );
}
