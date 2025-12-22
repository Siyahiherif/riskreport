import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return <div className="p-6 text-red-600">ADMIN_TOKEN is not set.</div>;
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
      <form
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow"
        action="/admin/login"
        method="POST"
      >
        <h1 className="text-xl font-semibold mb-3">Admin Login</h1>
        <p className="text-sm text-slate-600 mb-4">Enter admin token</p>
        <input
          type="password"
          name="token"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          placeholder="Admin token"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-lg"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
