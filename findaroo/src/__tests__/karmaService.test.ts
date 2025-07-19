import { karmaService, KARMA_ACTIONS } from '../services/karmaService';
import { supabase } from '../services/supabaseClient';

// Mock Supabase
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

describe('KarmaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createKarmaEvent', () => {
    it('should create a karma event successfully', async () => {
      const mockKarmaEvent = {
        id: 'test-id',
        user_id: 'user-123',
        action: 'return_success',
        points: 10,
        item_id: 'item-123',
        created_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockKarmaEvent, error: null }),
        })),
      }));

      const mockUpdate = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }));

      const mockSelect = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ 
          data: [{ points: 10 }, { points: 5 }], 
          error: null 
        }),
      }));

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'karma_events') {
          return { insert: mockInsert };
        }
        if (table === 'users') {
          return { update: mockUpdate };
        }
        return { select: mockSelect };
      });

      const result = await karmaService.createKarmaEvent('user-123', 'RETURN_SUCCESS', 'item-123');

      expect(result.success).toBe(true);
      expect(result.karmaEvent).toEqual(mockKarmaEvent);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        action: 'return_success',
        points: 10,
        item_id: 'item-123',
      });
    });

    it('should handle karma event creation errors', async () => {
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        })),
      }));

      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await karmaService.createKarmaEvent('user-123', 'RETURN_SUCCESS');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateUserKarmaPoints', () => {
    it('should calculate and update user karma points correctly', async () => {
      const mockKarmaEvents = [
        { points: 10 },
        { points: 5 },
        { points: -3 },
        { points: 1 },
      ];

      const mockSelect = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ 
          data: mockKarmaEvents, 
          error: null 
        }),
      }));

      const mockUpdate = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }));

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'karma_events') {
          return { select: mockSelect };
        }
        return { update: mockUpdate };
      });

      const result = await karmaService.updateUserKarmaPoints('user-123');

      expect(result.success).toBe(true);
      expect(result.totalPoints).toBe(13); // 10 + 5 - 3 + 1
      expect(mockUpdate).toHaveBeenCalledWith({ karma_points: 13 });
    });
  });

  describe('getUserKarmaHistory', () => {
    it('should fetch user karma history successfully', async () => {
      const mockKarmaHistory = [
        {
          id: 'event-1',
          user_id: 'user-123',
          action: 'return_success',
          points: 10,
          item_id: 'item-123',
          created_at: new Date().toISOString(),
          items: { id: 'item-123', title: 'Lost Keys', status: 'returned' },
        },
      ];

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({ 
              data: mockKarmaHistory, 
              error: null 
            }),
          })),
        })),
      }));

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await karmaService.getUserKarmaHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.karmaEvents).toEqual(mockKarmaHistory);
    });
  });

  describe('getUserKarmaStats', () => {
    it('should calculate karma statistics correctly', async () => {
      const mockKarmaEvents = [
        { action: 'return_success', points: 10 },
        { action: 'send_tip', points: 5 },
        { action: 'ghost_request', points: -5 },
        { action: 'return_success', points: 10 },
        { action: 'report_spam', points: 1 },
      ];

      const mockSelect = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ 
          data: mockKarmaEvents, 
          error: null 
        }),
      }));

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await karmaService.getUserKarmaStats('user-123');

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        totalPoints: 21, // 10 + 5 - 5 + 10 + 1
        positiveEvents: 4,
        negativeEvents: 1,
        returnsCompleted: 2,
        tipsSent: 1,
        reportsSubmitted: 1,
      });
    });
  });

  describe('checkTrustedReturnerStatus', () => {
    it('should return true for trusted returner with 3+ returns', async () => {
      const mockReturns = [
        { id: 'return-1' },
        { id: 'return-2' },
        { id: 'return-3' },
      ];

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ 
            data: mockReturns, 
            error: null 
          }),
        })),
      }));

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await karmaService.checkTrustedReturnerStatus('user-123');

      expect(result.success).toBe(true);
      expect(result.isTrustedReturner).toBe(true);
      expect(result.returnsCompleted).toBe(3);
    });

    it('should return false for user with less than 3 returns', async () => {
      const mockReturns = [
        { id: 'return-1' },
        { id: 'return-2' },
      ];

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ 
            data: mockReturns, 
            error: null 
          }),
        })),
      }));

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await karmaService.checkTrustedReturnerStatus('user-123');

      expect(result.success).toBe(true);
      expect(result.isTrustedReturner).toBe(false);
      expect(result.returnsCompleted).toBe(2);
    });
  });

  describe('getKarmaActionDescription', () => {
    it('should return correct descriptions for karma actions', () => {
      expect(karmaService.getKarmaActionDescription('return_success')).toBe('Successfully returned an item');
      expect(karmaService.getKarmaActionDescription('send_tip')).toBe('Sent a thank-you tip');
      expect(karmaService.getKarmaActionDescription('ghost_request')).toBe('Failed to respond to return request');
      expect(karmaService.getKarmaActionDescription('unknown_action')).toBe('Unknown Action');
    });
  });

  describe('getKarmaLevel', () => {
    it('should return correct karma levels based on points', () => {
      expect(karmaService.getKarmaLevel(150).level).toBe('Karma Master');
      expect(karmaService.getKarmaLevel(75).level).toBe('Trusted Helper');
      expect(karmaService.getKarmaLevel(35).level).toBe('Good Samaritan');
      expect(karmaService.getKarmaLevel(10).level).toBe('Helper');
      expect(karmaService.getKarmaLevel(2).level).toBe('Newcomer');
      expect(karmaService.getKarmaLevel(-5).level).toBe('Needs Improvement');
    });

    it('should return correct colors for karma levels', () => {
      expect(karmaService.getKarmaLevel(150).color).toBe('#8B5CF6');
      expect(karmaService.getKarmaLevel(75).color).toBe('#10B981');
      expect(karmaService.getKarmaLevel(35).color).toBe('#3B82F6');
      expect(karmaService.getKarmaLevel(10).color).toBe('#F59E0B');
      expect(karmaService.getKarmaLevel(2).color).toBe('#6B7280');
      expect(karmaService.getKarmaLevel(-5).color).toBe('#EF4444');
    });
  });

  describe('KARMA_ACTIONS', () => {
    it('should have correct point values for all actions', () => {
      expect(KARMA_ACTIONS.RETURN_SUCCESS.points).toBe(10);
      expect(KARMA_ACTIONS.SEND_TIP.points).toBe(5);
      expect(KARMA_ACTIONS.GHOST_REQUEST.points).toBe(-5);
      expect(KARMA_ACTIONS.KEEP_ITEM.points).toBe(-10);
      expect(KARMA_ACTIONS.GET_FLAGGED.points).toBe(-3);
      expect(KARMA_ACTIONS.REPORT_SPAM.points).toBe(1);
      expect(KARMA_ACTIONS.ITEM_POSTED.points).toBe(1);
      expect(KARMA_ACTIONS.FIRST_MESSAGE.points).toBe(1);
    });

    it('should have correct action names', () => {
      expect(KARMA_ACTIONS.RETURN_SUCCESS.action).toBe('return_success');
      expect(KARMA_ACTIONS.SEND_TIP.action).toBe('send_tip');
      expect(KARMA_ACTIONS.GHOST_REQUEST.action).toBe('ghost_request');
      expect(KARMA_ACTIONS.KEEP_ITEM.action).toBe('keep_item');
      expect(KARMA_ACTIONS.GET_FLAGGED.action).toBe('get_flagged');
      expect(KARMA_ACTIONS.REPORT_SPAM.action).toBe('report_spam');
      expect(KARMA_ACTIONS.ITEM_POSTED.action).toBe('item_posted');
      expect(KARMA_ACTIONS.FIRST_MESSAGE.action).toBe('first_message');
    });
  });
});
