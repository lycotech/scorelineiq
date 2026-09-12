import Link from "next/link";

export default function NewAccumulatorPostPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/accumulators" className="text-sm text-tertiary hover:text-primary">
        &larr; Back to accumulators
      </Link>
      <h1 className="text-xl font-bold text-neutral">New accumulator post</h1>

      <form
        method="POST"
        action="/api/admin/accumulators/create"
        encType="multipart/form-data"
        className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Title
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Weekend 5-fold, 20/1"
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Bet slip screenshot
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            required
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Text
          <textarea
            name="body"
            rows={5}
            placeholder="Notes about this accumulator — why these picks, what to watch for, etc."
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button type="submit" className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
          Publish
        </button>
      </form>
    </div>
  );
}
