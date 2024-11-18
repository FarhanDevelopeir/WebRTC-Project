import React, { useContext } from 'react';
import { Button } from '@material-ui/core';

import { SocketContext } from '../SocketContext';
import { Context } from '../ContextAzure';


const Notifications = () => {
  const { answerCall, call, callAccepted } = useContext(Context);

  return (
    <>
      {call.isReceivingCall && !callAccepted && (
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems:'center' }}>
          <h1 style={{ fontFamily:'sans-serif'}}>{call.name} is calling:</h1>
          <Button variant="contained" color="primary" onClick={answerCall}>
            Answer
          </Button>
        </div>
      )}
    </>
  );
};

export default Notifications;