import Link from "next/link";
import Image from "next/image";
import { getAccumulatorPosts } from "../../../lib/queries";
import { formatRelativeTime } from "../../../lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ result?: string; reason?: string }>;
}

export default async function AdminAccumulatorsPage({ searchParams }: PageProps) {
  const { result, reason } = await searchParams;
  const posts = await getAccumulatorPosts();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral">Admin — Accumulators</h1>
          <p className="text-sm text-tertiary">Bet-slip screenshots posted to the public /accumulators page.</p>
        </div>
        <Link href="/admin/accumulators/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover">
          New post
        </Link>
      </div>

      {result === "created" && (
        <p className="rounded-md border border-secondary-border bg-secondary-container px-3 py-2 text-sm text-secondary-text">Post created.</p>
      )}
      {result === "deleted" && (
        <p className="rounded-md border border-secondary-border bg-secondary-container px-3 py-2 text-sm text-secondary-text">Post deleted.</p>
      )}
      {result === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Error: {reason}</p>
      )}

      {posts.length === 0 ? (
        <p className="text-sm text-tertiary">No accumulator posts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
              <Image
                src={post.imagePath}
                alt={post.title}
                width={80}
                height={Math.round((80 * post.imageHeight) / post.imageWidth)}
                className="rounded-md border border-border object-cover"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-neutral">{post.title}</div>
                <div className="text-xs text-tertiary">Posted {formatRelativeTime(post.createdAt)}</div>
              </div>
              <Link href={`/admin/accumulators/${post.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
