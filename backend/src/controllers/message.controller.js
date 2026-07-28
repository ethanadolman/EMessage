import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-clerkId");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getConversationsForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;
    const pinnedConversationIds = req.user.pinnedConversationIds || [];
    const hiddenConversationIds = req.user.hiddenConversationIds || [];

    const conversations = await Message.aggregate([
      // 1. Keep only the messages I sent or received.
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      // 2. Sort by time so the latest message is the one we keep.
      { $sort: { createdAt: 1 } },
      // 3. Collapse them into one row per chat partner, noting the latest message details.
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
          lastMessageText: { $last: "$text" },
          lastMessageImage: { $last: "$image" },
          lastMessageVideo: { $last: "$video" },
          lastMessageAudio: { $last: "$audio" },
        },
      },
      { $match: { _id: { $nin: hiddenConversationIds } } },
      // 4. Mark favorites, then keep them at the top in recency order.
      { $addFields: { isPinned: { $in: ["$_id", pinnedConversationIds] } } },
      { $sort: { isPinned: -1, lastMessageAt: -1 } },
      // 5. Look up each partner's user profile.
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      // 6. Merge the preview fields into the user document.
      {
        $addFields: {
          _id: "$user._id",
          clerkId: "$user.clerkId",
          fullName: "$user.fullName",
          profilePic: "$user.profilePic",
          email: "$user.email",
          lastOnlineAt: "$user.lastOnlineAt",
          createdAt: "$user.createdAt",
          updatedAt: "$user.updatedAt",
          lastMessageAt: "$lastMessageAt",
          lastMessagePreview: {
            $cond: [
              { $ifNull: ["$lastMessageVideo", false] },
              "Sent a video",
              {
                $cond: [
                  { $ifNull: ["$lastMessageAudio", false] },
                  "Sent an audio file",
                  {
                    $cond: [
                      { $ifNull: ["$lastMessageImage", false] },
                      "Sent an image",
                      {
                        $cond: [
                          { $gt: [{ $strLenCP: { $ifNull: ["$lastMessageText", ""] } }, 0] },
                          "$lastMessageText",
                          "",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      // 7. Remove sensitive fields and keep the user profile plus the preview.
      {
        $project: {
          user: 0,
          lastMessageText: 0,
          lastMessageImage: 0,
          lastMessageVideo: 0,
          lastMessageAudio: 0,
        },
      },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversationsForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;
    let audioUrl;
    let audioName;

    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }

      const url = await uploadChatMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) videoUrl = url;
      else if (req.file.mimetype.startsWith("audio/")) {
        audioUrl = url;
        audioName = req.file.originalname;
      }
      else imageUrl = url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      audioName,
    });

    await newMessage.save();

    // A new message restores this existing thread for either participant if it was hidden.
    await Promise.all([
      User.findByIdAndUpdate(senderId, { $pull: { hiddenConversationIds: receiverId } }),
      User.findByIdAndUpdate(receiverId, { $pull: { hiddenConversationIds: senderId } }),
    ]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    // only send the message in realtime if user is online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function toggleConversationPin(req, res) {
  try {
    const { id: conversationId } = req.params;
    const isPinned = req.user.pinnedConversationIds?.some(
      (id) => String(id) === String(conversationId),
    );

    const update = isPinned
      ? { $pull: { pinnedConversationIds: conversationId } }
      : { $addToSet: { pinnedConversationIds: conversationId } };
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });

    res.status(200).json({
      isPinned: Boolean(user.pinnedConversationIds?.some((id) => String(id) === String(conversationId))),
    });
  } catch (error) {
    console.error("Error toggling conversation pin:", error.message);
    res.status(500).json({ message: "Failed to update favorite" });
  }
}

export async function deleteConversation(req, res) {
  try {
    const { id: conversationId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { hiddenConversationIds: conversationId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting conversation:", error.message);
    res.status(500).json({ message: "Failed to delete chat" });
  }
}
