import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { AssistantView } from '@/components/ai/AssistantView';
import { useBudget } from '@/hooks/useBudget';
import { PROMPT_SUGGESTIONS } from '@/services/ai';
import { useAssistantStore } from '@/stores/assistant';
import { usePlanStore } from '@/stores/plan';

/** 10 Hima AI. Answers use wallet calculations; plan changes need an explicit Approve. */
export default function AssistantScreen() {
  const budget = useBudget();
  const { ask: askParam } = useLocalSearchParams<{ ask?: string }>();
  const { messages, status, ask, retry, resolveSuggestion } = useAssistantStore(
    useShallow((s) => ({ messages: s.messages, status: s.status, ask: s.ask, retry: s.retry, resolveSuggestion: s.resolveSuggestion })),
  );
  const applyAdjustment = usePlanStore((s) => s.applyAdjustment);
  const askedParam = useRef(false);

  // Opened from "See the numbers" / "Review suggestion": ask that question once.
  useEffect(() => {
    if (budget && askParam && !askedParam.current) {
      askedParam.current = true;
      ask(askParam, budget);
    }
  }, [budget, askParam, ask]);

  if (!budget) return null;

  return (
    <AssistantView
      status={status}
      messages={messages}
      prompts={PROMPT_SUGGESTIONS.filter((q) => !messages.some((m) => m.role === 'user' && m.text === q))}
      now={budget.now}
      safeToSpend={budget.summary.safeToSpend}
      walletBalance={budget.walletBalance}
      greeting={`Hi ${budget.user.firstName}! Ask me about your budget. Any numbers I give come straight from your wallet.`}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      onAsk={(q) => ask(q, budget)}
      onRetry={() => retry(budget)}
      onApprove={(id) => {
        const m = messages.find((x) => x.id === id);
        if (!m?.suggestion) return;
        applyAdjustment(budget.user.id, m.suggestion.adjustment);
        resolveSuggestion(id, 'approved');
        AccessibilityInfo.announceForAccessibility('Approved. Your plan is updated.');
      }}
      onDismiss={(id) => resolveSuggestion(id, 'dismissed')}
    />
  );
}
