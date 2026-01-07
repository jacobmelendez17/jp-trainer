from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import tempfile
import os

from faster_whisper import WhisperModel

app = FastAPI()
model = WhisperModel("small", device="cpu", compute_type="int8")

@app.post("/transcribe")
async def trasncribe(file: UploadFil = File(...), language: str = Form("ja")):
    suffix = os.path.splitext(file.filename)[1] or ".webm"
    with tempfile.NamedTemporaryFIle(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    
    try:
        segmetns, info = model.trasncribe(tmp_path, language=language)
        text = "".join([seg.text fro seg in segments]).strip()
        return JSONResponse({"transcript": text})
    finally:
        try:
            os.remove(tmp_path)
        except:
            pass