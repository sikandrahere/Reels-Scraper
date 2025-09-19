import express from 'express';
const router = express.Router();
import scrapeReels from "../services/scrape.services.js"

router.get('/', async (req, res) => {
 const{username,limit}=req.query

  const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 50); // default 20, max 50

  try {
    const reels = await scrapeReels(username, safeLimit);
    res.json(reels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router