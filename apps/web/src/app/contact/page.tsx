import type { Metadata } from "next";

const CONTACT_TITLE = "Contact";
const CONTACT_DESCRIPTION =
  "Get in touch with the ScorelineIQ team — feedback, data corrections, or general enquiries.";

export const metadata: Metadata = {
  title: CONTACT_TITLE,
  description: CONTACT_DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: { title: CONTACT_TITLE, description: CONTACT_DESCRIPTION },
  twitter: { card: "summary_large_image", title: CONTACT_TITLE, description: CONTACT_DESCRIPTION },
};

export default function ContactPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-6 text-sm leading-relaxed text-zinc-700">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Contact</h1>

      <p>
        ScorelineIQ is an independently run project. We welcome feedback on the site, the
        predictions, or anything else — including spotted errors, missing fixtures, or suggestions
        for leagues to add.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-950">Email us</h2>
        <p>
          The best way to reach us is by email at{" "}
          <a
            href="mailto:hello@scorelineiq.com"
            className="font-medium text-primary underline"
          >
            hello@scorelineiq.com
          </a>
          . We aim to reply within 2–3 business days.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-950">What to include</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            <strong>Prediction error or data issue</strong> — include the match name and date so we
            can look it up quickly.
          </li>
          <li>
            <strong>Missing league or fixture</strong> — let us know the competition and country.
            Our current data tier covers a fixed set of leagues; we&apos;re expanding over time.
          </li>
          <li>
            <strong>General feedback</strong> — anything about the site design, accuracy page,
            or how predictions are presented is genuinely useful.
          </li>
          <li>
            <strong>Press or partnership enquiries</strong> — also via the email above.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-950">Advertising</h2>
        <p>
          For advertising or sponsorship enquiries, please email{" "}
          <a
            href="mailto:hello@scorelineiq.com"
            className="font-medium text-primary underline"
          >
            hello@scorelineiq.com
          </a>{" "}
          with the subject line &ldquo;Advertising&rdquo;.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-950">Response times</h2>
        <p>
          We&apos;re a small team, so please allow 2–3 business days for a reply. We read every
          message even if we can&apos;t respond to all of them individually.
        </p>
      </section>
    </article>
  );
}
