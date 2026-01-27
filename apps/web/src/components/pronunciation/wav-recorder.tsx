"use client";

import { useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onAudioReady: (audio: Blob) => void; // can be webm/mp4; server will convert
};

export function WavRecorder({ disabled, onAudioReady }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState(false);

  async function start() {
    if (disabled || recording) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // Pick the best mime type the browser supports
    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4", // safari often prefers mp4
    ];

    const mimeType =
      preferredTypes.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";

    chunksRef.current = [];
    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      onAudioReady(blob);

      // cleanup mic
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    };

    mr.start();
    setRecording(true);
  }

  function stop() {
    if (!recording) return;
    setRecording(false);
    mediaRecorderRef.current?.stop();
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={recording ? stop : start}
      className={[
        "rounded-xl border border-neutral-800 px-4 py-2 text-sm",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-50",
      ].join(" ")}
    >
      {recording ? "Stop" : "Record"}
    </button>
  );
}
