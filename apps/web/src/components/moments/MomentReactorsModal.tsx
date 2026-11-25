'use client';

import React from 'react';
import { MomentEntity } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { ReactionListModal } from '../ui/ReactionListModal';

interface MomentReactorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: MomentEntity | null;
}

export const MomentReactorsModal: React.FC<MomentReactorsModalProps> = ({
  isOpen,
  onClose,
  moment,
}) => {
  const t = useLanguageStore((s) => s.t);

  return (
    <ReactionListModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.moments?.reactionsHeader}
      reactions={moment?.reactions || []}
    />
  );
};
