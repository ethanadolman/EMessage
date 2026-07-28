import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
    pinnedConversationIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    hiddenConversationIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    lastOnlineAt: {
        type: Date,
    },
}, 
{timestamps:true}, // createdAt & updatedAt
);

const User = mongoose.model("User",userSchema);

export default User;
