'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPasswordRequirements } from '@circle/shared';
import { useLanguageStore } from '../../stores/language.store';

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showMatch?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword,
  showMatch = false,
}) => {
  const t = useLanguageStore((s) => s.t);
  const reqs = checkPasswordRequirements(password);

  if (!password) {
    return null;
  }

  // Count criteria passed
  const criteria = [
    { key: 'minLength', label: t.validation.passwordMinLength, valid: reqs.minLength },
    { key: 'hasUpper', label: t.validation.passwordUppercase, valid: reqs.hasUpper },
    { key: 'hasLower', label: t.validation.passwordLowercase, valid: reqs.hasLower },
    { key: 'hasNumber', label: t.validation.passwordNumber, valid: reqs.hasNumber },
    { key: 'hasSpecial', label: t.validation.passwordSpecialChar, valid: reqs.hasSpecial },
  ];

  const passedCount = criteria.filter((c) => c.valid).length;

  let strengthLabel = t.auth.passwordWeak;
  let strengthColor = 'bg-circle-coral';
  let strengthTextColor = 'text-circle-coral';
  let barsActive = 1;

  if (passedCount >= 5) {
    strengthLabel = t.auth.passwordStrong;
    strengthColor = 'bg-circle-sage';
    strengthTextColor = 'text-circle-sage';
    barsActive = 4;
  } else if (passedCount >= 4) {
    strengthLabel = t.auth.passwordMedium;
    strengthColor = 'bg-amber-500';
    strengthTextColor = 'text-amber-500';
    barsActive = 3;
  } else if (passedCount >= 2) {
    strengthLabel = t.auth.passwordWeak;
    strengthColor = 'bg-amber-400';
    strengthTextColor = 'text-amber-400';
    barsActive = 2;
  }

  const isMatch = Boolean(confirmPassword && password === confirmPassword);

  return (
    <div className="mt-2 space-y-2 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3 text-xs animate-fadeIn">
      {/* Strength Header & Progress Bars */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-circle-slate dark:text-circle-dark-muted">
          {t.auth.passwordStrength}:{' '}
          <span className={`font-bold ${strengthTextColor}`}>{strengthLabel}</span>
        </span>
        <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
          {passedCount}/5
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 py-0.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step <= barsActive
                ? strengthColor
                : 'bg-circle-hairline dark:bg-circle-dark-hairline'
            }`}
          />
        ))}
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <div
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${
                item.valid
                  ? 'bg-circle-sage/20 text-circle-sage'
                  : 'bg-circle-slate/10 text-circle-slate/50 dark:text-circle-dark-muted/50'
              }`}
            >
              {item.valid ? (
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </div>
            <span
              className={`text-[11px] transition-colors ${
                item.valid
                  ? 'text-circle-charcoal dark:text-circle-dark-text font-medium'
                  : 'text-circle-slate/70 dark:text-circle-dark-muted/70'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Password match check (if active) */}
      {showMatch && confirmPassword !== undefined && confirmPassword.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 pt-2 mt-1">
          <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
              isMatch
                ? 'bg-circle-sage/20 text-circle-sage'
                : 'bg-circle-coral/20 text-circle-coral'
            }`}
          >
            {isMatch ? (
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            ) : (
              <X className="h-2.5 w-2.5 stroke-[3]" />
            )}
          </div>
          <span
            className={`text-[11px] font-medium ${
              isMatch ? 'text-circle-sage' : 'text-circle-coral'
            }`}
          >
            {isMatch ? t.auth.passwordMatch : t.auth.passwordMismatch}
          </span>
        </div>
      )}
    </div>
  );
};
