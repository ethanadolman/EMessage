import { Avatar } from "@heroui/react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";
import { TypingIndicator } from "./TypingIndicator";

export function ConversationRow({ user, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left ${
        selected ? "bg-accent-soft" : ""
      }`}
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
  );
}