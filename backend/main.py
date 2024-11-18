import io
import os
import wave
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import numpy as np
import os
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# Load the .env file


# Use your OpenAI key
from helper import transcribe_audio_with_whisper

# Adjust the path to the dist folder of the frontend
app = Flask(__name__, static_folder="../my-app/dist")
# app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Set up OpenAI API key
# openai.api_key = "your-api-key-here"

# Serve static files from the "dist" folder of your Vite frontend
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')
  
# Serve any other static files (JavaScript, CSS, etc.)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Socket.io logic
@socketio.on('connect')
def handle_connect():
    print('User connected:', request.sid)
    emit('me', request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    emit('callEnded', broadcast=True)



@socketio.on('callUser')
def handle_call_user(data):
    user_to_call = data['userToCall']
    signal_data = data['signalData']
    from_user = data['from']
    name = data['name']
    emit('callUser', {'signal': signal_data, 'from': from_user, 'name': name}, room=user_to_call)


def convert_raw_audio_to_wav(audio_data, sample_rate=44100):
    """ Convert raw audio data (Float32Array) to WAV format """
    # Convert the float32 array to int16 array
    int_audio = np.int16(audio_data * 32767)  # Scale to 16-bit PCM
    
    # Create an in-memory buffer
    wav_buffer = io.BytesIO()
    
    # Write the WAV file
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono audio
        wav_file.setsampwidth(2)  # 2 bytes for int16
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(int_audio.tobytes())
    
    # Return the buffer with the WAV data
    wav_buffer.seek(0)  # Reset the buffer to the beginning
    return wav_buffer

def send_audio_to_whisper(audio_buffer):
    """ Send the in-memory audio buffer (WAV format) to Whisper for transcription """
    # transcription = openai.Audio.transcribe(
    #     model="whisper-1",
    #     file=audio_buffer
    # )
    # print(transcription['text'])
    transcription = client.audio.transcriptions.create(
    model="whisper-1", 
    file=audio_buffer
    )
    return transcription['text']

@socketio.on('audioData')
def handle_audio_data(data):
    # audio_data = np.array(data['audio'])  # Convert the received audio data to NumPy array
    audio_data = data['audio']
    
    # Convert the raw audio data to a numpy array
    audio_array = np.array(audio_data, dtype=np.float32)

    print("Received audio data:", audio_array)



      # Convert the raw audio data to WAV format (in-memory)
    wav_audio = convert_raw_audio_to_wav(audio_array)

    # Send the in-memory WAV audio to Whisper for transcription
    transcription = send_audio_to_whisper(wav_audio)

    # Print or return the transcription
    print("Transcription:", transcription)

@socketio.on('answerCall')
def handle_answer_call(data):
    emit('callAccepted', data['signal'], room=data['to'])

# Start the server
if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5000))
    print(f"Server is running on port {PORT}")
    socketio.run(app, port=PORT)
