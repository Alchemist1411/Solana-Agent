import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/verify", (req: any, res: any) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).end();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof payload === "object" && payload !== null && "sub" in payload && "addr" in payload) {
      return res.json({ user: { id: payload.sub, publicKey: payload.addr } });
    } else {
      return res.status(401).end();
    }
  } catch {
    return res.status(401).end();
  }
});

export default router;