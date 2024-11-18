import React, { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const Context = createContext();

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
    console.log("Azure Config:", azureConfig);
  }, []);

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

  // const startAzureSTT = (audioStream, type) => {
  //   console.log("azure_starts:", type);
    
  //   const audioConfig = speechsdk.AudioConfig.fromStreamInput(audioStream);
  //   const speechConfig = speechsdk.SpeechConfig.fromSubscription(
  //     azureConfig.key,
  //     azureConfig.region
  //   );

  //   const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

  //   recognizer.recognizeOnceAsync((result) => {
  //     if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
  //       console.log(`${type} Transcription: `, result.text);
  //       // setLocalTranscript((prevTranscript) => [...prevTranscript, recognizedText]);

  //     } else if (result.reason === speechsdk.ResultReason.NoMatch) {
  //       console.log(`No speech recognized from ${type} stream.`);
  //     } else if (result.reason === speechsdk.ResultReason.Canceled) {
  //       const cancellationDetails = speechsdk.CancellationDetails.fromResult(
  //         result
  //       );
  //       console.log(`${type} STT canceled: `, cancellationDetails.errorDetails);
  //     }
  //   });

  //   recognizer.startContinuousRecognitionAsync();
  // };

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
        // console.log();
        
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
    <Context.Provider
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
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { ContextProvider, Context };
