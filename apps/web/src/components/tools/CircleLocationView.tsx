'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Radio,
  Clock,
  Compass,
  Square,
  Play,
  RotateCw,
  Users,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useLiveLocationsQuery,
  useStartLiveLocationMutation,
  useUpdateLiveLocationMutation,
  useStopLiveLocationMutation,
} from '../../hooks/use-circle-tools';
import { LiveLocationEntity } from '@circle/types';

interface CircleLocationViewProps {
  circleId: string;
}

export const CircleLocationView: React.FC<CircleLocationViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 15, 30, 60 mins
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  const {
    data: activeLocations = [],
    isLoading: isLoadingLocations,
    refetch,
  } = useLiveLocationsQuery(circleId);

  const startMutation = useStartLiveLocationMutation(circleId);
  const updateMutation = useUpdateLiveLocationMutation(circleId);
  const stopMutation = useStopLiveLocationMutation(circleId);

  // Check if current user is actively sharing
  const myActiveShare = activeLocations.find(
    (loc) => loc.member?.userId === user?.id || (loc as any).memberId === user?.id,
  );

  // Format remaining time in MM:SS
  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Hết hạn';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleStartSharing = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      // Fallback coordinate: Hồ Con Rùa, Sài Gòn
      startSharingWithCoords(10.7828, 106.6958);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startSharingWithCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Fallback default coordinates if permission denied or error
        startSharingWithCoords(10.7828, 106.6958);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const startSharingWithCoords = async (latitude: number, longitude: number) => {
    try {
      await startMutation.mutateAsync({
        latitude,
        longitude,
        shareDuration: selectedDuration,
      });
      setCurrentCoords({ lat: latitude, lng: longitude });
    } catch (err: any) {
      alert(err.message || 'Lỗi khi bắt đầu chia sẻ vị trí');
    } finally {
      setIsLocating(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      await stopMutation.mutateAsync();
      setCurrentCoords(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi dừng chia sẻ vị trí');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Top Header */}
      <div className="px-8 py-5 border-b border-gray-100 dark:border-circle-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Chia Sẻ Vị Trí Trực Tiếp (Live Location)
              {activeLocations.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                  {activeLocations.length} đang phát sóng
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chia sẻ tọa độ theo thời gian thực có hẹn giờ tự ngắt 15p, 30p, 1h (UC19)
            </p>
          </div>
        </div>

        {/* Sharing Controls */}
        <div className="flex items-center gap-3">
          {myActiveShare ? (
            <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Đang chia sẻ: {getRemainingTime(myActiveShare.expiresAt)}
                </span>
              </div>
              <button
                onClick={handleStopSharing}
                disabled={stopMutation.isPending}
                className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm"
              >
                Dừng chia sẻ
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Duration Select */}
              <div className="flex items-center bg-gray-100 dark:bg-circle-dark-surface p-1 rounded-xl border border-gray-200 dark:border-circle-dark-border text-xs font-semibold">
                {[15, 30, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      selectedDuration === d
                        ? 'bg-white dark:bg-circle-dark-bg text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {d} phút
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartSharing}
                disabled={isLocating || startMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm flex items-center gap-2"
              >
                {isLocating || startMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang bật GPS...
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" />
                    Bắt đầu chia sẻ vị trí
                  </>
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-circle-dark-border hover:bg-gray-50 dark:hover:bg-circle-dark-hover text-gray-500 transition-colors"
            title="Làm mới tọa độ"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Map Radar Canvas + Live Members List */}
      <div className="flex-1 flex overflow-hidden">
        {/* Radar Map Canvas Representation */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center overflow-hidden">
          {/* Radar Circles Pattern */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full border border-sky-500/20 animate-pulse" />
            <div className="w-[440px] h-[440px] rounded-full border border-sky-500/25 absolute" />
            <div className="w-[280px] h-[280px] rounded-full border border-sky-500/30 absolute" />
            <div className="w-[120px] h-[120px] rounded-full border border-sky-500/40 absolute flex items-center justify-center">
              <Compass className="w-8 h-8 text-sky-400/50" />
            </div>
            {/* Coordinate Crosshairs */}
            <div className="w-full h-px bg-sky-500/15 absolute" />
            <div className="h-full w-px bg-sky-500/15 absolute" />
          </div>

          {/* Active Members Markers on Digital Map */}
          {activeLocations.length === 0 ? (
            <div className="z-10 text-center p-6 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-sky-500/20 max-w-sm">
              <Navigation className="w-10 h-10 text-sky-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-base font-bold text-white mb-1">
                Chưa có ai đang chia sẻ vị trí
              </h3>
              <p className="text-xs text-sky-200/70 mb-4">
                Bật phát sóng vị trí để thành viên trong Vòng tròn có thể nhìn thấy điểm hẹn và khoảng cách tới bạn.
              </p>
              <button
                onClick={handleStartSharing}
                className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl transition-all shadow-lg"
              >
                Bật phát sóng ngay
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {activeLocations.map((loc, idx) => {
                const isMe = loc.member?.userId === user?.id;
                // Calculate radial layout offset for visual radar presentation
                const angle = (idx * (360 / activeLocations.length) * Math.PI) / 180;
                const radius = 100 + (idx % 2) * 50;
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;

                return (
                  <div
                    key={loc.id}
                    style={{
                      transform: `translate(${offsetX}px, ${offsetY}px)`,
                    }}
                    className="absolute flex flex-col items-center group cursor-pointer transition-all hover:scale-110 z-20"
                  >
                    {/* Member Avatar Pin */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-sky-400 bg-sky-900/90 shadow-[0_0_15px_rgba(56,189,248,0.5)] overflow-hidden flex items-center justify-center">
                        {loc.member?.user?.profile?.avatarUrl ? (
                          <img
                            src={loc.member.user.profile.avatarUrl}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {loc.member?.user?.profile?.displayName?.substring(0, 2).toUpperCase() ||
                              'US'}
                          </span>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    {/* Member Name & Coords Tooltip */}
                    <div className="mt-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-sky-400/30 text-center shadow-lg">
                      <div className="text-xs font-bold text-white whitespace-nowrap">
                        {loc.member?.user?.profile?.displayName || 'Thành viên'}
                        {isMe && ' (Tôi)'}
                      </div>
                      <div className="text-[10px] text-sky-300 font-mono">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </div>
                      <div className="text-[9px] text-amber-300 mt-0.5">
                        còn {getRemainingTime(loc.expiresAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Map Info Overlay Banner */}
          <div className="absolute bottom-6 left-6 z-10 bg-slate-900/80 backdrop-blur-md border border-sky-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs text-sky-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chỉ thành viên trong Vòng tròn mới có thể xem vị trí của bạn</span>
          </div>
        </div>

        {/* Right Sidebar: Active Members List */}
        <div className="w-80 border-l border-gray-100 dark:border-circle-dark-border bg-white dark:bg-circle-dark-surface flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-circle-dark-border flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Thành viên đang phát sóng ({activeLocations.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeLocations.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                Chưa có ai đang chia sẻ vị trí
              </div>
            ) : (
              activeLocations.map((loc) => {
                const isMe = loc.member?.userId === user?.id;
                return (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-2xl border border-gray-200 dark:border-circle-dark-border bg-gray-50/50 dark:bg-circle-dark-bg/50 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {loc.member?.user?.profile?.avatarUrl ? (
                        <img
                          src={loc.member.user.profile.avatarUrl}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        loc.member?.user?.profile?.displayName?.substring(0, 2).toUpperCase() || 'MB'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {loc.member?.user?.profile?.displayName || 'Thành viên'}
                          {isMe && ' (Tôi)'}
                        </span>
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Hết hạn trong {getRemainingTime(loc.expiresAt)}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 mt-2 transition-colors font-medium"
                      >
                        Mở Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
