import useScrollToBottom from "../../hooks/useScrollToBottom";
import { MessageBubble } from "./MessageBubble";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";

export function MessageList() {
  const { activeConversation, activeConversationId } = useSelectedConversation();

  const lastMessage = activeConversation?.messages.at(-1);
  const lastMessageId = lastMessage?.id;
  const waitForImageLoad = Boolean(lastMessage?.imageUrl);
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId, waitForImageLoad);

  const scrollToBottom = () => {
    const el = messagesScrollRef.current;
    if (!el) return;

    const applyScroll = () => {
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    };

    applyScroll();
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {activeConversation ? (
        <div
          ref={messagesScrollRef}
          className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4"
        >
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
            Today
          </p>
          {activeConversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onImageLoad={message.id === lastMessageId && waitForImageLoad ? scrollToBottom : undefined}
            />
          ))}
        </div>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}