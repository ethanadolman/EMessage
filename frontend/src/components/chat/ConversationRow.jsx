import { memo } from "react";
import { Avatar, Button } from "@heroui/react";
import { StarIcon, Trash2Icon } from "lucide-react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { useChatStore } from "../../store/useChatStore";

function ConversationRowComponent({
  user,
  selected,
  onTogglePin,
  isPinning = false,
  onDelete,
  isDeleting = false,
}) {
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);

  return (
    <div
      className={`group flex w-full items-center gap-1 border-b border-border py-1.5 pl-3 pr-1.5 ${
        selected ? "bg-accent-soft" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setActiveConversationId(user.id)}
        className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
      >
        <div className="relative shrink-0">
        <AvatarWithOnlineIndicator isOnline={user.isOnline ?? true} isIdle={user.isIdle ?? false}>
          <Avatar className="size-12 shrink-0">
            <Avatar.Image alt={user.name} src={user.avatarUrl} />
            <Avatar.Fallback className="text-sm font-medium">{user.initials}</Avatar.Fallback>
          </Avatar>
        </AvatarWithOnlineIndicator>
        {user.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-red-600 px-1 text-[10px] font-semibold text-white shadow">
            {user.unreadCount > 9 ? "9+" : user.unreadCount}
          </span>
        ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{user.name}</p>
          {user.isTyping || user.preview ? (
            <p className="truncate text-sm text-muted">
              {user.isTyping ? <TypingIndicator className="text-muted" label="Typing" /> : user.preview}
            </p>
          ) : null}
        </div>
      </button>
      <div className="flex shrink-0 items-center">
        {onTogglePin ? (
          <Button
          variant="ghost"
          size="sm"
          isIconOnly
          isDisabled={isPinning}
          className={`shrink-0 transition-opacity ${
            user.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } ${user.isPinned ? "text-amber-400" : "text-muted hover:text-amber-400"}`}
          aria-label={user.isPinned ? `Remove ${user.name} from favorites` : `Favorite ${user.name}`}
          title={user.isPinned ? "Remove from favorites" : "Favorite chat"}
          onPress={onTogglePin}
          >
            <StarIcon className="size-4" fill={user.isPinned ? "currentColor" : "none"} aria-hidden />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            isDisabled={isDeleting}
            className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger"
            aria-label={`Delete chat with ${user.name}`}
            title="Delete chat"
            onPress={onDelete}
          >
            <Trash2Icon className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export const ConversationRow = memo(ConversationRowComponent);
