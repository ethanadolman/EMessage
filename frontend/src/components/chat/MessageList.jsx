import { Fragment, useCallback, useMemo } from "react";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import { useMessageEnterAnimation } from "../../hooks/useMessageEnterAnimation";
import { MessageBubble } from "./MessageBubble";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import {
  useActiveConversationId,
  useActiveConversationMessages,
} from "../../hooks/useSelectedConversation";

function getDayKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameDay(left, right) {
  const leftKey = getDayKey(left);
  const rightKey = getDayKey(right);

  return leftKey !== null && leftKey === rightKey;
}

function getDayLabel(value, isFirstMessage) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return isFirstMessage ? "Today" : "Earlier";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildMessageItems(messages) {
  return messages.map((message, index) => {
    const previousMessage = messages[index - 1];
    const isNewDay = index === 0 || !isSameDay(message.createdAt, previousMessage?.createdAt);

    return {
      message,
      isNewDay,
      dayLabel: isNewDay ? getDayLabel(message.createdAt, index === 0) : null,
    };
  });
}

export function MessageList() {
  const activeConversationId = useActiveConversationId();
  const messages = useActiveConversationMessages();
  const hasConversation = Boolean(activeConversationId);

  const lastMessage = messages.at(-1);
  const lastMessageId = lastMessage?.id;
  const waitForImageLoad = Boolean(lastMessage?.imageUrl);
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId, waitForImageLoad);

  const messageItems = useMemo(() => buildMessageItems(messages), [messages]);
  const animatedMessageIds = useMessageEnterAnimation(activeConversationId, messages);

  const scrollToBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messagesScrollRef]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {hasConversation ? (
        <div
          ref={messagesScrollRef}
          className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-3 sm:px-3 sm:py-4"
        >
          {messageItems.map(({ message, isNewDay, dayLabel }) => (
            <Fragment key={message.id}>
              {isNewDay ? (
                <div className="my-3 flex items-center gap-3 px-2">
                  <div className="h-px flex-1 bg-muted/30" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {dayLabel}
                  </p>
                  <div className="h-px flex-1 bg-muted/30" />
                </div>
              ) : null}
              <MessageBubble
                message={message}
                animate={animatedMessageIds.has(message.id)}
                onImageLoad={
                  message.id === lastMessageId && waitForImageLoad ? scrollToBottom : undefined
                }
              />
            </Fragment>
          ))}
        </div>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}
