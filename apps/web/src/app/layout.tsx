import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ScorelineIQ",
    template: "%s | ScorelineIQ",
  },
  description: "Data-driven football predictions and accuracy tracking.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScorelineIQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const gaId = process.env.GA_MEASUREMENT_ID;
  const adsenseClientId = process.env.ADSENSE_CLIENT_ID;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      {adsenseClientId && (
        <head>
          {
            // A raw tag, deliberately not next/script: AdSense's
            // site-verification crawler reads the initial HTML response
            // without executing JS, looking for the exact literal
            // <script> tag from its own instructions. next/script never
            // emits that literal tag under any strategy — even
            // "beforeInteractive" only produces a preload hint plus a
            // `__next_s` data array that Next's runtime uses to insert
            // the script client-side. Confirmed empirically: verification
            // failed with next/script and this raw tag is the fix.
          }
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body className="flex min-h-full flex-col bg-background text-neutral">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <Footer />
        <ServiceWorkerRegister />
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
