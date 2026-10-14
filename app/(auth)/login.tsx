import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { HimaButton } from '@/components/ui/HimaButton';
import { HimaInput } from '@/components/ui/HimaInput';
import { Mascot } from '@/components/ui/Mascot';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { usePlanStore } from '@/stores/plan';
import { useSessionStore } from '@/stores/session';
import { colors, font, layout, lineHeight } from '@/theme';
import { validateEmail, validatePassword } from '@/utils/validation';

type Mode = 'logIn' | 'signUp';

const MODES = [
  { value: 'logIn', label: 'Log in' },
  { value: 'signUp', label: 'Sign up' },
] as const;

/** Sign-up isn't drawn in the design; it reuses this screen with its own title and button. */
const COPY: Record<Mode, { title: string; subtitle: string; action: string; busy: string }> = {
  logIn: {
    title: 'Welcome back',
    subtitle: "Log in to see what's safe to spend today.",
    action: 'Log in',
    busy: 'Logging in…',
  },
  signUp: {
    title: 'Create your account',
    subtitle: "Sign up to see what's safe to spend today.",
    action: 'Sign up',
    busy: 'Signing up…',
  },
};

/** 02 Log in, with the 02b validation-error state. */
export default function LoginScreen() {
  const logIn = useSessionStore((s) => s.logIn);
  const signUp = useSessionStore((s) => s.signUp);
  const passwordRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<Mode>('logIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  const submit = async () => {
    const next = { email: validateEmail(email), password: validatePassword(password, mode) };
    setErrors(next);
    const firstError = next.email ?? next.password;
    if (firstError) {
      AccessibilityInfo.announceForAccessibility(firstError);
      return;
    }
    setSubmitting(true);
    try {
      await (mode === 'logIn' ? logIn : signUp)(email, password);
      const userId = useSessionStore.getState().session?.user.id;
      const hasPlan = userId != null && usePlanStore.getState().plans[userId] != null;
      router.replace(hasPlan ? '/home' : '/allowance');
    } catch {
      setErrors({ password: "Couldn't reach Hima. Check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footer}>
      <HimaButton
        label={submitting ? copy.busy : copy.action}
        loading={submitting}
        onPress={submit}
        testID="login-submit"
      />
      {mode === 'logIn' && (
        <Text style={styles.note}>New here? Sign up takes about two minutes, then Hima builds your first weekly plan.</Text>
      )}
    </View>
  );

  return (
    <Screen background="white" footer={footer}>
      <View style={styles.main}>
        <View style={styles.intro}>
          <View style={styles.introText}>
            <Text style={styles.title} accessibilityRole="header">
              {copy.title}
            </Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <Mascot pose="wave" height={112} style={styles.mascot} />
        </View>

        <SegmentedControl
          options={MODES}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setErrors({});
          }}
          accessibilityLabel="Log in or sign up"
          style={styles.modes}
        />

        <View style={styles.form}>
          <HimaInput
            label="Email"
            size="lg"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
            testID="login-email"
          />
          <HimaInput
            ref={passwordRef}
            label="Password"
            size="lg"
            password
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === 'logIn' ? 'current-password' : 'new-password'}
            textContentType={mode === 'logIn' ? 'password' : 'newPassword'}
            returnKeyType="go"
            onSubmitEditing={submit}
            testID="login-password"
          />
          {mode === 'logIn' && (
            <Pressable
              onPress={() =>
                Alert.alert('Forgot password', 'Password reset is not available in this demo yet.')
              }
              accessibilityRole="link"
              style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: {
    paddingTop: 40,
    paddingHorizontal: layout.screenPadding,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  introText: {
    flexShrink: 1,
  },
  title: {
    fontFamily: font.jakarta[800],
    fontSize: 28,
    lineHeight: lineHeight(28, 1.2),
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textSecondary,
  },
  mascot: {
    marginRight: -6,
  },
  modes: {
    marginTop: 24,
  },
  form: {
    gap: 16,
    marginTop: 24,
  },
  forgot: {
    alignSelf: 'flex-end',
    minHeight: layout.minTouch,
    marginTop: -8,
    justifyContent: 'center',
  },
  forgotText: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.deepSkyBlue,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 28,
    gap: 14,
  },
  note: {
    fontFamily: font.inter[400],
    fontSize: 12,
    lineHeight: lineHeight(12, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
