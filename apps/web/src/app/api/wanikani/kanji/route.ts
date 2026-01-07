import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";

const WK_BASE = "https://api.wanikani.com/v2";

const GURU_PLUS_STAGES = "5,6,7,8,9";

type Assignment = {
    data: {
        subject_id: number;
        subject_type: string;
        srs_stage: number;
    };
};

type Subject = {
    id: number;
    object: string;
    data: {
        level: number;
        characters: string | null;
        meanings: { meaning: string; primary: boolean }[];
        auxiliary_meanings: { meaning: string; type: "whitelist" | "blacklist"; accepted_answer: boolean }[];
    };
}

async function wkGetAll<T>(token: string, path: string) {
    const out: T[] = [];
    let url: string | null = `${WK_BASE}${path}`;

    while (url) {
        const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        const json: unknown = await resp.json();
        if (!resp.ok) throw new Error(JSON.stringify(json));

        const parsed = json as { data: T[]; pages?: { next_url?: string | null } };
        out.push(...(parsed.data as T[]));
        url = parsed.pages?.next_url ?? null;
    }

    return out;
}

function chunk<T>(arr: T[], size: number) {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

function shuffle<T>(arr: T[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        const email = session?.user?.email;
        if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const minLevel = Number(searchParams.get("minLevel") ?? "1");
        const maxLevel = Number(searchParams.get("maxLevel") ?? "60");
        const limit = Math.min(Number(searchParams.get("limit") ?? "25"), 100);

        if (!Number.isFinite(minLevel) || !Number.isFinite(maxLevel) || minLevel < 1 || maxLevel < minLevel) {
            return NextResponse.json({ error: "Invalid level range" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const conn = await prisma.wanikaniConnection.findUnique({
            where: { userId: user.id },
            select: { tokenEnc: true },
        });
        if (!conn) return NextResponse.json({ error: "No WaniKani token saved" }, { status: 404 });

        const token = decryptToken(conn.tokenEnc);

        // IMPORTANT: make sure this string is correct:
        // headers: { Authorization: `Bearer ${token}` }
        const assignments = await wkGetAll<Assignment>(
            token,
            `/assignments?subject_types=kanji&started=true&srs_stages=${GURU_PLUS_STAGES}`
        );

        const subjectIds = assignments.map((a) => a.data.subject_id);
        if (subjectIds.length === 0) return NextResponse.json({ items: [] });

        const idChunks = chunk(subjectIds, 250);
        const subjects: Subject[] = [];

        for (const ids of idChunks) {
            const resp = await fetch(`${WK_BASE}/subjects?ids=${ids.join(",")}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });

            const json: unknown = await resp.json().catch(() => null);

            if (!resp.ok) {
                return NextResponse.json(
                    { error: "WaniKani API error", status: resp.status, details: json },
                    { status: resp.status }
                );
            }

            const parsed = json as { data: Subject[] };
            subjects.push(...parsed.data);
        }

        const filtered = subjects
            .filter((s) => s.object === "kanji")
            .filter((s) => (s.data.level ?? 0) >= minLevel && (s.data.level ?? 0) <= maxLevel)
            .filter((s) => !!s.data.characters);

        const items = shuffle(filtered)
            .slice(0, limit)
            .map((s) => {
                const primary = (s.data.meanings ?? []).filter((m) => m.primary).map((m) => m.meaning);
                const acceptedAux = (s.data.auxiliary_meanings ?? [])
                    .filter((m) => m.accepted_answer === true)
                    .map((m) => m.meaning);
                const accepted = Array.from(new Set([...primary, ...acceptedAux]));

                return {
                    subjectId: s.id,
                    level: s.data.level,
                    characters: s.data.characters!,
                    acceptedMeanings: accepted,
                };
            });

        return NextResponse.json({ items });
    } catch (e: any) {
        console.error("Kanji route error:", e);
        return NextResponse.json(
            { error: "Server error", message: String(e?.message ?? e) },
            { status: 500 }
        );
    }
}
