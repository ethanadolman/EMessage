import { Avatar, Button } from "@heroui/react";
import { ChevronLeftIcon, Volume2Icon, VolumeXIcon, XIcon } from "lucide-react";
import { AppLogo } from "../AppLogo";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

import { ThemePresetPicker } from "../ThemePresetPicker";

import { ThemeToggle } from "../ThemeToggle";
import { WallpaperPicker } from "../WallpaperPicker";
import { TypingIndicator } from "./TypingIndicator";

import { useChatStore } from "../../store/useChatStore";
import {
  useActiveConversationId,
  useActiveConversationPeer,
  useIsLargeScreen,
} from "../../hooks/useSelectedConversation";

function formatLastOnline(lastOnlineAt) {
  if (!lastOnlineAt) return "Last online recently";

  const millisecondsAgo = Date.now() - new Date(lastOnlineAt).getTime();
  if (Number.isNaN(millisecondsAgo) || millisecondsAgo < 60_000) return "Last online just now";

  const minutesAgo = Math.floor(millisecondsAgo / 60_000);
  if (minutesAgo < 60) return `Last online ${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `Last online ${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  return `Last online ${daysAgo}d ago`;
}

function OfflineStatus({ lastOnlineAt }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>Offline</span>
      <span className="text-muted/70" aria-hidden>·</span>
      <span className="text-muted/80">{formatLastOnline(lastOnlineAt)}</span>
    </span>
  );
}

export function ChatHeader() {
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSoundEnabled = useChatStore((state) => state.setSoundEnabled);

  const activeConversationId = useActiveConversationId();
  const peer = useActiveConversationPeer();
  const isLargeScreen = useIsLargeScreen();

  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2">
      {peer && !isLargeScreen ? (
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          onPress={() => setActiveConversationId(null)}
        >
          <ChevronLeftIcon className="size-6" strokeWidth={2.25} />
        </Button>
      ) : null}

      {peer ? (
        <>
          <AvatarWithOnlineIndicator
            isOnline={peer.isOnline ?? true}
            isIdle={peer.isIdle ?? false}
          >
            <Avatar className="size-9 shrink-0">
              <Avatar.Image alt={peer.name} src={peer.avatarUrl} />
              <Avatar.Fallback className="text-sm font-medium">{peer.initials}</Avatar.Fallback>
            </Avatar>
          </AvatarWithOnlineIndicator>

          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[15px] font-semibold leading-tight">{peer.name}</p>
            <p className="truncate text-xs text-muted">
              {peer.isTyping ? (
                <TypingIndicator className="font-medium text-accent" />
              ) : peer.isIdle ? (
                <span className="font-medium text-amber-500">Idle</span>
              ) : peer.isOnline ? (
                <span className="font-medium text-success">Online</span>
              ) : (
                <OfflineStatus lastOnlineAt={peer.lastOnlineAt} />
              )}
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center gap-2.5 sm:text-left">
          <AppLogo size={36} className="rounded-[9px]" />
          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[13px] font-medium text-muted">Select a conversation</p>
          </div>
        </div>
      )}

      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
        <div className="hidden min-[400px]:contents">
          <WallpaperPicker />
          <ThemePresetPicker />
        </div>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          aria-pressed={isSoundEnabled}
          aria-label={isSoundEnabled ? "Mute chat sounds" : "Enable chat sounds"}
          title={isSoundEnabled ? "Mute chat sounds" : "Enable chat sounds"}
          onPress={() => setSoundEnabled(!isSoundEnabled)}
        >
          {isSoundEnabled ? (
            <Volume2Icon className="size-5.5" strokeWidth={2} aria-hidden />
          ) : (
            <VolumeXIcon className="size-5.5" strokeWidth={2} aria-hidden />
          )}
        </Button>

        {activeConversationId ? (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="shrink-0"
            aria-label="Close chat"
            onPress={() => setActiveConversationId(null)}
          >
            <XIcon className="size-5.5" strokeWidth={2} aria-hidden />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
