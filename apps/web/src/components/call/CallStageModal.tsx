'use client';

import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useIceServersQuery, useLeaveCallMutation } from '../../hooks/use-call-queries';
import { useWebRTCCall } from '../../hooks/use-webrtc-call';
import { CallType, CallSessionDetailEntity } from '@circle/types';

interface CallStageModalProps {
  callSession: CallSessionDetailEntity;
  isOpen: boolean;
  onClose: () => void;
}

export const CallStageModal: React.FC<CallStageModalProps> = ({
  callSession,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const { data: iceServers = [] } = useIceServersQuery();
  const leaveCallMutation = useLeaveCallMutation();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoDisabled,
    isConnected,
    error,
    toggleAudio,
    toggleVideo,
  } = useWebRTCCall({
    callSessionId: isOpen ? callSession.id : null,
    callType: callSession.callType,
    currentUserId: user?.id || '',
    iceServers,
    onCallEnded: onClose,
  });

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoDisabled]);

  if (!isOpen) return null;

  const handleLeave = () => {
    leaveCallMutation.mutate({ callSessionId: callSession.id });
    onClose();
  };

  const isVideo = callSession.callType === CallType.VIDEO;
  const totalParticipants = (remoteStreams.length + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-circle-charcoal/80 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-full max-h-[88vh] flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-circle-charcoal/90 text-white shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-primary text-circle-charcoal font-bold text-lg shadow-sm">
              {callSession.circle?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>{callSession.circle?.name || 'Vòng tròn'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-circle-primary/20 text-circle-primary font-medium">
                  {isVideo ? 'Video Call' : 'Voice Room'}
                </span>
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Users className="h-3.5 w-3.5" />
                <span>{totalParticipants} thành viên đang tham gia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Media Stage Area */}
        <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
          {error ? (
            <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md">
              <p className="text-red-400 font-semibold mb-2">Lỗi kết nối</p>
              <p className="text-xs text-white/70">{error}</p>
            </div>
          ) : isVideo ? (
            /* Video Call Grid Layout */
            <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-center">
              {/* Local Video Card */}
              <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center group shadow-md">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${
                    isVideoDisabled ? 'hidden' : 'block'
                  }`}
                />
                {isVideoDisabled && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 rounded-full bg-circle-primary/20 flex items-center justify-center text-circle-primary text-2xl font-bold border border-circle-primary/30">
                      {user?.profile?.displayName?.charAt(0) || 'Me'}
                    </div>
                    <span className="text-xs text-white/60 font-medium">Camera đang tắt</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
                  <span>Bạn</span>
                  {isAudioMuted && <MicOff className="h-3 w-3 text-red-400" />}
                </div>
              </div>

              {/* Remote Peers Video Cards */}
              {remoteStreams.map((peer) => (
                <RemoteVideoCard key={peer.userId} peer={peer} />
              ))}

              {remoteStreams.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 text-white/50 text-center">
                  <Users className="h-10 w-10 mb-2 opacity-50 text-circle-primary animate-pulse" />
                  <p className="text-sm font-medium">Đang chờ thành viên khác tham gia...</p>
                  <p className="text-xs text-white/40 mt-1">
                    Các thành viên trong Vòng tròn đã nhận được thông báo cuộc gọi
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Voice Audio Room Layout (Avatar Cards with Pulse Wave) */
            <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-6 p-4">
              {/* Local Participant Card */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`h-28 w-28 rounded-full border-2 transition-all flex items-center justify-center text-3xl font-bold shadow-lg ${
                      isAudioMuted
                        ? 'border-white/20 bg-white/10 text-white/50'
                        : 'border-circle-primary bg-circle-primary/20 text-circle-primary ring-8 ring-circle-primary/10 animate-pulse'
                    }`}
                  >
                    {user?.profile?.displayName?.charAt(0) || 'Me'}
                  </div>
                  {isAudioMuted && (
                    <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-500 text-white shadow-md">
                      <MicOff className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-white">Bạn (Tôi)</span>
              </div>

              {/* Remote Participants Cards */}
              {remoteStreams.map((peer) => (
                <RemoteAudioCard key={peer.userId} peer={peer} />
              ))}

              {remoteStreams.length === 0 && (
                <div className="w-full text-center text-white/50 text-xs py-4">
                  Đang phát tín hiệu mời gọi... Chuông reo tới toàn bộ thành viên trong nhóm.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Control Action Bar */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
              isAudioMuted
                ? 'bg-red-500/80 hover:bg-red-500 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={isAudioMuted ? 'Bật Mic' : 'Tắt Mic'}
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Camera Button (Video mode only) */}
          {isVideo && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
                isVideoDisabled
                  ? 'bg-red-500/80 hover:bg-red-500 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isVideoDisabled ? 'Bật Camera' : 'Tắt Camera'}
            >
              {isVideoDisabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          )}

          {/* Leave / Hang Up Button */}
          <button
            type="button"
            onClick={handleLeave}
            className="flex h-12 px-6 items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold transition-all active:scale-95 shadow-lg shadow-red-600/30"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="text-sm">Rời phòng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const RemoteVideoCard: React.FC<{ peer: { userId: string; stream: MediaStream } }> = ({
  peer,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-md">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
        <span>Thành viên</span>
        <Volume2 className="h-3 w-3 text-circle-primary" />
      </div>
    </div>
  );
};

const RemoteAudioCard: React.FC<{ peer: { userId: string; stream: MediaStream } }> = ({
  peer,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && peer.stream) {
      audioRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="flex flex-col items-center gap-3">
      <audio ref={audioRef} autoPlay playsInline />
      <div className="h-28 w-28 rounded-full border-2 border-circle-primary bg-circle-primary/20 text-circle-primary ring-8 ring-circle-primary/10 flex items-center justify-center text-3xl font-bold shadow-lg animate-pulse">
        U
      </div>
      <span className="text-sm font-semibold text-white">Thành viên</span>
    </div>
  );
};
