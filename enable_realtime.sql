-- Add room_messages to the supabase_realtime publication
-- This is required for the client to receive real-time updates (subscriptions)
alter publication supabase_realtime add table room_messages;
