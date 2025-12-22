export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const hasToken = !!process.env.ADMIN_TOKEN;
  const hasUser = !!process.env.ADMIN_USER && !!process.env.ADMIN_PASS;

  if (!hasToken && !hasUser) {
    return <div className="p-6 text-red-600">ADMIN_TOKEN or ADMIN_USER/ADMIN_PASS must be set.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
      <form
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow"
        action="/api/admin/login"
        method="POST"
      >
        <h1 className="text-xl font-semibold mb-3">Admin Login</h1>
        <p className="text-sm text-slate-600 mb-4">Use admin token or username/password.</p>
        {hasToken && (
          <input
            type="password"
            name="token"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none mb-3"
            placeholder="Admin token"
          />
        )}
        {hasUser && (
          <>
            <input
              type="text"
              name="username"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none mb-2"
              placeholder="Admin username"
            />
            <input
              type="password"
              name="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none mb-3"
              placeholder="Admin password"
            />
          </>
        )}
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-lg"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
