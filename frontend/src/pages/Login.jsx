// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";

/**
 * Demo login page:
 * - prefilled admin@demo.com / admin123 by default
 * - on submit, if credentials match, login locally via loginWithUser()
 * - optional: auto-submit is commented (can be enabled)
 */

export default function Login() {
  const nav = useNavigate();
  const { loginWithUser } = useAuth();

  // Initialize with demo credentials directly (avoid setState inside effect)
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState(null);

  // Optional: auto-submit once after mount (uncomment if you want immediate login)
  // useEffect(() => {
  //   const t = setTimeout(() => handleSubmit(), 300); // small delay to let UI mount
  //   return () => clearTimeout(t);
  // }, []);

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErr(null);

    // demo-only validation
    if (email === "admin@demo.com" && password === "admin123") {
      // mark as admin role in frontend-only session
      loginWithUser({
        username: "admin",
        email: "admin@demo.com",
        role: "admin",
        is_staff: true,
      });
      nav("/dashboard");
      return;
    } else {
      setErr("Invalid demo credentials. Try admin@demo.com / admin123");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Sign in (Demo)</h2>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Login
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        Demo credentials: <strong>admin@demo.com</strong> /{" "}
        <strong>admin123</strong>
      </div>
    </div>
  );
}
