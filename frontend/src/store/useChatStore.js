import { create } from "zustand";
import { persist } from "zustand/middleware";

import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create(
  persist(
    (set, get) => ({
      users: [],
      conversations: [],
      messages: [],
      selectedUser: null,
      isConversationsLoading: false,
      isUsersLoading: false,
      isMessagesLoading: false,
      activeConversationId: null,
      searchQuery: "",
      sidebarTab: "chats",
      composerText: "",
      isSoundEnabled: true,
      isSendingMedia: false,
      typingUsers: {},
      unreadCounts: {},

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set((state) => ({
            users: res.data,
            selectedUser:
              state.selectedUser && res.data.some((user) => user._id === state.selectedUser._id)
                ? state.selectedUser
                : null,
          }));
        } catch (error) {
          console.log("Error in get Users", error.message);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
          const res = await axiosInstance.get("/messages/conversations");
          set({ conversations: res.data });
        } catch (error) {
          console.log("Error in getConversations", error.message);
        } finally {
          set({ isConversationsLoading: false });
        }
      },

      getMessages: async (userId) => {
        if (!userId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return false;

        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          set({ messages: [...messages, res.data], composerText: "" });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
          return false;
        }
      },

      subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");

        const showIncomingMessageNotification = (message, sender, conversationId) => {
          if (typeof window === "undefined") return;
          if (typeof window.Notification === "undefined") return;

          const isConversationOpen = get().activeConversationId === conversationId;
          const shouldSkip =
            document.visibilityState === "visible" &&
            window.document.hasFocus() &&
            isConversationOpen;

          if (shouldSkip) return;

          const senderName = sender?.fullName || sender?.name || "a contact";
          const senderAvatar = sender?.profilePic || sender?.avatarUrl || "/favicon.ico";

          if (window.Notification.permission === "granted") {
            new window.Notification(`${senderName}`, {
              body: message.text || "You received a new message",
              icon: senderAvatar,
            });
          } else if (window.Notification.permission === "default") {
            window.Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                new window.Notification(`${senderName}`, {
                  body: message.text || "You received a new message",
                  icon: senderAvatar,
                });
              }
            });
          }
        };

        socket.on("newMessage", (newMessage) => {
          const { selectedUser, activeConversationId } = get();
          const authUserId = useAuthStore.getState().authUser?._id;
          const conversationPartnerId =
            String(newMessage.senderId) === String(authUserId)
              ? String(newMessage.receiverId)
              : String(newMessage.senderId);
          const selectedConversationId = selectedUser ? String(selectedUser._id) : null;
          const isMatchingOpenConversation =
            activeConversationId && String(activeConversationId) === conversationPartnerId;
          const isOpenConversation = isMatchingOpenConversation || selectedConversationId === conversationPartnerId;

          // Always refresh sidebar
          get().getConversations();

          if (isOpenConversation) {
            get().getMessages(conversationPartnerId);
            get().clearUnreadCount(conversationPartnerId);
          } else {
            get().incrementUnreadCount(conversationPartnerId);
            const sender = get().users.find((user) => String(user._id) === String(conversationPartnerId));
            showIncomingMessageNotification(newMessage, sender, conversationPartnerId);
          }

          // Also append immediately if the conversation is currently open
          if (selectedConversationId === conversationPartnerId) {
            set((state) => ({
              messages: state.messages.some((message) => message._id === newMessage._id)
                ? state.messages
                : [...state.messages, newMessage],
            }));
          }
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage");
      },

      subscribeToTyping: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("typing");
        socket.off("stopTyping");

        socket.on("typing", ({ senderId }) => {
          if (senderId) {
            get().setTypingUser(senderId, true);
          }
        });

        socket.on("stopTyping", ({ senderId }) => {
          if (senderId) {
            get().setTypingUser(senderId, false);
          }
        });
      },

      unsubscribeFromTyping: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("typing");
        socket?.off("stopTyping");
      },

      setSelectedUser: (selectedUser) => set({ selectedUser }),

      setActiveConversationId: (activeConversationId) => {
        set((state) => ({
          activeConversationId,
          selectedUser:
            state.users.find((user) => user._id === activeConversationId) ||
            state.conversations.find((user) => user._id === activeConversationId) ||
            null,
          messages: activeConversationId ? state.messages : [],
        }));

        if (activeConversationId) {
          get().clearUnreadCount(activeConversationId);
        }
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setComposerText: (composerText) => set({ composerText }),
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),
      setTypingUser: (userId, isTyping) =>
        set((state) => {
          const nextTypingUsers = { ...state.typingUsers };

          if (isTyping) {
            nextTypingUsers[userId] = true;
          } else {
            delete nextTypingUsers[userId];
          }

          return { typingUsers: nextTypingUsers };
        }),

      incrementUnreadCount: (userId) =>
        set((state) => {
          if (!userId) return state;

          return {
            unreadCounts: {
              ...state.unreadCounts,
              [userId]: (state.unreadCounts[userId] || 0) + 1,
            },
          };
        }),

      clearUnreadCount: (userId) =>
        set((state) => {
          if (!userId) return state;

          const nextUnreadCounts = { ...state.unreadCounts };
          delete nextUnreadCounts[userId];

          return { unreadCounts: nextUnreadCounts };
        }),

      sendTextMessage: async (conversationId) => {
        const messageText = get().composerText.trim();
        if (!conversationId || !messageText) return false;

        return get().sendMessage({ text: messageText });
      },

      sendMediaMessage: async ({ conversationId, file }) => {
        if (!conversationId || !file) return false;

        const formData = new FormData();
        formData.append("media", file);

        set({ isSendingMedia: true });
        try {
          return await get().sendMessage(formData);
        } finally {
          set({ isSendingMedia: false });
        }
      },
    }),
    {
      name: "imessage-storage",
      partialize: (state) => ({
        isSoundEnabled: state.isSoundEnabled,
        unreadCounts: state.unreadCounts,
      }),
    },
  ),
);