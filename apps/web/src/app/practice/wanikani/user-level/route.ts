import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";

async function wkGet(token: string, path: string) {
    const res = await fetch(`https://api.wanikani.com/v2${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    return res;
}

export async function GET() {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conn = await prisma.wanikaniConnection.findUnique({ where: { userId: user.id } });
    if (!conn?.tokenEnc) return NextResponse.json({ error: "No token saved" }, { status: 400 });

    const token = decryptToken(conn.tokenEnc);

    const res = await wkGet(token, "/user");
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        return NextResponse.json({ error: "WaniKani error", status: res.status, body }, { status: 502 });
    }

    const data = await res.json();
    const level = data?.data?.level ?? 1;

    return NextResponse.json({ level });
}