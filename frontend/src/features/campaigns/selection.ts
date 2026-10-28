// The dev checks testers one by one, up to the number the campaign wants.
export function toggleTester(selected: number[], id: number, max: number): number[] {
  if (selected.includes(id)) return selected.filter((s) => s !== id);
  if (selected.length >= max) return selected;
  return [...selected, id];
}

export function selectionCount(chosen: number, wanted: number): string {
  return `${chosen} sur ${wanted}`;
}
