-- Allow users to delete their own rooms
create policy "Users can delete their own rooms" on rooms
  for delete using (auth.uid() = owner_id);

-- Files will be deleted automatically via ON DELETE CASCADE, 
-- but if we ever wanted to delete individual files:
-- (We'll assume room ownership implies file ownership for deletion contexts)
create policy "Users can delete files in their rooms" on files
  for delete using (
    exists (
      select 1 from rooms
      where rooms.id = files.room_id
      and rooms.owner_id = auth.uid()
    )
  );
