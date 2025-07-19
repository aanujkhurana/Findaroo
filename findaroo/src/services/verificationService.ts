import { supabase } from './supabaseClient';
import * as SMS from 'expo-sms';
import { Alert } from 'react-native';

export interface VerificationRequest {
  id: string;
  user_id: string;
  verification_type: 'phone' | 'email' | 'identity';
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  documents: any[];
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  success: boolean;
  details: any;
  created_at: string;
}

class VerificationService {
  // Phone verification
  async sendPhoneVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with verification code
      const { error } = await supabase
        .from('users')
        .update({
          phone_verification_code: code,
          phone_verification_expires_at: expiresAt.toISOString(),
          last_verification_attempt: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // In production, you would send SMS via a service like Twilio
      // For now, we'll show the code in an alert (development only)
      if (__DEV__) {
        Alert.alert('Verification Code', `Your code is: ${code}\n(This is shown only in development)`);
      }

      await this.logSecurityAction('phone_verification_sent', { phone: phoneNumber });
      return { success: true };
    } catch (error: any) {
      console.error('Error sending phone verification:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyPhoneCode(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('phone_verification_code, phone_verification_expires_at')
        .eq('id', user.user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!userData.phone_verification_code) {
        return { success: false, error: 'No verification code found. Please request a new one.' };
      }

      if (new Date() > new Date(userData.phone_verification_expires_at)) {
        return { success: false, error: 'Verification code has expired. Please request a new one.' };
      }

      if (userData.phone_verification_code !== code) {
        await this.logSecurityAction('phone_verification_failed', { code_attempted: code });
        return { success: false, error: 'Invalid verification code.' };
      }

      // Mark phone as verified
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone_verified: true,
          phone_verification_code: null,
          phone_verification_expires_at: null
        })
        .eq('id', user.user.id);

      if (updateError) throw updateError;

      await this.logSecurityAction('phone_verified', { success: true });
      return { success: true };
    } catch (error: any) {
      console.error('Error verifying phone code:', error);
      return { success: false, error: error.message };
    }
  }

  // Email verification
  async resendEmailVerification(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: (await supabase.auth.getUser()).data.user?.email || ''
      });

      if (error) throw error;

      await this.logSecurityAction('email_verification_resent');
      return { success: true };
    } catch (error: any) {
      console.error('Error resending email verification:', error);
      return { success: false, error: error.message };
    }
  }

  // Identity verification
  async submitIdentityVerification(documents: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.user.id,
          verification_type: 'identity',
          documents: documents,
          status: 'pending'
        });

      if (error) throw error;

      // Update user verification status
      await supabase
        .from('users')
        .update({ verification_status: 'pending' })
        .eq('id', user.user.id);

      await this.logSecurityAction('identity_verification_submitted', { document_count: documents.length });
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting identity verification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get verification requests
  async getVerificationRequests(): Promise<VerificationRequest[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      return [];
    }
  }

  // Payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Security logging
  async logSecurityAction(action: string, details: any = {}): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('security_logs')
        .insert({
          user_id: user.user.id,
          action,
          details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging security action:', error);
    }
  }

  // Get security logs
  async getSecurityLogs(limit: number = 50): Promise<SecurityLog[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching security logs:', error);
      return [];
    }
  }
}

export const verificationService = new VerificationService();
