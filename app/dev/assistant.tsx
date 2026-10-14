import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantView } from '@/components/ai/AssistantView';
import { useBudget } from '@/hooks/useBudget';
import { answerFor, PROMPT_SUGGESTIONS } from '@/services/ai';
import type { ChatMessage } from '@/stores/assistant';

const noop = () => {};

/** Dev-only: 10 Hima AI with the design's conversation, and 10b offline. Answers come from the real AI service. */
export default function AssistantPreview() {
  const { state = 'chat' } = useLocalSearchParams<{ state?: string }>();
  const budget = useBudget();
  if (!__DEV__) return <Redirect href="/" />;
  if (!budget) return null;

  const question = 'Can I afford ₱150 today?';
  const answer = answerFor(question, budget);
  const suggestion = answerFor('Can you improve my weekly budget?', budget).suggestion;
  const at = budget.now.toISOString();
  const messages: ChatMessage[] = [
    { id: 'q', role: 'user', text: question, createdAt: at },
    {
      id: 'a',
      role: 'ai',
      text: answer.text,
      calculated: answer.calculated,
      suggestion,
      suggestionState: 'open',
      createdAt: at,
    },
  ];

  return (
    <AssistantView
      status={state === 'offline' ? 'offline' : 'idle'}
      messages={messages}
      prompts={PROMPT_SUGGESTIONS.filter((q) => q !== question)}
      now={budget.now}
      safeToSpend={budget.summary.safeToSpend}
      walletBalance={budget.walletBalance}
      greeting=""
      onBack={noop}
      onAsk={noop}
      onRetry={noop}
      onApprove={noop}
      onDismiss={noop}
    />
  );
}
