import os
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS

# Adjust the path to the dist folder of the frontend
# app = Flask(__name__, static_folder="dist")
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# # Serve static files from the "dist" folder of your Vite frontend
# @app.route('/')
# def serve_index():
#     return send_from_directory(app.static_folder, 'index.html')
  
# # Serve any other static files (JavaScript, CSS, etc.)
# @app.route('/<path:path>')
# def serve_static(path):
#     return send_from_directory(app.static_folder, path)

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

@socketio.on('answerCall')
def handle_answer_call(data):
    emit('callAccepted', data['signal'], room=data['to'])

# Start the server
if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5000))
    print(f"Server is running on port {PORT}")
    socketio.run(app, port=PORT)
