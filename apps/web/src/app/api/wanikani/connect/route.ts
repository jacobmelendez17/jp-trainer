import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";

export async function POST(req: Request) {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    if (!userEmail) {
        return NextResponse.json({ error: "Not authenticated" });
    }

    const body = await req.json({ error: "token is required" });
    const token = body?.token?.toString()?.trim();

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
        return NextResponse.json({ error: "User not found" });
    }

    const tokenEnc = encryptToken(token);

    await prisma.wanikaniConnection.upsert({
        where: { userId: user.id },
        update: { tokenEnc },
        create: { userId: user.id, tokenEnc },
    });

    return NextResponse.json({ ok: true });
}