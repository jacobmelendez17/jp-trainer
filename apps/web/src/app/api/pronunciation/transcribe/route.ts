import { NextResponse } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath as string);

export const runtime = "nodejs";

async function writeTempFile(buf: Buffer, ext: string) {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "jp-trainer'"));
    const file = path.join(dir, `audio.${ext}`);
    await fs.promises.writeFile(file, buf);
    return { dir, file };
}

async function convertToWav16k(inputPath: string) {
    const outPath = inputPath.replace(/\.[^.]+$/, ".wav");

    await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
            .audioChannels(1)
            .audioFrequency(16000)
            .audioCodec("pcm_s1gle")
            .format("wav")
            .on("end", () => resolve())
            .on("error", (err: any) => reject(err))
            .save(outPath);
    });

    return outPath;
}

async function tryAzureShortAudio(wavPath: string) {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) return null;

    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP`;

    const wav = await fs.promises.readFile(wavPath);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
            "Accept": "application/json",
        },
        body: wav,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Azure STT failed: ${res.status} ${text}`);
    }

    const data: any = await res.json().catch(() => null);

    const transcript =
        data?.DisplayText ??
            data?.NBest?.[0]?.Display ??
            data?.NBest?.[0]?.DisplayText ??
            data?.RecognitionStatus === "Success"
            ? data?.DisplayText
            : null;

    if (!transcript) {
        throw new Error(`Azure STT returned unexpected JSON: ${JSON.stringify(data).slice(0, 500)}`);
    }

    return String(transcript);
}

async function tryWhisperService(originalPath: string) {
    const whisperUrl = process.env.WHISPER_URL;
    if (!whisperUrl) return null;

    const fileBuf = await fs.promises.readFile(originalPath);
    const form = new FormData();
    form.set("file", new Blob([fileBuf]), path.basename(originalPath));
    form.set("language", "ja");

    const res = await fetch(whisperUrl, { method: "POST", body: form });
    if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Whisper service failed: ${res.status} ${text}`);
    }
    const data: any = await res.json().catch(() => null);
    if (!data?.transcript) throw new Error("Whisper service returned no transcript");
    return String(data.transcript);
}

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("audio");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Missing audio file (field name: audio)" }, { status: 400 });
        }

        const arr = await file.arrayBuffer();
        const buf = Buffer.from(arr);
        const ext = (file.name.split(".").pop() || "webm").toLowerCase();

        const { dir, file: inputPath } = await writeTempFile(buf, ext);

        try {
            const wavPath = await convertToWav16k(inputPath);

            try {
                const azureTranscript = await tryAzureShortAudio(wavPath);
                if (azureTranscript) return NextResponse.json({ transcript: azureTranscript, provider: "azure" });
            } catch (e) {
                console.warn(String(e));
            }

            const whisperTranscript = await tryWhisperService(inputPath);
            if (whisperTranscript) return NextResponse.json({ transcript: whisperTranscript, provider: "whisper" });

            return NextResponse.json({ error: "No transcription provider configured" }, { status: 500 });
        } finally {
            fs.promises.rm(dir, { recursive: true, force: true }).catch(() => { });
        }
    } catch (err: any) {
        return NextResponse.json({ error: "Transcription failed", details: String(err?.message ?? err) }, { status: 500 });
    }
}