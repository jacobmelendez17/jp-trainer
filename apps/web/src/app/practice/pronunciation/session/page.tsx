"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WavRecorder } from "@/components/pronunciation/wav-recorder";

type Sentence = {
    id: string;
    jpText: string;
    jpReading: string;
    furiganaHtml?: string | null;
    enText: string;
};

function normalizeJP(s: string) {
    return (s || "")
        .trim()
        .replace(/[。．.、,!?\s]/g, "")
        .replace(/　/g, "")
        .toLowerCase();
}

export default function PronunciationSessionPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const orderIndex = Number(sp.get("orderIndex") ?? "0");

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [idx, setIdx] = useState(0);

    const [showFurigana, setShowFurigana] = useState(true);
    const [busy, setBusy] = useState(false);

    const [last, setLast] = useState<null | {
        provider: string;
        transcript: string;
        ok: boolean;
    }>(null);

    const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());

    const current = sentences[idx];

    useEffect(() => {
        (async () => {
            if (!orderIndex) return;

            setLoading(true);
            const res = await fetch(`/api/pronunciation/session?orderIndex=${orderIndex}`, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));

            if(!res.ok) {
                console.error("Session load failed:", data);
                setSentences([]);
                setTitle("");
                setLoading(false);
                return;
            }

            setTitle(data.challenge?.title ?? `Challenge ${orderIndex}`);
            setSentences(data.sentences ?? []);
            setIdx(0);
            setCorrectIds(new Set());
            setLast(null);
            setLoading(false);
        })();
    }, [orderIndex]);

    const total = sentences.length;
    const correct = correctIds.size;
    const done = !loading && total > 0 && idx >= total;

    const accuracy = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    }, [correct, total]);

    async function transcribeAndGrade(wav: Blob) {
        if (!current) return;

        setBusy(true);
        setLast(null);
        try {
            const fd = new FormData();
            fd.append("audio", wav, "audio.wav");

            const res = await fetch("/api/pronunciation/transcribe", { method: "POST", body: fd });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data?.error ?? "Transcribe failed");

            const transcript = String(data?.transcript ?? "");
            const provider = String(data?.provider ?? "unknown");

            const a = normalizeJP(transcript);
            const expectedKana = normalizeJP(current.jpReading);
            const expectedText = normalizeJP(current.jpText);

            const ok = a.length > 0 && (a === expectedKana || a === expectedText);

            setLast({ transcript, provider, ok });

            if (ok) {
                setCorrectIds((prev) => new Set(prev).add(current.id));
            }
        } catch (e: any) {
            setLast({ transcript: `Error: ${String(e?.message ?? e)}`, provider: "error", ok: false });
        } finally {
            setBusy(false);
        }
    }

    function next() {
        setLast(null);
        setIdx((n) => Math.min(n + 1, total));
    }

    async function finishAndSave() {
        const res = await fetch("/api/pronunciation/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error("Complete failed:", data);
            return;
        }
        router.push("/practice/pronunciation/setip");
    }

    if(loading) {
        return (
            <main className="min-h-screen grid place-items-center bg-[#faf7f0] p-6 text-neutral-800">
                <div className="text0sm text-neutral-700">Loading session...</div>
            </main>
        );
    }

    if (!loading && sentences.length === 0) {
        return (
            <main className="min-h-screen grid place-items-center bg-[#faf7f0] p-6 text-neutral-800">
                <div className="max-w-md rounded-2xl border border-neutral-800  bg-white p-6 shadow-sm space-y-3">
                    <h1 className="text-xl font-semibold text-neutral-800">No sentences found</h1>
                    <p className="text-sm text-neutral-700">Seed sentences for this challenge, then try again.</p>
                    <button
                        className="rounded-xl border border0neutral-800 px-4 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => router.push("/practice/pronunciation/setup")}
                    >
                        Back to setup
                    </button>
                </div>
            </main>
        );
    }

    if (done) {
        const earned = accuracy === 100 ? "Perfect (eligible for 5th star)" : accuracy >= 80 ? "Star eligible (≤ 4 stars)" : "No star";
        return (
            <main className="min-h-screen bg-[#faf7f0] p-6 text-neutral-800">
                <div className="mx-auto max-w-xl rounded-2xl border border-neutral-800 bg-white p-6 shadow-sm space-y-4">
                    <h1 className="text-2xl font-bold text-neutral-800">
                        Challenge {orderIndex} complete
                    </h1>
                    <div className="text-sm text-neutral-700">
                        Accuray: <span className="font-semibold">{accuracy}%</span> ({correct}/{total})
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-neutral-50 p-3 text-sm text-neutral-800">
                        Result: <span className="font-semibold">{earned}</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="flex-1 rounded-xl border border0neutral-800 px-4 py-2 text-sm hover:bg-neutral-50"
                            onClick={() => router.push("/practice/pronunciaation/setup")}
                        >
                            Back
                        </button>
                        <button
                            className="flex-1 rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                            onClick={finishAndSave}
                        >
                            Save & finish
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#faf7f0] p-6 text-neutral-800">
            <div className="mx0auto max-w-2xl space-y-4">
                <header className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-white p-4 shadow-sm">
                    <div className="space-y-1">
                        <div className="text-sm text-neutral-700">
                            Challenge <span className="font-semibold">{orderIndex}</span>
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 ">{title}</div>
                    </div>

                    <button
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => router.push("/practice/pronunciation/setup")}
                    >
                        Exit
                    </button>
                </header>

                <section className="rounded-2xl border border-neutral-800 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-neutral-800">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={showFurigana}
                                onChange={(e) => setShowFurigana(e.target.checked)}
                            />
                            Furigana
                        </label>

                        <div className="text-sm text-neutral-700">
                            Correct: <span className="font-semibold">{correct}</span> / {total}
                        </div>
                    </div>

                    <div className="rounded-2xl border- border-neutral-800 bg-neutral-50 p-6">

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                    </div>

                    {last && (
                        <div className="rounded-xl border border-neutral-800 bg-white p-3 text-sm space-y-2">
                            
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}