import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const email = body?.email?.toLowerCase().trim();
    const password = body?.password ?? "";

    if (!email ) {
        return NextResponse.json(
            { error: "Email required" },
            { status : 400 }
        );
    }

    if (password.length < 8) {
        return NextResponse.json(
            { error: "Password must be at least 8 characters." },
            { status : 400 }
        );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "Email already in use." }, {status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data:{ email, passwordHash }
    });

    return NextResponse.json({ ok: true});
}