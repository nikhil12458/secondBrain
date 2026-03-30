import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveItem } from '../services/db';
import { Mic, MicOff, Loader2, Save, RefreshCw } from 'lucide-react';

export default function Journal() {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Set default title to today's date
    const today = new Date();
    setTitle(`Journal Entry - ${today.toLocaleDateString()}`);

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
          setTranscript((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
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
      setTranscript((prev) => prev ? prev + ' ' : '');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSave = async () => {
    if (!user || !transcript.trim()) return;
    
    setSaving(true);
    try {
      await saveItem(user.uid, {
        type: 'journal',
        title: title || 'Untitled Journal',
        content: transcript,
      });
      setTranscript('');
      alert('Journal entry saved successfully!');
    } catch (error) {
      console.error('Error saving journal:', error);
      alert('Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the current transcript?')) {
      setTranscript('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Voice Journal</h1>
        <p className="text-zinc-400">Speak your thoughts and save them directly to your second brain.</p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Entry Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-lg font-medium"
            placeholder="Journal Title..."
          />
        </div>

        <div className="flex-1 min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-zinc-400">Transcript</label>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                disabled={!transcript || isListening}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 disabled:opacity-50"
                title="Clear transcript"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative flex-1">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Click the microphone and start speaking..."
              className="w-full h-full min-h-[300px] bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-y text-lg leading-relaxed"
            />
            
            {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Listening...
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> Start Dictation
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={!transcript.trim() || saving || isListening}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save to Brain
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
