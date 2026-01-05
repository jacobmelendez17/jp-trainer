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
            const res = await fetch(
                `api/wanikani/anji?minLevel=${minLevel}&maxLevel=${maxLevel}&limit=${limit}`
            );
            const data = await res.json();
            setItems(data.items ?? []);
            setLoading(false);
        })();
    }, [minLevel, maxLevel, limit]);

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
            <main className="min-h-screen grid place-items-center bg-[#faf7f0] p-6">
                <div className="max-w-md rounded-2xl border bg-white p-6 shadow-sm space-y-3">
                    
                </div>
            </main>
        )
    }
}