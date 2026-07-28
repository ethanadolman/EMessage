import { useRef } from "react";

/**
 * Returns message IDs that should play the enter animation.
 * Initial history on conversation load is skipped; only newly arriving messages animate.
 */
export function useMessageEnterAnimation(conversationId, messages) {
  const seenMessageIdsRef = useRef(new Set());
  const animatedMessageIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);
  const conversationIdRef = useRef(conversationId);

  if (conversationIdRef.current !== conversationId) {
    conversationIdRef.current = conversationId;
    seenMessageIdsRef.current = new Set();
    animatedMessageIdsRef.current = new Set();
    initialLoadDoneRef.current = false;
  }

  if (conversationId && messages.length > 0) {
    if (!initialLoadDoneRef.current) {
      seenMessageIdsRef.current = new Set(messages.map((message) => message.id));
      initialLoadDoneRef.current = true;
    } else {
      for (const message of messages) {
        if (seenMessageIdsRef.current.has(message.id)) continue;

        seenMessageIdsRef.current.add(message.id);
        animatedMessageIdsRef.current.add(message.id);
      }
    }
  }

  return animatedMessageIdsRef.current;
}
