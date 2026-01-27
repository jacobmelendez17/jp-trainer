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

async function toHiraganaReading(text: string) {
    const k = await getKuro();
    const hira = await k.convert(text, { to: "hiragana" });
    return normalizeJP(hira);
}

function isWav(file: File) {
    const t = (file.type || "").toLowerCase();
    const n = (file.name || "").toLowerCase();
    return t.includes("wav") || n.endsWith(".wav");
}

async function transcribeAzure(wavFile: File) {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
        throw new Error("Azure not configured (missing AZURE KEY or AZURE REGION)");
    }

    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP`;

    const body = await wavFile.arrayBuffer();

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
            Accept: "application/json",
        },
        body,
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        throw new Error(`Azure STT failed: ${res.status} ${text}`);
    }

    const data: any = text ? JSON.parse(text) : null;
    const transcript = data?.DisplayText;

    if (!transcript) {
        throw new Error(`Azure returned unexpected JSON: ${text.slice(0, 500)}`);
    }

    return String(transcript);
}

async function transcribeWhisperServer(wavFile: File) {
    const url = process.env.WHISPER_SERVER_URL || "http://127.0.0.1:8787/inference";

    const fd = new FormData();
    fd.set("file", wavFile, wavFile.name || "audio.wav");
    fd.set("response_format", "json");

    const res = await fetch(url, { method: "POST", body: fd });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        throw new Error(`whisper-server failed: ${res.status} ${text}`);
    }

    const data: any = text ? JSON.parse(text) : null;
    const transcript =
        data?.text ??
        data?.transcription ??
        data?.result?.text ??
        "";

    if (!transcript) {
        throw new Error(`whisper-server returned unexpected JSON: ${text.slice(0, 500)}`)
    }

    return String(transcript);
}

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const audio = form.get("audio");

        if (!(audio instanceof File)) {
            return NextResponse.json(
                { error: "Missing audio file. Expected field name: audio" },
                { status: 400 }
            );
        }

        if (!isWav(audio)) {
            return NextResponse.json(
                { error: "Please upload WAV audio (PCM 16kHz mono recommended)." },
                { status: 400 }
            );
        }

        try {
            const transcript = await transcribeAzure(audio);
            const reading = await toHiraganaReading(transcript);
            return NextResponse.json({ transcript, reading, provider: "azure" });
        } catch (azureErr: any) {
            const transcript = await transcribeWhisperServer(audio);
            const reading = await toHiraganaReading(transcript);
            return NextResponse.json({
                transcript,
                reading,
                provider: "whisper",
                azureError: String(azureErr?.message ?? azureErr),
            });
        }
    } catch (err: any) {
        return NextResponse.json(
            { error: "Transcription failed", details: String(err?.message ?? err) },
            { status: 500 }
        );
    }
}