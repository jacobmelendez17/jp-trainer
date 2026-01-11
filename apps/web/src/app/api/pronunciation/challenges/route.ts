import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TIER_SIZE = 10;

async function getAuthedUserId() {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return null;
}

function computeLocked(orderIndex: number, starsByOrder: Map<Number, number>) {
    const tier = Math.floor((orderIndex - 1) / TIER_SIZE) + 1;
    if (tier <= 1) return false;

    const prevTierStart = (tier - 2) * TIER_SIZE + 1;
    const prevTierEnd = (tier - 1) * TIER_SIZE;

    for (let i = prevTierStart; i <= prevTierEnd; i++) {
        const s = starsByOrder.get(i) ?? 0;
        if (s < 3) return true;
    }
    return false;
}

export async function GET() {
    const userId = await getAuthedUserId();
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const challenges = await prisma.pronunciationChallenge.findMany({
        orderBy: { orderIndex: "asc" },
        include: {
            _count: { select: { sentences: true } },
            progresses: { where: { userId }, select: { stars: true } },
        },
    });

    const starsByOrder = new Map<number, number>();
    for (const c of challenges) {
        const stars = c.progresses[0]?.stars ?? 0;
        starsByOrder.set(c.orderIndex, stars);
    }

    const payload = challenges.map((c) => {
        const stars = c.progresses[0]?.stars ?? 0;
        const isLocked = computeLocked(c.orderIndex, starsByOrder);

        return {
            id: c.id,
            orderIndex: c.orderIndex,
            title: c.title,
            stars,
            isLocked,
            sentenceCount: c._count.sentences,
        };
    });

    return NextResponse.json({ challenges: payload });
}