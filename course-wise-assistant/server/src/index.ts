import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import logger from 'morgan';
import user_router from './routes/auth-route';
import course_router from './routes/course-route';
import topic_router from './routes/topic-route';
import material_router from './routes/material-route';
import chat_router from './routes/chat-route';
import math_chat_router from './routes/math-chat-route';
import research_paper_router from './routes/research-paper-route';

dotenv.config();

const app = express();

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    maxAge: 86400,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Mount routers
app.use('/api/auth', user_router);
app.use('/api/courses', course_router);
app.use('/api/topics', topic_router);
app.use('/api/materials', material_router);
app.use('/api/chats', chat_router);
app.use('/api/math-chats', math_chat_router);
app.use('/api/research-papers', research_paper_router);

app.get('/', (req, res) => {
  res.send('Company & task server is running');
});

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log('App error -> ', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

// catch all the unknown routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log('Server running on http://localhost:8000');
});
