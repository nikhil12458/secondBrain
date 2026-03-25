import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToItems } from '../services/db';
import { createChatSession } from '../services/gemini';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToItems(user.uid, (data) => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (loading || initialized) return;

    const initChat = async () => {
      try {
        const session = await createChatSession(items);
        setChatSession(session);

        // Find an old item to follow up on
        const oldItems = items.filter(item => {
          if (!item.createdAt?.toDate) return false;
          const daysOld = differenceInDays(new Date(), item.createdAt.toDate());
          return daysOld > 30; // Older than 1 month
        });

        let initialMessage = "Hello! I'm your Second Brain AI assistant. You can ask me anything about the items you've saved.";

        if (oldItems.length > 0) {
          const randomOldItem = oldItems[Math.floor(Math.random() * oldItems.length)];
          const monthsOld = Math.max(1, differenceInMonths(new Date(), randomOldItem.createdAt.toDate()));
          initialMessage = `Hello! I noticed you saved **"${randomOldItem.title}"** about ${monthsOld} month${monthsOld > 1 ? 's' : ''} ago. Would you like to revisit it, or ask me anything else about your saved knowledge?`;
        }

        setMessages([{ role: 'model', text: initialMessage }]);
        setInitialized(true);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      }
    };

    initChat();
  }, [loading, items, initialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || sending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSending(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the AI. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  if (loading || !initialized) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Initializing your AI assistant...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-400" />
          AI Assistant
        </h1>
        <p className="text-zinc-400">Chat with your second brain. Ask questions, find connections, or revisit old memories.</p>
      </header>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
              }`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-zinc-300" />
                </div>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your saved items..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-4 pr-12 py-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
