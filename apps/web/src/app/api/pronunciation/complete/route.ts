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

export async function POST(req: Request) {
    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const orderIndex = Number(body?.orderIndex ?? 0);
    const correct = Number(body?.correct ?? 0);
    const total = Number(body?.total ?? 0);

    if (!orderIndex || total <= 0 || correct < 0 || correct > total) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const challenge = await prisma.pronunciationChallenge.findUnique({
        where: { orderIndex },
        select: { id: true },
    });

    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    const accuracy = correct / total;

    const earned = accuracy === 1 ? 1 : accuracy >= 0.8 ? 1 : 0;
    const cap = accuracy === 1 ? 5 : 4;

    const current = await prisma.userPronunciationChallengeProgress.findUnique({
        where: { userId_challengeId: { userId, challengeId: challenge.id } },
        select: { stars: true },
    });

    const oldStars = current?.stars ?? 0;
    const newStars = Math.min(cap, oldStars + earned);

    await prisma.userPronunciationChallengeProgress.upsert({
        where: { userId_challengeId: { userId, challengeId: challenge.id } },
        create: { userId, challengeId: challenge.id, stars: newStars },
        update: { stars: newStars },
    });

    return NextResponse.json({ orderIndex, accuracy, earned, oldStars, newStars });
}