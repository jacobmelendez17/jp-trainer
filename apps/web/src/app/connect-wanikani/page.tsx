"use client";

import { useState } from "react";

export default function ConnectWanikaniPage() {
    const [token, setToken] = useState("");
    const [status, setStatus] = useState("");

    async function saveToken() {
        setStatus("Saving token...");
        const res = await fetch("/api/wanikani/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) return setStatus(`Error: ${data?.error ?? "unknown"}`);
        setStatus("Saved! Now click Test.");
    }

    async function testToken() {
        setStatus("Testing token...");
        const res = await fetch("/api/wanikani/test");
        const data = await res.json();
        if (!res.ok) return setStatus(`Error: ${data?.error ?? "unknown"}`);
        setStatus(`Connected ${data.username} (Level ${data.level})`);
    }

    return (
        <main className="min-h-screen grid place-items-center bg-[#faf7f0] p-6">
            <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <h1 className="text-2xl font-semibold text-neutral-800">Connect WaniKani</h1>
                <p className="tet-sm text-neutral-600">
                    Paste your WaniKani API token.
                </p>
                
                <input 
                    className="w-full rounded-xl border px-3 py-2 text-neutral-800"
                    placeholder="Paste token..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                />

                <div className="flex gap-2">
                    <button className="flex-1 rounded-xl bg-black text-white px-4 py-2" onClick={saveToken}>
                        Save Token
                    </button>
                    <button className="flex-1 rounded-xl border px-4 py-2 border-black text-neutral-800" onClick={testToken}>
                        Test
                    </button>
                </div>

                {status ? <div className="rounded-xl border bg-neutral-50 p-3 text-sm text-neutral-800">{status}</div> : null}
            </div>
        </main>
    )
}