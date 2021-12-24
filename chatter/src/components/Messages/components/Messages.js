import React, { useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';

const BOT = 'bot';
const BOTTY_USER = 'botty';
const ME = 'me';

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);


function Messages() {


  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { messages, setLatestMessage } = useContext(LatestMessagesContext);
  const [message, setMessage] = useState("");
  const stateRef = useRef();
  const bottomRef = useRef();

  const [messageList, setMessageList] = useState([{
    id: BOT,
    user: BOTTY_USER,
    message: messages[BOT]
  
  }]);

  stateRef.current = messageList;

  const scrollToBottom = () => {
    bottomRef.current.scrollIntoView({
    behavior: "smooth",
    block: "start",
    });
  };

  useEffect(() => {
    socket.on("bot-message", (data) => {
      const objIndex =  stateRef.current.findIndex((obj => obj.isTyping === true));
      const messageData = {
        id: BOT,
        user: BOTTY_USER,
        message: data,
        isTyping: false
      };

      if(objIndex !== -1){
        stateRef.current.splice(objIndex, 1);
      }
      setLatestMessage(messageData.id, messageData.message);
      setMessageList((list) => [...list, messageData]);
      scrollToBottom();
      playReceive();
    });

    socket.on("bot-typing", (data) => {
      const messageData = {
        id: BOT,
        user: BOTTY_USER,
        message: "",
        isTyping: true
      };

      setMessageList((list) => [...list, messageData]);

      scrollToBottom();
       
     });

     

  }, [socket]);

  const onChangeMessage = (e) => {
     setMessage(e.target.value);    
  };
  

  const sendMessage = async () => {
    const messageData = {
      id: ME,
      message: message,
      user: ME
    };


    await socket.emit('user-message', message); 
    setLatestMessage(messageData.id, messageData.message);
    setMessageList((list) => [...list, messageData]);
    setMessage(""); 
    scrollToBottom();
    playSend();
    
    
  }

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
      {
        messageList.map(message => {
          if(message.isTyping){
            return <TypingMessage />
          }
          return <Message  message={message} />
        })
      }

      <div ref={bottomRef} className="list-bottom"></div>

      </div>
       <Footer message={message} sendMessage={sendMessage} onChangeMessage={onChangeMessage} /> 
    </div>
  );
}

export default Messages;
