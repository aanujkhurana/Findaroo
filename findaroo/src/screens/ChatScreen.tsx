import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import { Message } from '../types';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

import { supabase } from '../services/supabaseClient';
import { reportingService } from '../services/reportingService';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      itemId: string;
      otherUserId: string;
      otherUserName: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { itemId, otherUserId, otherUserName } = route.params;

  console.log('[ChatScreen] Initialized with params:', { itemId, otherUserId, otherUserName });

  const { session } = useAuth();

  // Prevent users from chatting with themselves
  React.useEffect(() => {
    if (session?.user && session.user.id === otherUserId) {
      console.error('[ChatScreen] User trying to chat with themselves');
      Alert.alert(
        'Invalid Action',
        'You cannot send messages to yourself.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [session?.user, otherUserId, navigation]);
  const {
    messages,
    loading,
    error,
    sendMessage,
    markAllAsRead,
    isMessageRead,
    sendTip,
    updateItemStatus,
    connectionStatus
  } = useChat(itemId, otherUserId);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  // Remove useItems hook to prevent excessive calls
  const [item, setItem] = useState<any>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  // New state for enhanced features
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [sendingTip, setSendingTip] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'ghosting' | 'inappropriate' | 'spam'>('ghosting');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [canReportGhosting, setCanReportGhosting] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      // Hide the default navigation header
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchItem = async () => {
      setItemLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
      if (!error) setItem(data);
      setItemLoading(false);
    };
    fetchItem();
  }, [itemId]);

  // Check if user can report ghosting
  useEffect(() => {
    const checkGhostingEligibility = async () => {
      if (!session?.user?.id || !otherUserId || !itemId) return;

      const result = await reportingService.canReportGhosting(
        session.user.id,
        otherUserId,
        itemId
      );
      setCanReportGhosting(result.canReport);
    };

    checkGhostingEligibility();
  }, [session?.user?.id, otherUserId, itemId, messages]);

  const handleResolve = async () => {
    if (!item) return;
    setResolving(true);
    let newStatus = item.status;
    if (item.status === 'lost') {
      newStatus = 'returned';
    } else if (item.status === 'found') {
      newStatus = 'claimed';
    }

    // Use updateItemStatus from useChat hook instead
    const success = await updateItemStatus(item.id, newStatus);
    if (success) {
      setItem({ ...item, resolved: true, status: newStatus });
      Alert.alert('Success', `Item marked as resolved (${newStatus}).`);
    } else {
      Alert.alert('Error', 'Failed to mark item as resolved.');
    }
    setResolving(false);
  };

  // Enhanced status update function
  const handleStatusUpdate = async (newStatus: string) => {
    if (!item) return;

    setResolving(true);
    const success = await updateItemStatus(item.id, newStatus);

    if (success) {
      setItem({ ...item, status: newStatus, resolved: newStatus === 'returned' || newStatus === 'claimed' });
      setShowStatusModal(false);
      Alert.alert('Success', `Item status updated to ${newStatus}`);
    } else {
      Alert.alert('Error', 'Failed to update item status');
    }
    setResolving(false);
  };

  // Handle tip sending
  const handleSendTip = async () => {
    const amount = parseFloat(tipAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid tip amount');
      return;
    }

    if (!item || !otherUserId) {
      Alert.alert('Error', 'Unable to send tip at this time');
      return;
    }

    setSendingTip(true);
    const success = await sendTip(otherUserId, amount, item.id);

    if (success) {
      setShowTipModal(false);
      setTipAmount('');
      Alert.alert('Success', `Tip of $${amount} sent successfully!`);
    } else {
      Alert.alert('Error', 'Failed to send tip. Please try again.');
    }
    setSendingTip(false);
  };

  // Handle report submission
  const handleSubmitReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert('Error', 'Please provide a description for your report');
      return;
    }

    if (!session?.user?.id || !otherUserId || !itemId) {
      Alert.alert('Error', 'Unable to submit report at this time');
      return;
    }

    setSubmittingReport(true);

    try {
      let result;
      if (reportType === 'ghosting') {
        result = await reportingService.reportGhosting(
          session.user.id,
          otherUserId,
          itemId,
          reportDescription
        );
      } else {
        result = await reportingService.reportItem(
          session.user.id,
          itemId,
          reportType as 'spam' | 'inappropriate',
          reportDescription
        );
      }

      if (result.success) {
        setShowReportModal(false);
        setReportDescription('');
        Alert.alert('Success', 'Report submitted successfully. Thank you for helping keep our community safe.');
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }

    setSubmittingReport(false);
  };

  const scrollToBottom = React.useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);



  // Mark messages as read when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (messages.length > 0) {
        console.log('[ChatScreen] Screen focused, marking messages as read');
        markAllAsRead();
      }
    }, [messages.length, markAllAsRead])
  );

  const handleSendMessage = React.useCallback(async () => {
    if (!messageText.trim() || sending) return;

    console.log('[ChatScreen] Sending message:', messageText);
    setSending(true);
    try {
      const result = await sendMessage(messageText, otherUserId);
      console.log('[ChatScreen] Send message result:', result);
      if (result) {
        setMessageText('');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [messageText, sending, sendMessage, otherUserId]);

  const formatTime = React.useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = React.useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Message suggestions based on item status
  const getMessageSuggestions = React.useCallback(() => {
    if (!item) return [];

    const suggestions = [];

    if (item.status === 'lost') {
      suggestions.push(
        "Hi! I think I found your item. Can you describe it?",
        "I have something that matches your description. Where would you like to meet?",
        "Is this still missing? I might have found it."
      );
    } else if (item.status === 'found') {
      suggestions.push(
        "Hi! I think this might be mine. Can I provide more details?",
        "I lost something similar. Where did you find this?",
        "This looks like mine! When would be a good time to meet?"
      );
    }

    suggestions.push(
      "Thank you for helping!",
      "When would be a good time to meet?",
      "Can you provide more details?"
    );

    return suggestions;
  }, [item]);

  // Handle suggestion tap
  const handleSuggestionTap = (suggestion: string) => {
    setMessageText(suggestion);
  };

  const renderMessage = React.useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === session?.user?.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = !previousMessage ||
      new Date(item.sent_at).toDateString() !== new Date(previousMessage.sent_at).toDateString();

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.sent_at)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[
                styles.timeText,
                isMyMessage ? styles.myTimeText : styles.otherTimeText
              ]}>
                {formatTime(item.sent_at)}
              </Text>
              {isMyMessage && (
                <View style={styles.readReceiptContainer}>
                  <Feather
                    name={isMessageRead(item) ? "check-circle" : "check"}
                    size={14}
                    color={isMessageRead(item) ? "#000000" : "#9CA3AF"}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }, [session?.user?.id, messages, formatDate, formatTime, isMessageRead]);

  if (loading || itemLoading) {
    return <Loading message="Loading messages..." />;
  }

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>You need to be signed in to chat</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading messages: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={26} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{otherUserName}</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: connectionStatus === 'connected' ? '#33C48D' :
                               connectionStatus === 'connecting' ? '#FFA930' : '#FF4C4C' }
            ]} />
            <Text style={styles.connectionText}>
              {connectionStatus === 'connected' ? 'Online' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {item && !item.resolved && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => setShowStatusModal(true)}
            >
              <Feather name="edit-3" size={20} color="#000000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowTipModal(true)}
          >
            <Feather name="gift" size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowReportModal(true)}
          >
            <Feather name="flag" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {/* Call to Action: Mark as Resolved */}
        {!itemLoading && item && !item.resolved && (
          <View style={styles.callToActionContainer}>
            <Text style={styles.callToActionText}>Is this item resolved?</Text>
            <TouchableOpacity
              style={[
                styles.resolveButton,
                resolving && styles.resolveButtonDisabled
              ]}
              onPress={() => {
                Alert.alert(
                  'Confirm',
                  'Are you sure you want to mark this item as resolved?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', onPress: handleResolve },
                  ]
                );
              }}
              disabled={resolving}
            >
              {resolving ? (
                <Feather name="clock" size={20} color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.resolveButtonText}>
                {resolving ? 'Marking...' : 'Mark as Resolved'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => `message-${item.id}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />

        {/* Suggestion text when there are no messages */}
        {!loading && messages.length === 0 && item && (
          <View style={styles.suggestionContainer}>
            <Text style={styles.suggestionText}>
              {item.status === 'lost'
                ? 'Start the conversation to help reunite the owner with their lost item.'
                : item.status === 'found'
                ? 'Start the chat to help return this found item to its owner.'
                : 'Start the conversation!'}
            </Text>
          </View>
        )}

        {/* Message Suggestions - Only show when no messages exist */}
        {messages.length === 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick replies:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getMessageSuggestions().map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionTap(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <Feather name="clock" size={24} color="#fff" />
            ) : (
              <Feather name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Item Status</Text>
            <Text style={styles.modalSubtitle}>Current status: {item?.status}</Text>

            <View style={styles.statusOptions}>
              {item?.status === 'lost' && (
                <>
                  <TouchableOpacity
                    style={[styles.statusOption, styles.successOption]}
                    onPress={() => handleStatusUpdate('returned')}
                    disabled={resolving}
                  >
                    <Feather name="check-circle" size={20} color="#fff" />
                    <Text style={styles.statusOptionText}>Mark as Returned</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, styles.errorOption]}
                    onPress={() => handleStatusUpdate('flagged')}
                    disabled={resolving}
                  >
                    <Feather name="flag" size={20} color="#fff" />
                    <Text style={styles.statusOptionText}>Flag as Inappropriate</Text>
                  </TouchableOpacity>
                </>
              )}

              {item?.status === 'found' && (
                <>
                  <TouchableOpacity
                    style={[styles.statusOption, styles.successOption]}
                    onPress={() => handleStatusUpdate('claimed')}
                    disabled={resolving}
                  >
                    <Feather name="user-check" size={20} color="#fff" />
                    <Text style={styles.statusOptionText}>Mark as Claimed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, styles.warningOption]}
                    onPress={() => handleStatusUpdate('kept')}
                    disabled={resolving}
                  >
                    <Feather name="archive" size={20} color="#fff" />
                    <Text style={styles.statusOptionText}>Keep Item</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, styles.errorOption]}
                    onPress={() => handleStatusUpdate('flagged')}
                    disabled={resolving}
                  >
                    <Feather name="flag" size={20} color="#fff" />
                    <Text style={styles.statusOptionText}>Flag as Inappropriate</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tip Modal */}
      <Modal
        visible={showTipModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send a Tip</Text>
            <Text style={styles.modalSubtitle}>Show your appreciation to {otherUserName}</Text>

            <View style={styles.tipInputContainer}>
              <Text style={styles.tipLabel}>Amount (AUD)</Text>
              <View style={styles.tipAmountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.tipInput}
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  editable={!sendingTip}
                />
              </View>

              <View style={styles.quickTipAmounts}>
                {[5, 10, 20, 50].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickTipButton}
                    onPress={() => setTipAmount(amount.toString())}
                  >
                    <Text style={styles.quickTipText}>${amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTipModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSendButton, sendingTip && styles.modalSendButtonDisabled]}
                onPress={handleSendTip}
                disabled={sendingTip || !tipAmount}
              >
                {sendingTip ? (
                  <Feather name="clock" size={16} color="#fff" />
                ) : (
                  <Feather name="gift" size={16} color="#fff" />
                )}
                <Text style={styles.modalSendText}>
                  {sendingTip ? 'Sending...' : 'Send Tip'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <Text style={styles.modalSubtitle}>Help us keep the community safe</Text>

            <View style={styles.reportTypeContainer}>
              <Text style={styles.reportTypeLabel}>Report Type:</Text>
              <View style={styles.reportTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.reportTypeOption,
                    reportType === 'ghosting' && styles.reportTypeOptionActive,
                    !canReportGhosting && reportType === 'ghosting' && styles.reportTypeOptionDisabled
                  ]}
                  onPress={() => setReportType('ghosting')}
                  disabled={!canReportGhosting && reportType !== 'ghosting'}
                >
                  <Text style={[
                    styles.reportTypeOptionText,
                    reportType === 'ghosting' && styles.reportTypeOptionTextActive
                  ]}>
                    Ghosting
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reportTypeOption,
                    reportType === 'inappropriate' && styles.reportTypeOptionActive
                  ]}
                  onPress={() => setReportType('inappropriate')}
                >
                  <Text style={[
                    styles.reportTypeOptionText,
                    reportType === 'inappropriate' && styles.reportTypeOptionTextActive
                  ]}>
                    Inappropriate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reportTypeOption,
                    reportType === 'spam' && styles.reportTypeOptionActive
                  ]}
                  onPress={() => setReportType('spam')}
                >
                  <Text style={[
                    styles.reportTypeOptionText,
                    reportType === 'spam' && styles.reportTypeOptionTextActive
                  ]}>
                    Spam/Fake
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.reportDescriptionContainer}>
              <Text style={styles.reportDescriptionLabel}>Description:</Text>
              <TextInput
                style={styles.reportDescriptionInput}
                placeholder="Please describe the issue..."
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSendButton, submittingReport && styles.modalSendButtonDisabled]}
                onPress={handleSubmitReport}
                disabled={submittingReport || !reportDescription.trim()}
              >
                {submittingReport ? (
                  <Feather name="clock" size={16} color="#fff" />
                ) : (
                  <Feather name="flag" size={16} color="#fff" />
                )}
                <Text style={styles.modalSendText}>
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 11,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#2E2E2E', // Findaroo dark gray (black accent)
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1e293b',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  myTimeText: {
    color: '#fff',
  },
  otherTimeText: {
    color: '#64748b',
  },
  readReceiptContainer: {
    marginLeft: 4,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2E2E2E',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },

  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F2F2F2', // Findaroo neutral gray
    color: '#2E2E2E', // Findaroo dark gray
  },
  sendButton: {
    backgroundColor: '#2E2E2E', // Findaroo dark gray (black accent)
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  suggestionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  suggestionText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2E2E2E', // Findaroo dark gray (black accent)
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callToActionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F2F2F2', // Findaroo neutral gray
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  callToActionText: {
    color: '#2E2E2E', // Findaroo dark gray
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#33C48D', // Findaroo success green
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resolveButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  resolveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E2E2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  statusOptions: {
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  successOption: {
    backgroundColor: '#33C48D',
  },
  warningOption: {
    backgroundColor: '#FFA930',
  },
  errorOption: {
    backgroundColor: '#FF4C4C',
  },
  statusOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalCloseButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  // Tip modal styles
  tipInputContainer: {
    marginBottom: 24,
  },
  tipLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2E2E',
    marginBottom: 12,
  },
  tipAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2E2E',
    marginRight: 8,
  },
  tipInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2E2E',
  },
  quickTipAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickTipButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickTipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2E2E',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  modalSendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    paddingVertical: 16,
    borderRadius: 16,
    marginLeft: 8,
  },
  modalSendButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  modalSendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Report modal styles
  reportTypeContainer: {
    marginBottom: 20,
  },
  reportTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  reportTypeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  reportTypeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  reportTypeOptionActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  reportTypeOptionDisabled: {
    opacity: 0.5,
  },
  reportTypeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  reportTypeOptionTextActive: {
    color: '#fff',
  },
  reportDescriptionContainer: {
    marginBottom: 20,
  },
  reportDescriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  reportDescriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fff',
  },
});
