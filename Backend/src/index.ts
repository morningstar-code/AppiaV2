require('dotenv').config();
import express from 'express';
import cors from 'cors';
import templateRoutes from './routes/template';
import chatRoutes from './routes/chat';
import projectRoutes from './routes/projects';
import { config } from './config/environment';

const app = express();
app.use(cors());
app.use(express.json());

// Setup routes
app.use('/template', templateRoutes);
app.use('/chat', chatRoutes);
app.use('/api/projects', projectRoutes);

app.listen(config.port, () => {
  console.log(`Gemini server running on http://localhost:${config.port}`);
});
