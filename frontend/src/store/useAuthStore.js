import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";
const DEFAULT_IDLE_TIMEOUT_MS = 300_000;
const MOBILE_IDLE_TIMEOUT_MS = 300_000;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  presenceMap: {},
  lastOnlineMap: {},
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
    set({ authUser: null, isCheckingAuth: false, onlineUsers: [], lastOnlineMap: {} });
    get().disconnectSocket();
  },

  connectSocket: (user) => {
    if (!user || get().socket?.connected) return;

    const socket = io(BASE_URL, { query: { userId: user._id } });

    set({ socket });

    let idleTimer = null;

    const isMobileDevice = () =>
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;

    const getIdleTimeout = () =>
      isMobileDevice() ? MOBILE_IDLE_TIMEOUT_MS : DEFAULT_IDLE_TIMEOUT_MS;

    const resetActivity = () => {
      if (!socket.connected) return;
      socket.emit("activity");
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        console.log("🟡 User went idle");
        socket.emit("idle");
      }, getIdleTimeout());
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "touchmove",
      "scroll",
      "click",
      "pointerdown",
      "pointermove",
      "focus",
      "pageshow",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, resetActivity, { passive: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        resetActivity();
      }
    });

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

    socket.on("userOffline", ({ userId, lastOnlineAt }) => {
      if (!userId || !lastOnlineAt) return;

      set((state) => ({
        lastOnlineMap: { ...state.lastOnlineMap, [userId]: lastOnlineAt },
      }));
    });

    resetActivity();
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [], presenceMap: {}, lastOnlineMap: {} });
  },
}));
