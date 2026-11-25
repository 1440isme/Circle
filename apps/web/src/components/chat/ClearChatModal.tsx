'use client';

import React from 'react';
import { Trash2, User, Users } from 'lucide-react';
import { ClearChatMode } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { ActionChoiceModal, ActionChoiceOption } from '../ui/ActionChoiceModal';

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: ClearChatMode) => Promise<void>;
  isLoading?: boolean;
}

export const ClearChatModal: React.FC<ClearChatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const t = useLanguageStore((s) => s.t);

  const options: ActionChoiceOption[] = [
    {
      id: 'FOR_ME',
      title: t.chat.clearChatForMeTitle,
      description: t.chat.clearChatForMeDesc,
      icon: <User className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />,
      isDefault: true,
      variant: 'default',
    },
    {
      id: 'EVERYONE',
      title: t.chat.clearChatEveryoneTitle,
      description: t.chat.clearChatEveryoneDesc,
      icon: <Users className="h-4 w-4 text-rose-500 shrink-0" />,
      variant: 'danger',
    },
  ];

  return (
    <ActionChoiceModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.chat.clearChatModalTitle}
      icon={<Trash2 className="h-5 w-5 text-rose-500 shrink-0" />}
      options={options}
      defaultSelectedId="FOR_ME"
      confirmLabel={t.chat.clearChatAction}
      confirmVariant="danger"
      warningText={(selectedId) =>
        selectedId === 'EVERYONE' ? t.chat.clearChatIrreversibleWarning : null
      }
      onConfirm={async (selectedId) => {
        await onConfirm(selectedId as ClearChatMode);
      }}
      isLoading={isLoading}
    />
  );
};
