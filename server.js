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
let jobs = [
    {
        id: '1',
        title: 'Senior UI/UX Designer',
        department: 'Design',
        description: 'We are seeking an experienced Senior UI/UX Designer to craft beautiful and intuitive web experiences. Requirements: 5+ years experience, Figma mastery, strong portfolio.',
        status: 'Active',
        postedDate: new Date().toISOString()
    }
];
let candidates = [];
let interviews = [];

// --- Automation Engine & Mock Services ---

const mockEmailService = {
    send: (to, subject, body) => {
        console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
        console.log(`Body: ${body}`);
        return true;
    }
};

const mockCalendarService = {
    getAvailableSlots: () => {
        const slots = [];
        const today = new Date();
        for (let i = 1; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            date.setHours(10, 0, 0, 0);
            slots.push(date.toISOString());
        }
        return slots;
    },
    createEvent: (candidateId, startTime) => {
        const eventId = `evt-${Date.now()}`;
        const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
        interviews.push({
            id: eventId,
            candidateId,
            startTime,
            endTime,
            status: 'Scheduled',
            type: 'AI-Interview'
        });
        return eventId;
    }
};

const triggerAutomation = async (candidate) => {
    console.log(`[AUTOMATION] Triggered for candidate: ${candidate.name} (Score: ${candidate.score})`);
    
    // Threshold for automatic interview scheduling
    const THRESHOLD = 80;

    if (candidate.score >= THRESHOLD) {
        console.log(`[AUTOMATION] Candidate passed threshold. Scheduling interview...`);
        
        // 1. Find available slots
        const slots = mockCalendarService.getAvailableSlots();
        const preferredSlot = slots[0];

        // 2. Update Stage
        candidate.stage = 'screening';

        // 3. Send Email
        mockEmailService.send(
            candidate.email,
            'RecruitPro: Invitation to AI Interview',
            `Hi ${candidate.name},\n\nYour application for ${candidate.position} looks great! We have automatically scheduled an AI-driven interview for you on ${new Date(preferredSlot).toLocaleString()}.\n\nPlease confirm your availability here: http://localhost:8000/interview-confirm?id=${candidate.id}`
        );

        // 4. Create Calendar Event
        mockCalendarService.createEvent(candidate.id, preferredSlot);
        
        console.log(`[AUTOMATION] Interview scheduled and email sent.`);
    } else if (candidate.score > 0) {
        console.log(`[AUTOMATION] Candidate score below threshold. Keeping in applied stage.`);
    }
};

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
        totalCandidates: candidates.length,
        activeJobs: jobs.length,
        timeToHire: 18,
        interviews: interviews.length
    });
});

// --- Jobs API ---
app.get('/api/jobs', (req, res) => {
    res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
    const newJob = { 
        id: Date.now().toString(), 
        ...req.body, 
        status: 'Active',
        postedDate: new Date().toISOString()
    };
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
        stage: req.body.stage || 'applied',
        appliedDate: new Date().toISOString()
    };
    candidates.unshift(newCandidate);
    
    // Trigger Automation Engine asynchronously
    triggerAutomation(newCandidate);

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
            console.warn('[AI SCORE] No file uploaded');
            return res.status(400).json({ error: 'No resume file uploaded' });
        }
        console.log(`[AI SCORE] Processing file: ${req.file.originalname} (${req.file.mimetype})`);

        const position = req.body.position || 'General';
        const job = jobs.find(j => j.title === position) || jobs[0];
        const jd = job ? job.description : 'Technical role requirement.';

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
                reasoning: "Simulated AI Score based on JD alignment.",
                parsedSkills: ["JavaScript", "React", "Node.js"] // Mock skills
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are an expert technical recruiter. Evaluate the following resume text against this Job Description: "${jd}".
            Return a JSON object with the following structure:
            {
                "score": <integer from 0 to 100 based on fit>,
                "reasoning": "<a short 2-sentence explanation of the score>",
                "parsedSkills": ["<skill1>", "<skill2>"]
            }
            
            Resume Text:
            ${resumeText.substring(0, 5000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let jsonStr = responseText;
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
            jsonStr = match[1];
        }
        
        const aiEvaluation = JSON.parse(jsonStr);
        console.log(`[AI SCORE] Success: Score ${aiEvaluation.score}`);
        res.json(aiEvaluation);

    } catch (error) {
        console.error('AI Evaluation Error:', error);
        res.status(500).json({ error: 'Failed to process and score resume.' });
    }
});

// --- AI Interview Sessions ---
let interviewSessions = {};

app.post('/api/interview/start', (req, res) => {
    const { candidateId } = req.body;
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const job = jobs.find(j => j.title === candidate.position) || jobs[0];
    
    interviewSessions[candidateId] = {
        candidateId,
        history: [],
        questionCount: 0,
        maxQuestions: 5,
        jd: job.description,
        resume: 'Candidate Skills: ' + (candidate.skills || 'General'),
        status: 'Ongoing'
    };

    const initialGreeting = `Hello ${candidate.name}! I am the RecruitPro AI Assistant. I will be conducting your technical interview today for the ${candidate.position} role. Are you ready to begin?`;
    interviewSessions[candidateId].history.push({ role: 'assistant', content: initialGreeting });

    res.json({ message: initialGreeting });
});

app.post('/api/interview/message', async (req, res) => {
    const { candidateId, message } = req.body;
    const session = interviewSessions[candidateId];
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.history.push({ role: 'user', content: message });
    session.questionCount++;

    if (session.questionCount > session.maxQuestions) {
        session.status = 'Completed';
        const goodbye = "Thank you for your time today! I have gathered enough information. Our team (and my AI brain) will evaluate your responses and get back to you soon.";
        session.history.push({ role: 'assistant', content: goodbye });
        
        // Trigger Evaluation asynchronously
        evaluateInterview(candidateId);
        
        return res.json({ message: goodbye, completed: true });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are an expert AI Interviewer for RecruitPro. 
            Job Description: ${session.jd}
            Candidate Info: ${session.resume}
            
            Current Interview History:
            ${session.history.map(h => `${h.role}: ${h.content}`).join('\n')}
            
            Task: Ask the NEXT relevant technical or behavioral question. Keep it concise.
            If the candidate just said they are ready, ask the first technical question.
        `;

        const result = await model.generateContent(prompt);
        const aiMessage = result.response.text();
        session.history.push({ role: 'assistant', content: aiMessage });

        res.json({ message: aiMessage });
    } catch (error) {
        console.error('Interview AI Error:', error);
        res.status(500).json({ error: 'AI failed to respond.' });
    }
});

const evaluateInterview = async (candidateId) => {
    const session = interviewSessions[candidateId];
    const candidate = candidates.find(c => c.id === candidateId);
    if (!session || !candidate) return;

    console.log(`[AUTOMATION] Evaluating interview for ${candidate.name}`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Evaluate this interview transcript for the candidate ${candidate.name}.
            Transcript:
            ${session.history.map(h => `${h.role}: ${h.content}`).join('\n')}
            
            Return a JSON object:
            {
                "score": <integer 0-100>,
                "feedback": "<short summary>",
                "decision": "pass" | "fail"
            }
        `;

        const result = await model.generateContent(prompt);
        const evaluation = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);

        candidate.interviewScore = evaluation.score;
        candidate.stage = evaluation.decision === 'pass' ? 'offer' : 'rejected';
        
        console.log(`[AUTOMATION] Interview Evaluation Complete: ${evaluation.decision.toUpperCase()} (Score: ${evaluation.score})`);
        
        mockEmailService.send(
            candidate.email,
            `RecruitPro: Interview Feedback`,
            `Hi ${candidate.name},\n\nThank you for completing the AI interview. Your performance has been evaluated.\n\nStatus: ${candidate.stage === 'offer' ? 'Shortlisted for Offer' : 'Application Unsuccessful'}\nFeedback: ${evaluation.feedback}`
        );

    } catch (error) {
        console.error('Evaluation Error:', error);
    }
};

app.listen(port, () => {
    console.log(`RecruitPro API and Server running on http://localhost:${port}`);
    console.log(`Automation Engine: ACTIVE (Threshold: 80)`);
    console.log(`AI Interviewer: ENABLED`);
    console.log(`AI Scoring ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Simulated (No API Key)'}`);
});


