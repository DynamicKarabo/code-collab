import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, X, Sparkles, Zap } from 'lucide-react';
import { ChatMessage, File, AIAction } from '../types';
import { streamCodeAssistant } from '../services/geminiService';

interface ChatPanelProps {
  activeFile: File | undefined | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: AIAction) => void;
  pendingMessage?: string | null;
  onClearPendingMessage?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ activeFile, isOpen, onClose, onAction, pendingMessage, onClearPendingMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // ... state ...

  // Handle pending message (e.g., "Fix this error...")
  useEffect(() => {
    if (isOpen && pendingMessage && !isTyping) {
      setInput(pendingMessage);
      // We can either auto-submit or just populate. Let's auto-submit for "magic" feel.
      // Waiting a tick to ensure state is ready if needed, or just call logic.
      // Actually, we can reuse logic if we extract handleSubmit, but for now let's just populate and user clicks send?
      // User request "Fix This" button usually implies auto-action. 
      // Let's modify handleSubmit to take an optional override, or just set input and simulate click?
      // Better: trigger submission programmatically.
    }
  }, [isOpen, pendingMessage]);

  // Actually, cleaner way:
  // We need to trigger submission. Let's extract core submit logic or use a ref to trigger.
  // Or just simply:
  useEffect(() => {
    if (isOpen && pendingMessage && onClearPendingMessage) {
      // Trigger submit
      handleProgrammaticSubmit(pendingMessage);
      onClearPendingMessage();
    }
  }, [isOpen, pendingMessage]);

  const handleProgrammaticSubmit = (msg: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    processAIResponse(msg);
  };

  // Refactor handleSubmit to use common logic
  const processAIResponse = async (userText: string) => {
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      const stream = streamCodeAssistant(
        userText,
        {
          currentFile: activeFile?.name || 'CodeCollab Workspace',
          fileContent: activeFile?.content || '// No active file selected'
        },
        isThinkingMode
      );

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        if (fullText.trim().startsWith('{') && fullText.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(fullText);
            if (parsed.action) {
              onAction(parsed.action);
              setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId
                  ? { ...msg, content: `⚡ Executing: ${parsed.action.type}...`, isStreaming: false }
                  : msg
              ));
              return;
            }
          } catch (e) { }
        }
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullText } : m));
      }
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: 'Failed to generate response.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };


  // ... existing Reset messages effect ...
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: activeFile
          ? 'Hi! I\'m your CodeCollab AI partner. I see you\'re working on ' + activeFile.name + '. How can I help?'
          : 'Hi! I\'m your CodeCollab AI partner. Ask me anything about coding!',
        timestamp: new Date(),
      }]);
    }
  }, [activeFile?.name]);

  // ... existing state ...
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ... scrollToBottom ...
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }]);

    const textToSend = input;
    setInput('');
    setIsTyping(true);

    await processAIResponse(textToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-[#333] bg-[#0a0a0a] flex flex-col h-full absolute right-0 top-0 z-20 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#111]">
        <div className="flex items-center gap-2 text-white font-medium">
          <Bot size={18} className="text-blue-500" />
          <span>AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Thinking Mode Toggle */}
          <button
            onClick={() => setIsThinkingMode(!isThinkingMode)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${isThinkingMode
              ? 'bg-purple-500/10 border-purple-500 text-purple-400'
              : 'bg-[#222] border-[#333] text-gray-500 hover:text-gray-300'
              }`}
            title={isThinkingMode ? "Deep Reasoning (Gemini 3 Pro)" : "Fast Response (Flash Lite)"}
          >
            {isThinkingMode ? <Sparkles size={10} /> : <Zap size={10} />}
            {isThinkingMode ? 'Thinking' : 'Fast'}
          </button>

          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-2">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-blue-600' : msg.role === 'system' ? 'bg-red-500' : 'bg-gray-700'
              }`}>
              {msg.role === 'ai' ? <Bot size={16} /> : <UserIcon size={16} />}
            </div>
            <div className={`flex-1 p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50'
              : 'bg-[#1a1a1a] border border-[#333] text-gray-300'
              }`}>
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
      <div className="p-4 border-t border-[#333] bg-[#0a0a0a]">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isThinkingMode ? "Ask a complex question..." : "Ask a quick question..."}
            className="w-full bg-[#111] text-gray-200 rounded-md py-3 pl-4 pr-12 text-sm border border-[#333] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder-gray-600"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 text-white hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Send size={18} />}
          </button>
        </form>
        <div className="text-[10px] text-gray-600 mt-2 text-center">
          {isThinkingMode ? "Using Gemini 3.0 Pro (High Intelligence)" : "Using Gemini Flash-Lite (Low Latency)"}
        </div>
      </div>
    </div>
  );
};