"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function parseCsvLevels(csv: string): number[] {
  return csv
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 60);
}

export default function WkSetupPage() {
  const router = useRouter();

  // 1..60
  const allLevels = useMemo(() => Array.from({ length: 60 }, (_, i) => i + 1), []);

  // Selected levels
  const [selected, setSelected] = useState<Set<number>>(new Set([1]));

  // User WK level (locks anything above this)
  const [userLevel, setUserLevel] = useState<number>(1);

  // Total kanji count for selected levels
  const [totalKanji, setTotalKanji] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(false);

  // Fetch the user's WK level (from your API)
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/wanikani/user-level");
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.level && Number.isFinite(data.level)) setUserLevel(data.level);
    })();
  }, []);

  // Fetch kanji count whenever selection changes
  useEffect(() => {
    const levels = Array.from(selected).sort((a, b) => a - b);
    if (levels.length === 0) {
      setTotalKanji(0);
      return;
    }

    const ac = new AbortController();
    setCountLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/wanikani/kanji-count?levels=${levels.join(",")}`, {
          signal: ac.signal,
        });
        const data = await res.json().catch(() => null);
        setTotalKanji(Number(data?.total ?? 0));
      } catch {
        // ignore abort / errors
      } finally {
        setCountLoading(false);
      }
    })();

    return () => ac.abort();
  }, [selected]);

  function toggleLevel(level: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  const selectedCsv = useMemo(() => Array.from(selected).sort((a, b) => a - b).join(","), [selected]);

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">WaniKani Refresher</h1>
          <p className="text-sm text-neutral-800">
            Select levels to review. The session will include <span className="font-medium">all kanji</span> from
            those levels.
          </p>
          <p className="text-xs text-neutral-700">
            Your level: <span className="font-semibold text-neutral-900">{userLevel}</span> (higher levels are locked)
          </p>
        </header>

        {/* 6x10 grid (10 columns × 6 rows) */}
        <section className="space-y-2">
          <div className="text-sm font-semibold text-neutral-900">Levels</div>

          <div className="grid grid-cols-10 gap-2">
            {allLevels.map((lvl) => {
              const locked = lvl > userLevel;
              const checked = selected.has(lvl);

              return (
                <label
                  key={lvl}
                  className={[
                    "flex items-center justify-center rounded-lg border px-0 py-2 text-sm font-medium select-none",
                    locked
                      ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : checked
                      ? "border-neutral-900 bg-neutral-900 text-white cursor-pointer"
                      : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900 cursor-pointer",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={locked}
                    onChange={() => toggleLevel(lvl)}
                  />
                  {lvl}
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-neutral-900">
              Total Kanji selected:{" "}
              <span className="font-semibold">{countLoading ? "…" : totalKanji}</span>
            </div>

            <button
              type="button"
              className="text-sm text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-900"
              onClick={() => setSelected(new Set([Math.min(userLevel, 1)]))}
            >
              Reset
            </button>
          </div>
        </section>

        <button
          className="w-full rounded-xl bg-black py-2 text-white hover:opacity-90 disabled:opacity-50"
          disabled={selected.size === 0}
          onClick={() => router.push(`/practice/wanikani/session?levels=${selectedCsv}`)}
        >
          Start session
        </button>
      </div>
    </main>
  );
}
