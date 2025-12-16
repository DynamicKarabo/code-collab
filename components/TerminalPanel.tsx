import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AlertCircle, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import 'xterm/css/xterm.css';

export interface EditorMarker {
    originalData: any; // Monaco marker data
    message: string;
    startLineNumber: number;
    startColumn: number;
    severity: number;
}

interface TerminalPanelProps {
    onTerminalReady?: (terminal: Terminal) => void;
    markers?: EditorMarker[];
    onFixError?: (marker: EditorMarker) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ onTerminalReady, markers = [], onFixError }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const [activeTab, setActiveTab] = useState<'terminal' | 'problems'>('terminal');

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#0a0a0a',
                foreground: '#ededed',
            },
            fontSize: 14,
            fontFamily: '"Fira Code", monospace',
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        // Delay opening to ensure container is ready
        setTimeout(() => {
            if (terminalRef.current) {
                term.open(terminalRef.current);
                fitAddon.fit();
            }
        }, 100);

        xtermRef.current = term;

        if (onTerminalReady) {
            onTerminalReady(term);
        }

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            xtermRef.current = null;
        };
    }, []);

    // Re-fit when switching tabs back to terminal
    useEffect(() => {
        if (activeTab === 'terminal' && xtermRef.current) {
            // Need a slight delay for layout to paint
            setTimeout(() => {
                const fitAddon = (xtermRef.current as any)._addons?.[0]; // Accessing fit addon loosely 
                if (fitAddon) fitAddon.fit();
            }, 50);
        }
    }, [activeTab]);

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            {/* Tabs Header */}
            <div className="flex items-center h-9 bg-black border-b border-white/5 px-4 gap-4">
                <button
                    onClick={() => setActiveTab('terminal')}
                    className={`flex items-center gap-2 px-3 py-1 border-t border-x rounded-t-md text-xs font-medium translate-y-[1px] transition-colors ${activeTab === 'terminal'
                            ? 'bg-[#0a0a0a] border-white/5 text-gray-200'
                            : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                >
                    <TerminalIcon size={12} />
                    Terminal
                </button>
                <button
                    onClick={() => setActiveTab('problems')}
                    className={`flex items-center gap-2 px-3 py-1 border-t border-x rounded-t-md text-xs font-medium translate-y-[1px] transition-colors ${activeTab === 'problems'
                            ? 'bg-[#0a0a0a] border-white/5 text-gray-200'
                            : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                >
                    <AlertCircle size={12} className={markers.length > 0 ? "text-red-400" : "text-gray-500"} />
                    Problems
                    {markers.length > 0 && (
                        <span className="bg-white/10 text-gray-300 px-1.5 rounded-full text-[10px]">{markers.length}</span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {/* Terminal View */}
                <div
                    className={`absolute inset-0 p-2 pl-4 ${activeTab === 'terminal' ? 'visible z-10' : 'invisible z-0'}`}
                    ref={terminalRef}
                />

                {/* Problems View */}
                {activeTab === 'problems' && (
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-2">
                        {markers.length === 0 ? (
                            <div className="text-gray-500 text-sm flex flex-col items-center justify-center h-full opacity-50">
                                <span className="mb-2">No problems detected</span>
                                <span className="text-xs">Happy coding!</span>
                            </div>
                        ) : (
                            markers.map((marker, i) => (
                                <div key={i} className="flex items-start justify-between bg-white/5 border border-white/5 rounded-lg p-3 group hover:border-white/10 transition-colors">
                                    <div className="flex gap-3">
                                        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <div className="text-sm text-gray-200 font-mono mb-1">{marker.message}</div>
                                            <div className="text-xs text-gray-500">
                                                Line {marker.startLineNumber}, Column {marker.startColumn}
                                            </div>
                                        </div>
                                    </div>
                                    {onFixError && (
                                        <button
                                            onClick={() => onFixError(marker)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Sparkles size={12} />
                                            Active Fix
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
