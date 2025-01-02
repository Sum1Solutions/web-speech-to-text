from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import whisper
import wave
import numpy as np
from typing import List
import io
import base64
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Initialize Whisper model with CPU settings and safe loading
try:
    import torch
    model = whisper.load_model("base", device="cpu", download_root=os.path.join(os.path.dirname(__file__), "models"))
    # Explicitly load state dict to avoid pickle security warning
    if hasattr(model, 'model') and hasattr(model.model, 'load_state_dict'):
        state_dict = torch.load(
            os.path.join(os.path.dirname(__file__), "models", "base.pt"),
            map_location="cpu",
            weights_only=True
        )
        model.model.load_state_dict(state_dict)
except Exception as e:
    logger.error(f"Error loading Whisper model: {e}")
    model = None

# Keep track of active connections
active_connections = set()

async def process_audio(audio_data: bytes) -> str:
    """Process audio data using Whisper model."""
    temp_file = None
    try:
        if model is None:
            raise RuntimeError("Whisper model not properly initialized")

        # Create a temporary directory if it doesn't exist
        temp_dir = "temp_audio"
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        temp_file = os.path.join(temp_dir, f"temp_{id(audio_data)}.wav")
        
        # Save audio data to a temporary WAV file
        with wave.open(temp_file, "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit audio
            wf.setframerate(RATE)
            wf.writeframes(audio_data)
        
        # Load audio and run inference
        result = model.transcribe(temp_file, language="en")
        return result["text"].strip()

    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        raise RuntimeError(f"Failed to process audio: {str(e)}")

    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception as e:
                logger.error(f"Error removing temporary file {temp_file}: {e}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        active_connections.add(websocket)
        logger.info("WebSocket connection established")
        
        try:
            last_pong_time = asyncio.get_event_loop().time()
            while True:
                try:
                    # Use a shorter timeout for more responsive ping/pong
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=15.0  # 15 second timeout
                    )
                    
                    # Handle ping/pong messages
                    try:
                        message = json.loads(data)
                        if isinstance(message, dict):
                            if message.get("type") == "pong":
                                last_pong_time = asyncio.get_event_loop().time()
                                continue
                            elif message.get("type") == "ping":
                                await websocket.send_text(json.dumps({"type": "pong"}))
                                continue
                    except json.JSONDecodeError:
                        pass  # Not a JSON message, treat as audio data
                        
                    # Skip empty messages
                    if not data:
                        continue
                        
                    # Check if we haven't received a pong in too long
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_pong_time > 45:  # 45 seconds without pong
                        logger.warning("No pong received for too long, closing connection")
                        break
                        
                    try:
                        audio_data = base64.b64decode(data)
                    except Exception as e:
                        logger.error(f"Base64 decode error: {e}")
                        await websocket.send_text(json.dumps({
                            "error": "Invalid audio data format",
                            "isFinal": True
                        }))
                        continue
                    
                    # Process the audio
                    try:
                        text = await process_audio(audio_data)
                    except RuntimeError as e:
                        await websocket.send_text(json.dumps({
                            "error": str(e),
                            "isFinal": True
                        }))
                        continue
                    
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
                        
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    try:
                        await websocket.send_text(json.dumps({
                            "type": "ping"
                        }))
                        # Check if we haven't received a pong in too long
                        current_time = asyncio.get_event_loop().time()
                        if current_time - last_pong_time > 45:  # 45 seconds without pong
                            logger.warning("No pong received for too long, closing connection")
                            break
                    except:
                        break
                        
        except WebSocketDisconnect:
            logger.info("Client disconnected normally")
        except Exception as e:
            logger.error(f"Error in WebSocket loop: {e}")
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        active_connections.remove(websocket)
        try:
            await websocket.close()
        except:
            pass
        logger.info("WebSocket connection closed")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
