import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ result?: string; reason?: string }>;
}

export default async function ChangePasswordPage({ searchParams }: PageProps) {
  const { result, reason } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm text-tertiary hover:text-primary">
        &larr; Back to admin
      </Link>
      <h1 className="text-xl font-bold text-neutral">Change password</h1>

      {result === "success" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Password updated.
        </p>
      )}
      {result === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {reason ?? "Something went wrong."}
        </p>
      )}

      <form
        method="POST"
        action="/api/admin/change-password"
        className="flex max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Current password
          <input
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-tertiary">
          New password
          <input
            type="password"
            name="newPassword"
            required
            minLength={12}
            autoComplete="new-password"
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Confirm new password
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={12}
            autoComplete="new-password"
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
