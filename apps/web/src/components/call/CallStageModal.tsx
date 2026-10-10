'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Smartphone,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleMembersQuery } from '../../hooks/use-circle-queries';
import { useIceServersQuery, useLeaveCallMutation } from '../../hooks/use-call-queries';
import { useWebRTCCall } from '../../hooks/use-webrtc-call';
import { getSocket } from '../../lib/socket';
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
  const { data: circleMembers = [] } = useCircleMembersQuery(callSession.circleId || null);
  const leaveCallMutation = useLeaveCallMutation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocalPortrait, setIsLocalPortrait] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const localDisplayName =
    user?.profile?.displayName ||
    user?.email?.split('@')[0] ||
    t.auth.guest;
  const localAvatarUrl = user?.profile?.avatarUrl;
  const localInitials = (localDisplayName.charAt(0) || 'U').toUpperCase();

  const resolvePeerInfo = (peerUserId: string) => {
    const member = circleMembers.find((m) => m.userId === peerUserId);
    const participant = callSession.participants?.find(
      (p: any) => p.member?.userId === peerUserId || p.memberId === member?.id,
    );

    const displayName =
      member?.user?.profile?.displayName ||
      participant?.member?.user?.profile?.displayName ||
      member?.nickname ||
      member?.user?.email?.split('@')[0] ||
      participant?.member?.user?.email?.split('@')[0] ||
      t.calls.memberDefault;

    const avatarUrl =
      member?.user?.profile?.avatarUrl ||
      participant?.member?.user?.profile?.avatarUrl ||
      null;

    const initials = (displayName.charAt(0) || 'U').toUpperCase();

    return { displayName, avatarUrl, initials };
  };

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

  // Determine local camera orientation dynamically (mobile portrait vs landscape / PC)
  const updateLocalOrientation = () => {
    if (localVideoRef.current) {
      const { videoWidth, videoHeight } = localVideoRef.current;
      if (videoWidth && videoHeight) {
        setIsLocalPortrait(videoHeight > videoWidth);
        return;
      }
    }
    if (typeof window !== 'undefined') {
      setIsLocalPortrait(window.innerHeight > window.innerWidth);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateLocalOrientation);
    window.addEventListener('orientationchange', updateLocalOrientation);
    return () => {
      window.removeEventListener('resize', updateLocalOrientation);
      window.removeEventListener('orientationchange', updateLocalOrientation);
    };
  }, []);

  if (!isOpen) return null;

  const handleLeave = () => {
    try {
      getSocket()?.emit('call:leave', { callSessionId: callSession.id });
    } catch {}
    leaveCallMutation.mutate({ callSessionId: callSession.id });
    onClose();
  };

  const isVideo = callSession.callType === CallType.VIDEO;
  const totalParticipants = remoteStreams.length + 1;

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col bg-circle-dark-canvas text-white animate-fadeIn'
          : 'fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 md:p-4 bg-black/85 backdrop-blur-md animate-fadeIn'
      }
    >
      <div
        className={
          isFullscreen
            ? 'relative w-full h-full flex flex-col bg-circle-dark-canvas text-white'
            : 'relative w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-circle-dark-canvas text-white shadow-2xl transition-all duration-300'
        }
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-primary text-circle-charcoal font-bold text-base shadow-sm">
              {callSession.circle?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{callSession.circle?.name || t.common.appName}</span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    isVideo
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isVideo ? t.calls.videoCallTitle : t.calls.voiceRoomTitle}
                </span>
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Users className="h-3.5 w-3.5" />
                <span>{t.calls.participantsActiveCount.replace('{count}', String(totalParticipants))}</span>
              </div>
            </div>
          </div>

          {/* Header Action: Fullscreen Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title={isFullscreen ? t.calls.minimizeWindow : t.calls.fullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Media Stage Area */}
        <div className="flex-1 p-2 sm:p-4 overflow-hidden flex items-center justify-center bg-circle-dark-surface">
          {error ? (
            <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md">
              <p className="text-red-400 font-semibold mb-2">{t.calls.connectionError}</p>
              <p className="text-xs text-white/70">{error}</p>
            </div>
          ) : isVideo ? (
            /* Video Call Stage (Discord/Messenger Responsive Canvas) */
            <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto">
              {remoteStreams.length === 0 ? (
                /* Single Participant (Local Only) */
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div
                    className={`relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-xl transition-all duration-300 ${
                      isLocalPortrait
                        ? 'aspect-[9/16] h-full max-h-[78vh] max-w-[440px] w-auto'
                        : 'aspect-video w-full max-w-5xl max-h-[78vh] h-auto'
                    }`}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={updateLocalOrientation}
                      onResize={updateLocalOrientation}
                      className={`w-full h-full object-cover -scale-x-100 ${
                        isVideoDisabled ? 'hidden' : 'block'
                      }`}
                    />
                    {isVideoDisabled && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-24 w-24 rounded-full bg-circle-primary/20 flex items-center justify-center text-circle-primary text-3xl font-bold border border-circle-primary/30 shadow-inner overflow-hidden">
                          {localAvatarUrl ? (
                            <img src={localAvatarUrl} alt={localDisplayName} className="w-full h-full object-cover" />
                          ) : (
                            localInitials
                          )}
                        </div>
                        <span className="text-xs text-white/60 font-medium">{t.calls.cameraOff}</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2 max-w-[90%]">
                      <span className="truncate">{localDisplayName} {t.calls.meSuffix}</span>
                      {isLocalPortrait ? (
                        <span title={t.calls.mobileDevice}>
                          <Smartphone className="h-3.5 w-3.5 text-circle-primary" />
                        </span>
                      ) : (
                        <span title={t.calls.pcDevice}>
                          <Monitor className="h-3.5 w-3.5 text-circle-primary" />
                        </span>
                      )}
                      {isAudioMuted && <MicOff className="h-3.5 w-3.5 text-red-400 ml-1" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                    <Users className="h-3.5 w-3.5 text-circle-primary animate-pulse" />
                    <span>{t.calls.waitingForPeers}</span>
                  </div>
                </div>
              ) : remoteStreams.length === 1 ? (
                /* Two Participants Side-by-Side (1-on-1 Messenger/Discord layout) */
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-2 items-center justify-center">
                  {/* Local Video Card */}
                  <div
                    className={`relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-xl transition-all duration-300 w-full h-full max-h-[78vh] ${
                      isLocalPortrait
                        ? 'aspect-[9/16] mx-auto'
                        : 'aspect-video'
                    }`}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={updateLocalOrientation}
                      onResize={updateLocalOrientation}
                      className={`w-full h-full object-cover -scale-x-100 ${
                        isVideoDisabled ? 'hidden' : 'block'
                      }`}
                    />
                    {isVideoDisabled && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-20 w-20 rounded-full bg-circle-primary/20 flex items-center justify-center text-circle-primary text-2xl font-bold border border-circle-primary/30 overflow-hidden">
                          {localAvatarUrl ? (
                            <img src={localAvatarUrl} alt={localDisplayName} className="w-full h-full object-cover" />
                          ) : (
                            localInitials
                          )}
                        </div>
                        <span className="text-xs text-white/60 font-medium">{t.calls.cameraOff}</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2 max-w-[90%]">
                      <span className="truncate">{localDisplayName} {t.calls.meSuffix}</span>
                      {isLocalPortrait ? (
                        <span title={t.calls.mobileDevice}>
                          <Smartphone className="h-3.5 w-3.5 text-circle-primary" />
                        </span>
                      ) : (
                        <span title={t.calls.pcDevice}>
                          <Monitor className="h-3.5 w-3.5 text-circle-primary" />
                        </span>
                      )}
                      {isAudioMuted && <MicOff className="h-3.5 w-3.5 text-red-400 ml-1" />}
                    </div>
                  </div>

                  {/* Remote Peer Video Card */}
                  <RemoteVideoCard
                    peer={remoteStreams[0]}
                    peerInfo={resolvePeerInfo(remoteStreams[0].userId)}
                  />
                </div>
              ) : (
                /* 3+ Participants Multi-Peer Grid Layout */
                <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-center justify-center p-2 overflow-y-auto">
                  {/* Local Video Card */}
                  <div
                    className={`relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isLocalPortrait ? 'aspect-[9/16] max-h-[60vh] mx-auto' : 'aspect-video w-full'
                    }`}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={updateLocalOrientation}
                      onResize={updateLocalOrientation}
                      className={`w-full h-full object-cover -scale-x-100 ${
                        isVideoDisabled ? 'hidden' : 'block'
                      }`}
                    />
                    {isVideoDisabled && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-16 w-16 rounded-full bg-circle-primary/20 flex items-center justify-center text-circle-primary text-xl font-bold border border-circle-primary/30 overflow-hidden">
                          {localAvatarUrl ? (
                            <img src={localAvatarUrl} alt={localDisplayName} className="w-full h-full object-cover" />
                          ) : (
                            localInitials
                          )}
                        </div>
                        <span className="text-[11px] text-white/60 font-medium">{t.calls.cameraOffShort}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5 max-w-[90%]">
                      <span className="truncate">{localDisplayName} {t.calls.meSuffix}</span>
                      {isLocalPortrait ? (
                        <Smartphone className="h-3 w-3 text-circle-primary" />
                      ) : (
                        <Monitor className="h-3 w-3 text-circle-primary" />
                      )}
                      {isAudioMuted && <MicOff className="h-3 w-3 text-red-400" />}
                    </div>
                  </div>

                  {/* Remote Peers Cards */}
                  {remoteStreams.map((peer) => (
                    <RemoteVideoCard
                      key={peer.userId}
                      peer={peer}
                      peerInfo={resolvePeerInfo(peer.userId)}
                      isMultiGrid
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Voice Audio Room Layout (Avatar Cards with Pulse Wave) */
            <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-8 p-6">
              {/* Local Participant Card */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`h-28 w-28 rounded-full border-2 transition-all flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden ${
                      isAudioMuted
                        ? 'border-white/20 bg-white/10 text-white/50'
                        : 'border-circle-primary bg-circle-primary/20 text-circle-primary ring-8 ring-circle-primary/10 animate-pulse'
                    }`}
                  >
                    {localAvatarUrl ? (
                      <img src={localAvatarUrl} alt={localDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      localInitials
                    )}
                  </div>
                  {isAudioMuted && (
                    <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-500 text-white shadow-md">
                      <MicOff className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white max-w-[160px]">
                  <span className="truncate">{localDisplayName} {t.calls.meSuffix}</span>
                  <Volume2 className="h-3.5 w-3.5 text-circle-primary shrink-0" />
                </div>
              </div>

              {/* Remote Participants Cards */}
              {remoteStreams.map((peer) => (
                <RemoteAudioCard
                  key={peer.userId}
                  peer={peer}
                  peerInfo={resolvePeerInfo(peer.userId)}
                />
              ))}

              {remoteStreams.length === 0 && (
                <div className="w-full text-center text-white/50 text-xs py-4">
                  {t.calls.callingBroadcastNotice}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Control Action Bar */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-white/10 bg-circle-dark-canvas backdrop-blur-md shrink-0">
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
              isAudioMuted
                ? 'bg-red-500/80 hover:bg-red-500 text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isAudioMuted ? t.calls.micTurnOn : t.calls.micTurnOff}
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
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoDisabled ? t.calls.cameraTurnOn : t.calls.cameraTurnOff}
            >
              {isVideoDisabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all active:scale-95 shadow-md"
            title={isFullscreen ? t.calls.minimize : t.calls.fullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          {/* Leave / Hang Up Button */}
          <button
            type="button"
            onClick={handleLeave}
            className="flex h-12 px-6 items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold transition-all active:scale-95 shadow-lg shadow-red-600/30"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="text-sm">{t.calls.leaveRoom}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const RemoteVideoCard: React.FC<{
  peer: { userId: string; stream: MediaStream };
  peerInfo: { displayName: string; avatarUrl: string | null; initials: string };
  isMultiGrid?: boolean;
}> = ({ peer, peerInfo, isMultiGrid = false }) => {
  const t = useLanguageStore((s) => s.t);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  const updateOrientation = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth && videoHeight) {
        setIsPortrait(videoHeight > videoWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return (
    <div
      className={`relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-xl transition-all duration-300 w-full h-full max-h-[78vh] ${
        isMultiGrid
          ? isPortrait
            ? 'aspect-[9/16] max-h-[60vh] mx-auto'
            : 'aspect-video w-full'
          : isPortrait
          ? 'aspect-[9/16] mx-auto'
          : 'aspect-video'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onLoadedMetadata={updateOrientation}
        onResize={updateOrientation}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2 max-w-[90%]">
        {peerInfo.avatarUrl ? (
          <img
            src={peerInfo.avatarUrl}
            alt={peerInfo.displayName}
            className="h-4 w-4 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="h-4 w-4 rounded-full bg-circle-primary text-circle-charcoal text-[9px] font-bold flex items-center justify-center shrink-0">
            {peerInfo.initials.charAt(0)}
          </span>
        )}
        <span className="truncate">{peerInfo.displayName}</span>
        {isPortrait ? (
          <span title={t.calls.mobileDevice} className="shrink-0">
            <Smartphone className="h-3.5 w-3.5 text-circle-primary" />
          </span>
        ) : (
          <span title={t.calls.pcDevice} className="shrink-0">
            <Monitor className="h-3.5 w-3.5 text-circle-primary" />
          </span>
        )}
        <Volume2 className="h-3.5 w-3.5 text-circle-primary shrink-0" />
      </div>
    </div>
  );
};

const RemoteAudioCard: React.FC<{
  peer: { userId: string; stream: MediaStream };
  peerInfo: { displayName: string; avatarUrl: string | null; initials: string };
}> = ({ peer, peerInfo }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && peer.stream) {
      audioRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="flex flex-col items-center gap-3">
      <audio ref={audioRef} autoPlay playsInline />
      <div className="h-28 w-28 rounded-full border-2 border-circle-primary bg-circle-primary/20 text-circle-primary ring-8 ring-circle-primary/10 flex items-center justify-center text-3xl font-bold shadow-lg animate-pulse overflow-hidden">
        {peerInfo.avatarUrl ? (
          <img
            src={peerInfo.avatarUrl}
            alt={peerInfo.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{peerInfo.initials}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-white max-w-[160px]">
        <span className="truncate">{peerInfo.displayName}</span>
        <Volume2 className="h-3.5 w-3.5 text-circle-primary shrink-0" />
      </div>
    </div>
  );
};
