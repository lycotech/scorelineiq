import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAccumulatorPostById } from "../../../../../lib/queries";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string; reason?: string }>;
}

export default async function EditAccumulatorPostPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { result, reason } = await searchParams;
  const post = await getAccumulatorPostById(id);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/accumulators" className="text-sm text-tertiary hover:text-primary">
        &larr; Back to accumulators
      </Link>
      <h1 className="text-xl font-bold text-neutral">Edit accumulator post</h1>

      {result === "saved" && (
        <p className="rounded-md border border-secondary-border bg-secondary-container px-3 py-2 text-sm text-secondary-text">Saved.</p>
      )}
      {result === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Error: {reason}</p>
      )}

      <Image
        src={post.imagePath}
        alt={post.title}
        width={post.imageWidth}
        height={post.imageHeight}
        className="max-w-xs rounded-lg border border-border"
        unoptimized
      />

      <form
        method="POST"
        action={`/api/admin/accumulators/${post.id}/update`}
        encType="multipart/form-data"
        className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Title
          <input
            type="text"
            name="title"
            required
            defaultValue={post.title}
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Replace screenshot (optional)
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Text
          <textarea
            name="body"
            rows={5}
            defaultValue={post.body}
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button type="submit" className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
          Save
        </button>
      </form>

      <form method="POST" action={`/api/admin/accumulators/${post.id}/delete`}>
        <button type="submit" className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
          Delete post
        </button>
      </form>
    </div>
  );
}
