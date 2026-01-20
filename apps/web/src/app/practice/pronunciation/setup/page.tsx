"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Challenge = {
    id: string;
    orderIndex: number;
    title: string;
    stars: number;
    isLocked: boolean;
    sentenceCount: number;
}

function Stars({ n }: { n: number }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < n ? "text-neutral-800" : "text-neutral-400"}`}>
                    *
                </span>
            ))}
        </div>
    );
}

export default function PronunciationSetUpPage() {
    const router = useRouter();
    const [items, setItems] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await fetch("/api/pronunciation/challenges", {cache: "no-store" });
            const data = await res.json().catch(() => ({}));
            setItems(data.challenges ?? []);
            setLoading(false);
        })();
    }, []);

    const unlockedCount = useMemo(() => items.filter((c) => !c.isLocked).length, [items]);

    return (
        <main className="min-h-screen bg-[#faf7f0] p06 text-neutral-800">
            <div className="mx-auto max-w-3xl space-y-4">
                <header className="space-y-1">
                    <h1 className="text-3xl font-bold text-neutral-800">Pronunciation</h1>
                    <p className="text-sm text-neutral-700">
                        Earn a star when you finish a challenge with <span className="font-semibold">≥ 80%</span> accuracy.
                        The <span className="font-semibold">5th star</span> only comes from a <span className="font-semibold">100%</span> run.
                    </p>
                </header>

                <section className="rounded-2xl border border-neutral-800 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-neutral-800">
                            Challenges unlocked: <span className="font-semibold">{unlockedCount}</span> / {items.length}
                        </div>
                        <button
                            className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-50"
                            onClick={() => router.push("/practice")}
                        >
                            Back
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-neutral-800 bg-white p-4 shadow-sm">
                    {loading ? (
                        <div className="text-sm text-neutral-700">Loading challenges...</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {items.map((c) => {
                                const disabled = c.isLocked || c.sentenceCount === 0;
                                return(
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => router.push(`/practice/pronunciation/session?orderIndex=${c.orderIndex}`)}
                                        disabled={disabled}
                                        className={[
                                            "rounded-xl border border-neutral-800 p-3 text-left transition",
                                            disabled ? "opacity-40 cursor-not-allowed bg-neutral-100" : "hover:bg-neutral-50",
                                        ].join(" ")}
                                        title={c.sentenceCount === 0 ? "No sentences yet" : c.isLocked ? "Locked" : "Start"}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="text-lg font-semibold text-neutral-800">{c.orderIndex}</div>
                                                <div className="text-xs text-neutral-700">{c.title}</div>
                                            </div>
                                            <Stars n={c.stars} />
                                        </div>
                                        <div className="mt-2 text-xs text-neutral-700">
                                            Sentences: <span className="font-semibold">{c.sentenceCount}</span>
                                            {c.isLocked && <span className="ml-2 font semibold">Locked</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}