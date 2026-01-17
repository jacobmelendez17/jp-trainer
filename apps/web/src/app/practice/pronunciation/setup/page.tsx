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