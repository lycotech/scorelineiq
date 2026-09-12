import Image from "next/image";
import type { Metadata } from "next";
import { getAccumulatorPosts } from "../../lib/queries";
import { formatShortDate } from "../../lib/format";
import { AdSlot } from "../../components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accumulators",
  description: "Bet-slip screenshots and booking codes from our accumulator picks, with notes on why we backed each selection.",
};

export default async function AccumulatorsPage() {
  const posts = await getAccumulatorPosts();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral">Accumulators</h1>
        <p className="mt-1 max-w-2xl text-sm text-tertiary">
          Bet slips we&apos;ve placed, posted as-is — booking codes included so you can pull up the same selections
          with your own bookmaker. Statistical analysis, not betting advice: see our{" "}
          <a href="/responsible-gambling" className="text-primary underline">
            responsible gambling
          </a>{" "}
          page.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-tertiary">No accumulator posts yet — check back soon.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Image
                  src={post.imagePath}
                  alt={post.title}
                  width={post.imageWidth}
                  height={post.imageHeight}
                  className="w-full max-w-sm rounded-md border border-border sm:w-72"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral">{post.title}</h2>
                  <div className="mt-0.5 text-xs text-tertiary">{formatShortDate(post.createdAt)}</div>
                  {post.body && <p className="mt-3 whitespace-pre-wrap text-sm text-neutral">{post.body}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdSlot height={250} />
    </div>
  );
}
