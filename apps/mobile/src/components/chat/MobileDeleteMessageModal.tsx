import React from 'react';
import { Trash2, User, Users } from 'lucide-react-native';
import {
  MobileActionChoiceModal,
  MobileActionChoiceOption,
} from '../ui/MobileActionChoiceModal';

interface MobileDeleteMessageModalProps {
  visible: boolean;
  onClose: () => void;
  canRecallForEveryone: boolean;
  onDeleteForMe: () => void;
  onRecallEveryone: () => void;
  colors: any;
  t: any;
  isDark?: boolean;
}

export const MobileDeleteMessageModal: React.FC<MobileDeleteMessageModalProps> = ({
  visible,
  onClose,
  canRecallForEveryone,
  onDeleteForMe,
  onRecallEveryone,
  colors,
  t,
  isDark = false,
}) => {
  const options: MobileActionChoiceOption[] = [
    {
      id: 'FOR_ME',
      title: t.chat.deleteMessageForMeTitle,
      description: t.chat.deleteMessageForMeDesc,
      icon: <User size={16} color={colors.primary} />,
      isDefault: true,
      variant: 'default',
    },
  ];

  if (canRecallForEveryone) {
    options.push({
      id: 'EVERYONE',
      title: t.chat.unsendEveryoneTitle,
      description: t.chat.unsendEveryoneDesc,
      icon: <Users size={16} color="#EF4444" />,
      variant: 'danger',
    });
  }

  return (
    <MobileActionChoiceModal
      visible={visible}
      onClose={onClose}
      title={t.chat.deleteMessageModalTitle}
      icon={<Trash2 size={18} color="#EF4444" />}
      options={options}
      defaultSelectedId="FOR_ME"
      confirmLabel={t.common.confirm}
      cancelLabel={t.common.cancel}
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
      colors={colors}
      isDark={isDark}
      t={t}
    />
  );
};
