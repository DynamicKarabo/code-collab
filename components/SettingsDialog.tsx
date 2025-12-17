import React, { useState, useEffect } from 'react';
import { X, Type, User, Monitor, Check } from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserType;
    onUpdateUser: (updates: Partial<UserType>) => void;
    editorSettings: EditorSettings;
    onUpdateEditorSettings: (settings: EditorSettings) => void;
}

export interface EditorSettings {
    fontSize: number;
    wordWrap: 'on' | 'off';
    minimap: boolean;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    currentUser,
    onUpdateUser,
    editorSettings,
    onUpdateEditorSettings,
}) => {
    const [activeTab, setActiveTab] = useState<'editor' | 'profile'>('editor');
    const [tempName, setTempName] = useState(currentUser.name);
    const [tempColor, setTempColor] = useState(currentUser.color);

    // Sync prop changes to temp state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setTempName(currentUser.name);
            setTempColor(currentUser.color);
        }
    }, [isOpen, currentUser]);

    const handleSaveProfile = () => {
        onUpdateUser({ name: tempName, color: tempColor });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333]">
                    <h2 className="text-lg font-semibold text-white">Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#333]">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'editor' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Profile
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {activeTab === 'editor' ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-200">
                            {/* Font Size */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Type size={16} /> Font Size
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="10"
                                        max="24"
                                        step="1"
                                        value={editorSettings.fontSize}
                                        onChange={(e) => onUpdateEditorSettings({ ...editorSettings, fontSize: parseInt(e.target.value) })}
                                        className="flex-1 accent-blue-500"
                                    />
                                    <span className="w-12 text-center font-mono bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm">
                                        {editorSettings.fontSize}px
                                    </span>
                                </div>
                            </div>

                            {/* Word Wrap */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Monitor size={16} /> Word Wrap
                                </label>
                                <button
                                    onClick={() => onUpdateEditorSettings({ ...editorSettings, wordWrap: editorSettings.wordWrap === 'on' ? 'off' : 'on' })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${editorSettings.wordWrap === 'on' ? 'bg-blue-600' : 'bg-[#333]'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${editorSettings.wordWrap === 'on' ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            {/* Minimap */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Monitor size={16} /> Minimap
                                </label>
                                <button
                                    onClick={() => onUpdateEditorSettings({ ...editorSettings, minimap: !editorSettings.minimap })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${editorSettings.minimap ? 'bg-blue-600' : 'bg-[#333]'
                                        }`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${editorSettings.minimap ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <User size={16} /> Display Name
                                </label>
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Avatar Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setTempColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${tempColor === color ? 'border-white scale-110' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={tempColor}
                                        onChange={(e) => setTempColor(e.target.value)}
                                        className="w-8 h-8 rounded-full overflow-hidden p-0 border-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
