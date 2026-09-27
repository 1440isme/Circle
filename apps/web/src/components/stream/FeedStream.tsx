'use client';

import React, { useState } from 'react';
import {
  Heart,
  Smile,
  Paperclip,
  Send,
  Image as ImageIcon,
  Sparkles,
  PhoneCall,
  Video,
  MoreHorizontal,
} from 'lucide-react';

export const FeedStream: React.FC = () => {
  const [message, setMessage] = useState('');

  return (
    <main className="flex-1 max-w-3xl flex flex-col gap-6 p-6 min-h-[calc(100vh-4rem)]">
      {/* Circle Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-circle-hairline bg-gradient-to-br from-circle-wash via-white to-circle-canvas p-6 shadow-circle-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-circle-hairline text-2xl">
              🍂
            </div>
            <div>
              <h2 className="text-xl font-bold text-circle-charcoal">Kỷ Niệm Mùa Thu 🍂</h2>
              <p className="text-sm text-circle-slate">
                Không gian lưu giữ những khoảnh khắc ấm áp và gắn kết của nhóm đồ án tốt nghiệp CIRCLE.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-circle-hairline bg-white text-circle-sage shadow-sm hover:bg-circle-wash transition-colors">
              <PhoneCall className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-circle-primary px-4 py-2 text-sm font-semibold text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white transition-all active:scale-98">
              <Video className="h-4 w-4" />
              <span>Phòng gọi nhóm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Card: "Điều muốn nói" (Anonymous Reflection Card) */}
      <div className="rounded-3xl border border-circle-peach/80 bg-circle-ivory p-6 shadow-circle-card relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-circle-peach">
            <Sparkles className="h-4 w-4 text-[#D97757]" />
            <span className="text-[#A35237]">Lời nhắn gửi ẩn danh đến vòng tròn</span>
          </div>
          <span className="text-xs text-circle-slate">15 phút trước</span>
        </div>
        <p className="text-base text-circle-charcoal font-normal leading-relaxed italic">
          &ldquo;Cảm ơn cả nhóm đã cùng nhau thức khuya làm đồ án trong tuần này. Dù có mệt nhưng thấy sản phẩm dần thành hình thật sự rất vui và tự hào. Cố lên nhé mọi người ơi! 🍵&rdquo;
        </p>
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-circle-peach/30">
          <span className="text-xs text-circle-slate">Người gửi ẩn danh</span>
          <div className="flex items-center gap-1.5 text-xs text-circle-slate">
            <button className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 hover:bg-white text-circle-charcoal transition-colors border border-circle-peach/40">
              <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
              <span>4</span>
            </button>
            <button className="rounded-full bg-white/80 p-1 hover:bg-white text-circle-slate border border-circle-peach/40">
              <Smile className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Group Feed & Discussion Thread */}
      <div className="flex flex-col gap-4">
        {/* Post item 1 */}
        <div className="rounded-2xl border border-circle-hairline bg-white p-5 shadow-circle-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-wash text-circle-sage font-bold text-sm">
                  NH
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-circle-primary animate-presence-breathe" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-circle-charcoal">Ninh Thị Mỹ Hạnh</h4>
                <p className="text-xs text-circle-slate">10:30 sáng nay</p>
              </div>
            </div>
            <button className="text-circle-slate hover:text-circle-charcoal">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-circle-charcoal leading-relaxed mb-4">
            Mình vừa cập nhật tài liệu phân công nhiệm vụ và Use Cases chi tiết của nhóm. Chiều nay 15h chúng mình họp nhanh qua WebRTC Call để chốt tiến độ Module 3 & 4 nhé! 📑✨
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-circle-hairline">
            <button className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-circle-slate hover:bg-circle-canvas transition-colors">
              <Heart className="h-3.5 w-3.5" />
              <span>Thích</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-circle-slate hover:bg-circle-canvas transition-colors">
              <Smile className="h-3.5 w-3.5" />
              <span>Phản hồi</span>
            </button>
          </div>
        </div>

        {/* Post item 2 */}
        <div className="rounded-2xl border border-circle-hairline bg-white p-5 shadow-circle-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-charcoal text-white font-bold text-sm">
                  TB
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-circle-primary animate-presence-breathe" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-circle-charcoal">Trương Công Bình</h4>
                <p className="text-xs text-circle-slate">09:15 sáng nay</p>
              </div>
            </div>
            <button className="text-circle-slate hover:text-circle-charcoal">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-circle-charcoal leading-relaxed mb-3">
            Đã đồng bộ xong toàn bộ hệ thống Design Tokens và giao diện mẫu từ Google Stitch và chuẩn Apple HIG vào dự án. Cả Web và Mobile đều đã có chung bảng màu thảo mộc và font Inter nhé!
          </p>
        </div>
      </div>

      {/* Sticky Bottom Message Composer (Pill Shape) */}
      <div className="sticky bottom-6 mt-auto">
        <div className="flex items-center gap-3 rounded-full border border-circle-hairline bg-white/90 p-2 shadow-circle-hover backdrop-blur-md">
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-circle-slate hover:bg-circle-canvas hover:text-circle-sage transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-circle-slate hover:bg-circle-canvas hover:text-circle-sage transition-colors">
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhắn tin cho nhóm Kỷ Niệm Mùa Thu..."
            className="flex-1 bg-transparent text-sm text-circle-charcoal placeholder:text-circle-slate focus:outline-none"
          />
          <button
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
              message.trim()
                ? 'bg-circle-primary text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white'
                : 'bg-circle-canvas text-circle-slate cursor-not-allowed'
            }`}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
};
