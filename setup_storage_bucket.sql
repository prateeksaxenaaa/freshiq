-- Create a new private bucket for grocery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('grocery-images', 'grocery-images', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own images
CREATE POLICY "Users can upload their own grocery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'grocery-images' AND
  auth.uid() = owner
);

-- Policy: Users can view their own images
CREATE POLICY "Users can view their own grocery images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'grocery-images' AND
  auth.uid() = owner
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own grocery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'grocery-images' AND
  auth.uid() = owner
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own grocery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'grocery-images' AND
  auth.uid() = owner
);
