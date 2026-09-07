// Best-effort on-demand ISR trigger. Silently does nothing if
// WEB_APP_URL/REVALIDATE_SECRET aren't configured (e.g. local dev
// without the web server running) — the time-based `revalidate` export
// on each page is the fallback, so a failed call here is never fatal.
export async function triggerRevalidate(paths: string[]): Promise<void> {
  const baseUrl = process.env.WEB_APP_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) return;

  try {
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ paths }),
    });
    if (!response.ok) {
      console.warn(`[revalidate] request failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("[revalidate] failed to trigger:", error);
  }
}
