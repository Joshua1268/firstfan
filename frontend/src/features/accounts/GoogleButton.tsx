"use client";

import { useId } from "react";
import { useApi } from "@/lib/use-api";
import { GoogleIcon } from "@/ui/icons";
import { getGoogleStatus } from "./api";

// Google's dark button theme: the site is dark only.
const buttonCls =
  "inline-flex h-14 w-full items-center justify-center gap-3 rounded-pill border border-[#8E918F] bg-[#131314] px-7 text-[16px] font-medium leading-none text-[#E3E3E3]";

// Hidden until the API says Google sign-in is configured.
export function GoogleButton({ href, disabledHint }: { href: string; disabledHint?: string | null }) {
  const hintId = useId();
  const { data } = useApi(getGoogleStatus);
  if (!data?.enabled) return null;

  const label = (
    <>
      <GoogleIcon size={20} />
      Continuer avec Google
    </>
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 text-[14px] text-ink-muted">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        ou
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      {disabledHint ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            aria-describedby={hintId}
            className={`${buttonCls} cursor-not-allowed opacity-40`}
          >
            {label}
          </button>
          <p id={hintId} className="text-[14px] leading-snug text-ink-muted">
            {disabledHint}
          </p>
        </div>
      ) : (
        <a href={href} className={`${buttonCls} transition-colors duration-150 hover:bg-[#1f1f21]`}>
          {label}
        </a>
      )}
    </div>
  );
}
