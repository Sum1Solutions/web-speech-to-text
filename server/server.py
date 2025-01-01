from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import ollama
import pyaudio
import wave
import numpy as np
from typing import List
import io
import base64

app = FastAPI()

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio configuration
CHUNK = 1024
FORMAT = pyaudio.paFloat32
CHANNELS = 1
RATE = 16000

async def process_audio(audio_data: bytes) -> str:
    """Process audio data using Ollama's Whisper model."""
    try:
        # Save audio data to a temporary WAV file
        with wave.open("temp.wav", "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(RATE)
            wf.writeframes(audio_data)
        
        # Use Ollama to transcribe
        response = ollama.audio(
            model='whisper',
            audio='temp.wav',
        )
        
        # Optionally post-process with a medical LLM
        # response = ollama.chat(model='mistral', 
        #     messages=[{
        #         'role': 'system', 
        #         'content': 'You are a medical transcription expert. Format and correct the following transcription, focusing on medical terminology:'
        #     }, {
        #         'role': 'user',
        #         'content': response
        #     }])

        return response['response']
    except Exception as e:
        print(f"Error processing audio: {e}")
        return ""

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive audio data as base64 string
            data = await websocket.receive_text()
            audio_data = base64.b64decode(data)
            
            # Process the audio
            text = await process_audio(audio_data)
            
            # Send back the transcribed text
            await websocket.send_text(json.dumps({
                "text": text,
                "isFinal": True
            }))
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
