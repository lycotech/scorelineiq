import { NextResponse } from "next/server";

// The accumulator pages were removed permanently (they posted bet slips
// and booking codes, which doesn't fit a statistics-only site). 410 Gone
// tells search engines the pages are deliberately and permanently gone —
// a clearer signal than a redirect to an unrelated page, which Google
// treats as a soft 404 — and still gives anyone with an old shared link
// somewhere useful to go. robots.txt must NOT disallow /accumulators, or
// crawlers can't see the 410.
const BODY = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>This page has been removed | ScorelineIQ</title>
</head>
<body style="font-family: system-ui, sans-serif; max-width: 36rem; margin: 4rem auto; padding: 0 1rem; line-height: 1.5;">
  <h1>This page has been removed</h1>
  <p>ScorelineIQ no longer publishes accumulator posts. We focus on statistical match analysis.</p>
  <p><a href="/">Today&rsquo;s predictions</a> &middot; <a href="/accuracy">Accuracy record</a></p>
</body>
</html>`;

export function GET() {
  return new NextResponse(BODY, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
