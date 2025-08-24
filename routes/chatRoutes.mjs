import express from 'express';
import {
  renderChat,
  handleChat,
  askMitre
} from '../controllers/chatController.mjs';

const router = express.Router();

router.get('/chat', renderChat);
router.post('/chat', handleChat);
router.post('/api/chat/ask', askMitre);

export default router;
