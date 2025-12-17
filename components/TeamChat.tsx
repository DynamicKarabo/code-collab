import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Loader2, X, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { User } from '../types';

interface TeamMessage {
    id: string;
    room_id: string;
    user_id: string;
    user_name: string;
    user_color: string;
    content: string;
    created_at: string;
}

interface TeamChatProps {
    roomId: string;
    currentUser: User;
    isOpen: boolean;
    onClose: () => void;
}

export const TeamChat: React.FC<TeamChatProps> = ({ roomId, currentUser, isOpen, onClose }) => {
    const [messages, setMessages] = useState<TeamMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!roomId) return;

        // Load initial messages
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('room_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data);
            }
            setLoading(false);
        };

        fetchMessages();

        // Subscribe to changes
        const channel = supabase
            .channel('room-messages-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const newMessage = payload.new as TeamMessage;
                    setMessages((prev) => [...prev, newMessage]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const content = input.trim();
        setInput('');

        // Optimistic update
        // Actually, let's wait for the real insertion to avoid duplicates if subscription fires fast.
        // Or simpler: Fire and forget, let subscription handle UI update.

        // BUT for better UX, we can insert directly to DB and let the subscription update the list?
        // Subscription will come back with the new row.

        await supabase.from('room_messages').insert({
            room_id: roomId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_color: currentUser.color || '#3b82f6',
            content: content
        });
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-[#333] bg-[#0a0a0a] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#111]">
                <div className="flex items-center gap-2 text-white font-medium">
                    <MessageCircle size={18} className="text-green-500" />
                    <span>Team Chat</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin text-gray-500" size={20} />
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-black"
                                    style={{ backgroundColor: msg.user_color }}
                                    title={msg.user_name}
                                >
                                    {msg.user_name[0]?.toUpperCase()}
                                </div>
                                <div className={`flex-1 p-2.5 rounded-lg text-sm leading-relaxed max-w-[85%] ${isMe
                                    ? 'bg-green-600/20 border border-green-500/30 text-green-50'
                                    : 'bg-[#1a1a1a] border border-[#333] text-gray-300'
                                    }`}>
                                    {!isMe && <div className="text-[10px] text-gray-500 mb-1">{msg.user_name}</div>}
                                    <div className="whitespace-pre-wrap break-words">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#333] bg-[#0a0a0a]">
                <form onSubmit={sendMessage} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-[#111] text-gray-200 rounded-md py-2.5 pl-3 pr-10 text-sm border border-[#333] focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
