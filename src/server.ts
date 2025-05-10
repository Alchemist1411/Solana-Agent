import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import agentRouter from "./routes/agent";
import healthCheckRouter from "./routes/healthCheck";
import messariChatRouter from "./routes/messariChat";
import messariRouter from "./routes/messari";
import signUpRouter from "./routes/Auth/SignUp";
import signInRouter from "./routes/Auth/SignIn";
import verifyRouter from "./routes/Auth/Verify";

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
dotenv.config();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://arrakas-ai.vercel.app"],
    credentials: true,
  })
);

app.use("/v1/agent", agentRouter);
app.use("/", healthCheckRouter);
app.use("/messari", messariChatRouter);
app.use("/", messariRouter);
app.use("/auth", signUpRouter);
app.use("/auth", signInRouter);
app.use("/auth", verifyRouter);

app.listen(port, () => {
    console.log(`Service is running on port: ${port}`);
});