import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import agentRouter from "./routes/agent";
import healthCheckRouter from "./routes/healthCheck";
import messariChatRouter from "./routes/messariChat";
import messariRouter from "./routes/messari";

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
dotenv.config();
app.use(cors());

app.use("/v1/agent", agentRouter);
app.use("/", healthCheckRouter);
app.use("/messari", messariChatRouter);
app.use("/", messariRouter);

app.listen(port, () => {
    console.log(`Service is running on port: ${port}`);
});