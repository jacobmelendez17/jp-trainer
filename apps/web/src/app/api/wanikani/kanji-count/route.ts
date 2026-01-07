import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";

function parseLevels(csv: string | null): number[] {
    if (!csv) return [];
    return csv
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 60);
}

export async function GET(req: Request) {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conn = await prisma.wanikaniConnection.findUnique({ where: { userId: user.id } });
    if (!conn?.tokenEnc) return NextResponse.json({ error: "No token saved" }, { status: 400 });

    const token = decryptToken(conn.tokenEnc);

    const { searchParams } = new URL(req.url);
    const levels = parseLevels(searchParams.get("levels"));
    if (levels.length === 0) return NextResponse.json({ total: 0 });

    const url = new URL("https://api.wanikani.com/v2/subjects");
    url.searchParams.set("types", "kanji");
    url.searchParams.set("levels", levels.join(","));

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        return NextResponse.json({ error: "WaniKani error", status: res.status, body }, { status: 502 });
    }

    const data = await res.json();
    const total = Number(data?.total_count ?? 0);

    return NextResponse.json({ total });
}