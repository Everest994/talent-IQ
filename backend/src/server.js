import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { fileURLToPath } from "url";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();

/* ===============================
   FIX __dirname (ES MODULE SAFE)
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());

app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);

app.use(clerkMiddleware());

/* ===============================
   API ROUTES
================================ */
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

/* ===============================
   SERVE FRONTEND (PRODUCTION)
================================ */
if (ENV.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../../frontend/dist");

  console.log("📦 Serving frontend from:", frontendPath);

  // Serve static assets
  app.use(express.static(frontendPath));

  // SPA fallback (NO ROUTE PATTERN → NO CRASH)
  app.get(/.*/, (_, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"));
  });
}

/* ===============================
   START SERVER
================================ */
const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () =>
      console.log(`🚀 Server running on port ${ENV.PORT}`)
    );
  } catch (error) {
    console.error("💥 Error starting the server:", error);
  }
};

startServer();
