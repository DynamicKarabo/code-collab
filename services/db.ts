import { supabase } from './supabase';
import { Room, File } from '../types';

export const db = {
    // Rooms
    async createRoom(name: string, ownerId: string): Promise<Room | null> {
        const roomId = 'room-' + Math.random().toString(36).substring(7);

        const { data, error } = await supabase
            .from('rooms')
            .insert([
                { id: roomId, name, owner_id: ownerId }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating room:', error);
            return null;
        }
        return data;
    },

    async getUserRooms(userId: string): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
        return data || [];
    },

    async getRoom(roomId: string): Promise<Room | null> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single();

        if (error) return null;
        return data;
    },

    async deleteRoom(roomId: string): Promise<boolean> {
        // We assume ON DELETE CASCADE is set up in the database schema for files
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (error) {
            console.error('Error deleting room:', error);
            console.error('Error details:', error.message, error.details, error.hint);
            return false;
        }
        return true;
    },

    // Files
    async getRoomFiles(roomId: string): Promise<File[]> {
        const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('room_id', roomId);

        if (error) {
            console.error('Error fetching files:', error);
            return [];
        }

        // Transform null content to empty string if needed
        return (data || []).map(f => ({ ...f, content: f.content || '' }));
    },

    async saveFile(file: File, roomId: string): Promise<void> {
        // Check if file exists to update, or insert new
        // We use name + room_id as a pseudo-unique constraint logic for this simplified app

        // First try to find the file
        const { data: existing } = await supabase
            .from('files')
            .select('id')
            .eq('room_id', roomId)
            .eq('name', file.name)
            .single();

        if (existing) {
            await supabase
                .from('files')
                .update({ content: file.content, language: file.language, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('files')
                .insert({
                    room_id: roomId,
                    name: file.name,
                    language: file.language,
                    content: file.content
                });
        }
    },

    async initializeRoomFiles(roomId: string, initialFiles: Omit<File, 'id'>[]) {
        // Only insert if room has no files
        const currentFiles = await this.getRoomFiles(roomId);
        if (currentFiles.length === 0) {
            for (const file of initialFiles) {
                await supabase.from('files').insert({
                    room_id: roomId,
                    name: file.name,
                    language: file.language,
                    content: file.content
                });
            }
            return true;
        }
        return false;
    }
};
