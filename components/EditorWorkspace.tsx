import React, { useState, useRef, useEffect } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext';
import { File as FileIcon, Settings, Share2, MessageSquare, Play, Menu, ArrowLeft, Plus, Trash2, Undo, Redo, Code, Check, X, Loader2 } from 'lucide-react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import randomColor from 'randomcolor';
import { INITIAL_FILES, MOCK_USERS } from '../constants';
import { File, User, AIAction } from '../types';
import { db } from '../services/db';
import { ChatPanel } from './ChatPanel';
import { TerminalPanel, EditorMarker } from './TerminalPanel';
import { CursorOverlay } from './CursorOverlay';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { FileExplorer } from './FileExplorer';

interface EditorWorkspaceProps {
  roomId: string;
  currentUser: User;
  onLeave: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ roomId, currentUser, onLeave }) => {
  // ... inside EditorWorkspace ...
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]); // New: Track open tabs
  const [users, setUsers] = useState<User[]>([currentUser]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Helper to handle opening a file (adds to tabs if needed)
  const handleOpenFile = (fileId: string) => {
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds(prev => [...prev, fileId]);
    }
    setActiveFileId(fileId);
  };

  // Helper to close a tab
  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const newOpenFiles = openFileIds.filter(id => id !== fileId);
    setOpenFileIds(newOpenFiles);

    // If we closed the active file, switch to the last one or nothing
    if (activeFileId === fileId) {
      if (newOpenFiles.length > 0) {
        setActiveFileId(newOpenFiles[newOpenFiles.length - 1]);
      } else {
        setActiveFileId(null);
      }
    }
  };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // File Creation State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Error Fixing State
  const [markers, setMarkers] = useState<EditorMarker[]>([]);
  const [pendingAiMessage, setPendingAiMessage] = useState<string | null>(null);

  // Share State
  const [hasCopied, setHasCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleFixError = (marker: EditorMarker) => {
    // Open Chat
    setIsChatOpen(true);
    // Set prompt
    setPendingAiMessage(`I found an error in ${activeFile?.name} at line ${marker.startLineNumber}: "${marker.message}". Can you fix it?`);
  };

  // Editor Reference
  const [editor, setEditor] = useState<any>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const fileContentRef = useRef<{ [key: string]: string }>({});

  // ... (useEffect for init previously added) ...

  const activeFile = files.find(f => f.id === activeFileId);

  // ... (handleCodeChange previously added) ...

  // Fix variable names in JSX below
  // Replace sidebarOpen with isSidebarOpen
  // Replace chatOpen with isChatOpen



  useEffect(() => {
    const initFiles = async () => {
      try {
        setLoading(true);
        // Ensure room exists and has files, or create defaults
        await db.initializeRoomFiles(roomId, INITIAL_FILES);

        // Fetch files
        const roomFiles = await db.getRoomFiles(roomId);
        if (roomFiles.length > 0) {
          setFiles(roomFiles);
          setActiveFileId(roomFiles[0].id);
        } else {
          // Fallback if DB issues, preventing infinite load
          setFiles([]);
        }
      } catch (error) {
        console.error("Failed to load files:", error);
      } finally {
        setLoading(false);
      }
    };
    initFiles();
  }, [roomId]);

  useEffect(() => {
    // Initialize Yjs
    const doc = new Y.Doc();
    docRef.current = doc;

    const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:1234';
    const provider = new WebsocketProvider(websocketUrl, roomId, doc);
    providerRef.current = provider;

    const awareness = provider.awareness;
    const color = randomColor();
    awareness.setLocalStateField('user', {
      name: currentUser.name,
      color: color
    });

    provider.on('status', (event: any) => {
      // console.log(event.status);
    });

    // Listen for awareness changes to update the users list
    awareness.on('change', () => {
      const states = awareness.getStates();
      const activeUsers = Array.from(states.values())
        .map((state: any) => state.user)
        .filter((user: User) => user && user.name) as User[];

      // Use map to ensure unique users by ID if needed, or just set
      // For now, simple set
      if (activeUsers.length > 0) {
        setUsers(activeUsers);
      }
    });

    return () => {
      provider.disconnect();
      doc.destroy();
    };
  }, [roomId, currentUser]);

  // Sync active file content
  useEffect(() => {
    if (!editor || !docRef.current || !providerRef.current || !activeFile) return;

    const doc = docRef.current;
    const yText = doc.getText(activeFileId || 'default'); // Fallback to avoid error if ID null, though check above handles it

    // If the file is empty in Yjs but has content locally (initially), push it
    if (yText.toString() === '' && activeFile.content !== '') {
      yText.insert(0, activeFile.content);
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const awareness = providerRef.current.awareness;
    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      awareness
    );

  }, [activeFileId, editor, activeFile]); // Removed deep dep activeFile.content to prevent loops, relying on ID switch

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;
    setFiles(prev => prev.map(f =>
      f.id === activeFile.id ? { ...f, content: value } : f
    ));

    // Simple debounce logic could go here or relying on a "Save" effect
    // For this prototype, let's just save immediately but async (fire and forget)
    // In production, use useDebounce.
    db.saveFile({ ...activeFile, content: value }, roomId);
  };

  const { theme } = useTheme();

  // Update Monaco Theme when app theme changes
  useEffect(() => {
    if (!editor) return;

    // We need access to 'monaco' instance. 
    // Since we don't store 'monaco' in state (only editor instance), we might need to use the loader or just reliance on global 'monaco' if available, 
    // or better, store monaco in state or use the onMount properly.
    // Actually, 'monaco' is available via useMonaco hook from @monaco-editor/react, or we can just define themes on mount and switch them.
    // Let's rely on the editor instance to update options, but themes are global.
    // Better approach: Import useMonaco.
  }, [theme, editor]);

  // Actually, let's use the 'active' prop of <Editor> or useMonaco hook.
  // Let's assume we need to import useMonaco.

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    setEditor(editorInstance);

    // Define all themes
    monaco.editor.defineTheme('vercel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#ededed',
        'editor.lineHighlightBorder': '#333333',
        'editorLineNumber.foreground': '#444444',
      }
    });

    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBorder': '#44475a',
        'editorLineNumber.foreground': '#6272a4',
      }
    });

    monaco.editor.defineTheme('github-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
        'editor.lineHighlightBorder': '#eaeef2',
        'editorLineNumber.foreground': '#6e7781',
      }
    });

    // Set initial
    monaco.editor.setTheme(theme);
  };

  // Effect to switch theme dynamically
  const monaco = useMonaco();
  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(theme);
    }
  }, [theme, monaco]);

  const handleCreateFile = (name?: string) => {
    // Determine name: arg OR state (for backward compatibility if needed, though FileExplorer handles it)
    const nameToUse = name || newFileName;

    if (!nameToUse.trim()) return;
    const extension = nameToUse.split('.').pop() || 'txt';
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      css: 'css',
      html: 'html',
      json: 'json'
    };

    const newFile: File = {
      id: Date.now().toString(),
      name: nameToUse, // This now supports paths like "folder/file.ts"
      language: languageMap[extension] || 'plaintext',
      content: '// New file\n'
    };

    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert("Cannot delete the last file.");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (confirmed) {
      const newFiles = files.filter(f => f.id !== fileId);
      setFiles(newFiles);
      if (activeFileId === fileId) {
        setActiveFileId(newFiles[0].id);
      }
    }
  };

  // WebContainer and Terminal State
  const webContainerRef = useRef<WebContainer | null>(null);
  const terminalRef = useRef<Terminal | null>(null);

  // Initialize WebContainer
  useEffect(() => {
    const bootWebContainer = async () => {
      try {
        const webcontainerInstance = await WebContainer.boot();
        webContainerRef.current = webcontainerInstance;
        console.log('WebContainer booted');
      } catch (error) {
        console.error('Failed to boot WebContainer:', error);
      }
    };
    bootWebContainer();
  }, []);

  const handleRunCode = async () => {
    if (!webContainerRef.current || !terminalRef.current) {
      alert("WebContainer is still booting...");
      return;
    }

    const terminal = terminalRef.current;

    // Write current file
    if (activeFile) {
      await webContainerRef.current.mount({
        [activeFile.name]: {
          file: {
            contents: activeFile.content
          }
        }
      });
    }

    // Run file with Node.js
    if (activeFile) {
      terminal.writeln(`\r\n$ node ${activeFile.name}`);
      const process = await webContainerRef.current.spawn('node', [activeFile.name]);

      process.output.pipeTo(new WritableStream({
        write(data) {
          terminal.write(data);
        }
      }));

      const exitCode = await process.exit;
      terminal.writeln(`\r\n[Process exited with code ${exitCode}]`);
    }
  };

  const triggerUndo = () => {
    editor?.trigger('toolbar', 'undo', null);
  };

  const triggerRedo = () => {
    editor?.trigger('toolbar', 'redo', null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!providerRef.current) return;

    // Throttle updates to ~50ms
    const now = Date.now();
    if (now - (window as any).lastMouseMoveTime < 50) return;
    (window as any).lastMouseMoveTime = now;

    const awareness = providerRef.current.awareness;
    const { clientX, clientY } = e;

    awareness.setLocalStateField('user', {
      ...awareness.getLocalState().user,
      mouse: { x: clientX, y: clientY }
    });
  };

  return (
    <div
      className="flex h-screen w-screen bg-black text-white overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      <CursorOverlay users={users} />

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-black/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col overflow-hidden z-20`}>
        <div className="h-12 flex items-center px-4 border-b border-[#333] gap-2">
          <button onClick={onLeave} className="text-secondary hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-sm tracking-tight truncate">{roomId}</span>
        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onOpenFile={handleOpenFile}
            onDeleteFile={handleDeleteFile}
            onCreateFile={handleCreateFile}
          />

          <div className="mt-8 border-t border-[#333] pt-4">
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-2">Collaborators</div>
            <div className="space-y-2 px-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full ring-2 ring-black"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-xs text-secondary">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Top Navigation */}
        <div className="h-14 bg-black/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-secondary hover:text-white transition-colors">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                {activeFile?.name || 'No file selected'}
              </span>
              {/* Undo / Redo Controls */}
              <div className="h-4 w-[1px] bg-[#333] mx-1"></div>
              <div className="flex items-center gap-1">
                <button onClick={triggerUndo} className="p-1.5 text-secondary hover:text-white hover:bg-[#222] rounded transition-colors" title="Undo (Ctrl+Z)">
                  <Undo size={14} />
                </button>
                <button onClick={triggerRedo} className="p-1.5 text-secondary hover:text-white hover:bg-[#222] rounded transition-colors" title="Redo (Ctrl+Y)">
                  <Redo size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="bg-white text-black hover:bg-gray-200 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              onClick={handleRunCode}
            >
              <Play size={12} fill="currentColor" /> Run
            </button>
            <button
              onClick={handleShare}
              className={`border border-[#333] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${hasCopied
                ? 'bg-green-500/10 text-green-500 border-green-500/50'
                : 'bg-[#222] text-white hover:bg-[#333]'
                }`}
            >
              {hasCopied ? <Check size={12} /> : <Share2 size={12} />}
              {hasCopied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded transition-colors relative ${isChatOpen ? 'bg-white text-black' : 'text-secondary hover:text-white hover:bg-[#222]'}`}
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded transition-colors relative ${isChatOpen ? 'bg-primary text-background' : 'text-secondary hover:text-primary hover:bg-surface'}`}
            >
              <MessageSquare size={16} />
            </button>

            <div className="h-4 w-[1px] bg-border mx-1"></div>
            <ThemeSwitcher />

            <button className="p-2 text-secondary hover:text-primary hover:bg-surface rounded">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative flex flex-col overflow-hidden">

          {/* Tab Bar */}
          {openFileIds.length > 0 && (
            <div className="flex items-center bg-[#0a0a0a] border-b border-white/5 overflow-x-auto min-h-[36px] scrollbar-hide">
              {openFileIds.map(id => {
                const file = files.find(f => f.id === id);
                if (!file) return null;
                const isActive = activeFileId === id;

                return (
                  <div
                    key={id}
                    onClick={() => setActiveFileId(id)}
                    className={`
                                group flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-r border-white/5 cursor-pointer min-w-[120px] max-w-[200px] select-none transition-colors
                                ${isActive ? 'bg-[#151515] text-blue-400 border-t-2 border-t-blue-500/50' : 'text-gray-500 hover:bg-[#111] hover:text-gray-300 border-t-2 border-t-transparent'}
                            `}
                  >
                    <FileIcon size={12} className={isActive ? "text-blue-400" : "text-gray-600"} />
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      onClick={(e) => handleCloseTab(e, id)}
                      className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all ${isActive ? 'text-blue-400' : 'text-gray-500'}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 h-full relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-secondary bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <span className="text-sm font-medium animate-pulse">Initializing workspace...</span>
              </div>
            ) : activeFile ? (
              <Editor
                height="100%"
                defaultLanguage={activeFile.language}
                language={activeFile.language}
                value={activeFile.content}
                theme="vercel-dark"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                onValidate={(userMarkers) => {
                  // Filter for errors only, or keep warnings too? Let's keep severe ones.
                  // Map Monaco markers to our interface
                  const editorMarkers: EditorMarker[] = userMarkers
                    .filter(m => m.severity > 1) // Info=1, Warning=2, Error=8, etc. Monaco enums are numbers
                    // Actually Monaco MarkerSeverity: Hint=1, Info=2, Warning=4, Error=8
                    // Let's take Warning(4) and Error(8) -> > 2
                    .map(m => ({
                      originalData: m,
                      message: m.message,
                      startLineNumber: m.startLineNumber,
                      startColumn: m.startColumn,
                      severity: m.severity
                    }));
                  setMarkers(editorMarkers);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: '"Fira Code", monospace',
                  lineHeight: 24,
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  renderLineHighlight: 'all',
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-secondary bg-[#0a0a0a] relative overflow-hidden select-none">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                    <Code className="w-8 h-8 text-gray-500" />
                  </div>

                  <h3 className="text-xl font-medium text-white mb-2">No file open</h3>
                  <p className="text-gray-500 text-sm mb-8">
                    Select a file from the sidebar to start editing, or create a new one to begin your project.
                  </p>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => setIsCreatingFile(true)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                    >
                      <Plus className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-gray-300">New File</span>
                    </button>
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                    >
                      <Menu className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-gray-300">Browse</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ChatPanel
            activeFile={activeFile}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onAction={async (action) => {
              if (action.type === 'create_file') {
                try {
                  const newFile: File = {
                    id: crypto.randomUUID(),
                    name: action.fileName,
                    language: action.fileName.endsWith('.ts') || action.fileName.endsWith('.tsx') ? 'typescript' : 'javascript', // simple inference
                    content: action.content
                  };
                  await db.saveFile(newFile, process.env.NEXT_PUBLIC_SUPABASE_URL ? roomId : 'demo');
                  // Optimistic update
                  setFiles(prev => [...prev, newFile]);
                  setActiveFileId(newFile.id);
                } catch (e) {
                  console.error("AI Create File Error: ", e);
                }
              } else if (action.type === 'edit_code') {
                const targetFile = files.find(f => f.name === action.fileName);
                if (targetFile) {
                  const updatedFile = { ...targetFile, content: action.content };
                  // Update DB
                  await db.saveFile(updatedFile, process.env.NEXT_PUBLIC_SUPABASE_URL ? roomId : 'demo');
                  // Update State
                  setFiles(prev => prev.map(f => f.id === targetFile.id ? updatedFile : f));
                }
              }
            }}
            pendingMessage={pendingAiMessage}
            onClearPendingMessage={() => setPendingAiMessage(null)}
          />
        </div>

        {/* Terminal Area */}
        <div className="h-48 border-t border-[#333]">
          <TerminalPanel
            onTerminalReady={(term) => { terminalRef.current = term; }}
            markers={markers}
            onFixError={handleFixError}
          />
        </div>
      </div>
    </div>
  );
};