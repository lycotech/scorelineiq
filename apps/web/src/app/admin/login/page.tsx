export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 pt-16">
      <h1 className="text-xl font-bold text-neutral">Admin sign in</h1>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Incorrect password.
        </p>
      )}
      <form method="POST" action="/api/admin/login" className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/admin"} />
        <label className="flex flex-col gap-1 text-sm text-tertiary">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
