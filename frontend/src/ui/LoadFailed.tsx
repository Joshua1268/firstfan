import { Button } from "@/ui/Button";
import { FormAlert } from "@/ui/FormAlert";

export function LoadFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex max-w-[46ch] flex-col gap-4">
      <FormAlert message={message} />
      <Button variant="secondary" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}
