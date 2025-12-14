import React, { useState, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { File as FileIcon, Settings, Share2, MessageSquare, Play, Menu, ArrowLeft, Plus, Trash2, Undo, Redo, Code, Check, X, Loader2 } from 'lucide-react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import randomColor from 'randomcolor';
import { INITIAL_FILES, MOCK_USERS } from '../constants';
import { File, User } from '../types';
import { db } from '../services/db';
import { ChatPanel } from './ChatPanel';
import { TerminalPanel } from './TerminalPanel';
import { CursorOverlay } from './CursorOverlay';
import { Logo } from './Logo';

interface EditorWorkspaceProps {
  roomId: string;
  currentUser: User;
  onLeave: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ roomId, currentUser, onLeave }) => {
  // ... inside EditorWorkspace ...
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([currentUser]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // File Creation State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

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
    // Initialize Yjs
    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new WebsocketProvider('ws://localhost:1234', roomId, doc);
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

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    setEditor(editorInstance);
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
    monaco.editor.setTheme('vercel-dark');
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const extension = newFileName.split('.').pop() || 'txt';
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
      name: newFileName,
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

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden relative">
      <CursorOverlay users={users} />

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-black border-r border-[#333] transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="h-12 flex items-center px-4 border-b border-[#333] gap-2">
          <button onClick={onLeave} className="text-secondary hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-sm tracking-tight truncate">{roomId}</span>
        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-2 mt-4">
            <span>Explorer</span>
            <button
              onClick={() => setIsCreatingFile(true)}
              className="hover:text-white transition-colors"
              title="New File"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${activeFileId === file.id
                  ? 'bg-white/10 text-white'
                  : 'text-secondary hover:bg-[#111] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileIcon size={14} className={activeFileId === file.id ? 'text-blue-400' : 'text-gray-500'} />
                  <span className="truncate">{file.name}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteFile(e, file.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {isCreatingFile && (
              <div className="px-3 py-2 bg-[#111] rounded-md flex items-center gap-2">
                <FileIcon size={14} className="text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFile();
                    if (e.key === 'Escape') setIsCreatingFile(false);
                  }}
                  placeholder="filename.ts"
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
                />
                <div className="flex items-center gap-1">
                  <button onClick={handleCreateFile} className="text-green-500 hover:text-green-400"><Check size={12} /></button>
                  <button onClick={() => setIsCreatingFile(false)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                </div>
              </div>
            )}
          </div>

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
        <div className="h-12 bg-black border-b border-[#333] flex items-center justify-between px-4">
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
            <button className="bg-[#222] text-white hover:bg-[#333] border border-[#333] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Share2 size={12} /> Share
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded transition-colors relative ${isChatOpen ? 'bg-white text-black' : 'text-secondary hover:text-white hover:bg-[#222]'}`}
            >
              <MessageSquare size={16} />
            </button>
            <button className="p-2 text-secondary hover:text-white hover:bg-[#222] rounded">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative flex overflow-hidden">
          <div className="flex-1 h-full relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-secondary">
                <Loader2 className="animate-spin mr-2" /> Loading workspace...
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
              <div className="h-full flex items-center justify-center text-secondary">
                <div className="text-center">
                  <p className="mb-2">No file selected</p>
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Create a file
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeFile && (
            <ChatPanel
              activeFile={activeFile}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          )}
        </div>

        {/* Terminal Area */}
        <div className="h-48 border-t border-[#333]">
          <TerminalPanel onTerminalReady={(term) => { terminalRef.current = term; }} />
        </div>
      </div>
    </div>
  );
};