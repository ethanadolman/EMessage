import { useEffect, useRef } from "react";

/**
 * Scrolls a container to the bottom when `threadKey` or `lastItemId` changes.
 * If `waitForImageLoad` is true, the scroll happens later via the image load callback.
 */
function useScrollToBottom(threadKey, lastItemId, waitForImageLoad = false) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (threadKey == null || threadKey === "") return;
    const el = scrollRef.current;
    if (!el || waitForImageLoad) return;

    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    };

    scrollToBottom();
  }, [threadKey, lastItemId, waitForImageLoad]);

  return scrollRef;
}

export default useScrollToBottom;