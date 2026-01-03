import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma"
import { decryptToken } from "@/lib/crypto";

export async function GET() {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    if (!userEmail) {
        return NextResponse.json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found " });
    }

    const conn = await prisma.wanikaniConnection.findUnique({
        where: { userId: user.id },
        select: { tokenEnc: true },
    });

    if (!conn) {
        return NextResponse.json({ error: "No token saved" });
    }

    const token = decryptToken(conn.tokenEnc);

    const resp = await fetch("https://api.wanikani.com/v2/user", {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json();
    if (!resp.ok) {
        return NextResponse.json({ error: "WaniKani API Error", details: data });
    }

    return NextResponse.json({
        ok: true,
        username: data?.data?.username,
        level: data?.data?.level,
        profileUrl: data?.data?.profile_url,
    })
}