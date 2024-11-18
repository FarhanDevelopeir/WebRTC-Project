// import React, { createContext, useState, useRef, useEffect } from "react";
// import { io } from "socket.io-client";
// import Peer from "simple-peer";
// import SpeechRecognition, {
//   useSpeechRecognition,
// } from "react-speech-recognition";

// const SocketContext = createContext();

// const socket = io("http://localhost:5000");
// // const socket = io("https://web-rtc-project-iota.vercel.app");

// const ContextProvider = ({ children }) => {
//   const [callAccepted, setCallAccepted] = useState(false);
//   const [callEnded, setCallEnded] = useState(false);
//   const [stream, setStream] = useState();
//   const [name, setName] = useState("");
//   const [call, setCall] = useState({});
//   const [me, setMe] = useState("");
//   const {
//     transcript,
//     listening,
//     resetTranscript,
//     browserSupportsSpeechRecognition,
//   } = useSpeechRecognition();

//   if (!browserSupportsSpeechRecognition) {
//     return <span>Browser doesn't support speech recognition.</span>;
//   }

//   const myVideo = useRef();
//   const userVideo = useRef();
//   const connectionRef = useRef();

//   useEffect(() => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((currentStream) => {
//         setStream(currentStream);
//       });

//     socket.on("me", (id) => setMe(id));

//     socket.on("callUser", ({ from, name: callerName, signal }) => {
//       setCall({ isReceivingCall: true, from, name: callerName, signal });
//     });
//   }, []);

//   const recognition = new (window.SpeechRecognition ||
//     window.webkitSpeechRecognition)();
//   recognition.continuous = true; // Keep listening after each pause
//   recognition.interimResults = true; // Get partial results before finalizing

//   useEffect(() => {
//     // When the stream is available and the video element is ready, assign the stream
//     if (stream && myVideo.current) {
//       console.log(myVideo.current); // Ensure the video element is available
//       myVideo.current.srcObject = stream;
//       // myVideo.current.muted = true; // Mute the local video element to avoid feedback.

//       // Log the audio track from the stream.
//       const audioTrack = stream.getAudioTracks()[0];
//       // logAudioData(audioTrack);
//       // console.log("Local Audio Track:", audioTrack);
//     }
//     if (stream && userVideo.current) {
//       userVideo.current.srcObject = stream;
//       // If needed, you can also log the remote stream audio track once you receive the peer's stream.
//       const remoteAudioTrack = stream.getAudioTracks()[0]; // Modify this when peer stream is available.
//       console.log("Remote Audio Track:", remoteAudioTrack);
//       //  logAudioData(remoteAudioTrack);
//       // SpeechRecognition.startListening()
//       SpeechRecognition.startListening({ continuous: true });
//       // console.log("transscript:", transcript);

//     }
//     console.log("Transcript (local):", transcript);

//     // return () => {
//     //   SpeechRecognition.stopListening();
//     // };
//   }, [stream, transcript]); // This effect runs when the stream is set

//   useEffect(() => {
//     if (stream && userVideo.current) {
//       userVideo.current.srcObject = stream; // Set remote video stream

//       // Extract audio from the remote stream
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const remoteStreamSource = audioContext.createMediaStreamSource(stream); // Audio from remote peer

//       // You can now process this audio (e.g., send to backend for transcription)
//       const analyser = audioContext.createAnalyser();
//       remoteStreamSource.connect(analyser);

//       // Optionally: Send remote audio data to a backend or third-party service for transcription.
//       const processRemoteAudio = () => {
//         const bufferLength = analyser.frequencyBinCount;
//         const dataArray = new Float32Array(bufferLength);
//         analyser.getFloatTimeDomainData(dataArray);

//         // Send this audio data to a backend for transcription
//         // For example: send to a backend via socket.io or fetch API
//         // socket.emit("audioData", dataArray);
//         socket.emit("audioData", dataArray);
//       };

//       // Run audio processing at intervals (e.g., every second)
//       const audioProcessingInterval = setInterval(processRemoteAudio, 1000);

//       // Cleanup on component unmount or when the stream ends
//       return () => {
//         clearInterval(audioProcessingInterval);
//         audioContext.close();
//       };
//     }
//   }, [stream]);

//   // const logAudioData = (audioTrack) => {
//   //   const audioContext = new (window.AudioContext ||
//   //     window.webkitAudioContext)();
//   //   const mediaStreamSource = audioContext.createMediaStreamSource(
//   //     new MediaStream([audioTrack])
//   //   );
//   //   const processor = audioContext.createScriptProcessor(4096, 1, 1); // 4096 samples per buffer

//   //   processor.onaudioprocess = function (event) {
//   //     const audioData = event.inputBuffer.getChannelData(0); // Get the audio data from the first channel
//   //     console.log("Audio Data:", audioData); // This will print raw audio data in the form of Float32Array
//   //      // Convert Float32Array to a regular array and send to the backend
//   //   const audioArray = Array.from(audioData);

//   //   // Send audio data to backend via socket.io
//   //   socket.emit("audioData", { audio: audioArray });
//   //   };

//   //   mediaStreamSource.connect(processor);
//   //   processor.connect(audioContext.destination); // Connect to the audio context for playback (optional)
//   // };

//   const answerCall = () => {
//     setCallAccepted(true);

//     const peer = new Peer({ initiator: false, trickle: false, stream });

//     peer.on("signal", (data) => {
//       socket.emit("answerCall", { signal: data, to: call.from });
//     });

//     peer.on("stream", (currentStream) => {
//       // if(userVideo.current){
//       //   userVideo.current.srcObject = currentStream;
//       // }
//       userVideo.current.srcObject = currentStream;
//     });

//     peer.signal(call.signal);

//     connectionRef.current = peer;
//   };

//   const callUser = (id) => {
//     const peer = new Peer({ initiator: true, trickle: false, stream });

//     peer.on("signal", (data) => {
//       socket.emit("callUser", {
//         userToCall: id,
//         signalData: data,
//         from: me,
//         name,
//       });
//     });

//     peer.on("stream", (currentStream) => {
//       setStream(currentStream);
//       // if(userVideo.current){
//       //   userVideo.current.srcObject = currentStream;
//       // }
//       // userVideo.current.srcObject = currentStream;
//     });

//     socket.on("callAccepted", (signal) => {
//       setCallAccepted(true);

//       peer.signal(signal);
//     });

//     connectionRef.current = peer;
//   };

//   const stopListening = () => {
//     recognition.stop(); // Stop the speech recognition when call ends
//   };

//   const leaveCall = () => {
//     setCallEnded(true);
//     SpeechRecognition.stopListening()

//     connectionRef.current.destroy();

//     window.location.reload();
//   };

//   return (
//     <SocketContext.Provider
//       value={{
//         call,
//         callAccepted,
//         myVideo,
//         userVideo,
//         stream,
//         name,
//         setName,
//         callEnded,
//         me,
//         callUser,
//         leaveCall,
//         answerCall,
//         transcript,
//       }}
//     >
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export { ContextProvider, SocketContext };

import React, { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

const socket = io("http://localhost:5000"); // Your backend server URL

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");
  const [localTranscript, setLocalTranscript] = useState([]);
  const [remoteTranscript, setRemoteTranscript] = useState([]);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const azureConfig = {
    key: import.meta.env.VITE_KEY,    // Load from Vite env
    region: import.meta.env.VITE_REGION, // Load from Vite env
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
      });

    socket.on("me", (id) => setMe(id));

    socket.on("callUser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;

      // Start transcribing local audio
      startAzureSTT(stream, "local");
    }
  }, [stream]);

  const startAzureSTT = (audioStream, type) => {
    console.log("working");
    // Use the browser-compatible Speech SDK
    const audioConfig =
      window.SpeechSDK.AudioConfig.fromStreamInput(audioStream);

    const speechConfig = window.SpeechSDK.SpeechConfig.fromSubscription(
      azureConfig.key,
      azureConfig.region
    );

    console.log(speechConfig);

    const recognizer = new window.SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    console.log(recognizer);

    recognizer.startContinuousRecognitionAsync(
      () => {
        console.log("Continuous Recognition Started for", type);
      },
      (err) => {
        console.error(`Error starting recognition for ${type}:`, err);
      }
    );

    // Log recognized speech with source info
    recognizer.recognized = (sender, event) => {
      const recognizedText = event.result.text;
     
      console.log(`Recognized from ${type}:`, recognizedText);
       if (type === "local") {
        // Add recognized text to local transcript
        setLocalTranscript((prevTranscript) => [...prevTranscript, recognizedText]);
      } else if (type === "remote") {
        // Add recognized text to remote transcript
        setRemoteTranscript((prevTranscript) => [...prevTranscript, recognizedText]);
      }
    };
    

  };

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;

      // Start transcribing remote audio
      startAzureSTT(currentStream, "remote");
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });

    peer.on("stream", (currentStream) => {
      setStream(currentStream);
      userVideo.current.srcObject = currentStream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    if (connectionRef.current) connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
        remoteTranscript,
        localTranscript
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
