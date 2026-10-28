"use client";

import { useEffect, type RefObject } from "react";

// The submit button is disabled while busy, so focus is lost: bring it to the first wrong field.
export function useFocusFirstError(form: RefObject<HTMLFormElement | null>, error: unknown) {
  useEffect(() => {
    if (error) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [form, error]);
}
