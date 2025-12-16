import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalPanelProps {
    onTerminalReady?: (terminal: Terminal) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ onTerminalReady }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);

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

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        // Report readiness
        if (onTerminalReady) {
            onTerminalReady(term);
        }

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            {/* Terminal Tab Header */}
            <div className="flex items-center h-9 bg-black border-b border-white/5 px-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border-t border-x border-white/5 rounded-t-md text-xs text-gray-200 font-medium translate-y-[1px]">
                    <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
                    Terminal
                </div>
            </div>

            {/* Terminal Container */}
            <div className="flex-1 p-2 pl-4" ref={terminalRef} />
        </div>
    );
};
