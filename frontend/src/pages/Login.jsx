// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";

export default function Login() {
  const nav = useNavigate();
  const { loginWithUser } = useAuth();

  // demo credentials prefilled
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErr(null);
    setLoading(true);

    // tiny UX delay to show button animation
    await new Promise((r) => setTimeout(r, 350));

    if (email === "admin@demo.com" && password === "admin123") {
      loginWithUser({
        username: "admin",
        email: "admin@demo.com",
        role: "admin",
        is_staff: true,
        remember: !!remember,
      });
      nav("/dashboard");
    } else {
      setErr("Invalid demo credentials. Try admin@demo.com / admin123");
    }
    setLoading(false);
  }

  // dummy social login handler
  const handleSocial = (provider) => {
    setErr(null);
    setLoading(true);
    setTimeout(() => {
      // pretend social returned an admin user
      loginWithUser({
        username: provider + "-demo",
        email: `${provider}@demo.com`,
        role: "admin",
        is_staff: true,
      });
      setLoading(false);
      nav("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Illustration + text (takes 8 columns on large screens) */}
        <div className="hidden lg:flex lg:col-span-8 items-center">
          <div className="w-full py-28 bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-10 shadow-lg flex gap-8">
            <div className="flex-1 flex flex-col justify-center gap-6">
              <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                Insights that matter.
              </h1>
              <p className="text-lg text-slate-600 max-w-xl">
                Visualize events and trends in one elegant dashboard. Filter by
                year, region, sector and dig into topics with interactive charts
                — discover the signal in the noise.
              </p>

              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow">
                    {/* spark icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2v6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 16v6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.93 4.93l4.24 4.24"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14.83 14.83l4.24 4.24"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 12h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 12h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Interactive
                    </div>
                    <div className="text-xs text-slate-500">
                      Hover, zoom & filter
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500 text-white shadow">
                    {/* chart icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="10"
                        width="3"
                        height="11"
                        rx="1"
                        fill="white"
                      />
                      <rect
                        x="9"
                        y="6"
                        width="3"
                        height="15"
                        rx="1"
                        fill="white"
                      />
                      <rect
                        x="15"
                        y="2"
                        width="3"
                        height="19"
                        rx="1"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Data-first
                    </div>
                    <div className="text-xs text-slate-500">
                      Fast aggregations
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustration (SVG) */}
            <div className="w-80 h-64 flex items-center justify-center">
              <svg viewBox="0 0 600 400" className="w-full h-full">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0" stopColor="#7c3aed" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <rect
                  x="20"
                  y="40"
                  width="260"
                  height="220"
                  rx="16"
                  fill="#f8fafc"
                  stroke="#e6eef9"
                />
                <g transform="translate(40,60)">
                  <rect
                    x="8"
                    y="8"
                    width="220"
                    height="18"
                    rx="8"
                    fill="url(#g1)"
                    opacity="0.9"
                  />
                  <g transform="translate(12,48)">
                    <rect
                      x="0"
                      y="0"
                      width="26"
                      height="80"
                      rx="4"
                      fill="#c7d2fe"
                    />
                    <rect
                      x="40"
                      y="12"
                      width="26"
                      height="68"
                      rx="4"
                      fill="#bfdbfe"
                    />
                    <rect
                      x="80"
                      y="28"
                      width="26"
                      height="52"
                      rx="4"
                      fill="#93c5fd"
                    />
                    <rect
                      x="120"
                      y="6"
                      width="26"
                      height="74"
                      rx="4"
                      fill="#60a5fa"
                    />
                    <rect
                      x="160"
                      y="36"
                      width="26"
                      height="44"
                      rx="4"
                      fill="#3b82f6"
                    />
                  </g>
                </g>
                <circle
                  cx="420"
                  cy="120"
                  r="72"
                  fill="url(#g1)"
                  opacity="0.12"
                />
                <g transform="translate(360,80)">
                  <path
                    d="M0,40 C30,10 60,10 90,40"
                    stroke="#60a5fa"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20,60 C40,40 60,40 80,60"
                    stroke="#7c3aed"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Login card (takes 4 columns on large screens) */}
        <div className="lg:col-span-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Welcome back
                </h2>
                <p className="text-sm text-slate-500">
                  Sign in to your dashboard
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-400">Demo</div>
                <div className="w-8 h-8 grid place-items-center rounded bg-indigo-50 text-indigo-600">
                  {/* user icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                      fill="currentColor"
                    />
                    <path
                      d="M4 20a8 8 0 0 1 16 0"
                      fill="currentColor"
                      opacity="0.9"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {err && (
              <div className="mb-3 text-sm text-rose-700 bg-rose-50 p-2 rounded">
                {err}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  aria-label="Email"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  aria-label="Password"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    // dummy forgot flow
                    setErr("Demo mode — password reset not available.");
                    setTimeout(() => setErr(null), 2200);
                  }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-white font-semibold ${
                  loading
                    ? "bg-indigo-400 cursor-wait"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      strokeOpacity="0.25"
                      fill="none"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                ) : null}
                <span>{loading ? "Signing in..." : "Sign in"}</span>
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <div className="text-xs text-gray-400">or continue with</div>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocial("google")}
                className="flex items-center gap-2 justify-center border border-gray-100 rounded-lg py-2 hover:shadow-sm"
              >
                <img src="" alt="" className="w-4 h-4 opacity-80" />
                <span className="text-xs">Google</span>
              </button>

              <button
                onClick={() => handleSocial("github")}
                className="flex items-center gap-2 justify-center border border-gray-100 rounded-lg py-2 hover:shadow-sm"
              >
                <img src="" alt="" className="w-4 h-4 opacity-80" />
                <span className="text-xs">GitHub</span>
              </button>

              <button
                onClick={() => handleSocial("twitter")}
                className="flex items-center gap-2 justify-center border border-gray-100 rounded-lg py-2 hover:shadow-sm"
              >
                <img src="" alt="" className="w-4 h-4 opacity-80" />
                <span className="text-xs">Twitter</span>
              </button>
            </div>

            <div className="mt-5 text-center text-xs text-slate-500">
              Demo credentials:{" "}
              <strong className="text-slate-700">admin@demo.com</strong> /{" "}
              <strong className="text-slate-700">admin123</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
