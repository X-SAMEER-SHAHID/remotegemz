/*
  # Storage Bucket for Images

  This migration creates a storage bucket for storing screenshots and other images
  related to work entries.
*/

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies are managed through the Supabase dashboard
-- Go to Storage > Policies to configure access control for the 'images' bucket
-- Recommended policies:
-- 1. Users can upload to their own folder: screenshots/{user_id}/*
-- 2. Users can view their own images
-- 3. Users can update their own images
-- 4. Users can delete their own images
