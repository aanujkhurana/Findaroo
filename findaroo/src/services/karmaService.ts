import { supabase } from './supabaseClient';
import { KarmaEvent } from '../types';

// Karma action types and their point values as per UserFlowReadme.md
export const KARMA_ACTIONS = {
  RETURN_SUCCESS: { action: 'return_success', points: 10 },
  SEND_TIP: { action: 'send_tip', points: 5 },
  GHOST_REQUEST: { action: 'ghost_request', points: -5 },
  KEEP_ITEM: { action: 'keep_item', points: -10 },
  GET_FLAGGED: { action: 'get_flagged', points: -3 },
  REPORT_SPAM: { action: 'report_spam', points: 1 },
  ITEM_POSTED: { action: 'item_posted', points: 1 },
  FIRST_MESSAGE: { action: 'first_message', points: 1 },
} as const;

export type KarmaActionType = keyof typeof KARMA_ACTIONS;

class KarmaService {
  /**
   * Create a karma event for a user
   */
  async createKarmaEvent(
    userId: string,
    actionType: KarmaActionType,
    itemId?: string
  ): Promise<{ success: boolean; karmaEvent?: KarmaEvent; error?: string }> {
    try {
      const karmaAction = KARMA_ACTIONS[actionType];
      
      console.log(`[KarmaService] Creating karma event: ${actionType} for user ${userId}`);
      
      const { data, error } = await supabase
        .from('karma_events')
        .insert({
          user_id: userId,
          action: karmaAction.action,
          points: karmaAction.points,
          item_id: itemId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[KarmaService] Error creating karma event:', error);
        return { success: false, error: error.message };
      }

      console.log(`[KarmaService] Karma event created successfully:`, data);
      
      // Update user's total karma points
      await this.updateUserKarmaPoints(userId);
      
      return { success: true, karmaEvent: data };
    } catch (err) {
      console.error('[KarmaService] Unexpected error creating karma event:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Calculate and update user's total karma points
   */
  async updateUserKarmaPoints(userId: string): Promise<{ success: boolean; totalPoints?: number; error?: string }> {
    try {
      // Calculate total karma points from karma_events
      const { data: karmaEvents, error: karmaError } = await supabase
        .from('karma_events')
        .select('points')
        .eq('user_id', userId);

      if (karmaError) {
        console.error('[KarmaService] Error fetching karma events:', karmaError);
        return { success: false, error: karmaError.message };
      }

      const totalPoints = karmaEvents?.reduce((sum, event) => sum + event.points, 0) || 0;
      
      // Update user's karma_points field
      const { error: updateError } = await supabase
        .from('users')
        .update({ karma_points: totalPoints })
        .eq('id', userId);

      if (updateError) {
        console.error('[KarmaService] Error updating user karma points:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`[KarmaService] Updated karma points for user ${userId}: ${totalPoints}`);
      return { success: true, totalPoints };
    } catch (err) {
      console.error('[KarmaService] Unexpected error updating karma points:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's karma history
   */
  async getUserKarmaHistory(
    userId: string, 
    limit: number = 50
  ): Promise<{ success: boolean; karmaEvents?: KarmaEvent[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('karma_events')
        .select(`
          id,
          user_id,
          action,
          points,
          item_id,
          created_at,
          items:item_id (
            id,
            title,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[KarmaService] Error fetching karma history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, karmaEvents: data || [] };
    } catch (err) {
      console.error('[KarmaService] Unexpected error fetching karma history:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's karma statistics
   */
  async getUserKarmaStats(userId: string): Promise<{
    success: boolean;
    stats?: {
      totalPoints: number;
      positiveEvents: number;
      negativeEvents: number;
      returnsCompleted: number;
      tipsSent: number;
      reportsSubmitted: number;
    };
    error?: string;
  }> {
    try {
      const { data: karmaEvents, error } = await supabase
        .from('karma_events')
        .select('action, points')
        .eq('user_id', userId);

      if (error) {
        console.error('[KarmaService] Error fetching karma stats:', error);
        return { success: false, error: error.message };
      }

      const events = karmaEvents || [];
      const stats = {
        totalPoints: events.reduce((sum, event) => sum + event.points, 0),
        positiveEvents: events.filter(event => event.points > 0).length,
        negativeEvents: events.filter(event => event.points < 0).length,
        returnsCompleted: events.filter(event => event.action === 'return_success').length,
        tipsSent: events.filter(event => event.action === 'send_tip').length,
        reportsSubmitted: events.filter(event => event.action === 'report_spam').length,
      };

      return { success: true, stats };
    } catch (err) {
      console.error('[KarmaService] Unexpected error fetching karma stats:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if user qualifies for trusted returner status
   */
  async checkTrustedReturnerStatus(userId: string): Promise<{
    success: boolean;
    isTrustedReturner?: boolean;
    returnsCompleted?: number;
    error?: string;
  }> {
    try {
      const { data: returns, error } = await supabase
        .from('karma_events')
        .select('id')
        .eq('user_id', userId)
        .eq('action', 'return_success');

      if (error) {
        console.error('[KarmaService] Error checking trusted returner status:', error);
        return { success: false, error: error.message };
      }

      const returnsCompleted = returns?.length || 0;
      const isTrustedReturner = returnsCompleted >= 3; // As per UserFlowReadme.md

      return { 
        success: true, 
        isTrustedReturner, 
        returnsCompleted 
      };
    } catch (err) {
      console.error('[KarmaService] Unexpected error checking trusted returner status:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get karma action description for display
   */
  getKarmaActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'return_success': 'Successfully returned an item',
      'send_tip': 'Sent a thank-you tip',
      'ghost_request': 'Failed to respond to return request',
      'keep_item': 'Kept item without returning',
      'get_flagged': 'Item was flagged by community',
      'report_spam': 'Reported spam/fake item',
      'item_posted': 'Posted a new item',
      'first_message': 'Started a conversation',
    };
    
    return descriptions[action] || action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get karma level based on points
   */
  getKarmaLevel(points: number): {
    level: string;
    color: string;
    icon: string;
    description: string;
  } {
    if (points >= 100) {
      return {
        level: 'Karma Master',
        color: '#8B5CF6',
        icon: 'crown',
        description: 'Community champion with exceptional karma'
      };
    } else if (points >= 50) {
      return {
        level: 'Trusted Helper',
        color: '#10B981',
        icon: 'shield-check',
        description: 'Reliable community member'
      };
    } else if (points >= 20) {
      return {
        level: 'Good Samaritan',
        color: '#3B82F6',
        icon: 'heart',
        description: 'Helpful community contributor'
      };
    } else if (points >= 5) {
      return {
        level: 'Helper',
        color: '#F59E0B',
        icon: 'star',
        description: 'Getting started with good deeds'
      };
    } else if (points >= 0) {
      return {
        level: 'Newcomer',
        color: '#6B7280',
        icon: 'user',
        description: 'New to the community'
      };
    } else {
      return {
        level: 'Needs Improvement',
        color: '#EF4444',
        icon: 'alert-triangle',
        description: 'Work on being more helpful'
      };
    }
  }
}

export const karmaService = new KarmaService();
