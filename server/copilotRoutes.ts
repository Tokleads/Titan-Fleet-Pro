import { Router } from 'express';
import { requireAuth } from './jwtAuth';
import { runCopilot } from './copilotService';

const router = Router();

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ error: 'Message too long' });
    }

    const response = await runCopilot(user.companyId, history, message.trim());
    res.json({ response });
  } catch (error: any) {
    console.error('[Copilot] Error:', error);
    res.status(500).json({ error: 'Copilot service error. Please try again.' });
  }
});

export default router;
