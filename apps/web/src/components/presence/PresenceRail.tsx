'use client';

import React from 'react';
import { Calendar, Users, Video, Clock } from 'lucide-react';

interface MemberProps {
  name: string;
  role: string;
  online: boolean;
  avatarBg: string;
  initials: string;
}

const MemberItem: React.FC<MemberProps> = ({ name, role, online, avatarBg, initials }) => (
  <div className="flex items-center justify-between rounded-xl p-2 hover:bg-circle-canvas transition-colors">
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${avatarBg}`}>
          {initials}
        </div>
        {online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-circle-primary animate-presence-breathe" />
        )}
      </div>
      <div>
        <h5 className="text-sm font-semibold text-circle-charcoal">{name}</h5>
        <p className="text-xs text-circle-slate">{role}</p>
      </div>
    </div>
  </div>
);

export const PresenceRail: React.FC = () => {
  return (
    <aside className="hidden xl:flex w-80 flex-col gap-6 border-l border-circle-hairline bg-white/50 p-5 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Quick Call Stage Launcher (Liquid Glass preview) */}
      <div className="rounded-2xl border border-circle-hairline bg-gradient-to-br from-circle-primary/10 to-circle-wash p-4 shadow-circle-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-circle-primary animate-presence-breathe" />
          <span className="text-xs font-semibold text-circle-sage uppercase tracking-wider">
            Phòng Thoại Đang Mở
          </span>
        </div>
        <h4 className="text-sm font-bold text-circle-charcoal mb-1">Kỷ Niệm Mùa Thu — Stage</h4>
        <p className="text-xs text-circle-slate mb-3">4 thành viên đang kết nối âm thanh</p>
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-circle-sage py-2 px-4 text-xs font-semibold text-white shadow-sm hover:bg-circle-charcoal transition-colors">
          <Video className="h-3.5 w-3.5" />
          <span>Tham gia cùng nhóm</span>
        </button>
      </div>

      {/* Online Group Members */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-circle-slate uppercase tracking-wider">
            <Users className="h-3.5 w-3.5" />
            <span>Thành viên trực tuyến (4)</span>
          </div>
        </div>
        <MemberItem
          name="Ninh Thị Mỹ Hạnh"
          role="Product & Business Lead"
          online={true}
          avatarBg="bg-circle-wash text-circle-sage"
          initials="NH"
        />
        <MemberItem
          name="Trương Công Bình"
          role="Technical & Realtime Lead"
          online={true}
          avatarBg="bg-circle-charcoal text-white"
          initials="TB"
        />
        <MemberItem
          name="Linh Trần"
          role="Thành viên nhóm"
          online={true}
          avatarBg="bg-circle-peach/30 text-amber-800"
          initials="LT"
        />
        <MemberItem
          name="Tuấn Anh"
          role="Thành viên nhóm"
          online={true}
          avatarBg="bg-emerald-100 text-emerald-800"
          initials="TA"
        />
      </div>

      {/* Upcoming Circle Events */}
      <div className="flex flex-col gap-2 pt-4 border-t border-circle-hairline">
        <div className="flex items-center gap-1.5 px-2 mb-1 text-xs font-semibold text-circle-slate uppercase tracking-wider">
          <Calendar className="h-3.5 w-3.5" />
          <span>Lịch hẹn sắp tới</span>
        </div>
        <div className="rounded-xl border border-circle-hairline bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-circle-sage mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Hôm nay · 15:00</span>
          </div>
          <h5 className="text-sm font-semibold text-circle-charcoal">Họp rà soát Use Case & API</h5>
          <p className="text-xs text-circle-slate mt-1">Chuẩn bị nội dung cho Module 3 và Module 4</p>
        </div>
      </div>
    </aside>
  );
};
