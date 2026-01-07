import { NextResponse } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import ffmpeg from "fluent-ffmpeg";

import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpehPath(ffmpegPath as string);

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
    }
}