-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
('user-backgrounds', 'user-backgrounds', true),
('user-avatars', 'user-avatars', true),
('user-audio', 'user-audio', true),
('user-cursors', 'user-cursors', true);

-- Set storage policies for authenticated uploads
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors'));

-- Allow public viewing of all files
CREATE POLICY "Public access for viewing" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors'));

-- Allow users to delete their own files (files in their user folder)
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);