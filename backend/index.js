import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ImageKit from "imagekit";
import { ObjectId } from "mongodb";

import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import User from "./models/User.js";

import {
  verifyFirebaseToken,
  verifyAdmin,
  admin,
} from "./firebase/firebaseConfig.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// MongoDB connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
};

// ImageKit config
const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
});

// ImageKit route for generating authentication parameters
app.post("/api/upload", (req, res) => {
  try {
    const { signature, expire, token } = imagekit.getAuthenticationParameters();
    res.json({ signature, expire, token });
  } catch (error) {
    console.error("Error generating ImageKit auth:", error);
    res.status(500).send("Error generating authentication parameters");
  }
});

// Firebase protected routes
app.use("/api", verifyFirebaseToken);

// --- Chat Routes ---
app.post("/api/chats", async (req, res) => {
  const { text } = req.body;
  const userId = req.user.uid;

  try {
    const newChat = new Chat({
      userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    const userChats = await UserChats.find({ userId });

    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId,
        chats: [{ _id: savedChat._id, title: text.substring(0, 40) }],
      });
      await newUserChats.save();
    } else {
      await UserChats.updateOne(
        { userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );
    }

    res.status(201).send(savedChat._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating chat!");
  }
});

// Route to get user chats
app.get("/api/userchats", async (req, res) => {
  const userId = req.user.uid;
  try {
    const userChats = await UserChats.find({ userId });
    res.status(200).send(userChats[0]?.chats || []);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user chats!");
  }
});

// Route to get chat by ID
app.get("/api/chats/:id", async (req, res) => {
  const userId = req.user.uid;
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    res.status(200).send(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching chat!");
  }
});

// Route to update chat
app.put("/api/chats/:id", async (req, res) => {
  const { question, answer, img } = req.body;
  const userId = req.user.uid;

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: req.params.id, userId },
      { $push: { history: { $each: newItems } } }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating chat!");
  }
});

// --- User Routes ---
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "uid name email photoURL");
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
});

app.post("/api/users", async (req, res) => {
  const user = req.body;
  const existing = await User.findOne({ email: user.email });

  if (existing) return res.send({ message: "User already exists" });

  const newUser = new User(user);
  await newUser.save();
  res.send({ message: "User created" });
});

app.get("/api/users/admin/:email", async (req, res) => {
  const email = req.params.email;
  if (req.user.email !== email) {
    return res.send({ admin: false });
  }

  const user = await User.findOne({ email });
  res.send({ admin: user?.role === "admin" });
});

app.patch("/api/users/admin/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await User.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role: "admin" } }
    );
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: "Failed to promote user" });
  }
});

app.get("/api/all-users", verifyAdmin, async (req, res) => {
  try {
    const result = await User.find();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: true, message: "Failed to get users" });
  }
});

app.get("/api/firebase-users", async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: true, message: "Internal server error" });
  }
});

app.delete("/api/delete-user/:uid", async (req, res) => {
  const uid = req.params.uid;
  try {
    await admin.auth().deleteUser(uid);
    const deleteResult = await User.deleteOne({ uid });

    if (deleteResult.deletedCount === 1) {
      res.status(200).send({ message: "User deleted successfully" });
    } else {
      res.status(404).send({ message: "User not found in MongoDB" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: true, message: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("🔥 Chatbot AI Server is Running 🔥");
});

// Start server
app.listen(port, () => {
  connect();
  console.log(`🚀 Server running on port ${port}`);
});
