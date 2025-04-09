import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync(path.resolve("./firebase-service-account.json"))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized");
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach user info to request
    next();
  } catch (err) {
    console.error("Firebase token verification failed:", err);
    res.status(403).send("Forbidden");
  }
};
