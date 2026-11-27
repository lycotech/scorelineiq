// The secondary fixture source doesn't give league names on our API tier, so
// a human names each league when importing. Before this check existed the
// import form pre-filled "League #<id>" and that placeholder was saved as the
// real name, then shown on public pages. These helpers keep placeholders out.

const PLACEHOLDER = /^league\s*#?\s*\d*$/i;

export function isPlaceholderLeagueName(name: string | null | undefined): boolean {
  const trimmed = (name ?? "").trim();
  return trimmed === "" || PLACEHOLDER.test(trimmed);
}

// Returns the cleaned name, or an error message safe to show an admin.
export function validateLeagueName(raw: string | null | undefined): { name: string } | { error: string } {
  const name = (raw ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 3 || name.length > 80) return { error: "League name must be 3-80 characters." };
  if (isPlaceholderLeagueName(name)) return { error: `"${name}" is a placeholder. Enter the real league name.` };
  return { name };
}
