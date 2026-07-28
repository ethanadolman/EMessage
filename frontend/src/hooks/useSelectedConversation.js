import { useMemo } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// John Doe -> JD
export function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("");
}

function mapMessage(message, authUserId) {
  return {
    id: message._id,
    role: String(message.senderId) === String(authUserId) ? "me" : "them",
    text: message.text || "",
    time: formatMessageTime(message.createdAt),
    createdAt: message.createdAt,
    imageUrl: message.image,
    videoUrl: message.video,
    audioUrl: message.audio,
    audioName: message.audioName,
  };
}

function useSelectedUser() {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const users = useChatStore((state) => state.users);
  const conversations = useChatStore((state) => state.conversations);

  return useMemo(() => {
    if (!activeConversationId) return null;

    return (
      users.find((user) => user._id === activeConversationId) ||
      conversations.find((user) => user._id === activeConversationId) ||
      null
    );
  }, [activeConversationId, users, conversations]);
}

export function useActiveConversationId() {
  return useChatStore((state) => state.activeConversationId);
}

export function useIsLargeScreen() {
  return useMediaQuery("(min-width: 1024px)");
}

export function useActiveConversationMessages() {
  const messages = useChatStore((state) => state.messages);
  const authUserId = useAuthStore((state) => state.authUser?._id);

  return useMemo(
    () => messages.map((message) => mapMessage(message, authUserId)),
    [messages, authUserId],
  );
}

export function useActiveConversationPeer() {
  const selectedUser = useSelectedUser();
  const activeConversationId = useActiveConversationId();
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const presenceMap = useAuthStore((state) => state.presenceMap);
  const lastOnlineMap = useAuthStore((state) => state.lastOnlineMap);
  const isTyping = useChatStore((state) =>
    activeConversationId ? Boolean(state.typingUsers[activeConversationId]) : false,
  );

  return useMemo(() => {
    if (!selectedUser) return null;

    return {
      name: selectedUser.fullName,
      subtitle: selectedUser.email,
      isOnline: onlineUsers.includes(selectedUser._id),
      isIdle: presenceMap?.[selectedUser._id] === "idle",
      lastOnlineAt: lastOnlineMap?.[selectedUser._id] || selectedUser.lastOnlineAt,
      isTyping,
      avatarUrl: selectedUser.profilePic,
      initials: getInitials(selectedUser.fullName),
    };
  }, [selectedUser, onlineUsers, presenceMap, lastOnlineMap, isTyping]);
}

export function useSelectedConversation() {
  const activeConversationId = useActiveConversationId();
  const peer = useActiveConversationPeer();
  const messages = useActiveConversationMessages();
  const isLargeScreen = useIsLargeScreen();

  const activeConversation = useMemo(() => {
    if (!activeConversationId || !peer) return null;

    return {
      id: activeConversationId,
      peer,
      messages,
    };
  }, [activeConversationId, peer, messages]);

  return {
    activeConversation,
    activeConversationId,
    isLargeScreen,
  };
}
