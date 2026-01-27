import { NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpegStatic from "ffmpeg-static";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { createRequire } from "node:module";

export const runtime = "nodejs";

function whichFfmpeg(): string | null {
    try {
        const p = execFileSync("which", ["ffmpeg"]).toString().trim();
        return p || null;
    } catch {
        return null;
    }
}

function findRepoRootFfmpegStatic(): string | null {
    let dir = process.cwd();
    for (let i = 0; i < 8; i++) {
        const candidate = path.join(dir, "node_modules", "ffmpeg-static", "ffmpeg");
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

const staticPath = (ffmpegStatic as unknown as string | null) || null;
const repoStatic = findRepoRootFfmpegStatic();
const sys = whichFfmpeg();

let kuro: Kuroshiro | null = null;

const require = createRequire(import.meta.url);

async function safeToHiragana(text: string) {
    try {
        if (!kuro) {
            const dictPath = resolveKuromojiDictPath();
            console.log("[kuromoji] dictPath:", dictPath);

            kuro = new Kuroshiro();
            await kuro.init(
                new KuromojiAnalyzer({
                    dictPath, // ✅ IMPORTANT
                })
            );
        }
        return await kuro.convert(text, { to: "hiragana" });
    } catch (e) {
        console.warn("[kuroshiro] failed to convert", String((e as any)?.message ?? e));
        return "";
    }
}

const chosen =
    (staticPath && fs.existsSync(staticPath) ? staticPath : null) ||
    (repoStatic && fs.existsSync(repoStatic) ? repoStatic : null) ||
    (sys && fs.existsSync(sys) ? sys : null);

console.log("[ffmpeg] debug", {
    cwd: process.cwd(),
    staticPath,
    staticExists: staticPath ? fs.existsSync(staticPath) : false,
    repoStatic,
    repoStaticExists: repoStatic ? fs.existsSync(repoStatic) : false,
    sys,
    sysExists: sys ? fs.existsSync(sys) : false,
    chosen,
});

if (chosen) {
    ffmpeg.setFfmpegPath(chosen);
    console.log("[ffmpeg] using", chosen);
} else {
    console.warn("[ffmpeg] no usable ffmpeg found");
}

async function writeTempFile(buf: Buffer, ext: string) {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "jp-trainer-"));
    const file = path.join(dir, `audio.${ext}`);
    await fs.promises.writeFile(file, buf);
    return { dir, file };
}

async function convertToWav16k(inputPath: string) {
    const outPath = inputPath.replace(/\.[^.]+$/, ".wav");
    const ffmpegLog: string[] = [];

    await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
            .audioChannels(1)
            .audioFrequency(16000)
            .audioCodec("pcm_s16le")
            .format("wav")
            .on("start", (cmd) => console.log("[ffmpeg] start", cmd))
            .on("stderr", (line) => {
                ffmpegLog.push(line);
                if (ffmpegLog.length > 40) ffmpegLog.shift();
            })
            .on("end", () => resolve())
            .on("error", (err) => {
                (err as any).__ffmpegLog = ffmpegLog.join("\n");
                reject(err);
            })
            .save(outPath);
    });

    return outPath;
}

function resolveKuromojiDictPath() {
    // points to .../node_modules/kuromoji/src/kuromoji.js (or similar)
    const kuromojiEntry = require.resolve("kuromoji");
    // dict is at .../node_modules/kuromoji/dict
    return path.join(path.dirname(kuromojiEntry), "..", "dict");
}

async function transcribeAzureWav(wavPath: string) {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) throw new Error("Azure not configured (missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION)");

    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP`;
    const wav = await fs.promises.readFile(wavPath);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
            Accept: "application/json",
        },
        body: wav,
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`Azure STT failed: ${res.status} ${text}`);

    const data: any = text ? JSON.parse(text) : null;
    const transcript = data?.DisplayText;
    if (!transcript) throw new Error(`Azure returned unexpected JSON: ${text.slice(0, 500)}`);

    return String(transcript);
}

async function transcribeWhisperServerFile(filePath: string) {
    const url = process.env.WHISPER_SERVER_URL || "http://127.0.0.1:8787/inference";

    const fileBuf = await fs.promises.readFile(filePath);
    const fd = new FormData();
    fd.set("file", new Blob([fileBuf]), path.basename(filePath));
    fd.set("response_format", "json");
    fd.set("language", "ja");

    const res = await fetch(url, { method: "POST", body: fd });

    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`whisper-server failed: ${res.status} ${text}`);

    const data: any = text ? JSON.parse(text) : null;
    const transcript = data?.text ?? data?.transcription ?? data?.result?.text ?? "";
    if (!transcript) throw new Error(`whisper-server returned unexpected JSON: ${text.slice(0, 500)}`);

    return String(transcript);
}

export async function POST(req: Request) {
    let stage = "init";
    try {
        stage = "read-form";
        const form = await req.formData();
        const audio = form.get("audio");

        if (!(audio instanceof File)) {
            return NextResponse.json({ error: "Missing audio file", stage }, { status: 400 });
        }

        stage = "bufferize";
        const arr = await audio.arrayBuffer();
        const buf = Buffer.from(arr);

        const mime = (audio.type || "").toLowerCase();
        const ext =
            mime.includes("webm") ? "webm" :
                mime.includes("mp4") ? "mp4" :
                    mime.includes("wav") ? "wav" :
                        ((audio.name.split(".").pop() || "bin").toLowerCase());

        console.log("[transcribe] incoming", { stage, mime, ext, filename: audio.name, bytes: audio.size });

        stage = "write-temp";
        const { dir, file: inputPath } = await writeTempFile(buf, ext);

        try {
            stage = "convert-wav";
            const wavPath = await convertToWav16k(inputPath);

            stage = "azure";
            try {
                const transcript = await transcribeAzureWav(wavPath);
                const reading = await safeToHiragana(transcript);
                return NextResponse.json({ transcript, reading, provider: "azure" });
            } catch (azureErr: any) {
                stage = "whisper";
                const transcript = await transcribeWhisperServerFile(wavPath);
                const reading = await safeToHiragana(transcript);

                return NextResponse.json({
                    transcript,
                    reading,
                    provider: "whisper",
                    azureError: String(azureErr?.message ?? azureErr),
                });

            }
        } finally {
            await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => { });
        }
    } catch (err: any) {
        console.error("[transcribe] failed", { stage, err: String(err?.message ?? err) });
        return NextResponse.json(
            {
                error: "Transcription failed",
                stage,
                details: String(err?.message ?? err),
                ffmpeg: err?.__ffmpegLog ? String(err.__ffmpegLog).slice(0, 2000) : undefined,
            },
            { status: 500 }
        );
    }
}
