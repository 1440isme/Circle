import React from 'react';
import { PasswordRecoveryWizard } from '../../src/components/auth/PasswordRecoveryWizard';

export default function ForgotPasswordScreen() {
  return <PasswordRecoveryWizard initialStep={1} />;
}
