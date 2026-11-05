import Link from "next/link";
import { contactEmail } from "@/lib/contact";
import { textLinkCls } from "@/ui/PageShell";

export function ContactLine() {
  const email = contactEmail();
  if (email)
    return (
      <>
        écris à{" "}
        <a href={`mailto:${email}`} className={`${textLinkCls} break-all`}>
          {email}
        </a>
      </>
    );
  return (
    <>
      passe par la{" "}
      <Link href="/contact" className={textLinkCls}>
        page contact
      </Link>
    </>
  );
}
