"use client";

import { useEffect, type RefObject } from "react";

// The disabled button loses focus: move it to the first wrong field.
export function useFocusFirstError(form: RefObject<HTMLFormElement | null>, error: unknown) {
  useEffect(() => {
    if (!error) return;
    const field = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    // A radio group is flagged as a whole: focus its first radio.
    const target = field?.getAttribute("role") === "radiogroup" ? field.querySelector<HTMLElement>("input") : field;
    target?.focus();
  }, [form, error]);
}
