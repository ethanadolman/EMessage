import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";
const IDLE_TIMEOUT_MS = 120_000;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  presenceMap: {},
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });

      get().connectSocket(res.data);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  clearAuth: () => {
    set({ authUser: null, isCheckingAuth: false, onlineUsers: [] });
    get().disconnectSocket();
  },

  connectSocket: (user) => {
    if (!user || get().socket?.connected) return;

    const socket = io(BASE_URL, { query: { userId: user._id } });

    set({ socket });

    let idleTimer = null;

    const resetActivity = () => {
      if (!socket.connected) return;
      socket.emit("activity");
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        console.log("🟡 User went idle");
        socket.emit("idle");
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((eventName) => window.addEventListener(eventName, resetActivity, { passive: true }));

    socket.on("connect", () => {
      console.log("🟢 Connected:", socket.id);
      resetActivity();
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", reason);
      if (idleTimer) window.clearTimeout(idleTimer);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    socket.on("getPresence", (presenceMap) => {
      const onlineUsers = Object.entries(presenceMap)
        .filter(([, status]) => status === "online" || status === "idle")
        .map(([userId]) => userId);

      set({ onlineUsers, presenceMap });
    });

    resetActivity();
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [], presenceMap: {} });
  },
}));