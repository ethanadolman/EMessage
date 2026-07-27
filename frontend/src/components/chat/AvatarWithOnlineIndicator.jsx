/**
 * Wraps an Avatar with a bottom-right presence dot (online / offline).
 */
export function AvatarWithOnlineIndicator({ isOnline, isIdle = false, children, dotClassName = "" }) {
  return (
    <div className="relative inline-flex shrink-0">
      {children}
      <span
        className={`pointer-events-none absolute bottom-0 right-0 z-10 size-[11px] rounded-full border-[2.5px] border-white shadow-sm dark:border-zinc-950 ${isIdle ? "bg-amber-500" : isOnline ? "bg-emerald-500" : "bg-[#C7C7CC] dark:bg-[#636366]"} ${dotClassName}`}
        aria-hidden
      />
      <span className="sr-only">{isIdle ? "Idle" : isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}