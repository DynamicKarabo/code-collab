import React, { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import { Mic, MicOff, Phone, PhoneOff, Users, Volume2 } from 'lucide-react';
import { User } from '../types';

interface VoiceChatProps {
    provider: WebsocketProvider | null;
    currentUser: User;
    users: User[];
}

interface SignalData {
    target: string;
    sender: string;
    type: 'offer' | 'answer' | 'candidate';
    data: any;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ provider, currentUser, users }) => {
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [peers, setPeers] = useState<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveVoice();
        };
    }, []);

    const joinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setIsJoined(true);

            // Initialize signaling listener
            if (provider) {
                provider.awareness.on('change', handleAwarenessChange);
            }

            // Connect to existing users
            connectToPeers();
        } catch (err) {
            console.error("Failed to access microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const leaveVoice = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setPeers(new Map());
        setIsJoined(false);

        if (provider) {
            provider.awareness.off('change', handleAwarenessChange);
            // Clear any signals
            provider.awareness.setLocalStateField('signal', null);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const connectToPeers = () => {
        // We are the "initiator" for any user with a simplified ID sort check to avoid dual-calls?
        // Actually, simple mesh: Everyone calls everyone they don't have a connection with?
        // Better strategy: Sort IDs. If MyID > TheirID, I initiate.

        users.forEach(user => {
            if (user.id === currentUser.id) return;
            if (peersRef.current.has(user.id)) return;

            // Simple stable tie-breaker: Only initiate if my ID > their ID (lexicographically)
            // This prevents both sides sending offers simultaneously.
            if (currentUser.id > user.id) {
                initiateConnection(user.id);
            }
        });
    };

    const createPeer = (targetUserId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal(targetUserId, 'candidate', event.candidate);
            }
        };

        pc.ontrack = (event) => {
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.autoplay = true;
            // remoteAudio.play().catch(e => console.error("Auto-play failed", e)); 
            // Note: Browsers might block autoplay if no interaction, but we are in a click handler chain hopefully.
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        peersRef.current.set(targetUserId, pc);
        setPeers(new Map(peersRef.current));
        return pc;
    };

    const initiateConnection = async (targetUserId: string) => {
        const pc = createPeer(targetUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(targetUserId, 'offer', offer);
    };

    const handleSignal = async (signal: SignalData) => {
        if (signal.target !== currentUser.id) return;

        const senderId = signal.sender;
        let pc = peersRef.current.get(senderId);

        if (signal.type === 'offer') {
            // If we get an offer, we must accept it, even if we thought we should initiate?
            // The MyID > TheirID rule should prevent own-offers, but if race happens, we handle gracefully.
            if (!pc) pc = createPeer(senderId);

            await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal(senderId, 'answer', answer);
        } else if (signal.type === 'answer') {
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
            }
        } else if (signal.type === 'candidate') {
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.data));
            }
        }
    };

    const sendSignal = (targetUserId: string, type: 'offer' | 'answer' | 'candidate', data: any) => {
        if (!provider) return;
        // We broadcast the signal via awareness. 
        // Ideally we'd use a direct message, but awareness is what we have.
        // We set a 'transient' field. Receivers must acknowledge?
        // Actually, awareness is "state". If we just set it, it propagates. 
        // But it's LWW (Last Write Wins). If we send multiple candidates fast, they might overwrite.
        // For a robust system we'd use a Y.Array or Y.Map for signaling queue, but let's try pure awareness for simplicity first.
        // Hack: Add random ID to signal to ensure it triggers change events?
        provider.awareness.setLocalStateField('signal', {
            target: targetUserId,
            sender: currentUser.id,
            type,
            data,
            timestamp: Date.now()
        });
    };

    const handleAwarenessChange = () => { // { added, updated, removed } args available
        if (!provider) return;
        const states = provider.awareness.getStates();

        states.forEach((state: any, clientId: number) => {
            const signal = state.signal as SignalData;
            if (signal && signal.target === currentUser.id) {
                // We found a signal for us!
                // Check if we already processed this specific signal timestamp to avoid loops?
                // The naive handler is stateless. 
                handleSignal(signal);
            }
        });
    };

    if (!isJoined) {
        return (
            <button
                onClick={joinVoice}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-500 hover:bg-green-600/30 rounded text-xs font-medium transition-colors"
            >
                <Phone size={14} />
                <span>Join Voice</span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1.5">
            <div className="flex items-center gap-2 px-2 border-r border-border">
                <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Voice Active
                </span>
            </div>

            <button
                onClick={toggleMute}
                className={`p-1.5 rounded transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-secondary hover:text-primary'}`}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            <button
                onClick={leaveVoice}
                className="p-1.5 rounded hover:bg-red-500/20 text-secondary hover:text-red-500 transition-colors"
                title="Disconnect"
            >
                <PhoneOff size={14} />
            </button>

            {peersRef.current.size > 0 && (
                <div className="text-[10px] text-secondary flex items-center gap-1 ml-1">
                    <Users size={10} />
                    {peersRef.current.size}
                </div>
            )}
        </div>
    );
};
