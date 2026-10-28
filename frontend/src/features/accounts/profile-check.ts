// Same rule as the API's "profile complete": checked before sending so each field gets its message.
export function missingProfileFields(form: FormData, hasProof: boolean): Record<string, string[]> {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const proof = form.get("proof");
  const newProof = proof instanceof File && proof.size > 0;

  const errors: Record<string, string[]> = {};
  if (!text("profession")) errors.profession = ["Choisis ton métier."];
  if (!text("momo_number")) errors.momo_number = ["Indique ton numéro mobile money pour recevoir tes gains."];
  if (!text("linkedin_url") && !newProof && !hasProof) {
    errors.linkedin_url = ["Ajoute ton profil LinkedIn ou un justificatif."];
  }
  return errors;
}
