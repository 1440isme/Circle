import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PasswordRecoveryWizard } from '../../src/components/auth/PasswordRecoveryWizard';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <PasswordRecoveryWizard
      initialEmail={email || ''}
      initialStep={email ? 2 : 1}
    />
  );
}
