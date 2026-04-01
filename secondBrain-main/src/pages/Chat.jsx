import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToItems, saveChatHistory, loadChatHistory } from '../services/db';
import { createChatSession } from '../services/mistral';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function Chat() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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
        const history = await loadChatHistory(user.uid);
        const session = await createChatSession(items, history);
        setChatSession(session);

        if (history && history.length > 0) {
          setMessages(history);
        } else {
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

          const initialHistory = [{ role: 'model', text: initialMessage }];
          setMessages(initialHistory);
          await saveChatHistory(user.uid, initialHistory);
        }
        
        setInitialized(true);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      }
    };

    initChat();
  }, [loading, items, initialized, user.uid]);

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
    
    setMessages(prev => {
      const newMessages = [...prev, { role: 'user', text: userMsg }];
      saveChatHistory(user.uid, newMessages).catch(err => console.error("Failed to save chat history:", err));
      return newMessages;
    });
    
    setSending(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg });
      
      setMessages(prev => {
        const newMessages = [...prev, { role: 'model', text: response.text }];
        // Save history asynchronously
        saveChatHistory(user.uid, newMessages).catch(err => console.error("Failed to save chat history:", err));
        return newMessages;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the AI. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await saveChatHistory(user.uid, []);
      setMessages([]);
      setInitialized(false); // Re-initialize to get a new greeting
      setShowClearConfirm(false);
    } catch (err) {
      console.error("Failed to clear chat:", err);
      // We can't use alert, so we just log it or show a toast if we had one.
      setShowClearConfirm(false);
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
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            AI Assistant
          </h1>
          <p className="text-zinc-400">Chat with your second brain. Ask questions, find connections, or revisit old memories.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Clear Chat
        </motion.button>
      </header>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-zinc-100 mb-2">Clear Chat History?</h3>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to clear your entire conversation history? This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors font-medium"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-xl"
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
              </motion.div>
            ))}
          </AnimatePresence>
          
          {sending && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
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
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-4 pr-12 py-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-shadow"
              disabled={sending}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!input.trim() || sending}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
