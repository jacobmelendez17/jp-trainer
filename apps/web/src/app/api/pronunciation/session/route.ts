import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getAuthedUserId() {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return null;

    const user = await prisma.user.findUnique({ where: { email } });
    return user?.id ?? null;
}

export async function GET(req: Request) {
    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderIndex = Number(searchParams.get("orderIndex") ?? "0");
    if (!orderIndex || Number.isNaN(orderIndex)) {
        return NextResponse.json({ error: "Missing/invalid orderIndex" }, { status: 400 });
    }

    const challenge = await prisma.pronunciationChallenge.findUnique({
        where: { orderIndex },
        include: {
            sentences: { orderBy: { createdAt: "asc" } },
        },
    });

    if (!challenge) {
        return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    if (challenge.sentences.length === 0) {
        return NextResponse.json({ error: "No sentences found for this challenge. Seed some sentences first. " }, { status: 404 });
    }

    return NextResponse.json({
        challenge: { id: challenge.id, orderIndex: challenge.orderIndex, title: challenge.title },
        sentences: challenge.sentences.map((s) => ({
            id: s.id,
            jpText: s.jpText,
            jpReading: s.jpReading,
            furiganaHtml: s.furiganaHtml,
            enText: s.enText,
        })),
    });
}