import React, { useState, useEffect, useRef } from 'react';
import './styles/AI.css'; 

const AI = ({ messages, setMessages, inputValue, setInputValue, question }) => {
  const [loading, setLoading] = useState(false); 
  const textareaRef = useRef(null);
  const chatWindowRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue) return;

    // Add user's message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: inputValue, sender: 'user' },
    ]);

    setLoading(true);
    setInputValue(''); 

    try {
      let aiMessage = '';
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: aiMessage, sender: 'ai' },
      ]);

      const response = await fetch(`http://localhost:9680/stream`, {
        method: 'POST',
        body: JSON.stringify({
          query: inputValue,
          question,
        }),
      });

      if (!response.ok) {
        throw new Error('Error with AI response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        const chunk = decoder.decode(value);

        const cleanedChunk = chunk.replace(/^data:\s?/, '').trim();
        
        const replacedChunk = cleanedChunk
          .replace(/\/s/g, ' ')
          .replace(/\\n/g, '<br />')
          .replace(/\\u003c/g, '<')
          .replace(/\\u003e/g, '>')
          .replace(/\\"/g, '"');
          
        aiMessage += replacedChunk;
        
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = { text: aiMessage, sender: 'ai' };
          return updatedMessages;
        });
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Sorry, something went wrong.', sender: 'ai' },
      ]);
    } finally {
      setLoading(false); 
    }
  };

  const renderMessage = (text) => {
    return (
      <span dangerouslySetInnerHTML={{ __html: text }} />
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setInputValue((prev) => prev + '\n');
        e.preventDefault();
      } else {
        handleSendMessage(e);
      }
    }
  };

  const handleInput = (e) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 60)}px`;

      if (inputValue === '') {
        textarea.style.height = '60px'; 
      }
    }
  }, [inputValue]);

  useEffect(() => {
    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <h3>Chat with Raesa</h3>
      <div className="chat-window" ref={chatWindowRef}> 
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender === 'user' ? 'You: ' : 'Raesa: '}</strong> 
            {renderMessage(msg.text)} 
          </div>
        ))}
        {loading && (
          <div className="loading">
            <span>Raesa is thinking</span>
            <span className="dot-animation">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <textarea
          ref={textareaRef} 
          value={inputValue}
          onChange={handleInput}
          placeholder="Type your message here..."
          className="message-input"
          onKeyDown={handleKeyDown} 
          disabled={loading}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AI;
