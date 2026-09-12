"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Registering in dev would cache webpack's dev-only asset URLs and
    // fight with hot reload — only register against the real build.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // best-effort — a failed registration shouldn't break the page
    });
  }, []);

  return null;
}
