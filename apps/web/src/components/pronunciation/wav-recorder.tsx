"use client";

import { useEffect, useRef, useState } from "react";
import RecordRTC from "recordrtc";

type Props = {
    disabled?: boolean;
    onWavReady: (wav: Blob) => void;
};

export function WavRecorder({ disabled, onWavReady }: Props) {
    const [recording, setRecording] = useState(false);
    const recRef = useRef<RecordRTC | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            try {
                recRef.current?.destroy();
            } catch {}
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    async function start() {
        if (disabled || recording) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const rec = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/wav",
            recorderType: RecordRTC.StereoAudioRecorder,
            numberOfAudioChannels: 1,
            desiredSampRate: 16000,
        });

        recRef.current = rec;
        rec.startRecording();
        setRecording(true);
    }

    async function stop() {
        const rec = recRef.current;
        const stream = streamRef.current;
        if (!rec || !stream) return;

        await new Promise<void>((resolve) => {
            rec.stopRecording(() => resolve());
        });

        const blob = rec.getBlob();

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        recRef.current?.destroy();
        recRef.current = null;

        setRecording(false);
        onWavReady(blob);
    }
    
    return (
        <button
            type="button"
            className={`rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-800 ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-50"
            }`}
            onClick={recording ? stop : start}
            disabled={disabled}
        >
            {recording ? "Stop recording" : "Record (WAV)"}
        </button>
    )
}