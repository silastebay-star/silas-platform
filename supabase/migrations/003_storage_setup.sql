-- Storage setup for SILAS pin photos
-- This migration sets up the storage bucket and RLS policies for pin images

-- Create storage bucket for pin photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pin-photos',
  'pin-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload images to pin-photos bucket
CREATE POLICY "Allow authenticated uploads to pin-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pin-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to pin photos
CREATE POLICY "Allow public read access to pin-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pin-photos');

-- Policy: Allow users to update their own uploaded images
CREATE POLICY "Allow users to update own pin-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pin-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own uploaded images
CREATE POLICY "Allow users to delete own pin-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pin-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to generate optimized image URLs
CREATE OR REPLACE FUNCTION get_pin_photo_url(
  photo_path text,
  width integer DEFAULT NULL,
  height integer DEFAULT NULL,
  quality integer DEFAULT 80
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
  transform_params text := '';
BEGIN
  -- Get the base storage URL
  SELECT 
    CASE 
      WHEN current_setting('app.settings.supabase_url', true) IS NOT NULL 
      THEN current_setting('app.settings.supabase_url', true) || '/storage/v1/object/public/pin-photos/'
      ELSE 'https://your-project.supabase.co/storage/v1/object/public/pin-photos/'
    END
  INTO base_url;
  
  -- Build transformation parameters
  IF width IS NOT NULL OR height IS NOT NULL OR quality != 80 THEN
    transform_params := '?';
    
    IF width IS NOT NULL THEN
      transform_params := transform_params || 'width=' || width::text;
    END IF;
    
    IF height IS NOT NULL THEN
      IF width IS NOT NULL THEN
        transform_params := transform_params || '&';
      END IF;
      transform_params := transform_params || 'height=' || height::text;
    END IF;
    
    IF quality != 80 THEN
      IF width IS NOT NULL OR height IS NOT NULL THEN
        transform_params := transform_params || '&';
      END IF;
      transform_params := transform_params || 'quality=' || quality::text;
    END IF;
  END IF;
  
  RETURN base_url || photo_path || transform_params;
END;
$$;

-- Create function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_pin_photos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete storage objects that don't have corresponding pin records
  DELETE FROM storage.objects
  WHERE bucket_id = 'pin-photos'
    AND NOT EXISTS (
      SELECT 1 FROM pins p
      WHERE p.photos @> ARRAY[objects.name]
    )
    AND created_at < NOW() - INTERVAL '24 hours'; -- Only delete files older than 24 hours
END;
$$;

-- Create function to validate image uploads
CREATE OR REPLACE FUNCTION validate_pin_photo_upload()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check file size (5MB limit)
  IF NEW.metadata->>'size' IS NOT NULL AND 
     (NEW.metadata->>'size')::bigint > 5242880 THEN
    RAISE EXCEPTION 'File size exceeds 5MB limit';
  END IF;
  
  -- Check mime type
  IF NEW.metadata->>'mimetype' IS NOT NULL AND 
     NEW.metadata->>'mimetype' NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') THEN
    RAISE EXCEPTION 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed';
  END IF;
  
  -- Check that the file is being uploaded to the correct user folder
  IF auth.uid()::text != (storage.foldername(NEW.name))[1] THEN
    RAISE EXCEPTION 'Files must be uploaded to your own folder';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for upload validation
CREATE TRIGGER validate_pin_photo_upload_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'pin-photos')
  EXECUTE FUNCTION validate_pin_photo_upload();

-- Update pins table to better handle photo arrays
ALTER TABLE pins 
ALTER COLUMN photos SET DEFAULT '{}';

-- Add index for photo queries
CREATE INDEX IF NOT EXISTS idx_pins_photos_gin ON pins USING gin(photos);

-- Create view for pins with photo URLs
CREATE OR REPLACE VIEW pins_with_photo_urls AS
SELECT 
  p.*,
  CASE 
    WHEN array_length(p.photos, 1) > 0 THEN
      array_agg(get_pin_photo_url(photo, 800, 600, 85) ORDER BY ordinality)
    ELSE 
      '{}'::text[]
  END as photo_urls,
  CASE 
    WHEN array_length(p.photos, 1) > 0 THEN
      array_agg(get_pin_photo_url(photo, 200, 200, 80) ORDER BY ordinality)
    ELSE 
      '{}'::text[]
  END as thumbnail_urls
FROM pins p
LEFT JOIN LATERAL unnest(p.photos) WITH ORDINALITY AS photo ON true
GROUP BY p.id, p.title, p.description, p.lat, p.lng, p.type, p.category, p.status, 
         p.created_at, p.updated_at, p.created_by, p.metadata, p.photos, p.likes, p.comments;

-- Grant permissions
GRANT SELECT ON pins_with_photo_urls TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_pin_photo_url TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_pin_photos TO authenticated;
