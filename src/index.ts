import express from 'express';
import subjectRouter from './routes/subjects';
import cors from 'cors';

const app = express();
const PORT = 8000;

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
    throw new Error('FRONTEND_URL is required');
}

app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

app.use('/api/subjects', subjectRouter);

app.get('/', (_req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
