// Facts about who runs the site, kept in one place so the responsible-
// gambling page (and, later, About / Terms) can't drift apart.
//
// Leave a field null until it is real. Pages render the matching line
// only when the value is set, so no placeholder text is ever published.
export const SITE_INFO = {
  // Legal name of the person or company operating ScorelineIQ.
  operatorName: null as string | null,
  // Where the operator is registered, e.g. "Lagos, Nigeria". Optional.
  operatorLocation: null as string | null,
  contactEmail: "hello@scorelineiq.com",
  // Minimum age to gamble in the target country (Nigeria).
  minimumAge: 18,
} as const;
