'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { CallType, IceServerConfig } from '@circle/types';

interface PeerStream {
  userId: string;
  stream: MediaStream;
  displayName?: string;
}

interface UseWebRTCCallOptions {
  callSessionId: string | null;
  callType: CallType;
  currentUserId: string;
  iceServers?: IceServerConfig[];
  onCallEnded?: () => void;
}

export function useWebRTCCall({
  callSessionId,
  callType,
  currentUserId,
  iceServers = [{ urls: 'stun:stun.l.google.com:19302' }],
  onCallEnded,
}: UseWebRTCCallOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callType === CallType.AUDIO);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media stream
  const startLocalMedia = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ WebRTC MediaDevices');
      }

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === CallType.VIDEO,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsConnected(true);
      setError(null);
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Error acquiring media stream:', err);
      setError(err?.message || 'Không thể truy cập Microphone hoặc Camera');
      return null;
    }
  }, [callType]);

  // Create or get RTCPeerConnection for a remote peer
  const getOrCreatePeerConnection = useCallback(
    (targetUserId: string, stream: MediaStream) => {
      if (peerConnections.current.has(targetUserId)) {
        return peerConnections.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServers.map((s) => ({
          urls: s.urls,
          username: s.username,
          credential: s.credential,
        })),
      });

      // Add local stream tracks to this peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && callSessionId) {
          const socket = getSocket();
          socket?.emit('webrtc:signal', {
            callSessionId,
            targetUserId,
            signal: { candidate: event.candidate },
          });
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        const [incomingStream] = event.streams;
        if (incomingStream) {
          setRemoteStreams((prev) => {
            const exists = prev.some((p) => p.userId === targetUserId);
            if (exists) {
              return prev.map((p) =>
                p.userId === targetUserId ? { ...p, stream: incomingStream } : p,
              );
            }
            return [...prev, { userId: targetUserId, stream: incomingStream }];
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setRemoteStreams((prev) => prev.filter((p) => p.userId !== targetUserId));
          peerConnections.current.delete(targetUserId);
        }
      };

      peerConnections.current.set(targetUserId, pc);
      return pc;
    },
    [callSessionId, iceServers],
  );

  // Toggle Microphone
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Camera
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  }, []);

  // Main lifecycle & signaling listeners
  useEffect(() => {
    if (!callSessionId || !currentUserId) return;

    let activeStream: MediaStream | null = null;
    const socket = getSocket();

    const initCall = async () => {
      activeStream = await startLocalMedia();
      if (!activeStream || !socket) return;

      // Join socket call room
      socket.emit('call:join', { callSessionId });

      // Signal handler for incoming WebRTC SDP / ICE messages
      const handleSignal = async (payload: any) => {
        if (payload.callSessionId !== callSessionId) return;
        const senderId = payload.senderUserId;
        if (!senderId || senderId === currentUserId || !activeStream) return;

        const pc = getOrCreatePeerConnection(senderId, activeStream);

        try {
          if (payload.signal?.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('webrtc:signal', {
              callSessionId,
              targetUserId: senderId,
              signal: answer,
            });
          } else if (payload.signal?.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));
          } else if (payload.signal?.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.signal.candidate));
          }
        } catch (signalErr) {
          console.error('[WebRTC] Signaling processing error:', signalErr);
        }
      };

      // Peer joined -> we initiate an offer to the new joiner
      const handlePeerJoined = async (payload: any) => {
        const newPeerUserId = payload.participant?.member?.userId;
        if (!newPeerUserId || newPeerUserId === currentUserId || !activeStream) return;

        const pc = getOrCreatePeerConnection(newPeerUserId, activeStream);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('webrtc:signal', {
            callSessionId,
            targetUserId: newPeerUserId,
            signal: offer,
          });
        } catch (offerErr) {
          console.error('[WebRTC] Error creating offer:', offerErr);
        }
      };

      const handlePeerLeft = (payload: any) => {
        if (payload.callSessionId === callSessionId && payload.userId) {
          const pc = peerConnections.current.get(payload.userId);
          if (pc) {
            pc.close();
            peerConnections.current.delete(payload.userId);
          }
          setRemoteStreams((prev) => prev.filter((p) => p.userId !== payload.userId));
        }
      };

      const handleCallEnded = (payload: any) => {
        if (payload.callSessionId === callSessionId) {
          onCallEnded?.();
        }
      };

      socket.on('webrtc:signal', handleSignal);
      socket.on('call:participant-joined', handlePeerJoined);
      socket.on('call:participant-left', handlePeerLeft);
      socket.on('call:ended', handleCallEnded);
    };

    initCall();

    return () => {
      // Cleanup all connections and tracks
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      setRemoteStreams([]);
      setLocalStream(null);
      localStreamRef.current = null;

      if (socket) {
        socket.emit('call:leave', { callSessionId });
        socket.off('webrtc:signal');
        socket.off('call:participant-joined');
        socket.off('call:participant-left');
        socket.off('call:ended');
      }
    };
  }, [
    callSessionId,
    currentUserId,
    startLocalMedia,
    getOrCreatePeerConnection,
    onCallEnded,
  ]);

  return {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoDisabled,
    isConnected,
    error,
    toggleAudio,
    toggleVideo,
  };
}
