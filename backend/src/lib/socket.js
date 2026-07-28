import express from "express";
import http from "http";
import { Server } from "socket.io";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, { cors: { origin: [allowedOrigin] } });

function getReceiverSocketId(userId) {
  return userSocketMap[userId]?.socketId;
}

// Presence state: { userId: { socketId, status } }
const userSocketMap = {};
const IDLE_TIMEOUT_MS = Number(process.env.IDLE_TIMEOUT_MS || 300_000);

function broadcastPresence() {
  const presence = Object.entries(userSocketMap).reduce((acc, [userId, state]) => {
    acc[userId] = state.status;
    return acc;
  }, {});

  io.emit("getPresence", presence);
}

function setUserStatus(userId, socketId, status) {
  if (!userId) return;

  userSocketMap[userId] = { socketId, status };
  broadcastPresence();
}

function clearUserStatus(userId, socketId) {
  if (!userId || userSocketMap[userId]?.socketId !== socketId) return false;

  delete userSocketMap[userId];
  broadcastPresence();
  return true;
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    setUserStatus(userId, socket.id, "online");
  }

  socket.on("activity", () => {
    if (userId) {
      setUserStatus(userId, socket.id, "online");
    }
  });

  socket.on("idle", () => {
    if (userId) {
      setUserStatus(userId, socket.id, "idle");
    }
  });

  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && userId) {
      io.to(receiverSocketId).emit("typing", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && userId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
    }
  });

  socket.on("disconnect", () => {
    if (!clearUserStatus(userId, socket.id)) return;

    const lastOnlineAt = new Date().toISOString();
    io.emit("userOffline", { userId, lastOnlineAt });
    User.findByIdAndUpdate(userId, { lastOnlineAt }).catch((error) => {
      console.error("Failed to save last online time:", error.message);
    });
  });

  const idleTimer = setInterval(() => {
    if (!userId) return;

    const state = userSocketMap[userId];
    if (!state || state.socketId !== socket.id) return;

    if (state.status === "online") {
      setUserStatus(userId, socket.id, "idle");
    }
  }, IDLE_TIMEOUT_MS);

  socket.on("disconnect", () => {
    clearInterval(idleTimer);
  });
});

export { app, server, io, getReceiverSocketId };
