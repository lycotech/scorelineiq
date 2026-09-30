import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAccumulatorPostBySlug } from "../../../lib/queries";
import { formatShortDate } from "../../../lib/format";
import { AdSlot } from "../../../components/AdSlot";
import { ShareButton } from "../../../components/ShareButton";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getAccumulatorPostBySlug(slug);
  if (!post) return {};

  const siteUrl = process.env.SITE_URL ?? "https://scorelineiq.com";
  const description = post.body || `Bet-slip screenshot and booking code from our accumulator picks: ${post.title}.`;
  const imageUrl = `${siteUrl}${post.imagePath}`;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/accumulators/${slug}` },
    openGraph: {
      title: post.title,
      description,
      images: [{ url: imageUrl, width: post.imageWidth, height: post.imageHeight }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function AccumulatorPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getAccumulatorPostBySlug(slug);
  if (!post) notFound();

  const siteUrl = process.env.SITE_URL ?? "https://scorelineiq.com";

  return (
    <div className="flex flex-col gap-8">
      <nav className="text-xs text-zinc-500">
        <Link href="/accumulators" className="hover:underline">Accumulators</Link>
      </nav>

      <article className="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Image
            src={post.imagePath}
            alt={post.title}
            width={post.imageWidth}
            height={post.imageHeight}
            className="w-full max-w-sm rounded-md border border-border sm:w-72"
            priority
          />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg font-semibold text-neutral">{post.title}</h1>
              <ShareButton url={`${siteUrl}/accumulators/${post.slug}`} title={post.title} text={post.body || post.title} />
            </div>
            <div className="mt-0.5 text-xs text-tertiary">{formatShortDate(post.createdAt)}</div>
            {post.body && <p className="mt-3 whitespace-pre-wrap text-sm text-neutral">{post.body}</p>}
          </div>
        </div>
      </article>

      <p className="text-xs text-tertiary">
        Statistical analysis, not betting advice: see our{" "}
        <a href="/responsible-gambling" className="text-primary underline">responsible gambling</a> page.
      </p>

      <AdSlot height={250} />
    </div>
  );
}
