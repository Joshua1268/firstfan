import { describe, expect, it } from "vitest";
import { missingProfileFields } from "./profile-check";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

const complete = { profession: "Pharmacienne", momo_number: "0700000000" };

describe("missingProfileFields", () => {
  it("accepts a complete profile without LinkedIn nor proof", () => {
    expect(missingProfileFields(form(complete))).toEqual({});
  });

  it("asks for the profession and the momo number", () => {
    const errors = missingProfileFields(form({ momo_number: "  " }));
    expect(Object.keys(errors).sort()).toEqual(["momo_number", "profession"]);
  });
});
