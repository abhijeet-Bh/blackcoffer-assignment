import React from "react";
import useAuth from "../auth/useAuth";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white shadow p-3 flex justify-between items-center">
      <div className="text-lg font-bold">Events Dashboard</div>
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-sm">
          Dashboard
        </Link>
        <Link to="/events" className="text-sm">
          Events
        </Link>
        {user ? (
          <>
            <span className="text-sm">Hi, {user.username}</span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
