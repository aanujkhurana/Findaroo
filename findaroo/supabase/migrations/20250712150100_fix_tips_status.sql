-- Fix tips table status constraint to match DatabaseReadme.md specification

-- Update the tips table status constraint
ALTER TABLE tips 
DROP CONSTRAINT IF EXISTS tips_status_check;

ALTER TABLE tips 
ADD CONSTRAINT tips_status_check 
CHECK (status IN ('pending', 'succeeded', 'failed'));
