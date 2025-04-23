import { Router, Request, Response } from 'express';
import { getAssetsROIInfo } from '../messariSpecific/roi';
import { getNewsFeed } from '../messariSpecific/newsFeed';

const router = Router();

router.get('/roi', async (req: Request, res: Response) => {
    try {
        const roiData = await getAssetsROIInfo();
        res.json({ data: roiData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ROI data' });
    }
});

router.get('/news/feed', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const news = await getNewsFeed(page, limit);
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news feed' });
    }
});

export default router;