"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Item = {
    subjectId: number;
    level: number;
    characters: string;
    acceptedMeanings: string[];
};

function normalize(s: string) {
    return s
        .toLowerCase()
        .trim()
        .replace(/[`']/g, "'")
        .replace(/[^a-z0-9'\s-]/g, "")
        .replace(/\s+/g, " ");
}

export default function WkSessionPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const levelsCsv = sp.get("levels") ?? "1";

    const minLevel = Number(sp.get("minLevel") ?? "1");
    const maxLevel = Number(sp.get("maxLevel") ?? "60");
    const limit = Number(sp.get("limit") ?? "25");

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [idx, setIdx] = useState(0);

    const [input, setInput] = useState("");
    const [revealed, setRevealed] = useState(false);
    const [feedback, setFeedback] = useState<null | {ok: boolean; correct: string[] }>(null);

    const [results, setResults] = useState<{ subjectId: number; characters: string; ok: boolean}[]>([]);

    const current = items[idx];

    useEffect(() => {
        (async () => {
            setLoading(true);
            setIdx(0);
            setResults([]);
            setInput("");
            setRevealed(false);
            setFeedback(null);

            try {
            const res = await fetch(`/api/wanikani/kanji?levels=${encodeURIComponent(levelsCsv)}`);

            const contentType = res.headers.get("content-type") ?? "";
            const isJson = contentType.includes("application/json");
            const data = isJson ? await res.json() : await res.text();

            if (!res.ok) {
                console.error("Kanji API error:", data);
                setItems([]);
                setLoading(false);
                return;
            }

            setItems((data as any).items ?? []);
            setLoading(false);
            } catch (err) {
            console.error("Fetch failed:", err);
            setItems([]);
            setLoading(false);
            }
        })();
    }, [levelsCsv]);


    const acceptedNormalized = useMemo(() => {
        if (!current) return [];
        return current.acceptedMeanings.map(normalize);
    }, [current]);

    function submit() {
        if (!current) return;

        const guess = normalize(input);
        const ok = guess.length > 0 && acceptedNormalized.includes(guess);

        setFeedback({ ok, correct: current.acceptedMeanings });

        setResults((r) => [
            ...r,
            { subjectId: current.subjectId, characters: current.characters, ok },
        ]);
    }

    function next() {
        setInput("");
        setRevealed(false);
        setFeedback(null);
        if (idx + 1 >= items.length) return;
        setIdx((n) => n + 1);
    }

    const done = !loading && items.length > 0 && results.length === items.length;
    const accuracy = useMemo(() => {
        if (results.length === 0) return 0;
        const correct = results.filter((r) => r.ok).length;
        return Math.round((correct / results.length) * 100);
    }, [results]);

    if (loading) {
        return (
            <main className="min-h-screen grid place-items-center bg-[#faf7f0]">
                <div className="text-sm text-neutral-600">Loading kanji...</div>
            </main>
        );
    }

    if(!loading && items.length === 0) {
        return (
            <main className="min-h-screen grid place-items-center p-6">
                <div className="max-w-md rounded-2xl border bg-white p-6 shadow-sm space-y-3">
                    <h1 className="text-xl font-semibold">No items found</h1>
                    <p className="text-sm text-neutral-600">
                        You may not have any Guru or above kanji in that level range.
                    </p>
                    <button className="rounded-xl border px-4 py-2" onClick={() =>router.push("/practice/wanikani/setup")}>
                        Back to setup
                    </button>
                </div>
            </main>
        );
    }

    if (done) {
        const missed = results.filter((r) => !r.ok);
        return (
            <main className="min-h-screen p-6">
                <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                    <h1 className="text-2xl font-semibol">Session complete</h1>
                    <p className="text-sm text-neutral-600">Accuracy: {accuracy}%</p>

                    {missed.length > 0 ? (
                        <div className="rounded-xl border bg-neutral-50 p-4">
                            <div className="text-sm font-medium mb-2">Missed</div>
                            <div className="flex flex-wrap gap-2">
                                {missed.map((m) => (
                                    <span key={m.subjectId} className="rounded-lg border bg-white px-2 py-1 text-sm">
                                        {m.characters}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-neutral-50 p-4 text-sm">
                            Perfect run!
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button className="flex-1 rounded-xl border px-4 py-2" onClick={() => router.push("/practice/wanikani/setup")}>
                            New session
                        </button>
                        <button className="flex-1 rounded-xl bg-black text-white px-4 py-2" onClick={() => router.push("/dashboard")}>
                            New session
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#faf7f0] p-6">
            <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-sm text-neutral-600">
                    <span>
                        {idx + 1} / {items.length}
                    </span>
                    <span>Level {current.level}</span>
                </div>

                <div className="text-center text-6xl font-semibold py-6 text-neutral-800">{current.characters}</div>

                <input 
                    className="w-full rounded-xl border px-3 py-3 text-lg text-neutral-800"
                    placeholder="Type the English meaning"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !feedback) submit();
                        if (e.key === "Enter" && feedback) next();
                    }}
                    readOnly={!!feedback}
                />

                <div className="flex gap-2">
                    {!feedback ? (
                        <>
                            <button
                                className="flex-1 rounded-xl bg-black py-2 text-white hover:opacity-90"
                                onClick={submit}
                            >
                                Submit
                            </button>
                            <button
                                className="flex-1 rounded-xl border py-2 text-neutral-800"
                                onClick={() => setRevealed(true)}
                            >
                                Reveal
                            </button>
                        </>
                    ) : (
                        <button
                            className="flex-1 rounded-xl bg-black py-2 text-white hover:opacity-90" onClick={next}>
                            Next
                        </button>
                    )}
                </div>

                {(revealed || feedback) && (
                    <div className="rounded-xl border bg-neutral-50 p-3 text-sm space-y-2 text-neutral-800">
                        <div className="font-medium">Accepted meanings</div>
                        <div className="flex flex-wrap gap-2 text-neutral-800">
                            {current.acceptedMeanings.map((m) => (
                                <span key={m} className="rounded-lg border bg-white px-2 py-1">
                                    {m}
                                </span>
                            ))}
                        </div>

                        {feedback && (
                            <div className={`text-sm ${feedback.ok ? "text-green-700" : "text-red-700"}`}>
                                {feedback.ok ? "Correct!" : "Incorrect"}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}