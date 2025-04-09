import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ImageKit from "imagekit";
import Chat from "./models/chat.js"; // Assuming you're working with chat models
import UserChats from "./models/userChats.js"; // Assuming userChats model

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Ensure CLIENT_URL is set correctly in your .env
    credentials: true,
  })
);

app.use(express.json());

// Initialize ImageKit with credentials
const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT, // Make sure this is correct in .env
});

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

// Generate authentication parameters for ImageKit
app.post("/api/upload", async (req, res) => {
  try {
    // Get authentication parameters for ImageKit
    const { signature, expire, token } = imagekit.getAuthenticationParameters();

    // Send the parameters back to the frontend
    res.json({ signature, expire, token });
  } catch (error) {
    console.error("Error generating ImageKit auth parameters:", error);
    res.status(500).send("Error generating authentication parameters");
  }
});

// Example route for creating a new chat (optional, based on your application)
app.post("/api/chats", async (req, res) => {
  const { text } = req.body;

  try {
    const newChat = new Chat({
      userId: "guest", // Using 'guest' as a placeholder for userId
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    const userChats = await UserChats.find({ userId: "guest" });

    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId: "guest",
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });

      await newUserChats.save();
    } else {
      await UserChats.updateOne(
        { userId: "guest" },
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

// Route to fetch user chats
app.get("/api/userchats", async (req, res) => {
  try {
    const userChats = await UserChats.find({ userId: "guest" });
    res.status(200).send(userChats[0].chats);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching user chats!");
  }
});

// Route to fetch a specific chat
app.get("/api/chats/:id", async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: "guest" });
    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

// Route to update a chat
app.put("/api/chats/:id", async (req, res) => {
  const { question, answer, img } = req.body;

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: req.params.id, userId: "guest" },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding conversation!");
  }
});

app.get("/", (req, res) => {
  res.send("Hello Lama Ai Server");
});

// Start the server and connect to MongoDB
app.listen(port, () => {
  connect();
  console.log(`Server running on port ${port}`);
});
