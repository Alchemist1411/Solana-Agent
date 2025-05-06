import express from "express";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import User from "../../models/user";

const router = express.Router();

router.post("/signup", async (req:any, res:any) => {
  const { publicKey, signature, nonce } = req.body;
  const sessionNonce = req.session?.nonce;
  if (!sessionNonce || nonce !== sessionNonce) {
    return res.status(400).json({ error: "Invalid or expired nonce" });
  }

  // Clear the nonce so it can't be reused
  delete req.session.nonce;

  // Verify signature
  const msg = Buffer.from(nonce);
  const sig = Buffer.from(signature, "hex");
  let pubkeyBytes;
  try {
    const bs58 = (await import("bs58")).default;
    pubkeyBytes = bs58.decode(publicKey);
  } catch {
    return res.status(400).json({ error: "Invalid publicKey format" });
  }
  const valid = nacl.sign.detached.verify(msg, sig, pubkeyBytes);
  if (!valid) return res.status(401).json({ error: "Bad signature" });

  // Find or create user
  let user = await User.findOne({ publicKey });
  if (!user) {
    user = await User.create({ publicKey });
  }

  // Issue JWT
  const token = jwt.sign(
    { sub: user._id, addr: user.publicKey },
    process.env.JWT_SECRET!,
    { algorithm: "HS256", expiresIn: "1h" }
  );

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  });

  return res.json({ user: { id: user._id, publicKey: user.publicKey } });
});

export default router;