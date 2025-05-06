import express from "express";

const router = express.Router();

router.get("/nounce", async (req:any, res:any) => {
  const nonce = Math.floor(Math.random() * 1000000);
  res.json({ nonce });
});

export default router;
