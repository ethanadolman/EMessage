import { Button, TextArea } from "@heroui/react";
import { ImageIcon, LoaderIcon, SendHorizontalIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useChatStore } from "../../store/useChatStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";

export function ChatComposer() {
  const composerText = useChatStore((state) => state.composerText);
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const sendMediaMessage = useChatStore((state) => state.sendMediaMessage);
  const isSendingMedia = useChatStore((state) => state.isSendingMedia);
  const sendTextMessage = useChatStore((state) => state.sendTextMessage);
  const setComposerText = useChatStore((state) => state.setComposerText);
  const { activeConversationId } = useSelectedConversation();
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const mediaInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sendCooldownRef = useRef(false);
  const sendCooldownTimeoutRef = useRef(null);
  const [isCooldownFeedbackVisible, setIsCooldownFeedbackVisible] = useState(false);
  const socket = useAuthStore((state) => state.socket);

  const playSoundIfEnabled = () => {
    if (isSoundEnabled) playRandomKeyStrokeSound();
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (socket?.connected && activeConversationId) {
      socket.emit("stopTyping", { receiverId: activeConversationId });
    }
  };

  const resetSendCooldown = () => {
    if (sendCooldownTimeoutRef.current) {
      window.clearTimeout(sendCooldownTimeoutRef.current);
    }
    sendCooldownTimeoutRef.current = null;
    sendCooldownRef.current = false;
  };

  const handleSend = async () => {
    const trimmedText = composerText.trim();

    if (!trimmedText) return;

    if (sendCooldownRef.current) {
      setIsCooldownFeedbackVisible(true);
      toast.error("Slow down!");
      window.setTimeout(() => setIsCooldownFeedbackVisible(false), 450);
      return;
    }

    sendCooldownRef.current = true;
    stopTyping();
    const didSendMessage = await sendTextMessage(activeConversationId);
    if (didSendMessage) {
      playSoundIfEnabled();
    }

    if (sendCooldownTimeoutRef.current) {
      window.clearTimeout(sendCooldownTimeoutRef.current);
    }

    sendCooldownTimeoutRef.current = window.setTimeout(() => {
      resetSendCooldown();
    }, 500);
  };

  const handleComposerTextChange = (event) => {
    const nextValue = event.target.value;
    setComposerText(nextValue);
    playSoundIfEnabled();

    if (!socket?.connected || !activeConversationId) return;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (nextValue.trim()) {
      socket.emit("typing", { receiverId: activeConversationId });
      typingTimeoutRef.current = window.setTimeout(() => {
        stopTyping();
      }, 1_500);
    } else {
      stopTyping();
    }
  };

  const handleMediaPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const didSendMessage = await sendMediaMessage({
      conversationId: activeConversationId,
      file,
    });

    if (didSendMessage) playSoundIfEnabled();
  };

  useEffect(() => {
    return () => {
      stopTyping();
      resetSendCooldown();
    };
  }, [activeConversationId]);

  return (
    <footer className="shrink-0 border-t border-border px-1.5 pb-2 pt-2 sm:px-2">
      {isSendingMedia ? (
        <div className="mx-auto mb-2 flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
          <LoaderIcon
            className="size-4 shrink-0 animate-spin text-accent"
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate">Uploading media...</span>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-full items-end gap-1.5 px-0.5 sm:gap-2 sm:px-1">
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          disabled={isSendingMedia}
          tabIndex={-1}
          aria-hidden
          onChange={handleMediaPick}
        />
        <Button
          variant="ghost"
          isIconOnly
          isDisabled={isSendingMedia}
          className="size-9 shrink-0 touch-manipulation self-end text-accent"
          onPress={() => mediaInputRef.current?.click()}
        >
          <ImageIcon className="size-5 sm:size-6" strokeWidth={2} />
        </Button>
        <TextArea
          fullWidth
          variant="bordered"
          placeholder="EMessage"
          rows={1}
          value={composerText}
          classNames={{ input: "resize-none" }}
          style={{ resize: "none" }}
          className={`flex-1 rounded-full transition-all ${
            isCooldownFeedbackVisible ? "animate-[composer-cooldown-shake_0.35s_ease-in-out]" : ""
          }`}
          onChange={handleComposerTextChange}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />

        <Button variant="primary" isIconOnly isDisabled={!composerText.trim()} onPress={handleSend}>
          <SendHorizontalIcon className="size-5" />
        </Button>
      </div>
    </footer>
  );
}