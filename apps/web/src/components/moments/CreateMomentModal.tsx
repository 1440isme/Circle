'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Video,
  RotateCcw,
  FlipHorizontal,
  Send,
  AlertTriangle,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  MessageCircle,
} from 'lucide-react';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';
import { useCreateMomentMutation } from '@/hooks/use-moment-queries';
import { useUploadMedia } from '@/hooks/use-upload-media';

interface CreateMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId?: string;
  replyingToAuthor?: string | null;
  onClearReplyingToAuthor?: () => void;
}

type CaptureMode = 'PHOTO' | 'VIDEO';

const MAX_GIF_SECONDS = 5;

export const CreateMomentModal: React.FC<CreateMomentModalProps> = ({
  isOpen,
  onClose,
  circleId,
  replyingToAuthor,
  onClearReplyingToAuthor,
}) => {
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const { data: myCircles = [] } = useMyCirclesQuery();
  const createMomentMutation = useCreateMomentMutation();
  const { uploadMedia, isUploading } = useUploadMedia();

  const effectiveCircle =
    activeCircle || (circleId ? myCircles.find((c) => c.id === circleId) : null);

  // Mode & Capture state
  const [mode, setMode] = useState<CaptureMode>('PHOTO');
  const [capturedMedia, setCapturedMedia] = useState<{
    blob: Blob;
    previewUrl: string;
    type: 'IMAGE' | 'VIDEO';
  } | null>(null);

  // Camera & Stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);

  // Camera states
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Video recording timer
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form states
  const [caption, setCaption] = useState('');
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected circles on open
  useEffect(() => {
    if (isOpen) {
      if (effectiveCircle) {
        setSelectedCircleIds([effectiveCircle.id]);
      } else if (myCircles.length > 0) {
        setSelectedCircleIds(myCircles.map((c) => c.id));
      }
      setCapturedMedia(null);
      setCaption('');
      setErrorMessage(null);
      setCameraError(null);
      setMode('PHOTO');
      setFacingMode('user');
      setIsMirrored(true);
    }
  }, [isOpen, effectiveCircle, myCircles]);

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach((track) => track.stop());
      canvasStreamRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);
    setIsCameraReady(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(t.moments.noCameraFound);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(t.moments.cameraPermissionDenied);
      } else {
        setCameraError(t.moments.noCameraFound);
      }
    }
  }, [facingMode, stopCameraStream, t.moments]);

  // Mount/Unmount camera based on modal open and captured status
  useEffect(() => {
    if (isOpen && !capturedMedia) {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isOpen, capturedMedia, startCamera, stopCameraStream]);

  // Handle Switch Camera (Front / Back)
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => {
      const next = prev === 'user' ? 'environment' : 'user';
      setIsMirrored(next === 'user');
      return next;
    });
  };

  // Toggle Mirroring manually
  const handleToggleMirror = () => {
    setIsMirrored((prev) => !prev);
  };

  // =========================================================================
  // CAPTURE ACTIONS
  // =========================================================================

  // 1. Take Snapshot Photo
  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video || !isCameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if isMirrored
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        stopCameraStream();
        setCapturedMedia({
          blob,
          previewUrl,
          type: 'IMAGE',
        });
      },
      'image/jpeg',
      0.88,
    );
  };

  // 2. Start Video Recording
  const handleStartRecording = () => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || isRecording) return;

    recordedChunksRef.current = [];
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }

    try {
      let streamToRecord = stream;

      // If mirrored preview, record through a mirrored canvas stream so WYSIWYG
      if (isMirrored && video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');

        if (ctx && typeof canvas.captureStream === 'function') {
          const fps = 30;
          const canvasStream = canvas.captureStream(fps);
          canvasStreamRef.current = canvasStream;

          // 5s GIF is completely silent (no audio tracks needed)
          const drawLoop = () => {
            if (ctx && video) {
              ctx.save();
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              ctx.restore();
            }
            animFrameRef.current = requestAnimationFrame(drawLoop);
          };
          animFrameRef.current = requestAnimationFrame(drawLoop);

          streamToRecord = canvasStream;
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: 1000000, // 1 Mbps for ultra-lightweight 5s GIF
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(streamToRecord, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (canvasStreamRef.current) {
          canvasStreamRef.current.getTracks().forEach((track) => track.stop());
          canvasStreamRef.current = null;
        }

        const actualType = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: actualType });
        const previewUrl = URL.createObjectURL(blob);
        stopCameraStream();
        setCapturedMedia({
          blob,
          previewUrl,
          type: 'VIDEO',
        });
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Countdown timer up to MAX_GIF_SECONDS (5s)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_GIF_SECONDS - 1) {
            handleStopRecording();
            return MAX_GIF_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.error('Failed to start MediaRecorder:', e);
    }
  };

  // 3. Stop Video Recording
  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // 4. Retake (Discard and reopen camera)
  const handleRetake = () => {
    if (capturedMedia?.previewUrl) {
      URL.revokeObjectURL(capturedMedia.previewUrl);
    }
    setCapturedMedia(null);
    setCaption('');
    setErrorMessage(null);
    startCamera();
  };

  // 5. Flip captured photo horizontally
  const handleFlipPhoto = () => {
    if (!capturedMedia || capturedMedia.type !== 'IMAGE') return;

    const img = new Image();
    img.src = capturedMedia.previewUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        URL.revokeObjectURL(capturedMedia.previewUrl);
        setCapturedMedia({
          ...capturedMedia,
          blob,
          previewUrl: URL.createObjectURL(blob),
        });
      }, 'image/jpeg', 0.88);
    };
  };

  // Toggle circle selection
  const handleToggleCircle = (circleId: string) => {
    setSelectedCircleIds((prev) =>
      prev.includes(circleId) ? prev.filter((id) => id !== circleId) : [...prev, circleId],
    );
  };

  const handleSelectAllCircles = () => {
    if (selectedCircleIds.length === myCircles.length) {
      setSelectedCircleIds([]);
    } else {
      setSelectedCircleIds(myCircles.map((c) => c.id));
    }
  };

  // 5. Submit Moment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedMedia) return;

    if (selectedCircleIds.length === 0) {
      setErrorMessage(t.validation.momentCirclesRequired);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Upload media to cloud/storage service
      const fileName =
        capturedMedia.type === 'VIDEO'
          ? `moment_${Date.now()}.webm`
          : `moment_${Date.now()}.jpg`;

      const uploadRes = await uploadMedia({
        folder: 'moments',
        file: capturedMedia.blob,
        fileName,
      });

      // 2. Submit moment with clean public URL
      const finalCaption = replyingToAuthor
        ? `Trả lời @${replyingToAuthor}: ${caption.trim()}`
        : caption.trim() || undefined;

      await createMomentMutation.mutateAsync({
        photoUrl: uploadRes.publicUrl,
        mediaType: capturedMedia.type,
        caption: finalCaption,
        circleIds: selectedCircleIds,
      });

      if (capturedMedia.previewUrl) {
        URL.revokeObjectURL(capturedMedia.previewUrl);
      }
      stopCameraStream();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || t.moments.momentNotFound || 'Không thể chia sẻ khoảnh khắc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-circle-charcoal text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-circle-primary text-circle-charcoal flex items-center justify-center">
              {mode === 'PHOTO' ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {capturedMedia ? t.moments.createTitle : t.moments.captureTitle}
              </h3>
              <p className="text-[11px] text-white/60">
                {capturedMedia ? t.moments.createSubtitle : t.moments.captureSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* CAMERA VIEWFINDER (When no media captured yet) */}
          {!capturedMedia && (
            <div className="space-y-4">
              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-center gap-2 bg-black/40 p-1 rounded-2xl w-fit mx-auto border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode('PHOTO')}
                  disabled={isRecording}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    mode === 'PHOTO'
                      ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{t.moments.modePhoto}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('VIDEO')}
                  disabled={isRecording}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    mode === 'VIDEO'
                      ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>{t.moments.modeVideo}</span>
                </button>
              </div>

              {/* Viewfinder Screen */}
              <div className="relative aspect-[3/4] max-h-[460px] w-full mx-auto rounded-3xl overflow-hidden bg-black border border-white/15 shadow-inner flex items-center justify-center">
                {/* Live Camera Video Feed */}
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isCameraReady ? 'opacity-100' : 'opacity-0'
                  } ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />

                {/* Replying Badge when replying with photo */}
                {replyingToAuthor && (
                  <div className="absolute top-3 inset-x-3 flex justify-center z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/25 border border-amber-500/50 text-amber-300 rounded-full text-xs font-semibold backdrop-blur-md shadow-md pointer-events-auto">
                      <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>{t.moments.replyToAuthorPrefix.replace('{author}', replyingToAuthor)}</span>
                      {onClearReplyingToAuthor && (
                        <button
                          type="button"
                          onClick={onClearReplyingToAuthor}
                          className="p-0.5 hover:bg-white/20 rounded-full ml-1 transition-colors"
                          title={t.moments.cancelReply}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Camera Permission / Error Fallback */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-black/90 z-20">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <p className="text-xs text-white/90 max-w-xs leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-xs font-semibold transition-colors mt-2"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t.moments.retryCamera}</span>
                    </button>
                  </div>
                )}

                {/* Viewfinder Overlay Controls */}
                {isCameraReady && !cameraError && (
                  <>
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                      {/* Mirror Toggle Button */}
                      <button
                        type="button"
                        onClick={handleToggleMirror}
                        className={`h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-95 ${
                          isMirrored
                            ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                            : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                        title={t.moments.flipHorizontal || 'Lật gương'}
                      >
                        <FlipHorizontal className="h-4 w-4" />
                      </button>

                      {/* Switch Facing Mode Button */}
                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-black/70 transition-all active:scale-95"
                        title={t.moments.switchCamera}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Recording Time Pill */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-rose-500/90 text-white px-3.5 py-1 text-xs font-mono font-bold shadow-md animate-pulse">
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        <span>
                          {t.moments.recordingTime.replace(
                            '{time}',
                            `${recordingSeconds}/${MAX_GIF_SECONDS}`,
                          )}
                        </span>
                      </div>
                    )}

                    {/* Bottom Shutter Controls */}
                    <div className="absolute bottom-6 inset-x-0 flex items-center justify-center z-10">
                      {mode === 'PHOTO' ? (
                        /* Photo Shutter Button */
                        <button
                          type="button"
                          onClick={handleTakePhoto}
                          className="h-18 w-18 rounded-full border-4 border-white bg-white/20 flex items-center justify-center p-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                        >
                          <div className="h-full w-full rounded-full bg-white group-hover:bg-circle-primary transition-colors" />
                        </button>
                      ) : (
                        /* Video Record Button */
                        <button
                          type="button"
                          onClick={isRecording ? handleStopRecording : handleStartRecording}
                          className={`h-18 w-18 rounded-full border-4 flex items-center justify-center p-1.5 shadow-2xl transition-all ${
                            isRecording
                              ? 'border-rose-500 bg-rose-500/20 scale-105'
                              : 'border-white bg-white/20 hover:scale-105'
                          }`}
                        >
                          <div
                            className={`transition-all ${
                              isRecording
                                ? 'h-6 w-6 rounded-md bg-rose-500'
                                : 'h-full w-full rounded-full bg-rose-500 hover:bg-rose-400'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CAPTURED MEDIA REVIEW & PRIVACY SELECTION */}
          {capturedMedia && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              {/* Media Preview Container */}
              <div className="relative aspect-[3/4] max-h-[360px] w-full mx-auto rounded-3xl overflow-hidden bg-black border border-white/20 shadow-lg flex items-center justify-center">
                {capturedMedia.type === 'IMAGE' ? (
                  <img
                    src={capturedMedia.previewUrl}
                    alt="Captured Moment"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={capturedMedia.previewUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Badge Type */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-white/20 flex items-center gap-1 text-white">
                  {capturedMedia.type === 'VIDEO' ? (
                    <>
                      <Video className="h-3 w-3 text-rose-400" />
                      <span>{t.moments.videoBadge}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-3 w-3 text-circle-primary" />
                      <span>{t.moments.photoBadge}</span>
                    </>
                  )}
                </div>

                {/* Retake Button */}
                <button
                  type="button"
                  onClick={handleRetake}
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black text-white px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t.moments.retake}</span>
                </button>

                {/* Flip Photo Button */}
                {capturedMedia.type === 'IMAGE' && (
                  <button
                    type="button"
                    onClick={handleFlipPhoto}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black text-white px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-95"
                    title={t.moments.flipHorizontal || 'Lật ảnh'}
                  >
                    <FlipHorizontal className="h-3.5 w-3.5" />
                    <span>{t.moments.flipHorizontal || 'Lật ảnh'}</span>
                  </button>
                )}
              </div>

              {/* Replying Badge */}
              {replyingToAuthor && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-2xl text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
                    <span>{t.moments.replyToAuthorPrefix.replace('{author}', replyingToAuthor)}</span>
                  </div>
                  {onClearReplyingToAuthor && (
                    <button
                      type="button"
                      onClick={onClearReplyingToAuthor}
                      className="p-1 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                      title={t.moments.cancelReply}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Caption Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <label htmlFor="caption" className="font-medium">
                    {t.moments.captionLabel}
                  </label>
                  <span>{caption.length}/80</span>
                </div>
                <input
                  id="caption"
                  type="text"
                  maxLength={80}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 80))}
                  placeholder={t.moments.captionPlaceholder}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 focus:border-circle-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Circle-Based Privacy: Auto-bound when inside a Circle (no prompt shown), or Checklist when on Hub */}
              {effectiveCircle ? null : (
                /* When in Global Hub: Checklist to choose which Circles to share with */
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white block">
                        {t.moments.selectCirclesLabel}
                      </label>
                    </div>
                    {myCircles.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSelectAllCircles}
                        className="text-[11px] font-semibold text-circle-primary hover:underline"
                      >
                        {selectedCircleIds.length === myCircles.length
                          ? t.moments.deselectAll
                          : t.moments.selectAll}
                      </button>
                    )}
                  </div>

                  {/* Circles List Checklist */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                    {myCircles.map((circle) => {
                      const isChecked = selectedCircleIds.includes(circle.id);
                      return (
                        <div
                          key={circle.id}
                          onClick={() => handleToggleCircle(circle.id)}
                          className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                            isChecked
                              ? 'bg-circle-primary/20 border-circle-primary text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs uppercase text-circle-primary shrink-0">
                              {circle.name.slice(0, 2)}
                            </div>
                            <div className="truncate">
                              <h5 className="text-xs font-semibold truncate">{circle.name}</h5>
                              <p className="text-[10px] text-white/50 font-mono">@{circle.handle}</p>
                            </div>
                          </div>

                          <div>
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-circle-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-white/40" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-2xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || createMomentMutation.isPending || selectedCircleIds.length === 0}
                  className="flex items-center gap-2 rounded-full bg-circle-primary text-circle-charcoal px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg hover:bg-circle-sage hover:text-white transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting || isUploading || createMomentMutation.isPending ? t.moments.submitting : t.moments.submitShare}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
