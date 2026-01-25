import { NextResponse } from "next/server";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

export const runtime = "nodejs";

let kuro: Kuroshiro | null = null;
async function getKuro() {
    if (kuro) return kuro;
    const k = new Kuroshiro();
    await k.init(new KuromojiAnalyzer());
    kuro = k;
    return k;
}

function normalizeJP(s: string) {
    return (s || "")
        .trim()
        .replace(/[。．.、,!?\s]/g, "")
        .replace(/ /g, "");
}
