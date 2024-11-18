const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WaveFile = require('wavefile').WaveFile;
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../my-app/dist'))); // Adjust to your frontend dist folder

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../my-app/dist/index.html'));
});

// Serve static files
app.get('/:path', (req, res) => {
  res.sendFile(path.join(__dirname, '../my-app/dist', req.params.path));
});




// Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.emit('me', socket.id);

  socket.on('disconnect', () => {
    io.emit('callEnded');
  });

  socket.on('callUser', (data) => {
    const { userToCall, signalData, from, name } = data;
    io.to(userToCall).emit('callUser', { signal: signalData, from, name });
  });

  socket.on('audioData', async (data) => {
    try {
      const audioArray = Float32Array.from(data.audio);
      console.log('Received audio data:', audioArray);

      // Convert raw audio to WAV format
      const wavAudio = convertRawAudioToWav(audioArray);

      // Send WAV to Whisper for transcription
      const transcription = await sendAudioToWhisper(wavAudio);
      console.log('Transcription:', transcription);
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
