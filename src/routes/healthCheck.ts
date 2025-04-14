import { Router, Request, Response } from "express";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.get('/healthCheck', (req: Request, res: Response) => {
    res.send('All good!, backend is live');
});


const pollHealthCheck = () => {
    const healthCheckUrl = process.env.HEALTH_CHECK_URL || "";
    setInterval(async () => {
        try {
            const response = await axios.get(healthCheckUrl);
            console.log(response.data);
        } catch (error) {
            console.error('Health Check Failed:', error);
        }
    }, 5 * 60 * 1000);
};

pollHealthCheck();

export default router;