import express from "express";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import User from "../../models/user";

const router = express.Router();

router.post("/signin", async (req: any, res: any) => {
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

  // Find or create user
  let user = await User.findOne({ publicKey });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Issue JWT
  const token = jwt.sign(
    { sub: user._id, addr: user.publicKey },
    process.env.JWT_SECRET!,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  });

  return res.json({ user: { id: user._id, publicKey: user.publicKey } });
});

export default router;