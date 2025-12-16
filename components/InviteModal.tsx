import React from 'react';
import { Check, Users } from 'lucide-react';

interface InviteModalProps {
    roomId: string;
    onAccept: () => void;
    onDecline: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ roomId, onAccept, onDecline }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-[#333] rounded-lg p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-2">
                        <Users size={32} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Join Room?</h2>
                        <p className="text-gray-400 text-sm">
                            You have been invited to collaborate in room <br />
                            <span className="text-white font-mono bg-[#222] px-1.5 py-0.5 rounded mt-1 inline-block">{roomId}</span>
                        </p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onDecline}
                            className="flex-1 px-4 py-2 bg-[#222] hover:bg-[#333] text-gray-300 rounded-md font-medium transition-colors"
                        >
                            Decline
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Check size={18} /> Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
