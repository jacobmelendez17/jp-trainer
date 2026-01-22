import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";

export const runtime = "nodejs";

async function wkGet(token: string, path: string) {
    return fetch(`https://api.wanikani.com/v2${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
}

function parseLevels(csv: string | null) {
    const levels = (csv ?? "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 60);

    return Array.from(new Set(levels)).sort((a, b) => a - b);
}

export async function GET(req: NextRequest) {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conn = await prisma.wanikaniConnection.findUnique({ where: { userId: user.id } });
    if (!conn?.tokenEnc) return NextResponse.json({ error: "No token saved" }, { status: 400 });

    const token = decryptToken(conn.tokenEnc);

    const levels = parseLevels(req.nextUrl.searchParams.get("levels"));
    if (levels.length === 0) {
        return NextResponse.json(
            { error: "Missing/invalid levels param. Example: levels=1,2,3" },
            { status: 400 }
        );
    }

    // 1) Fetch assignments for kanji for selected levels
    const assignmentsRes = await wkGet(
        token,
        `/assignments?subject_types=kanji&levels=${levels.join(",")}&unlocked=true`
    );

    if (!assignmentsRes.ok) {
        const body = await assignmentsRes.text().catch(() => "");
        return NextResponse.json(
            { error: "WaniKani assignments error", status: assignmentsRes.status, body },
            { status: 502 }
        );
    }

    const assignmentsJson: any = await assignmentsRes.json();
    const subjectIds: number[] =
        (assignmentsJson?.data ?? [])
            .map((a: any) => a?.data?.subject_id)
            .filter((n: any) => Number.isFinite(n));

    if (subjectIds.length === 0) return NextResponse.json({ items: [] });

    // 2) Fetch the kanji subjects
    const subjectsRes = await wkGet(token, `/subjects?types=kanji&ids=${subjectIds.join(",")}`);
    if (!subjectsRes.ok) {
        const body = await subjectsRes.text().catch(() => "");
        return NextResponse.json(
            { error: "WaniKani subjects error", status: subjectsRes.status, body },
            { status: 502 }
        );
    }

    const subjectsJson: any = await subjectsRes.json();
    const subjects: any[] = subjectsJson?.data ?? [];

    const items = subjects
        .map((s: any) => ({
            subjectId: s.id,
            level: s.data?.level,
            characters: s.data?.characters,
            acceptedMeanings: (s.data?.meanings ?? [])
                .filter((m: any) => m?.accepted_answer)
                .map((m: any) => String(m.meaning)),
        }))
        .filter((x: any) => x.characters && x.acceptedMeanings.length > 0);

    // Shuffle (still only within chosen levels)
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    return NextResponse.json({ items });
}
