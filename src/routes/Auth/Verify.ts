import express from "express";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/verify", async (req: any, res: any) => {
  const { publicKey, signature } = req.body;

  const staticMessage = "Sign in to Arrakas AI";
  const messageBytes = Buffer.from(staticMessage);
  const sigBytes = Buffer.from(signature, "hex");

  let pubkeyBytes;
  try {
    const bs58 = (await import("bs58")).default;
    pubkeyBytes = bs58.decode(publicKey);
  } catch {
    return res.status(400).json({ error: "Invalid public key" });
  }

  const valid = nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
  if (!valid) return res.status(401).json({ error: "Invalid signature" });

  return res.json({ user: { publicKey } });
});

export default router;