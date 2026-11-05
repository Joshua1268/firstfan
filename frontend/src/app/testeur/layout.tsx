import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/accounts/LogoutButton";
import { RequireRole } from "@/features/accounts/RequireRole";
import { PRODUCT_NAME } from "@/lib/brand";
import { AppShell } from "@/ui/AppShell";

export const metadata: Metadata = { title: `Espace testeur · ${PRODUCT_NAME}` };

export default function TesterLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      spaceHref="/testeur"
      spaceLabel="Espace testeur"
      links={[{ href: "/testeur/gains", label: "Mes gains" }]}
      actions={<LogoutButton />}
    >
      <RequireRole role="tester">{children}</RequireRole>
    </AppShell>
  );
}
