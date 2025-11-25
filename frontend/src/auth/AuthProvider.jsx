import React, { useState, useMemo } from "react";
import { AuthContext } from "./context";
// note: we intentionally do not decode JWT here in demo mode
import { logout as apiLogout } from "../api/api";

/**
 * AuthProvider:
 * - initializes user state from localStorage synchronously using lazy initializer
 * - exposes loginWithUser, loginWithToken (placeholder), logout
 *
 * Important:
 * - This file exports a React component only (default export).
 * - The AuthContext was moved to context.js to satisfy Fast Refresh.
 */

function readStoredUser() {
  try {
    const stored = localStorage.getItem("access_token");
    if (!stored) return null;
    if (stored.trim().startsWith("{")) {
      return JSON.parse(stored);
    }
    // For real JWTs you could decode here and return a shaped user object.
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export default function AuthProvider({ children }) {
  // lazy initializer avoids calling setState inside an effect on mount
  const [user, setUser] = useState(() => readStoredUser());

  // For real JWT flow: store token string and decode it
  const loginWithToken = (token) => {
    // placeholder: keep token in storage (no decode in demo)
    localStorage.setItem("access_token", token);
    // Optionally decode and set user from payload
    // setUser({ username: ..., payload: ... });
  };

  // Frontend-only login (demo)
  const loginWithUser = (userObj) => {
    setUser(userObj);
    localStorage.setItem("access_token", JSON.stringify(userObj));
  };

  const logout = () => {
    try {
      apiLogout();
    } catch (e) {
      console.log(e);
    }
    setUser(null);
    localStorage.removeItem("access_token");
  };

  // Memoize context value to avoid unnecessary re-renders downstream
  const value = useMemo(
    () => ({
      user,
      loginWithToken,
      loginWithUser,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
