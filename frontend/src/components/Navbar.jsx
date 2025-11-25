import React from "react";
import useAuth from "../auth/useAuth";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow p-3 flex w-screen z-10 fixed justify-center items-center">
      <div className="max-w-6xl w-full flex flex-row items-center justify-between">
        <div className="text-lg text-text font-bold">
          Black Coffer Events Dashboard
        </div>

        <div className="flex text-text items-center gap-6 relative">
          {/* Dashboard Link */}
          <div className="relative flex flex-col items-center">
            <Link to="/dashboard" className="text-sm">
              Dashboard
            </Link>
            <span
              className={`
                absolute -bottom-1 h-[2px] bg-accent rounded transition-all duration-300
                ${
                  isActive("/dashboard") ? "w-1/2 opacity-100" : "w-0 opacity-0"
                }
              `}
            ></span>
          </div>

          {/* Events Link */}
          <div className="relative flex flex-col items-center">
            <Link to="/events" className="text-sm">
              Events
            </Link>
            <span
              className={`
                absolute -bottom-1 h-[2px] bg-accent rounded transition-all duration-300
                ${isActive("/events") ? "w-1/2 opacity-100" : "w-0 opacity-0"}
              `}
            ></span>
          </div>

          {user ? (
            <>
              <span className="text-sm capitalize font-bold text-accent">
                Hi, {user.username}
              </span>
              <button
                onClick={logout}
                className="bg-accent text-white px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="relative flex flex-col items-center">
              <Link to="/login" className="text-sm">
                Login
              </Link>
              <span
                className={`
                  absolute -bottom-1 h-[2px] bg-accent rounded transition-all duration-300
                  ${isActive("/login") ? "w-1/2 opacity-100" : "w-0 opacity-0"}
                `}
              ></span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
