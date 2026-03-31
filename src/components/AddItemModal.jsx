import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveItem, uploadImage } from '../services/db';
import { X, Loader2, Link as LinkIcon, Upload, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AddItemModal({ onClose }) {
  const { user } = useAuth();
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setContent((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'network') {
          alert('Speech recognition network error. This browser may not support the Web Speech API fully, or you may be offline.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access.');
        } else if (event.error !== 'no-speech') {
          alert(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setContent((prev) => prev ? prev + ' ' : '');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAutoFill = async () => {
    if (!url) return;
    setFetchingMeta(true);
    try {
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (json.status === 'success') {
        setTitle(json.data.title || '');
        setContent(json.data.description || json.data.title || 'No description available.');
        
        // Auto-detect type
        const urlLower = url.toLowerCase();
        if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
          setType('video');
        } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || urlLower.includes('instagram.com')) {
          setType('social');
        } else {
          setType('article');
        }
      } else {
        alert('Could not fetch metadata for this URL.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching metadata.');
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      if (!title) {
        setTitle(file.name.split('.')[0]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      let finalUrl = url;
      
      if (type === 'image' && imageFile) {
        finalUrl = await uploadImage(imageFile, user.uid);
      }

      await saveItem(user.uid, {
        type,
        title,
        content,
        url: finalUrl || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 flex-shrink-0">
            <h2 className="text-xl font-semibold text-zinc-100">Add to Second Brain</h2>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  if (newType !== 'image') {
                    setImageFile(null);
                  }
                  if (newType === 'journal' && !title) {
                    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    setTitle(`Journal Entry - ${date}`);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-shadow"
              >
                <option value="note">Note</option>
                <option value="journal">Voice Journal</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="social">Social Media</option>
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {type === 'image' ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-zinc-400 mb-1">Upload Image</label>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors bg-zinc-950"
                >
                  <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                  <span className="text-zinc-400 text-sm">
                    {imageFile ? imageFile.name : 'Click to select an image from your device'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </motion.div>
                <div className="mt-2 text-center text-zinc-500 text-xs">Or provide an image URL below</div>
              </motion.div>
            ) : null}

            {type !== 'image' && type !== 'journal' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-zinc-400 mb-1">URL (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-shadow"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAutoFill}
                    disabled={!url || fetchingMeta}
                    className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {fetchingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                    Auto-fill
                  </motion.button>
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-shadow"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-zinc-400">
                  {type === 'journal' ? 'Journal Entry' : 'Content / Description'}
                </label>
                {recognitionRef.current && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isListening 
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
                        : type === 'journal' 
                          ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" /> Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" /> {type === 'journal' ? 'Start Recording' : 'Dictate'}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={type === 'journal' ? "Click 'Start Recording' to dictate your journal entry, or type it here..." : "Paste content or write a description..."}
                rows={type === 'journal' ? 8 : 5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none transition-shadow"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="bg-zinc-100 text-zinc-900 px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Processing AI...' : 'Save Item'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
