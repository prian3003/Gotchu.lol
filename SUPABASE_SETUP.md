# Supabase Setup Guide

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

## 2. Create Storage Buckets

Create the following storage buckets in your Supabase dashboard:

### Required Buckets:
- `user-backgrounds` - For background images
- `user-avatars` - For profile avatars  
- `user-audio` - For background audio files
- `user-cursors` - For custom cursor files

### Bucket Configuration:
```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('user-backgrounds', 'user-backgrounds', true),
('user-avatars', 'user-avatars', true),
('user-audio', 'user-audio', true),
('user-cursors', 'user-cursors', true);
```

## 3. Set Bucket Policies

For each bucket, set the following RLS policies:

### Storage Policy (Allow authenticated users to upload)
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors'));

-- Allow users to view all files (public access)
CREATE POLICY "Public access for viewing" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors'));

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors') 
       AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id IN ('user-backgrounds', 'user-avatars', 'user-audio', 'user-cursors') 
       AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. File Upload Structure

Files are organized by user ID:
```
user-backgrounds/
  ├── user_123/
  │   ├── 1640995200000-abc123.png
  │   └── 1640995300000-def456.jpg
  └── user_456/
      └── 1640995400000-ghi789.webp

user-avatars/
  ├── user_123/
  │   └── 1640995500000-avatar.png
  └── user_456/
      └── 1640995600000-profile.jpg
```

## 6. Supported File Types

### Images (Backgrounds, Avatars):
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)
- GIF (.gif)
- Max size: 5MB

### Audio:
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)
- Max size: 10MB

### Cursors:
- PNG (.png)
- ICO (.ico)
- SVG (.svg)
- Max size: 1MB

## 7. Testing Upload

1. Navigate to customization page
2. Try uploading a PNG file for background
3. Check Supabase storage dashboard to verify upload
4. Verify file appears in your bucket with correct user folder structure

## 8. Troubleshooting

### Common Issues:
1. **403 Forbidden**: Check RLS policies are set correctly
2. **Bucket not found**: Ensure buckets are created with exact names
3. **File too large**: Check file size limits in validation
4. **Invalid file type**: Verify MIME type validation

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase environment variables
3. Test bucket policies in Supabase SQL editor
4. Check network tab for failed requests