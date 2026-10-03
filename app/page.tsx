"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<{ token: string; tier: string } | null>(null);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Sends the email to your Python backend running on port 8000
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Authentication failed");

      const data = await res.json();
      setSession({ token: data.user_token, tier: data.tier });
      
      // Saves the token to the browser for future API requests
      localStorage.setItem("user_token", data.user_token);
    } catch (err) {
      setError("Failed to connect to the backend. Is Python running?");
    }
  };

  // If authenticated, show the Access Granted screen
  if (session) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-6 rounded-lg text-center shadow-xl">
          <h2 className="text-xl font-bold text-green-400 mb-2">Access Granted</h2>
          <p className="text-sm text-neutral-400 mb-4">Your device is linked to a cryptographic hash.</p>
          <div className="bg-black p-3 rounded text-xs font-mono break-all text-neutral-500 mb-4 border border-neutral-800">
            {session.token}
          </div>
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold border border-neutral-700 px-3 py-1 rounded-full">
            Tier: {session.tier}
          </span>
        </div>
      </main>
    );
  }

  // The Default Login Interface
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Ephemeral Secrets</h1>
        <p className="text-neutral-400 text-sm mb-8">
          Zero-data authentication. Your email is hashed instantly and never stored.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors"
          >
            Generate Identity Hash
          </button>
        </form>
      </div>
    </main>
  );
}