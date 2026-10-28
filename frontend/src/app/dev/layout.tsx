import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/accounts/LogoutButton";
import { RequireRole } from "@/features/accounts/RequireRole";
import { PRODUCT_NAME } from "@/lib/brand";
import { AppShell } from "@/ui/AppShell";

export const metadata: Metadata = { title: `Espace dev · ${PRODUCT_NAME}` };

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell spaceHref="/dev" spaceLabel="Espace dev" actions={<LogoutButton />}>
      <RequireRole role="dev">{children}</RequireRole>
    </AppShell>
  );
}
