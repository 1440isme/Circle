'use client';

import React from 'react';
import { Trash2, User, Users } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { ActionChoiceModal, ActionChoiceOption } from '../ui/ActionChoiceModal';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  canRecallForEveryone: boolean;
  onDeleteForMe: () => void;
  onRecallEveryone: () => void;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  canRecallForEveryone,
  onDeleteForMe,
  onRecallEveryone,
}) => {
  const t = useLanguageStore((s) => s.t);

  const options: ActionChoiceOption[] = [
    {
      id: 'FOR_ME',
      title: t.chat.deleteMessageForMeTitle,
      description: t.chat.deleteMessageForMeDesc,
      icon: <User className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />,
      isDefault: true,
      variant: 'default',
    },
  ];

  if (canRecallForEveryone) {
    options.push({
      id: 'EVERYONE',
      title: t.chat.unsendEveryoneTitle,
      description: t.chat.unsendEveryoneDesc,
      icon: <Users className="h-4 w-4 text-rose-500 shrink-0" />,
      variant: 'danger',
    });
  }

  return (
    <ActionChoiceModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.chat.deleteMessageModalTitle}
      icon={<Trash2 className="h-5 w-5 text-rose-500 shrink-0" />}
      options={options}
      defaultSelectedId="FOR_ME"
      confirmLabel={t.chat.confirmBtn}
      confirmVariant="danger"
      warningText={(selectedId) =>
        selectedId === 'EVERYONE' ? t.chat.unsendEveryoneWarning : null
      }
      onConfirm={(selectedId) => {
        if (selectedId === 'EVERYONE' && canRecallForEveryone) {
          onRecallEveryone();
        } else {
          onDeleteForMe();
        }
        onClose();
      }}
    />
  );
};
