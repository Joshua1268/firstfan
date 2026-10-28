import Link from "next/link";
import { FormAlert } from "@/ui/FormAlert";

// An object that does not exist, or belongs to someone else: the API answers 404 for both.
export function NotFoundNotice({
  message,
  backHref,
  backLabel,
}: {
  message: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex max-w-[46ch] flex-col gap-4">
      <FormAlert message={message} />
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center self-start text-[15px] font-medium text-accent underline-offset-4 hover:underline"
      >
        {backLabel}
      </Link>
    </div>
  );
}
