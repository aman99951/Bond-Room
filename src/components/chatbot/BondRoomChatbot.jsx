import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Send, X, Sparkles } from 'lucide-react';
import { chatbotApi } from '../../apis/api/chatbotApi';
import beeWithWing from '../assets/bee-with-wing.png';
import beeWithoutWing from '../assets/bee-without-wing.png';
import './BondRoomChatbot.css';

const FAQ_QUESTIONS = [
  'Is Bond Room really free for Teens?',
  'How are mentors verified?',
  'Are sessions safe and private?',
  'Can I choose my own mentor?',
  'What age group is this for?',
  'How long are the sessions?',
];

const BOT_WELCOME =
  "Hey there! 👋 I'm Bondy, your friendly guide! Ask me anything about Bond Room - pricing, mentors, safety, or sessions. I'm here to help! 🌟";

const BondRoomChatbot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: BOT_WELCOME }]);
  const [loading, setLoading] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [quickQuestionsOpen, setQuickQuestionsOpen] = useState(true);
  const messagesContainerRef = useRef(null);

  const history = useMemo(
    () =>
      messages
        .filter((item) => item.role === 'assistant' || item.role === 'user')
        .slice(-8)
        .map((item) => ({ role: item.role, content: item.content })),
    [messages]
  );

  const sendMessage = async (rawText) => {
    const text = String(rawText || '').trim();
    if (!text || loading) return;
    if (!hasAskedQuestion) {
      setHasAskedQuestion(true);
      setQuickQuestionsOpen(false);
    }
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const payload = await chatbotApi.respond({
        message: text,
        history,
      });
      const answer = String(payload?.answer || '').trim() || 'I can help with Bond Room questions! 😊';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Oops! 😅 Something went wrong. Please try again!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  useEffect(() => {
    const node = messagesContainerRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading, open]);

  return (
    <div className="bond-chatbot-root" aria-live="polite">
      {!open ? (
        <button
          type="button"
          className="bond-chatbot-float"
          onClick={() => setOpen(true)}
          aria-label="Open Bond Room chatbot"
        >
          <div className="bond-chatbot-sparkles">
            <span className="sparkle sparkle-1">✨</span>
            <span className="sparkle sparkle-2">✨</span>
            <span className="sparkle sparkle-3">✨</span>
          </div>
          
          <span className="bond-chatbot-avatar bond-chatbot-avatar-image" aria-hidden="true">
            <img src={beeWithoutWing} alt="" className="bee-frame bee-frame-rest" />
            <img src={beeWithWing} alt="" className="bee-frame bee-frame-wing" />
          </span>
          
          <div className="bond-chatbot-prompt-wrap">
            <span className="bond-chatbot-prompt">Need any help?</span>
            <span className="bond-chatbot-subprompt">I'm here for you! 😊</span>
          </div>
        </button>
      ) : null}

      {open ? (
        <section className="bond-chatbot-panel" role="dialog" aria-label="Bond Room assistant">
          <div className="panel-bg-decoration">
            <div className="bg-circle circle-1"></div>
            <div className="bg-circle circle-2"></div>
            <div className="bg-circle circle-3"></div>
          </div>
          
          <header className="bond-chatbot-header">
            <div className="bond-chatbot-title-wrap">
              <span className="bond-chatbot-title-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="bond-chatbot-title">Bondy - Your Bond Room Buddy 🐝</p>
                <p className="bond-chatbot-subtitle">
                  <span className="status-dot"></span>
                  Online & ready to help!
                </p>
              </div>
            </div>
            <button
              type="button"
              className="bond-chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </header>

          <div className="bond-chatbot-messages" ref={messagesContainerRef}>
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`bond-chatbot-message-wrapper ${item.role === 'user' ? 'is-user' : 'is-assistant'}`}
              >
                {item.role === 'assistant' && (
                  <div className="message-avatar">
                    <img src={beeWithoutWing} alt="" className="mini-bee-image" />
                  </div>
                )}
                <div className={`bond-chatbot-message ${item.role === 'user' ? 'is-user' : 'is-assistant'}`}>
                  {item.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="bond-chatbot-message-wrapper is-assistant">
                <div className="message-avatar">
                  <img src={beeWithWing} alt="" className="mini-bee-image typing-bee-image" />
                </div>
                <div className="bond-chatbot-typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bond-chatbot-faqs">
            <button
              type="button"
              className="faq-toggle"
              onClick={() => setQuickQuestionsOpen((prev) => !prev)}
            >
              <span className="faq-title">
                <Sparkles size={12} />
                Quick Questions
              </span>
              <span className="faq-toggle-icon" aria-hidden="true">
                {quickQuestionsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            {quickQuestionsOpen ? (
              <div className="faq-chips-container">
                {FAQ_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="bond-chatbot-faq-chip"
                    onClick={() => sendMessage(question)}
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form className="bond-chatbot-input-row" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question here..."
                className="bond-chatbot-input"
                disabled={loading}
              />
              {input && <span className="input-glow"></span>}
            </div>
            <button 
              type="submit" 
              className="bond-chatbot-send" 
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
};

export default BondRoomChatbot;
