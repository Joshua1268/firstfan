export const OPEN_TO_ALL = "Tout public";

// An empty target profession means the campaign is open to every tester, without a piece.
export function audienceLabel(targetProfession: string): string {
  return targetProfession || OPEN_TO_ALL;
}
