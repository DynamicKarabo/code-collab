import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, X } from 'lucide-react';
import { ChatMessage, File } from '../types';
import { streamCodeAssistant } from '../services/geminiService';

interface ChatPanelProps {
  activeFile: File;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ activeFile, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Hi! I\'m your CodeCollab AI partner. I see you\'re working on ' + activeFile.name + '. How can I help?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    // Add placeholder AI message
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      const stream = streamCodeAssistant(userMsg.content, {
        currentFile: activeFile.name,
        fileContent: activeFile.content
      });

      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: fullText } : m
        ));
      }
      
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Failed to generate response.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-slate-700 bg-slate-900 flex flex-col h-full absolute right-0 top-0 z-20 shadow-xl">
      {/* Header */}
      <div className="h-12 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800">
        <div className="flex items-center gap-2 text-blue-400 font-semibold">
          <Bot size={18} />
          <span>AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-blue-600' : msg.role === 'system' ? 'bg-red-500' : 'bg-slate-600'
            }`}>
              {msg.role === 'ai' ? <Bot size={16} /> : <UserIcon size={16} />}
            </div>
            <div className={`flex-1 p-3 rounded-lg text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' 
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}>
               {/* Extremely simple markdown-like rendering for this prototype */}
               <div className="whitespace-pre-wrap font-mono text-xs md:text-sm">
                  {msg.content}
               </div>
               {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse" />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your code..."
            className="w-full bg-slate-900 text-slate-200 rounded-md py-3 pl-4 pr-12 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md disabled:opacity-50 transition-colors"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};