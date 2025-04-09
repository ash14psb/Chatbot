import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// Initialize Firebase Admin with service account credentials
const serviceAccount = JSON.parse(
  readFileSync(path.resolve("./firebase-service-account.json"))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware to verify Firebase Token
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

// Verify if the user is an admin
export const verifyAdmin = async (req, res, next) => {
  const email = req.user.email;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    if (userRecord.customClaims?.role !== "admin") {
      return res.status(403).send({ error: true, message: "Forbidden" });
    }
    next();
  } catch (err) {
    console.error("Error verifying admin:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Export admin explicitly for use in other parts of the app
export { admin };
