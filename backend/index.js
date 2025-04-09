import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ImageKit from "imagekit";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { verifyFirebaseToken } from "./firebase/firebaseConfig.js";
import User from "./models/User.js"; // Import User model

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

// MongoDB connection setup
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
};

// ImageKit config setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
});

// ImageKit auth route
app.post("/api/upload", (req, res) => {
  try {
    const { signature, expire, token } = imagekit.getAuthenticationParameters();
    res.json({ signature, expire, token });
  } catch (error) {
    console.error("Error generating ImageKit auth parameters:", error);
    res.status(500).send("Error generating authentication parameters");
  }
});

// Protected routes with Firebase Auth
app.use("/api", verifyFirebaseToken);

// Create new chat
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
    console.log(err);
    res.status(500).send("Error creating chat!");
  }
});

// Fetch user chats
app.get("/api/userchats", async (req, res) => {
  const userId = req.user.uid;
  try {
    const userChats = await UserChats.find({ userId });
    res.status(200).send(userChats[0]?.chats || []);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching user chats!");
  }
});

// Get specific chat
app.get("/api/chats/:id", async (req, res) => {
  const userId = req.user.uid;
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

// Update chat
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
    console.log(err);
    res.status(500).send("Error updating chat!");
  }
});

<<<<<<< HEAD
app.get("/", (req, res) => {
  res.send("Hello Lama Ai Server");
});

// Start the server and connect to MongoDB
=======
// Fetch all users (new route)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "uid name email photoURL");
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching users");
  }
});

// Start the server
>>>>>>> 964eec64a633b3a9c94e5ba739b1b2b4bd340494
app.listen(port, () => {
  connect();
  console.log(`Server running on port ${port}`);
});
