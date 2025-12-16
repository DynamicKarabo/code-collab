import React, { useState, useMemo } from 'react';
import { File as FileIcon, Folder, FolderOpen, ChevronRight, ChevronDown, Trash2, Plus } from 'lucide-react';
import { File } from '../types';

interface FileNode {
    id: string; // "dir-name" or file.id
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileNode[];
    fileId?: string; // Only for files
}

interface FileExplorerProps {
    files: File[];
    activeFileId: string | null;
    onOpenFile: (fileId: string) => void;
    onDeleteFile: (e: React.MouseEvent, fileId: string) => void;
    onCreateFile: (name: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileId, onOpenFile, onDeleteFile, onCreateFile }) => {
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
    const [isCreating, setIsCreating] = useState(false);
    const [newPath, setNewPath] = useState('');

    // 1. Build Tree
    const fileTree = useMemo(() => {
        const root: FileNode[] = [];
        const map = new Map<string, FileNode>(); // path -> node

        // Sort files by path depth/name
        const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

        sortedFiles.forEach(file => {
            const parts = file.name.split('/');
            let currentPath = '';

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!map.has(currentPath)) {
                    const node: FileNode = {
                        id: isFile ? file.id : `dir-${currentPath}`,
                        name: part,
                        type: isFile ? 'file' : 'folder',
                        path: currentPath,
                        children: isFile ? undefined : [],
                        fileId: isFile ? file.id : undefined
                    };
                    map.set(currentPath, node);

                    if (parentPath) {
                        const parent = map.get(parentPath);
                        if (parent && parent.children) {
                            // Check if already exists in parent (avoid duplicates for folders encountered multiple times)
                            if (!parent.children.find(c => c.path === currentPath)) {
                                parent.children.push(node);
                            }
                        }
                    } else {
                        if (!root.find(c => c.path === currentPath)) {
                            root.push(node);
                        }
                    }
                }
            });
        });

        // Helper to sort tree: folders first, then files
        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });
            nodes.forEach(n => {
                if (n.children) sortNodes(n.children);
            });
        };
        sortNodes(root);
        return root;
    }, [files]);

    const toggleFolder = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(collapsedFolders);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setCollapsedFolders(next);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPath.trim()) {
            onCreateFile(newPath.trim());
            setNewPath('');
            setIsCreating(false);
        }
    };

    const renderNode = (node: FileNode, depth: number) => {
        const isCollapsed = collapsedFolders.has(node.path);
        const isActive = node.type === 'file' && activeFileId === node.fileId;
        const paddingLeft = (depth * 12) + 12;

        return (
            <div key={node.path}>
                <div
                    className={`
                group flex items-center gap-1.5 py-1.5 pr-2 text-sm select-none cursor-pointer transition-colors
                ${isActive ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary hover:bg-surface'}
            `}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={(e) => {
                        if (node.type === 'folder') toggleFolder(node.path, e);
                        else if (node.fileId) onOpenFile(node.fileId);
                    }}
                >
                    <span className="opacity-70 shrink-0">
                        {node.type === 'folder' ? (
                            isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />
                            // isCollapsed ? <Folder size={14} /> : <FolderOpen size={14} />
                        ) : (
                            <FileIcon size={14} />
                        )}
                    </span>

                    <span className="truncate flex-1">{node.name}</span>

                    {node.type === 'file' && (
                        <button
                            onClick={(e) => node.fileId && onDeleteFile(e, node.fileId)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>

                {node.type === 'folder' && !isCollapsed && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 px-4 mt-4">
                <span>Explorer</span>
                <button
                    onClick={() => setIsCreating(true)}
                    className="hover:text-primary transition-colors"
                    title="New File"
                >
                    <Plus size={14} />
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateSubmit} className="px-3 mb-2">
                    <input
                        autoFocus
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent"
                        placeholder="path/to/file.ts"
                        value={newPath}
                        onChange={e => setNewPath(e.target.value)}
                        onBlur={() => !newPath && setIsCreating(false)}
                    />
                </form>
            )}

            {fileTree.length === 0 && !isCreating ? (
                <div className="text-center text-xs text-secondary mt-8 italic">No files</div>
            ) : (
                <div>
                    {fileTree.map(node => renderNode(node, 0))}
                </div>
            )}
        </div>
    );
};
