from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import ollama
import wave
import numpy as np
from typing import List
import io
import base64
import os

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
CHANNELS = 1
RATE = 16000

async def process_audio(audio_data: bytes) -> str:
    """Process audio data using Ollama's Whisper model."""
    try:
        # Create a temporary directory if it doesn't exist
        temp_dir = "temp_audio"
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        temp_file = os.path.join(temp_dir, "temp.wav")
        
        # Save audio data to a temporary WAV file
        with wave.open(temp_file, "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(RATE)
            wf.writeframes(audio_data)
        
        try:
            # Use Ollama to transcribe
            response = ollama.audio(
                model='whisper',
                audio=temp_file,
            )
            return response['response']
        except Exception as e:
            print(f"Ollama transcription error: {e}")
            return ""
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
    except Exception as e:
        print(f"Error processing audio: {e}")
        return ""

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established")
    
    try:
        while True:
            # Receive audio data as base64 string
            data = await websocket.receive_text()
            try:
                audio_data = base64.b64decode(data)
                
                # Process the audio
                text = await process_audio(audio_data)
                
                if text:
                    # Send back the transcribed text
                    await websocket.send_text(json.dumps({
                        "text": text,
                        "isFinal": True
                    }))
                else:
                    await websocket.send_text(json.dumps({
                        "error": "Failed to transcribe audio",
                        "isFinal": True
                    }))
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send_text(json.dumps({
                    "error": str(e),
                    "isFinal": True
                }))
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        print("WebSocket connection closed")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)
