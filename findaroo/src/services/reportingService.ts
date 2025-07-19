import { supabase } from './supabaseClient';
import { karmaService } from './karmaService';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  item_id?: string;
  report_type: 'spam' | 'inappropriate' | 'fake' | 'ghosting' | 'abuse';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

class ReportingService {
  /**
   * Report an item as spam, fake, or inappropriate
   */
  async reportItem(
    reporterId: string,
    itemId: string,
    reportType: 'spam' | 'inappropriate' | 'fake',
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the item to find the owner
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('user_id, title')
        .eq('id', itemId)
        .single();

      if (itemError) {
        return { success: false, error: 'Item not found' };
      }

      // Prevent self-reporting
      if (item.user_id === reporterId) {
        return { success: false, error: 'You cannot report your own item' };
      }

      // Check if user has already reported this item
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('item_id', itemId)
        .single();

      if (existingReport) {
        return { success: false, error: 'You have already reported this item' };
      }

      // Create the report
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: item.user_id,
          item_id: itemId,
          report_type: reportType,
          description,
          status: 'pending'
        });

      if (reportError) {
        console.error('[ReportingService] Error creating report:', reportError);
        return { success: false, error: 'Failed to submit report' };
      }

      // Award karma to reporter for accurate reporting (we'll assume it's accurate for now)
      await karmaService.createKarmaEvent(reporterId, 'REPORT_SPAM', itemId);

      // Check if this item has received multiple reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id')
        .eq('item_id', itemId)
        .eq('status', 'pending');

      // If 3 or more reports, flag the item and penalize the owner
      if (reports && reports.length >= 3) {
        await supabase
          .from('items')
          .update({ status: 'flagged' })
          .eq('id', itemId);

        // Penalize the item owner
        await karmaService.createKarmaEvent(item.user_id, 'GET_FLAGGED', itemId);
      }

      return { success: true };
    } catch (error) {
      console.error('[ReportingService] Error reporting item:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Report a user for ghosting (not responding to messages)
   */
  async reportGhosting(
    reporterId: string,
    ghostedUserId: string,
    itemId: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Prevent self-reporting
      if (reporterId === ghostedUserId) {
        return { success: false, error: 'You cannot report yourself' };
      }

      // Check if there are actually messages between these users for this item
      const { data: messages } = await supabase
        .from('messages')
        .select('id, sent_at')
        .eq('item_id', itemId)
        .or(`and(sender_id.eq.${reporterId},receiver_id.eq.${ghostedUserId}),and(sender_id.eq.${ghostedUserId},receiver_id.eq.${reporterId})`)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (!messages || messages.length === 0) {
        return { success: false, error: 'No conversation found for this item' };
      }

      // Check if the last message was sent more than 48 hours ago
      const lastMessage = messages[0];
      const lastMessageTime = new Date(lastMessage.sent_at);
      const now = new Date();
      const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastMessage < 48) {
        return { success: false, error: 'Must wait 48 hours before reporting ghosting' };
      }

      // Check if user has already reported ghosting for this item
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('reported_user_id', ghostedUserId)
        .eq('item_id', itemId)
        .eq('report_type', 'ghosting')
        .single();

      if (existingReport) {
        return { success: false, error: 'You have already reported ghosting for this item' };
      }

      // Create the ghosting report
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: ghostedUserId,
          item_id: itemId,
          report_type: 'ghosting',
          description,
          status: 'pending'
        });

      if (reportError) {
        console.error('[ReportingService] Error creating ghosting report:', reportError);
        return { success: false, error: 'Failed to submit report' };
      }

      // Penalize the ghosted user
      await karmaService.createKarmaEvent(ghostedUserId, 'GHOST_REQUEST', itemId);

      return { success: true };
    } catch (error) {
      console.error('[ReportingService] Error reporting ghosting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get reports for moderation
   */
  async getReports(
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' = 'pending',
    limit: number = 50
  ): Promise<{ success: boolean; reports?: Report[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reporter_id(id, full_name),
          reported_user:users!reported_user_id(id, full_name),
          item:items(id, title, status)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ReportingService] Error fetching reports:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reports: data || [] };
    } catch (error) {
      console.error('[ReportingService] Error fetching reports:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update report status (for moderation)
   */
  async updateReportStatus(
    reportId: string,
    status: 'reviewed' | 'resolved' | 'dismissed'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) {
        console.error('[ReportingService] Error updating report status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[ReportingService] Error updating report status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if user can report ghosting for an item
   */
  async canReportGhosting(
    reporterId: string,
    otherUserId: string,
    itemId: string
  ): Promise<{ canReport: boolean; reason?: string }> {
    try {
      // Check if there are messages between these users
      const { data: messages } = await supabase
        .from('messages')
        .select('id, sent_at, sender_id')
        .eq('item_id', itemId)
        .or(`and(sender_id.eq.${reporterId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${reporterId})`)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (!messages || messages.length === 0) {
        return { canReport: false, reason: 'No conversation found' };
      }

      const lastMessage = messages[0];
      const lastMessageTime = new Date(lastMessage.sent_at);
      const now = new Date();
      const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastMessage < 48) {
        return { 
          canReport: false, 
          reason: `Must wait ${Math.ceil(48 - hoursSinceLastMessage)} more hours` 
        };
      }

      // Check if the last message was sent by the reporter (they're waiting for a response)
      if (lastMessage.sender_id !== reporterId) {
        return { 
          canReport: false, 
          reason: 'The other user was the last to message' 
        };
      }

      return { canReport: true };
    } catch (error) {
      console.error('[ReportingService] Error checking ghosting eligibility:', error);
      return { canReport: false, reason: 'Error checking eligibility' };
    }
  }
}

export const reportingService = new ReportingService();
