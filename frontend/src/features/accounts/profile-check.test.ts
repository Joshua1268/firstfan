import { describe, expect, it } from "vitest";
import { missingProfileFields } from "./profile-check";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

const complete = { profession: "Pharmacien", momo_number: "0700000000", linkedin_url: "https://linkedin.com/in/k" };

describe("missingProfileFields", () => {
  it("accepts a complete profile", () => {
    expect(missingProfileFields(form(complete), false)).toEqual({});
  });

  it("asks for the profession and the momo number", () => {
    const errors = missingProfileFields(form({ linkedin_url: complete.linkedin_url, momo_number: "  " }), false);
    expect(Object.keys(errors).sort()).toEqual(["momo_number", "profession"]);
  });

  it("asks for LinkedIn or a proof", () => {
    const errors = missingProfileFields(form({ ...complete, linkedin_url: "" }), false);
    expect(Object.keys(errors)).toEqual(["linkedin_url"]);
  });

  it("accepts a new proof file instead of LinkedIn", () => {
    const data = form({ ...complete, linkedin_url: "" });
    data.set("proof", new File(["x"], "carte.pdf"));
    expect(missingProfileFields(data, false)).toEqual({});
  });

  it("accepts a proof already saved instead of LinkedIn", () => {
    expect(missingProfileFields(form({ ...complete, linkedin_url: "" }), true)).toEqual({});
  });
});
