-- Fix foreign key constraints to use CASCADE DELETE
-- This allows items to be deleted even when they have associated tips or karma events

-- Fix tips table foreign key constraint
ALTER TABLE tips
DROP CONSTRAINT IF EXISTS tips_item_id_fkey;

ALTER TABLE tips
ADD CONSTRAINT tips_item_id_fkey
FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- Fix karma_events table foreign key constraint
ALTER TABLE karma_events
DROP CONSTRAINT IF EXISTS karma_events_item_id_fkey;

ALTER TABLE karma_events
ADD CONSTRAINT karma_events_item_id_fkey
FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
