"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WkSetupPage() {
  const router = useRouter();
  const [minLevel, setMinLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(60);
  const [limit, setLimit] = useState(25);

  return (
    <main className="min-h-screen bg-[#faf7f0] p-6">
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold">WaniKani Refresher</h1>
        <p className="text-sm text-neutral-600">
          Review Guru+ kanji meanings. Choose a level range and how many to do.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">Min level</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              type="number"
              min={1}
              max={60}
              value={minLevel}
              onChange={(e) => setMinLevel(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Max level</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              type="number"
              min={1}
              max={60}
              value={maxLevel}
              onChange={(e) => setMaxLevel(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <div className="text-sm font-medium">How many</div>
          <input
            className="w-full rounded-xl border px-3 py-2"
            type="number"
            min={5}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>

        <button
          className="w-full rounded-xl bg-black py-2 text-white hover:opacity-90"
          onClick={() => {
            router.push(
              `/practice/wanikani/session?minLevel=${minLevel}&maxLevel=${maxLevel}&limit=${limit}`
            );
          }}
        >
          Start session
        </button>
      </div>
    </main>
  );
}