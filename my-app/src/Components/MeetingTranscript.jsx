import React, { useContext } from "react";
// import { SocketContext } from "../SocketContext";
import { Context } from '../ContextAzure';



const MeetingTranscript = () => {
  const { remoteTranscript, localTranscript } = useContext(Context);

  return (
    <div>
      <h3>Local Peer Transcript</h3>
      <div>
        {localTranscript.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
      <h3>Remote Peer Transcript</h3>
      <div>
        {remoteTranscript.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
    </div>
  );
};

export default MeetingTranscript;
