import { Button } from "@heroui/react";
import { DownloadIcon, FileAudioIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatPlaybackTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function MessageAudio({ src, name, onDownload }) {
  const audioRef = useRef(null);
  const progressFrameRef = useRef(null);
  const wasPlayingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekValue, setSeekValue] = useState(0);

  const stopProgressUpdates = () => {
    if (progressFrameRef.current) {
      cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
    }
  };

  const startProgressUpdates = () => {
    stopProgressUpdates();

    const updateProgress = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }

      progressFrameRef.current = requestAnimationFrame(updateProgress);
    };

    progressFrameRef.current = requestAnimationFrame(updateProgress);
  };

  useEffect(() => {
    return () => stopProgressUpdates();
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  };

  const beginSeek = () => {
    const audio = audioRef.current;
    if (!audio) return;

    wasPlayingRef.current = !audio.paused;

    if (wasPlayingRef.current) {
      audio.pause();
    }

    setSeekValue(audio.currentTime);
    setIsSeeking(true);
  };

  const updateSeek = (event) => {
    setSeekValue(Number(event.target.value));
  };

  const commitSeek = async () => {
    const audio = audioRef.current;
    if (!audio || !isSeeking) return;

    audio.currentTime = seekValue;
    setCurrentTime(seekValue);
    setIsSeeking(false);

    if (wasPlayingRef.current) {
      try {
        await audio.play();
      } catch {}
    }
  };

  return (
    <div className="mb-1.5 min-w-64 rounded-2xl border border-current/10 bg-background/12 p-2.5 shadow-sm backdrop-blur-sm">
      <audio
        ref={audioRef}
        preload="metadata"
        src={src}
        onDurationChange={(event) =>
          setDuration(event.currentTarget.duration)
        }
        onPlay={() => {
          setIsPlaying(true);
          startProgressUpdates();
        }}
        onPause={() => {
          setIsPlaying(false);
          stopProgressUpdates();
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          stopProgressUpdates();
        }}
      />

      <div className="flex items-center gap-2.5">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-9 shrink-0 rounded-full bg-current/10 text-inherit hover:bg-current/18"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          onPress={togglePlayback}
        >
          {isPlaying ? (
            <PauseIcon className="size-4" fill="currentColor" />
          ) : (
            <PlayIcon className="ml-0.5 size-4" fill="currentColor" />
          )}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <FileAudioIcon
              className="size-3.5 shrink-0 opacity-75"
              aria-hidden
            />
            <span className="truncate text-sm font-medium">
              {name || "Audio message"}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={
              isSeeking
                ? seekValue
                : Math.min(currentTime, duration || 0)
            }
            onPointerDown={beginSeek}
            onChange={updateSeek}
            onPointerUp={commitSeek}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            aria-label="Audio progress"
            className="mt-1.5 h-1 w-full cursor-pointer accent-current"
          />

          <div className="flex justify-between text-[11px] tabular-nums opacity-70">
            <span>
              {formatPlaybackTime(isSeeking ? seekValue : currentTime)}
            </span>
            <span>{formatPlaybackTime(duration)}</span>
          </div>
        </div>

        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-8 shrink-0 rounded-full text-inherit opacity-75 hover:bg-current/10 hover:opacity-100"
          aria-label={`Download ${name || "audio message"}`}
          onPress={onDownload}
        >
          <DownloadIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}