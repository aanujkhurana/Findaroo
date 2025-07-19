import { reportingService } from '../services/reportingService';
import { karmaService } from '../services/karmaService';
import { supabase } from '../services/supabaseClient';

// Mock dependencies
jest.mock('../services/supabaseClient');
jest.mock('../services/karmaService');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockKarmaService = karmaService as jest.Mocked<typeof karmaService>;

describe('ReportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportItem', () => {
    it('should successfully report an item', async () => {
      const mockItem = {
        user_id: 'item-owner-123',
        title: 'Test Item',
      };

      // Mock item fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
          }),
        }),
      } as any);

      // Mock existing report check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      // Mock report creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      // Mock karma service
      mockKarmaService.createKarmaEvent.mockResolvedValue({ success: true });

      // Mock reports count check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const result = await reportingService.reportItem(
        'reporter-123',
        'item-123',
        'spam',
        'This item looks fake'
      );

      expect(result.success).toBe(true);
      expect(mockKarmaService.createKarmaEvent).toHaveBeenCalledWith(
        'reporter-123',
        'REPORT_SPAM',
        'item-123'
      );
    });

    it('should prevent self-reporting', async () => {
      const mockItem = {
        user_id: 'user-123',
        title: 'Test Item',
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
          }),
        }),
      } as any);

      const result = await reportingService.reportItem(
        'user-123', // Same as item owner
        'item-123',
        'spam',
        'This item looks fake'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot report your own item');
    });

    it('should prevent duplicate reports', async () => {
      const mockItem = {
        user_id: 'item-owner-123',
        title: 'Test Item',
      };

      const mockExistingReport = {
        id: 'existing-report-123',
      };

      // Mock item fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
          }),
        }),
      } as any);

      // Mock existing report check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockExistingReport, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await reportingService.reportItem(
        'reporter-123',
        'item-123',
        'spam',
        'This item looks fake'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reported this item');
    });

    it('should flag item after 3 reports', async () => {
      const mockItem = {
        user_id: 'item-owner-123',
        title: 'Test Item',
      };

      const mockReports = [
        { id: 'report-1' },
        { id: 'report-2' },
        { id: 'report-3' },
      ];

      // Mock item fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
          }),
        }),
      } as any);

      // Mock existing report check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      // Mock report creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      // Mock karma service
      mockKarmaService.createKarmaEvent.mockResolvedValue({ success: true });

      // Mock reports count check (3 reports)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockReports, error: null }),
          }),
        }),
      } as any);

      // Mock item update to flagged
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const result = await reportingService.reportItem(
        'reporter-123',
        'item-123',
        'spam',
        'This item looks fake'
      );

      expect(result.success).toBe(true);
      expect(mockKarmaService.createKarmaEvent).toHaveBeenCalledWith(
        'item-owner-123',
        'GET_FLAGGED',
        'item-123'
      );
    });
  });

  describe('reportGhosting', () => {
    it('should successfully report ghosting', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          sender_id: 'reporter-123',
        },
      ];

      // Mock messages check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock existing report check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock report creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      // Mock karma service
      mockKarmaService.createKarmaEvent.mockResolvedValue({ success: true });

      const result = await reportingService.reportGhosting(
        'reporter-123',
        'ghosted-user-123',
        'item-123',
        'User stopped responding after initial contact'
      );

      expect(result.success).toBe(true);
      expect(mockKarmaService.createKarmaEvent).toHaveBeenCalledWith(
        'ghosted-user-123',
        'GHOST_REQUEST',
        'item-123'
      );
    });

    it('should prevent reporting ghosting too early', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          sender_id: 'reporter-123',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await reportingService.reportGhosting(
        'reporter-123',
        'ghosted-user-123',
        'item-123',
        'User stopped responding'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must wait 48 hours before reporting ghosting');
    });
  });

  describe('canReportGhosting', () => {
    it('should return true when ghosting can be reported', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          sender_id: 'reporter-123',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await reportingService.canReportGhosting(
        'reporter-123',
        'other-user-123',
        'item-123'
      );

      expect(result.canReport).toBe(true);
    });

    it('should return false when no conversation exists', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await reportingService.canReportGhosting(
        'reporter-123',
        'other-user-123',
        'item-123'
      );

      expect(result.canReport).toBe(false);
      expect(result.reason).toBe('No conversation found');
    });
  });
});
