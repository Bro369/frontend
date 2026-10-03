"use client";

import { useState, useEffect } from "react";

interface Post {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
  seconds_remaining: number;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [tier, setTier] = useState<string>("free");
  
  // Post creation state
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [expiresIn, setExpiresIn] = useState(60);
  
  // Feed state
  const [searchTag, setSearchTag] = useState("#protest");
  const [posts, setPosts] = useState<Post[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Check for existing session token on load
  useEffect(() => {
    const savedToken = localStorage.getItem("user_token");
    if (savedToken) setToken(savedToken);
  }, []);

  // Connect WebSocket when searchTag changes
  useEffect(() => {
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${wsProtocol}//127.0.0.1:8000/ws/tags/${searchTag.replace("#", "")}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "NEW_POST") {
        setPosts((prev) => [data.post, ...prev]);
      }
    };

    // Fetch initial posts for the tag via REST
    fetchPosts(searchTag);

    return () => {
      ws.close();
    };
  }, [searchTag, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      setToken(data.user_token);
      setTier(data.tier);
      localStorage.setItem("user_token", data.user_token);
    } catch {
      setStatusMessage("Authentication failed.");
    }
  };

  const fetchPosts = async (tag: string) => {
    try {
      const cleanTag = tag.replace("#", "");
      const res = await fetch(`http://127.0.0.1:8000/posts/search?tag=${cleanTag}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      console.error("Failed to fetch posts");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");

    const tagsArray = tagsInput.split(",").map((t) => t.trim());

    try {
      const res = await fetch("http://127.0.0.1:8000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || "",
        },
        body: JSON.stringify({
          content,
          tags: tagsArray,
          expires_in_minutes: Number(expiresIn),
        }),
      });

      if (!res.ok) throw new Error("Failed to publish");

      setContent("");
      setTagsInput("");
      setStatusMessage("Secret published successfully.");
      fetchPosts(searchTag);
    } catch {
      setStatusMessage("Error publishing secret. Check tag formatting.");
    }
  };

  // 1. Login View if no token exists
  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Ephemeral Secrets</h1>
          <p className="text-neutral-400 text-sm mb-8">Zero-data authentication. Hashed instantly.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:outline-none focus:border-neutral-600"
            />
            {statusMessage && <p className="text-red-400 text-sm">{statusMessage}</p>}
            <button type="submit" className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-neutral-200">
              Generate Identity Hash
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 2. Main Dashboard View
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Ephemeral Feed</h1>
          <span className="text-xs uppercase tracking-wider text-neutral-400 border border-neutral-800 px-3 py-1 rounded-full">
            Tier: {tier}
          </span>
        </div>

        {/* Create Post Form */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Drop a Secret</h2>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <textarea
              required
              rows={3}
              maxLength={2000}
              placeholder="What's happening? (Max 2000 characters)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Tags (comma separated, e.g., protest, tech)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-black border border-neutral-800 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:border-neutral-600 text-sm"
              />
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="bg-black border border-neutral-800 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:border-neutral-600 text-sm"
              >
                <option value={1}>Self-destruct in 1 minute</option>
                <option value={60}>Self-destruct in 1 hour</option>
                <option value={1440}>Self-destruct in 24 hours</option>
              </select>
            </div>
            {statusMessage && <p className="text-sm text-green-400">{statusMessage}</p>}
            <button type="submit" className="bg-white text-black font-semibold rounded-lg px-6 py-2 hover:bg-neutral-200 text-sm">
              Publish Secret
            </button>
          </form>
        </div>

        {/* Live Feed & Filter */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-neutral-400">Filter Feed Tag:</label>
            <input
              type="text"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-3">
            {posts.length === 0 ? (
              <p className="text-neutral-500 text-sm italic">No active secrets found for {searchTag}.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-xl space-y-3">
                  <p className="text-neutral-100 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex flex-wrap justify-between items-center text-xs text-neutral-500 pt-2 border-t border-neutral-800/50">
                    <div className="flex gap-2">
                      {post.tags.map((t) => (
                        <span key={t} className="text-neutral-400 bg-black px-2 py-0.5 rounded border border-neutral-800">{t}</span>
                      ))}
                    </div>
                    <span>Burns in: {Math.max(0, post.seconds_remaining)}s</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}