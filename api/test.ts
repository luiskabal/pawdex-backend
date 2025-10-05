export default async (req: any, res: any) => {
  try {
    res.status(200).json({ 
      message: 'PawDex Backend is working!', 
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};