require('dotenv').config();
import express from 'express';
import cors from 'cors';
import templateRoutes from './routes/template';
import chatRoutes from './routes/chat';
import projectRoutes from './routes/projects';
import { config } from './config/environment';

const app = express();
app.use(cors({
  origin: ['https://appia-v2.vercel.app', 'https://appia-v2-*.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'AppiaV2 API is running!', status: 'ok' });
});

// Setup routes
app.use('/template', templateRoutes);
app.use('/chat', chatRoutes);
app.use('/api/projects', projectRoutes);

app.listen(config.port, () => {
  console.log(`Gemini server running on http://localhost:${config.port}`);
});
