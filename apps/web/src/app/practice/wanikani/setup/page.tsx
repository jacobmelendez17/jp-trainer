"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function toCsv(set: Set<number>) {
  return Array.from(set).sort((a, b) => a - b).join(",");
}

export default function WaniKaniSetupPage() {
  const router = useRouter();

  const allLevels = useMemo(() => Array.from({ length: 60 }, (_, i) => i + 1), []);
  const [selected, setSelected] = useState<Set<number>>(new Set([1]));
  const [userLevel, setUserLevel] = useState<number>(24);
  const [totalKanji, setTotalKanji] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/wanikani/user-level");
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (Number.isFinite(data?.level)) setUserLevel(data.level);
    })();
  }, []);

  useEffect(() => {
    const csv = toCsv(selected);
    if (!csv) {
      setTotalKanji(0);
      return;
    }

    const ac = new AbortController();
    setCountLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/wanikani/kanji-count?levels=${csv}`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("kanji-count failed:", res.status, text);
          setTotalKanji(0);
          return;
        }
        const data = await res.json().catch(() => null);
        setTotalKanji(Number(data?.total ?? 0));
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

  const levelsCsv = toCsv(selected);

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-800">WaniKani Refresher</h1>
          <p className="text-sm text-neutral-800">
            Select levels to review. The session includes <span className="font-semibold">all kanji</span> in those levels.
          </p>
          <p className="text-xs text-neutral-800">
            Your level: <span className="font-semibold text-neutral-800">{userLevel}</span> (higher levels are locked)
          </p>
        </header>

        <section className="space-y-3">
          <div className="text-sm font-semibold text-neutral-800">Levels</div>

          {/* EXACTLY 6x10 */}
          <div className="grid grid-cols-10 gap-3">
            {allLevels.map((lvl) => {
              const locked = lvl > userLevel;
              const active = selected.has(lvl);

              return (
                <button
                  key={lvl}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleLevel(lvl)}
                  className={[
                    "h-12 w-12 rounded-lg border text-base font-semibold transition",
                    "focus:outline-none focus:ring-2 focus:ring-neutral-800/30",
                    locked
                      ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                      : active
                      ? "border-neutral-800 bg-neutral-800 text-white"
                      : "border-neutral-300 bg-neutral-200 text-neutral-800 hover:bg-neutral-300",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {String(lvl).padStart(2, "0")}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-neutral-900">
              Total Kanji selected:{" "}
              <span className="font-semibold">{countLoading ? "…" : totalKanji}</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="text-sm font-medium text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-900"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </button>
              <button
                type="button"
                className="text-sm font-medium text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-900"
                onClick={() => setSelected(new Set([1]))}
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <button
          className="rounded-xl bg-black py-2 text-white hover:opacity-90 disabled:opacity-50"
          disabled={selected.size === 0}
          onClick={() => router.push(`/practice/wanikani/session?levels=${levelsCsv}`)}
        >
          Start session
        </button>
      </div>
    </main>
  );
}
