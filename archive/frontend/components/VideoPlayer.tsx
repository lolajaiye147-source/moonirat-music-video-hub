'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  src: string;
  poster?: string | null;
  autoPlay?: boolean;
  onPlay?: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ src, poster, autoPlay = false, onPlay }: Props) {
  const ref      = useRef<HTMLVideoElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [muted, setMuted]       = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent]   = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCtrl, setShowCtrl] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoPlay) ref.current?.play().catch(() => {});
  }, [autoPlay]);

  const fadeControls = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowCtrl(true);
    timerRef.current = setTimeout(() => setShowCtrl(false), 3000);
  };

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); onPlay?.(); }
    else          { v.pause(); setPlaying(false); }
    fadeControls();
  };

  const onTimeUpdate = () => {
    const v = ref.current;
    if (!v) return;
    setCurrent(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await wrapRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative bg-black rounded-2xl overflow-hidden aspect-video cursor-pointer group"
      onMouseMove={fadeControls}
      onClick={togglePlay}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        className="w-full h-full object-contain"
        muted={muted}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
      />

      {/* Controls overlay */}
      <div
        className={clsx(
          'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300',
          showCtrl || !playing ? 'opacity-100' : 'opacity-0',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="px-4 pb-1 cursor-pointer" onClick={seek}>
          <div className="h-1 bg-white/20 rounded-full relative hover:h-1.5 transition-all">
            <div className="h-full bg-moon-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={togglePlay} className="text-white hover:text-moon-300 transition-colors">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <button onClick={() => { setMuted((m) => !m); }} className="text-white/70 hover:text-white transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-xs text-white/60 ml-1">
            {formatTime(current)} / {formatTime(duration)}
          </span>
          <div className="ml-auto">
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Big play icon when paused */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-5">
            <Play className="w-10 h-10 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}
