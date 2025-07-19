-- Create reports table for handling user reports and moderation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) NOT NULL,
    reported_user_id UUID REFERENCES users(id),
    item_id UUID REFERENCES items(id),
    report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'inappropriate', 'fake', 'ghosting', 'abuse')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports table
-- Users can create reports
CREATE POLICY "Users can create reports"
ON reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Users can view reports they created
CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT 
USING (auth.uid() = reporter_id);

-- Admins/moderators can view all reports (we'll implement admin roles later)
-- For now, we'll allow service role to manage reports
CREATE POLICY "Service role can manage reports"
ON reports FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_item_id ON reports(item_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Grant necessary permissions
GRANT ALL ON reports TO authenticated;
GRANT ALL ON reports TO service_role;
