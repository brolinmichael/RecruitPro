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
// Production safeguards: 10 MB cap + restrict to PDF / DOC / DOCX / plain text.
const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ALLOWED_RESUME_MIMES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_BYTES },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_RESUME_MIMES.has(file.mimetype)) {
            return cb(new Error('Unsupported resume format. Use PDF, DOC, DOCX or TXT.'));
        }
        cb(null, true);
    }
});

app.use(cors());
app.use(express.json());
// Lightweight request log so we can see exactly what hits the API.
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`[REQ] ${req.method} ${req.path}`);
    }
    next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// --- Mock Database ---
// State is bootstrapped from data/seed.js — these are mutable `let` bindings
// so handlers can push / patch / filter without touching the source file.
const SEED = require('./data/seed');
let jobs = SEED.jobs.map(j => ({ ...j }));
let candidates = SEED.candidates.map(c => ({ ...c }));
let interviews = [];

// ID counters start above the highest seeded numeric suffix so new records
// never collide with seed ids.
const maxSeedId = (list, prefix) => list
    .map(o => parseInt(String(o.id || '').replace(prefix, ''), 10))
    .filter(n => Number.isFinite(n))
    .reduce((m, n) => Math.max(m, n), 0);

let jobIdSeq = Math.max(2100, maxSeedId(jobs, 'j-'));
let candidateIdSeq = Math.max(1100, maxSeedId(candidates, 'c-'));
const nextJobId = () => `j-${++jobIdSeq}`;
const nextCandidateId = () => `c-${++candidateIdSeq}`;

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

const VALID_DEPARTMENTS = new Set(['Design', 'Engineering', 'Product', 'Marketing', 'Sales', 'Operations', 'Data', 'Growth', 'Other']);
const VALID_LEVELS = new Set(['Entry', 'Mid', 'Senior', 'Lead', 'Principal']);
const VALID_EMPLOYMENT = new Set(['full-time', 'part-time', 'contract', 'internship']);
const VALID_WORK_MODE = new Set(['onsite', 'hybrid', 'remote']);
const VALID_JOB_STATUS = new Set(['active', 'draft', 'closed']);
const VALID_CURRENCY = new Set(['USD', 'EUR', 'GBP', 'CAD', 'INR']);

const DEPT_STYLE = {
    Design:      { icon: 'user',          color: 'cyan'   },
    Engineering: { icon: 'layers',        color: 'blue'   },
    Product:     { icon: 'box',           color: 'cyan'   },
    Marketing:   { icon: 'megaphone',     color: 'purple' },
    Growth:      { icon: 'trending-up',   color: 'purple' },
    Sales:       { icon: 'trending-up',   color: 'green'  },
    Operations:  { icon: 'settings',      color: 'blue'   },
    Data:        { icon: 'flask-conical', color: 'green'  },
    Other:       { icon: 'briefcase',     color: 'cyan'   }
};

// Map our pipeline stages to badge variants shown on the Jobs row.
const PIPELINE_BADGE = {
    final:     { label: 'Final Round', cls: 'stage-final'     },
    interview: { label: 'Interview',   cls: 'stage-interview' },
    screening: { label: 'Screening',   cls: 'stage-screening' },
    reviewing: { label: 'Reviewing',   cls: 'stage-reviewing' }
};

// Find candidates that belong to a job. Primary linkage is `candidate.jobId`
// === `job.id`; fall back to a case-insensitive `candidate.position` ===
// `job.title` match so form-created candidates that didn't set jobId still
// show up correctly.
const candidatesForJob = (job) => candidates.filter(c => {
    if (c.jobId) return c.jobId === job.id;
    return (c.position || '').toLowerCase() === (job.title || '').toLowerCase();
});

// Derive a job's live pipeline summary. Returns badge + progress + applicant
// slice — used by the jobs list rows AND the job-detail view.
const summarizeJobPipeline = (job) => {
    const matches = candidatesForJob(job);
    const total = matches.length;
    // Highest stage with at least one candidate wins the badge.
    const has = (stage) => matches.some(c => c.stage === stage);
    let badgeKey = 'reviewing';
    if (has('offer') || has('hired')) badgeKey = 'final';
    else if (has('interview')) badgeKey = 'interview';
    else if (has('screening')) badgeKey = 'screening';
    const badge = PIPELINE_BADGE[badgeKey];

    // Progress = % of applicants past the "applied" gate, clamped 5–95.
    let progress = 8;
    if (total > 0) {
        const moved = matches.filter(c => c.stage && c.stage !== 'applied' && c.stage !== 'rejected').length;
        progress = Math.max(5, Math.min(95, Math.round((moved / total) * 100)));
    }

    return {
        applicantsCount: total,
        applicantNames: matches.slice(0, 3).map(c => c.name),
        pipelineStage: badgeKey,
        pipelineStageLabel: badge.label,
        pipelineStageClass: badge.cls,
        progress,
        progressColor: DEPT_STYLE[job.department]?.color || 'cyan'
    };
};

// Group a job's applicants into the four kanban columns shown on the
// pipeline / job-detail view. Terminal stages (hired/rejected) are excluded
// from the kanban — the kanban represents the *active* pipeline, and those
// records live in the candidates list / detail view instead.
const PIPELINE_COLUMNS = ['applied', 'screening', 'interview', 'offer'];
const TERMINAL_STAGES = new Set(['hired', 'rejected']);
const groupApplicantsByStage = (job) => {
    const list = candidatesForJob(job);
    const buckets = Object.fromEntries(PIPELINE_COLUMNS.map(s => [s, []]));
    list.forEach(c => {
        if (TERMINAL_STAGES.has(c.stage)) return;
        const bucket = buckets[c.stage] || buckets.applied;
        bucket.push({
            id: c.id,
            name: c.name,
            position: c.position || job.title,
            score: typeof c.score === 'number' ? c.score : null,
            skills: Array.isArray(c.skills) ? c.skills.slice(0, 2) : [],
            source: c.source || null,
            appliedDate: c.appliedDate || null
        });
    });
    return buckets;
};

const decorateJob = (job) => ({
    ...job,
    departmentIcon: (DEPT_STYLE[job.department] || DEPT_STYLE.Other).icon,
    departmentColor: (DEPT_STYLE[job.department] || DEPT_STYLE.Other).color,
    ...summarizeJobPipeline(job)
});

const sanitizeJobPayload = (body) => {
    const errors = {};
    const title = (body.title || '').trim();
    const department = (body.department || 'Other').trim();
    const level = (body.level || 'Senior').trim();
    const employmentType = (body.employmentType || 'full-time').trim().toLowerCase();
    const workMode = (body.workMode || 'onsite').trim().toLowerCase();
    const location = (body.location || '').trim();
    const currency = (body.currency || 'USD').trim().toUpperCase();
    const status = (body.status || 'active').trim().toLowerCase();
    const description = (body.description || body.overview || '').trim();

    // Responsibilities / requirements accept array OR text (newline-separated).
    // The Create Job form passes textarea text; the seed (and external clients)
    // can pass real arrays.
    const toBullets = (raw) => {
        if (raw === undefined || raw === null) return [];
        if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean);
        return String(raw).split(/\r?\n+/).map(s => s.replace(/^[-•\s]+/, '').trim()).filter(Boolean);
    };
    const responsibilities = toBullets(body.responsibilities);
    const requirements = toBullets(body.requirements);
    const perks = toBullets(body.perks);
    const hiringManager = (body.hiringManager && typeof body.hiringManager === 'object')
        ? {
            name: (body.hiringManager.name || '').trim(),
            role: (body.hiringManager.role || '').trim()
        }
        : null;

    if (!title) errors.title = 'Job title is required.';
    else if (title.length > 140) errors.title = 'Job title is too long.';

    if (department && !VALID_DEPARTMENTS.has(department)) errors.department = 'Unknown department.';
    if (level && !VALID_LEVELS.has(level)) errors.level = 'Unknown level.';
    if (!VALID_EMPLOYMENT.has(employmentType)) errors.employmentType = 'Unknown employment type.';
    if (!VALID_WORK_MODE.has(workMode)) errors.workMode = 'Unknown work mode.';
    if (!VALID_JOB_STATUS.has(status)) errors.status = 'Unknown status.';
    if (currency && !VALID_CURRENCY.has(currency)) errors.currency = 'Unsupported currency.';

    const toMoney = (raw, key) => {
        if (raw === undefined || raw === null || raw === '') return null;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0 || n > 10000000) {
            errors[key] = 'Enter a valid amount.';
            return null;
        }
        return Math.round(n);
    };
    const salaryMin = toMoney(body.salaryMin, 'salaryMin');
    const salaryMax = toMoney(body.salaryMax, 'salaryMax');
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        errors.salaryMax = 'Max salary must be greater than or equal to min.';
    }

    // Skills: accept JSON, array, or comma-separated string (mirrors candidates).
    let skills = [];
    if (body.skills !== undefined) {
        if (Array.isArray(body.skills)) {
            skills = body.skills.map(s => String(s).trim()).filter(Boolean);
        } else if (typeof body.skills === 'string') {
            try {
                const parsed = JSON.parse(body.skills);
                if (Array.isArray(parsed)) skills = parsed.map(s => String(s).trim()).filter(Boolean);
                else skills = body.skills.split(',').map(s => s.trim()).filter(Boolean);
            } catch (_) {
                skills = body.skills.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
    }

    return {
        errors,
        data: {
            title, department, level, employmentType, workMode, location,
            currency, salaryMin, salaryMax, skills,
            // Legacy alias kept so existing UI bits that read `description` still work.
            description, overview: description,
            responsibilities, requirements, perks, hiringManager, status
        }
    };
};

app.get('/api/jobs', (req, res) => {
    const { status, department, search } = req.query;
    let list = jobs;
    if (status) list = list.filter(j => j.status === String(status).toLowerCase());
    if (department) list = list.filter(j => (j.department || '').toLowerCase() === String(department).toLowerCase());
    if (search) {
        const q = String(search).toLowerCase();
        list = list.filter(j =>
            (j.title || '').toLowerCase().includes(q) ||
            (j.department || '').toLowerCase().includes(q) ||
            (j.location || '').toLowerCase().includes(q) ||
            (j.skills || []).some(s => s.toLowerCase().includes(q))
        );
    }
    res.json(list.map(decorateJob));
});

app.get('/api/jobs/insights', (req, res) => {
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    const activeJobs = jobs.filter(j => j.status === 'active');
    const totalOpenings = activeJobs.length;

    // Openings trend = jobs posted in last 30 days vs prior 30 days
    const postedLast30 = jobs.filter(j => {
        const t = new Date(j.postedDate).getTime();
        return Number.isFinite(t) && (now - t) <= THIRTY_DAYS;
    }).length;
    const postedPrev30 = jobs.filter(j => {
        const t = new Date(j.postedDate).getTime();
        return Number.isFinite(t) && (now - t) > THIRTY_DAYS && (now - t) <= 2 * THIRTY_DAYS;
    }).length;
    const openingsTrendPct = postedPrev30 ? Math.round(((postedLast30 - postedPrev30) / postedPrev30) * 100) : (postedLast30 > 0 ? 100 : 0);

    const hired = candidates.filter(c => c.stage === 'hired').length;
    const hiredLast30 = candidates.filter(c => {
        if (c.stage !== 'hired') return false;
        const t = new Date(c.appliedDate).getTime();
        return Number.isFinite(t) && (now - t) <= THIRTY_DAYS;
    }).length;

    const applications = candidates.length;
    const appsLast7 = candidates.filter(c => {
        const t = new Date(c.appliedDate).getTime();
        return Number.isFinite(t) && (now - t) <= SEVEN_DAYS;
    }).length;
    const appsPrev7 = candidates.filter(c => {
        const t = new Date(c.appliedDate).getTime();
        return Number.isFinite(t) && (now - t) > SEVEN_DAYS && (now - t) <= 2 * SEVEN_DAYS;
    }).length;
    const appsTrendPct = appsPrev7 ? Math.round(((appsLast7 - appsPrev7) / appsPrev7) * 100) : (appsLast7 > 0 ? 100 : 0);

    // Offer acceptance = hired / (hired + offer + rejected-after-offer). We don't
    // model "declined" explicitly, so use hired / (hired + offer) as a proxy.
    const offers = candidates.filter(c => c.stage === 'offer').length;
    const offerDenom = hired + offers;
    const offerAcceptance = offerDenom > 0 ? Math.round((hired / offerDenom) * 100) : null;

    res.json({
        totalOpenings,
        openingsTrendPct,
        candidatesHired: hired,
        hiredLast30Days: hiredLast30,
        applicationsReceived: applications,
        applicationsTrendPct: appsTrendPct,
        offerAcceptanceRate: offerAcceptance
    });
});

// Single-job detail endpoint — registered AFTER /api/jobs/insights so the
// literal path wins. Returns the full job record plus its applicants grouped
// by pipeline stage so the job-detail view can render the kanban directly
// from one fetch. 404 when the id is unknown.
app.get('/api/jobs/:id', (req, res) => {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const applicantsByStage = groupApplicantsByStage(job);
    const stageCounts = Object.fromEntries(
        PIPELINE_COLUMNS.map(s => [s, applicantsByStage[s].length])
    );
    const totalApplicants = PIPELINE_COLUMNS.reduce((sum, s) => sum + stageCounts[s], 0);

    res.json({
        ...decorateJob(job),
        applicantsByStage,
        stageCounts,
        totalApplicants
    });
});

app.post('/api/jobs', (req, res) => {
    const { errors, data } = sanitizeJobPayload(req.body);
    if (Object.keys(errors).length) {
        return res.status(400).json({
            error: 'Please correct the highlighted fields.',
            fields: errors
        });
    }
    // Reject duplicate active titles within the same department (case-insensitive)
    // — open requisitions for the same role usually mean a mistake.
    const dup = jobs.find(j =>
        j.status === 'active' &&
        (j.title || '').toLowerCase() === data.title.toLowerCase() &&
        (j.department || '').toLowerCase() === data.department.toLowerCase()
    );
    if (dup) {
        return res.status(409).json({
            error: 'An active job with this title already exists in that department.',
            fields: { title: 'Duplicate active job for this department.' }
        });
    }

    const newJob = {
        id: nextJobId(),
        ...data,
        postedDate: new Date().toISOString()
    };
    jobs.unshift(newJob);
    res.status(201).json(decorateJob(newJob));
});

// --- Candidates API ---

const VALID_STAGES = new Set(['applied', 'screening', 'interview', 'offer', 'rejected', 'hired']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parse skills from form (JSON string, comma-separated string, or array)
const parseSkills = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean);
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
        } catch (_) {
            // not JSON — fall back to comma split
        }
        return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
};

const sanitizeCandidatePayload = (body) => {
    const errors = {};
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const position = (body.position || '').trim();
    const phone = (body.phone || '').trim();
    const source = (body.source || '').trim();
    const notes = (body.notes || '').trim();
    const stage = (body.stage || 'applied').trim().toLowerCase();
    const experienceRaw = (body.experience || '').toString().trim();

    if (!name) errors.name = 'Name is required.';
    else if (name.length > 120) errors.name = 'Name is too long.';

    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';

    if (!position) errors.position = 'Position is required.';

    let experience = null;
    if (experienceRaw !== '') {
        const n = Number(experienceRaw);
        if (!Number.isFinite(n) || n < 0 || n > 60) errors.experience = 'Experience must be between 0 and 60 years.';
        else experience = String(Math.round(n));
    }

    if (!VALID_STAGES.has(stage)) errors.stage = 'Unknown pipeline stage.';

    const scoreRaw = body.score;
    let score = null;
    if (scoreRaw !== undefined && scoreRaw !== null && scoreRaw !== '') {
        const n = parseInt(scoreRaw, 10);
        if (Number.isNaN(n) || n < 0 || n > 100) errors.score = 'Score must be between 0 and 100.';
        else score = n;
    }

    // jobId: explicit if provided, otherwise auto-link by matching the
    // position string against an existing job title (case-insensitive). This
    // keeps the form-based flow working without exposing job ids to the user.
    let jobId = (body.jobId || '').trim();
    if (jobId && !jobs.some(j => j.id === jobId)) {
        errors.jobId = 'Unknown job.';
        jobId = '';
    }
    if (!jobId && position) {
        const match = jobs.find(j => (j.title || '').toLowerCase() === position.toLowerCase());
        if (match) jobId = match.id;
    }

    return {
        errors,
        data: {
            name, email, position, phone, source, notes, stage, experience, score,
            jobId: jobId || null,
            skills: parseSkills(body.skills),
            aiReasoning: (body.aiReasoning || '').trim() || null
        }
    };
};

app.get('/api/candidates', (req, res) => {
    const { search, stage, source } = req.query;
    let list = candidates;
    if (stage) list = list.filter(c => c.stage === String(stage).toLowerCase());
    if (source) list = list.filter(c => (c.source || '').toLowerCase() === String(source).toLowerCase());
    if (search) {
        const q = String(search).toLowerCase();
        list = list.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.position || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.skills || []).some(s => s.toLowerCase().includes(q))
        );
    }
    res.json(list);
});

// Single-candidate detail endpoint. Returns 404 when the id is unknown so the
// client can render an empty state instead of crashing on undefined fields.
const STAGE_LABEL = {
    applied:   { label: 'Applied',        round: 'Stage 1 · Application'  },
    screening: { label: 'Screening',      round: 'Round 1 · Screening'    },
    interview: { label: 'Interview',      round: 'Round 2 · Interview'    },
    offer:     { label: 'Offer Extended', round: 'Final · Offer'          },
    hired:     { label: 'Hired',          round: 'Closed · Hired'         },
    rejected:  { label: 'Not Moving Fwd', round: 'Closed · Rejected'      }
};
// A short verdict driven by the AI match score — cheap signal for the chip
// in the hero section ("Strong Fit", "Good Fit", etc.).
const fitVerdict = (score) => {
    if (typeof score !== 'number') return null;
    if (score >= 90) return 'Strong Fit';
    if (score >= 80) return 'Good Fit';
    if (score >= 70) return 'Average Fit';
    return 'Below Bar';
};

const decorateCandidate = (c) => {
    const stage = STAGE_LABEL[c.stage] || { label: c.stage || 'Applied', round: '—' };
    return {
        ...c,
        stageLabel: stage.label,
        stageRound: stage.round,
        fitVerdict: fitVerdict(c.score),
        isActive: c.stage !== 'rejected'
    };
};

app.get('/api/candidates/:id', (req, res) => {
    const candidate = candidates.find(c => c.id === req.params.id);
    if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found.' });
    }
    res.json(decorateCandidate(candidate));
});

app.get('/api/candidates/insights', (req, res) => {
    const total = candidates.length;
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    const newLast7 = candidates.filter(c => {
        const t = new Date(c.appliedDate).getTime();
        return Number.isFinite(t) && (now - t) <= SEVEN_DAYS;
    }).length;
    const prevWindow = candidates.filter(c => {
        const t = new Date(c.appliedDate).getTime();
        return Number.isFinite(t) && (now - t) > SEVEN_DAYS && (now - t) <= 2 * SEVEN_DAYS;
    }).length;

    const scored = candidates.filter(c => typeof c.score === 'number');
    const avgMatch = scored.length
        ? Math.round(scored.reduce((sum, c) => sum + c.score, 0) / scored.length)
        : 0;

    const SHORTLISTED_STAGES = new Set(['screening', 'interview', 'offer', 'hired']);
    const shortlisted = candidates.filter(c => SHORTLISTED_STAGES.has(c.stage)).length;
    const conversion = total ? Math.round((shortlisted / total) * 100) : 0;

    const sourceCounts = candidates.reduce((acc, c) => {
        const key = c.source || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    let topSource = '—';
    let topSourcePct = 0;
    const entries = Object.entries(sourceCounts);
    if (entries.length) {
        entries.sort((a, b) => b[1] - a[1]);
        topSource = entries[0][0];
        topSourcePct = total ? Math.round((entries[0][1] / total) * 100) : 0;
    }

    res.json({
        totalCandidates: total,
        newLast7Days: newLast7,
        newTrendDelta: newLast7 - prevWindow,
        avgMatchScore: avgMatch,
        shortlisted,
        shortlistedConversion: conversion,
        topSource,
        topSourcePercentage: topSourcePct
    });
});

app.post('/api/candidates', upload.single('resume'), (req, res) => {
    const { errors, data } = sanitizeCandidatePayload(req.body);

    if (Object.keys(errors).length) {
        return res.status(400).json({
            error: 'Please correct the highlighted fields.',
            fields: errors
        });
    }

    // Reject duplicate email (case-insensitive).
    if (candidates.some(c => (c.email || '').toLowerCase() === data.email)) {
        return res.status(409).json({
            error: 'A candidate with this email already exists.',
            fields: { email: 'This email is already on file.' }
        });
    }

    const newCandidate = {
        id: nextCandidateId(),
        ...data,
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

// Centralized error handler — turns multer/file-filter errors into JSON.
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Resume file is too large. Maximum size is 10 MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err && err.message && err.message.startsWith('Unsupported resume format')) {
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        console.error('Unhandled error:', err);
        return res.status(500).json({ error: 'Unexpected server error.' });
    }
    next();
});

app.listen(port, () => {
    console.log(`RecruitPro API and Server running on http://localhost:${port}`);
    console.log(`Automation Engine: ACTIVE (Threshold: 80)`);
    console.log(`AI Interviewer: ENABLED`);
    console.log(`AI Scoring ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Simulated (No API Key)'}`);
});


