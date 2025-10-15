"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 🔹 Check token on every route change or manual login event
  useEffect(() => {
    const checkToken = () => setIsLoggedIn(!!localStorage.getItem("token"));
    checkToken();

    // 🔸 When user logs in, we manually trigger a “storage” event in login/page.js
    window.addEventListener("storage", checkToken);

    // 🔸 Also check again when route changes (dashboard/login/register)
    checkToken();

    return () => {
      window.removeEventListener("storage", checkToken);
    };
  }, [pathname]); // ✅ run again when route changes

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("storage")); // notify Navbar in all tabs
      setIsLoggedIn(false);
      setTimeout(() => router.push("/login"), 300); // small delay for redirect
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1
          className="text-xl font-semibold text-indigo-600 cursor-pointer"
          onClick={() => router.push("/")}
        >
          Agent Activity Tracker
        </h1>

        <nav className="space-x-4">
          <a href="/" className="text-sm text-gray-600 hover:text-indigo-600">
            Home
          </a>

          {!isLoggedIn && (
            <>
              <a
                href="/register"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Register
              </a>
              <a
                href="/login"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Login
              </a>
            </>
          )}

          {isLoggedIn && (
            <>
              <a
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}