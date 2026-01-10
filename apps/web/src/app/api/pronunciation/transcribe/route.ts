import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
            return NextResponse.json({ transcript, provider: "azure" });
        } catch (azureErr: any) {
            const transcript = await transcribeWhisperServer(audio);
            return NextResponse.json({
                transcript,
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