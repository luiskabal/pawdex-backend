import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: 'healthy',
    message: 'PawDex Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'vercel'
  });
}