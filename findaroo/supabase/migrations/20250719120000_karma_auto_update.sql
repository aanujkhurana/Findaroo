-- Create function to automatically update user karma points when karma events are created
CREATE OR REPLACE FUNCTION update_user_karma_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's karma_points by summing all their karma events
    UPDATE users 
    SET karma_points = (
        SELECT COALESCE(SUM(points), 0) 
        FROM karma_events 
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update karma points when karma events are inserted
DROP TRIGGER IF EXISTS trigger_update_user_karma ON karma_events;
CREATE TRIGGER trigger_update_user_karma
    AFTER INSERT ON karma_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_karma_points();

-- Also create a trigger for when karma events are updated (in case points change)
DROP TRIGGER IF EXISTS trigger_update_user_karma_on_update ON karma_events;
CREATE TRIGGER trigger_update_user_karma_on_update
    AFTER UPDATE ON karma_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_karma_points();

-- Create a function to recalculate all user karma points (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_karma_points()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET karma_points = COALESCE(karma_totals.total_points, 0)
    FROM (
        SELECT 
            user_id, 
            SUM(points) as total_points
        FROM karma_events 
        GROUP BY user_id
    ) karma_totals
    WHERE users.id = karma_totals.user_id;
    
    -- Set karma_points to 0 for users with no karma events
    UPDATE users 
    SET karma_points = 0 
    WHERE karma_points IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run the recalculation to ensure all existing users have correct karma points
SELECT recalculate_all_karma_points();
