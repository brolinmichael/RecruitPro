const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Initialize Google Generative AI (Requires GEMINI_API_KEY in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
// Set up multer for memory storage (for resume uploads)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// --- Mock Database ---
let jobs = [];
let candidates = [];

// --- Authentication (Mock) ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email && password.length >= 6) {
        res.json({ token: 'mock-jwt-token-12345', user: { email } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- Dashboard (Mock) ---
app.get('/api/dashboard/kpis', (req, res) => {
    res.json({
        totalCandidates: candidates.length || 124,
        activeJobs: jobs.length || 8,
        timeToHire: 18,
        interviews: 24
    });
});

// --- Jobs API ---
app.get('/api/jobs', (req, res) => {
    res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
    const newJob = { id: Date.now().toString(), ...req.body, status: 'Active' };
    jobs.unshift(newJob);
    res.status(201).json(newJob);
});

// --- Candidates API ---
app.get('/api/candidates', (req, res) => {
    res.json(candidates);
});

app.post('/api/candidates', upload.single('resume'), (req, res) => {
    const newCandidate = { 
        id: Date.now().toString(), 
        ...req.body,
        score: req.body.score ? parseInt(req.body.score) : null,
        stage: req.body.stage || 'applied'
    };
    candidates.unshift(newCandidate);
    res.status(201).json(newCandidate);
});

app.patch('/api/candidates/:id/stage', (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
        candidate.stage = stage;
        res.json(candidate);
    } else {
        res.status(404).json({ error: 'Candidate not found' });
    }
});

// --- AI Resume Scoring API ---
app.post('/api/candidates/score', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }

        const position = req.body.position || 'General';
        let resumeText = '';

        // Extract text from PDF
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            resumeText = data.text;
        } else {
            // Fallback for text/plain
            resumeText = req.file.buffer.toString('utf-8');
        }

        // If no API key is provided, generate a simulated realistic score
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_key') {
            const mockScore = Math.floor(Math.random() * (95 - 65 + 1) + 65);
            return res.json({ 
                score: mockScore, 
                reasoning: "Simulated AI Score. Please set GEMINI_API_KEY in .env for real AI evaluation.",
                parsedSkills: ["JavaScript", "React", "Node.js"] // Mock skills
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are an expert technical recruiter. Evaluate the following resume text for the position of "${position}".
            Return a JSON object with the following structure:
            {
                "score": <integer from 0 to 100 based on fit>,
                "reasoning": "<a short 2-sentence explanation of the score>",
                "parsedSkills": ["<skill1>", "<skill2>"]
            }
            
            Resume Text:
            ${resumeText.substring(0, 5000)} // Limit text to avoid token limits
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Extract JSON from response (handling potential markdown blocks)
        let jsonStr = responseText;
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
            jsonStr = match[1];
        }
        
        const aiEvaluation = JSON.parse(jsonStr);
        res.json(aiEvaluation);

    } catch (error) {
        console.error('AI Evaluation Error:', error);
        res.status(500).json({ error: 'Failed to process and score resume.' });
    }
});

app.listen(port, () => {
    console.log(`RecruitPro API and Server running on http://localhost:${port}`);
    console.log(`AI Scoring ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Simulated (No API Key)'}`);
});
