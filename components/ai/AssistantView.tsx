import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { webInputReset } from '@/components/ui/FieldFrame';
import { HimaButton } from '@/components/ui/HimaButton';
import { IconButton } from '@/components/ui/IconButton';
import { ArrowLeft, CloudOff, RefreshCw, Send, ShieldCheck, Sparkle } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import type { ChatMessage } from '@/stores/assistant';
import { colors, font, lineHeight, radius, shadow, tabular } from '@/theme';
import { formatActivityTime } from '@/utils/date';
import { formatPeso } from '@/utils/money';

import { AIChatBubble, ThinkingBubble, UserBubble } from './ChatBubbles';
import { AIRecommendationCard } from './AIRecommendationCard';
import { MascotAvatar } from './MascotAvatar';

type Props = {
  status: 'idle' | 'thinking' | 'offline';
  messages: ChatMessage[];
  prompts: string[];
  now: Date;
  /** Shown while offline: these come from the wallet, not the AI. */
  safeToSpend: number;
  walletBalance: number;
  onBack: () => void;
  onAsk: (question: string) => void;
  onRetry: () => void;
  onApprove: (messageId: string) => void;
  onDismiss: (messageId: string) => void;
  /** Greeting shown before the first question (not drawn in the design). */
  greeting: string;
};

/** 10 Hima AI chat and 10b offline fallback. */
export function AssistantView(p: Props) {
  const insets = useSafeAreaInsets();
  const offline = p.status === 'offline';
  const [draft, setDraft] = useState('');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [p.messages.length, p.status]);

  const send = (text: string) => {
    if (!text.trim() || p.status === 'thinking') return;
    p.onAsk(text);
    setDraft('');
  };

  const firstAt = p.messages[0]?.createdAt;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
        <IconButton icon={ArrowLeft} accessibilityLabel="Back" onPress={p.onBack} />
        <MascotAvatar size={40} ring={!offline} />
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">
              Hima AI
            </Text>
            {!offline && <Sparkle size={14} color={colors.ai} strokeWidth={2} />}
          </View>
          {offline ? (
            <View style={styles.offlineStatus} accessibilityLiveRegion="polite">
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>Powered by Groq · uses your wallet data</Text>
          )}
        </View>
      </View>

      {offline ? (
        <>
          <ScrollView style={styles.flex} contentContainerStyle={styles.offlineMain}>
            <View style={styles.offlineAvatar}>
              <MascotAvatar size={96} style={styles.offlineRing} />
              <View style={styles.offlineBadge}>
                <CloudOff size={18} color={colors.textSecondary} strokeWidth={2} />
              </View>
            </View>
            <Text style={styles.offlineTitle} accessibilityRole="header">
              Hima AI can&apos;t connect right now
            </Text>
            <Text style={styles.offlineBody}>
              Your money is fine. Balances and Safe-to-Spend come from your wallet, not the AI, so they&apos;re still up to date.
            </Text>
            <View style={styles.stillCard} accessibilityLabel="Still available">
              <View style={styles.stillTitle}>
                <ShieldCheck size={13} color={colors.safeText} strokeWidth={2.2} />
                <Text style={styles.stillTitleText}>Still up to date</Text>
              </View>
              <View style={[styles.stillRow, styles.stillDivider]}>
                <Text style={styles.stillLabel}>Safe-to-Spend this week</Text>
                <Text style={styles.stillValue}>{formatPeso(p.safeToSpend)}</Text>
              </View>
              <View style={styles.stillRow}>
                <Text style={styles.stillLabel}>Wallet balance</Text>
                <Text style={styles.stillValue}>{formatPeso(p.walletBalance)}</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.offlineActions}>
            <HimaButton label="Try again" variant="ai" icon={RefreshCw} iconSize={18} onPress={p.onRetry} />
            <HimaButton label="Back to Home" variant="text" size="compact" onPress={p.onBack} />
          </View>
        </>
      ) : (
        <>
          <ScrollView
            ref={scroll}
            style={styles.flex}
            contentContainerStyle={styles.conversation}
            accessibilityLabel="Conversation"
            keyboardShouldPersistTaps="handled">
            <Text style={styles.time}>{formatActivityTime(firstAt ? new Date(firstAt) : p.now, p.now)}</Text>
            {p.messages.length === 0 && <AIChatBubble text={p.greeting} />}
            {p.messages.map((m) =>
              m.role === 'user' ? (
                <UserBubble key={m.id} text={m.text} />
              ) : (
                <View key={m.id} style={styles.aiGroup}>
                  <AIChatBubble text={m.text} calculated={m.calculated} />
                  {m.suggestion && (
                    <AIRecommendationCard
                      suggestion={m.suggestion}
                      state={m.suggestionState ?? 'open'}
                      onApprove={() => p.onApprove(m.id)}
                      onDismiss={() => p.onDismiss(m.id)}
                    />
                  )}
                </View>
              ),
            )}
            {p.status === 'thinking' && <ThinkingBubble />}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptsScroll}
            contentContainerStyle={styles.prompts}
            keyboardShouldPersistTaps="handled">
            {p.prompts.map((q) => (
              <Pressable key={q} onPress={() => send(q)} accessibilityRole="button" style={({ pressed }) => [styles.prompt, pressed && styles.pressed]}>
                <Text style={styles.promptText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <View style={[styles.inputBar, { paddingBottom: 20 + insets.bottom }]}>
        <TextInput
          value={offline ? '' : draft}
          onChangeText={setDraft}
          editable={!offline}
          placeholder={offline ? 'Hima AI is unavailable' : 'Ask about your budget…'}
          placeholderTextColor={offline ? colors.textDisabled : colors.placeholder}
          accessibilityLabel="Ask Hima AI"
          returnKeyType="send"
          onSubmitEditing={() => send(draft)}
          style={[styles.input, offline && styles.inputOff, webInputReset]}
          selectionColor={colors.skyBlue}
          cursorColor={colors.navy}
          underlineColorAndroid="transparent"
          testID="assistant-input"
        />
        <Pressable
          onPress={() => send(draft)}
          disabled={offline || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: offline || !draft.trim() }}
          style={[styles.send, offline && styles.sendOff]}>
          <Send size={20} color={offline ? colors.textDisabled : colors.white} strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 1,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  offlineStatus: {
    // The design's inline-flex status sits in a 22 px line box under the title: 2 margin + 5.
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.textDisabled,
  },
  offlineText: {
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.textSecondary,
  },
  conversation: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
  },
  time: {
    textAlign: 'center',
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  aiGroup: {
    gap: 12,
  },
  promptsScroll: {
    flexGrow: 0,
  },
  prompts: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  prompt: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.aiBorderStrong,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.aiTint,
  },
  promptText: {
    fontFamily: font.jakarta[600],
    fontSize: 13,
    color: colors.aiText,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    fontFamily: font.inter[400],
    fontSize: 15,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  inputOff: {
    borderColor: colors.muted,
    backgroundColor: colors.muted,
    color: colors.textDisabled,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: {
    backgroundColor: colors.muted,
  },
  offlineMain: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  offlineAvatar: {
    width: 96,
    height: 96,
  },
  offlineRing: {
    boxShadow: shadow.tabBarHalo,
    overflow: 'visible',
  },
  offlineBadge: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTitle: {
    marginTop: 24,
    fontFamily: font.jakarta[700],
    fontSize: 22,
    lineHeight: lineHeight(22, 1.3),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  offlineBody: {
    marginTop: 8,
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stillCard: {
    alignSelf: 'stretch',
    marginTop: 20,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stillTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  stillTitleText: {
    fontFamily: font.inter[700],
    fontSize: 12,
    color: colors.safeText,
  },
  stillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 44,
  },
  stillDivider: {
    // Content-box in the design: 44 plus the 1 px divider.
    minHeight: 45,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  stillLabel: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
  stillValue: {
    fontFamily: font.jakarta[800],
    fontSize: 16,
    color: colors.textPrimary,
    ...tabular,
  },
  offlineActions: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
});
