// Seed data for the in-memory mock database.
//
// Shape contract:
//   jobs[*]:        rich job postings used by the Jobs list AND the job-
//                   detail / pipeline view. Includes overview, responsibilities,
//                   requirements, perks, hiringManager, and pipeline metadata.
//   candidates[*]:  applicant records linked to a job via `jobId`. The server
//                   derives each job's applicant breakdown by filtering on
//                   this field (with a position-title fallback for legacy
//                   records or form-created candidates).
//
// Keep this file purely declarative — no I/O, no env lookups. Mutation lives
// in server.js (which copies these arrays into its own `let` bindings).

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// ─── Jobs ────────────────────────────────────────────────────────────────────
const jobs = [
    {
        id: 'j-2001',
        title: 'Senior UI/UX Designer',
        department: 'Design',
        level: 'Senior',
        employmentType: 'full-time',
        workMode: 'hybrid',
        location: 'San Francisco, CA',
        currency: 'USD',
        salaryMin: 130000,
        salaryMax: 170000,
        skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'Accessibility'],
        overview:
            'We are seeking an experienced Senior UI/UX Designer to craft beautiful and intuitive web experiences. ' +
            'You will own the end-to-end design process — wireframing, prototyping, user testing, and high-fidelity ' +
            'mockups — while collaborating closely with our product and engineering teams to deliver pixel-perfect ' +
            'implementations across desktop and mobile surfaces.',
        responsibilities: [
            'Design high-fidelity mockups for web and mobile applications',
            'Collaborate with product and engineering teams on feature specs',
            'Conduct user research and usability testing',
            'Maintain and expand our comprehensive design system',
            'Mentor junior designers and participate in design critiques'
        ],
        requirements: [
            '5+ years of product design experience',
            'Mastery of Figma and modern design tooling',
            'Strong portfolio demonstrating end-to-end product work',
            'Experience contributing to or owning a design system',
            'Excellent communication and stakeholder management skills'
        ],
        perks: [
            'Competitive salary + meaningful equity',
            'Health, dental, and vision insurance',
            'Hybrid schedule — Tue/Thu in office',
            '$2,000 annual learning budget'
        ],
        hiringManager: { name: 'Maya Chen', role: 'Director of Design' },
        status: 'active',
        postedDate: daysAgo(6)
    },
    {
        id: 'j-2002',
        title: 'Senior Product Designer',
        department: 'Design',
        level: 'Senior',
        employmentType: 'full-time',
        workMode: 'onsite',
        location: 'New York, NY',
        currency: 'USD',
        salaryMin: 140000,
        salaryMax: 180000,
        skills: ['Figma', 'Research', 'Prototyping', 'Information Architecture', 'Workshop Facilitation'],
        overview:
            'Drive the design vision for our core SaaS product. You will partner deeply with product and engineering, ' +
            'shape strategy, run workshops, and ship work that meaningfully moves business metrics. We are looking ' +
            'for a strong systems thinker who is equally comfortable with research, prototyping, and high-craft visual work.',
        responsibilities: [
            'Own the design strategy and execution for two product areas',
            'Run discovery and validation with users and stakeholders',
            'Define interaction patterns and contribute to the design system',
            'Partner with PMs to shape the product roadmap',
            'Present design rationale clearly to leadership'
        ],
        requirements: [
            '6+ years of product design experience at SaaS or consumer companies',
            'Demonstrated ability to ship cross-functional, multi-quarter initiatives',
            'Confident facilitator of workshops and design reviews',
            'Strong written communication and design documentation skills'
        ],
        perks: [
            'In-person, collaborative studio in NoMad',
            'Catered lunch + commuter benefits',
            'Annual design conference budget',
            'Generous parental leave'
        ],
        hiringManager: { name: 'Jordan Pierce', role: 'Head of Product Design' },
        status: 'active',
        postedDate: daysAgo(18)
    },
    {
        id: 'j-2003',
        title: 'Full Stack Engineer',
        department: 'Engineering',
        level: 'Mid',
        employmentType: 'full-time',
        workMode: 'remote',
        location: 'Remote',
        currency: 'USD',
        salaryMin: 110000,
        salaryMax: 150000,
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
        overview:
            'Join a small, high-leverage product engineering team to build features across the stack. We use ' +
            'TypeScript everywhere — React on the frontend, Node.js on the backend, PostgreSQL for storage, and ' +
            'AWS for infrastructure. You will own features end-to-end, from design discussions through deployment.',
        responsibilities: [
            'Design and ship features across the frontend, backend, and database layers',
            'Write maintainable, well-tested TypeScript',
            'Participate in code review and architectural decisions',
            'Improve our deploy pipeline and observability tooling',
            'Be on-call for production issues approximately one week per quarter'
        ],
        requirements: [
            '3+ years building production web applications',
            'Solid TypeScript fundamentals',
            'Comfort working across the stack (frontend, API, schema)',
            'Experience with cloud infrastructure (AWS, GCP, or similar)',
            'Strong written communication for an async, remote team'
        ],
        perks: [
            'Fully remote, async-first culture',
            'Home-office stipend + WFH equipment',
            'Quarterly team off-sites',
            'Health + 401(k) matching'
        ],
        hiringManager: { name: 'Priscilla Adebayo', role: 'Engineering Manager' },
        status: 'active',
        postedDate: daysAgo(12)
    },
    {
        id: 'j-2004',
        title: 'Marketing Manager',
        department: 'Marketing',
        level: 'Lead',
        employmentType: 'full-time',
        workMode: 'hybrid',
        location: 'Austin, TX',
        currency: 'USD',
        salaryMin: 100000,
        salaryMax: 135000,
        skills: ['SEO', 'Content Strategy', 'Lifecycle Marketing', 'Analytics', 'Brand'],
        overview:
            'Own growth marketing strategy and execution for our B2B SaaS. You will lead a small marketing team ' +
            'across organic, paid, content, and lifecycle channels — and partner with sales on pipeline programs ' +
            'that compound month over month.',
        responsibilities: [
            'Set the quarterly marketing strategy and own pipeline targets',
            'Lead two ICs across content, lifecycle, and SEO',
            'Partner with sales on ABM and pipeline programs',
            'Manage marketing budget and channel mix',
            'Report on attribution, funnel, and ROI to leadership'
        ],
        requirements: [
            '6+ years in B2B SaaS marketing, with at least 2 leading a team',
            'Hands-on experience with SEO, content, and lifecycle',
            'Strong analytical chops — comfortable in GA, Mixpanel, or similar',
            'Excellent writing and editing skills'
        ],
        perks: [
            'Hybrid in Austin (Mon/Wed/Fri in office)',
            'Equity + performance bonus',
            'Unlimited PTO with a 3-week minimum',
            'Annual marketing conference budget'
        ],
        hiringManager: { name: 'Rohan Kapoor', role: 'VP Marketing' },
        status: 'active',
        postedDate: daysAgo(26)
    },
    {
        id: 'j-2005',
        title: 'Data Scientist',
        department: 'Data',
        level: 'Senior',
        employmentType: 'full-time',
        workMode: 'remote',
        location: 'Remote',
        currency: 'USD',
        salaryMin: 135000,
        salaryMax: 170000,
        skills: ['Python', 'SQL', 'ML', 'TensorFlow', 'Pandas', 'Statistics'],
        overview:
            'Build models and dashboards that drive product decisions. You will work directly with product ' +
            'managers and engineers, shipping experiments, forecasting key metrics, and turning ambiguous ' +
            'business questions into rigorous analyses that change what we build next.',
        responsibilities: [
            'Design and analyze A/B experiments end-to-end',
            'Build forecasting and segmentation models',
            'Create dashboards and self-serve tooling for the product team',
            'Partner with engineering to instrument new product surfaces',
            'Present findings clearly to non-technical stakeholders'
        ],
        requirements: [
            '4+ years as a data scientist or quantitative analyst',
            'Strong SQL and Python; comfort with statistical inference',
            'Experience designing and reading out experiments',
            'Ability to translate business questions into modeling tasks'
        ],
        perks: [
            'Fully remote with overlap hours 10 am – 2 pm Pacific',
            'GPU compute credits',
            'Conference + course budget',
            'Health + dental + vision'
        ],
        hiringManager: { name: 'Yelena Markov', role: 'Head of Data' },
        status: 'active',
        postedDate: daysAgo(3)
    }
];

// ─── Candidates ─────────────────────────────────────────────────────────────
//
// Each candidate links to a job via `jobId`. The summary helpers in server.js
// filter on this field, so changing jobId changes which job a candidate
// appears under on the pipeline / job detail view.
//
// Note: stage distribution is intentionally varied so each job has a realistic
// pipeline shape (most still in applied/screening, fewer in interview/offer).

const mk = (base) => ({
    notes: '',
    portfolio: '',
    linkedIn: '',
    github: '',
    education: [],
    workHistory: [],
    ...base
});

const candidates = [
    // ── j-2001 Senior UI/UX Designer · 8 applicants ──
    mk({
        id: 'c-1001', jobId: 'j-2001',
        name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com', phone: '+1 (415) 555-0188',
        position: 'Senior UI/UX Designer', experience: '9', source: 'Referral',
        skills: ['Figma', 'Design Systems', 'Prototyping', 'Accessibility'], stage: 'interview', score: 94,
        aiReasoning: 'Seasoned design lead with measurable impact on design systems. Strong cross-functional collaboration. 9 yrs senior-level tenure.',
        appliedDate: daysAgo(4),
        location: 'Brooklyn, NY',
        linkedIn: 'linkedin.com/in/sarah-jenkins',
        portfolio: 'sarahjenkins.design',
        workHistory: [
            { title: 'UI/UX Lead', company: 'Northwind Labs', duration: '5 yrs' },
            { title: 'Senior Designer', company: 'Studio Aria', duration: '4 yrs' }
        ],
        education: [{ degree: 'B.F.A. Graphic Design', school: 'Rhode Island School of Design' }]
    }),
    mk({
        id: 'c-1002', jobId: 'j-2001',
        name: 'Marcus Reed', email: 'marcus.reed@example.com', phone: '+1 (415) 555-0277',
        position: 'Senior UI/UX Designer', experience: '8', source: 'LinkedIn',
        skills: ['Figma', 'UX Research', 'Wireframing'], stage: 'interview', score: 88,
        aiReasoning: 'Strong portfolio across consumer and enterprise; thoughtful systems thinker.',
        appliedDate: daysAgo(7),
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/marcus-reed',
        portfolio: 'marcusreed.work',
        workHistory: [{ title: 'Senior Designer', company: 'Pixel North', duration: '6 yrs' }],
        education: [{ degree: 'B.A. Industrial Design', school: 'ArtCenter College of Design' }]
    }),
    mk({
        id: 'c-1003', jobId: 'j-2001',
        name: 'Hana Okafor', email: 'hana.okafor@example.com', phone: '+1 (628) 555-0102',
        position: 'Senior UI/UX Designer', experience: '6', source: 'LinkedIn',
        skills: ['Figma', 'Prototyping', 'Design Systems'], stage: 'screening', score: 86,
        aiReasoning: 'Solid foundations in design systems work. Portfolio leans consumer.',
        appliedDate: daysAgo(9),
        location: 'Oakland, CA',
        linkedIn: 'linkedin.com/in/hana-okafor',
        workHistory: [{ title: 'Product Designer', company: 'Trove', duration: '4 yrs' }],
        education: [{ degree: 'B.A. Communication Design', school: 'CCA' }]
    }),
    mk({
        id: 'c-1004', jobId: 'j-2001',
        name: 'Daniel Cho', email: 'daniel.cho@example.com', phone: '+1 (415) 555-0341',
        position: 'Senior UI/UX Designer', experience: '7', source: 'Referral',
        skills: ['Figma', 'User Research', 'Accessibility'], stage: 'screening', score: 82,
        aiReasoning: 'Strong research methodology. Less direct design-system ownership.',
        appliedDate: daysAgo(11),
        location: 'Palo Alto, CA',
        linkedIn: 'linkedin.com/in/danielcho',
        portfolio: 'danielcho.design',
        workHistory: [{ title: 'UX Designer', company: 'Lyric Health', duration: '5 yrs' }],
        education: [{ degree: 'M.S. HCI', school: 'Stanford University' }]
    }),
    mk({
        id: 'c-1005', jobId: 'j-2001',
        name: 'Lina Petrova', email: 'lina.petrova@example.com', phone: '+1 (628) 555-0418',
        position: 'Senior UI/UX Designer', experience: '5', source: 'Indeed',
        skills: ['Figma', 'Prototyping'], stage: 'applied', score: 79,
        aiReasoning: 'Mid-level. Good visual chops, would need ramp time on systems thinking.',
        appliedDate: daysAgo(2),
        location: 'San Jose, CA',
        linkedIn: 'linkedin.com/in/linapetrova',
        workHistory: [{ title: 'Product Designer', company: 'Maple Bay', duration: '3 yrs' }],
        education: [{ degree: 'B.A. Visual Communication', school: 'San Jose State University' }]
    }),
    mk({
        id: 'c-1006', jobId: 'j-2001',
        name: 'Theo Williams', email: 'theo.williams@example.com', phone: '+1 (415) 555-0530',
        position: 'Senior UI/UX Designer', experience: '8', source: 'Company Website',
        skills: ['Figma', 'Design Systems', 'Workshop Facilitation'], stage: 'applied', score: 84,
        aiReasoning: 'Hands-on systems lead at a previous SaaS. Strong async written communication.',
        appliedDate: daysAgo(3),
        location: 'Berkeley, CA',
        linkedIn: 'linkedin.com/in/theow',
        workHistory: [{ title: 'Senior Designer', company: 'Cascade', duration: '6 yrs' }],
        education: [{ degree: 'B.A. Design', school: 'UC Davis' }]
    }),
    mk({
        id: 'c-1007', jobId: 'j-2001',
        name: 'Aria Wei', email: 'aria.wei@example.com', phone: '+1 (628) 555-0633',
        position: 'Senior UI/UX Designer', experience: '6', source: 'LinkedIn',
        skills: ['Figma', 'User Research'], stage: 'applied', score: 76,
        aiReasoning: 'Research-heavy background; portfolio is interview-thin.',
        appliedDate: daysAgo(1),
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/ariawei',
        workHistory: [{ title: 'UX Researcher', company: 'Outpost', duration: '4 yrs' }],
        education: [{ degree: 'M.A. Human-Centered Design', school: 'University of Washington' }]
    }),
    mk({
        id: 'c-1008', jobId: 'j-2001',
        name: 'Bea Johansen', email: 'bea.j@example.com', phone: '+1 (415) 555-0712',
        position: 'Senior UI/UX Designer', experience: '10', source: 'Referral',
        skills: ['Figma', 'Accessibility', 'Design Systems'], stage: 'offer', score: 97,
        aiReasoning: 'Standout portfolio. Senior systems leadership at two scale-ups. Strong fit.',
        appliedDate: daysAgo(14),
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/beaj',
        portfolio: 'beajohansen.com',
        workHistory: [
            { title: 'Principal Designer', company: 'Vega Labs', duration: '4 yrs' },
            { title: 'Senior Designer', company: 'Northstar', duration: '6 yrs' }
        ],
        education: [{ degree: 'B.F.A. Graphic Design', school: 'Parsons School of Design' }]
    }),

    // ── j-2002 Senior Product Designer · 6 applicants ──
    mk({
        id: 'c-2001', jobId: 'j-2002',
        name: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+1 (212) 555-0199',
        position: 'Senior Product Designer', experience: '7', source: 'LinkedIn',
        skills: ['Figma', 'Research', 'Prototyping'], stage: 'interview', score: 91,
        aiReasoning: 'Research-driven product designer. Multi-quarter shipping history.',
        appliedDate: daysAgo(5),
        location: 'New York, NY',
        linkedIn: 'linkedin.com/in/alex-morgan',
        portfolio: 'alexmorgan.co',
        workHistory: [
            { title: 'Product Designer', company: 'Lumen Co.', duration: '3 yrs' },
            { title: 'UX Designer', company: 'Bytework', duration: '4 yrs' }
        ],
        education: [{ degree: 'B.A. HCI', school: 'Cornell University' }]
    }),
    mk({
        id: 'c-2002', jobId: 'j-2002',
        name: 'Devika Iyer', email: 'devika.iyer@example.com', phone: '+1 (646) 555-0234',
        position: 'Senior Product Designer', experience: '8', source: 'Referral',
        skills: ['Figma', 'Workshop Facilitation', 'Information Architecture'], stage: 'interview', score: 89,
        aiReasoning: 'Workshop facilitator with track record on IA redesigns at two SaaS companies.',
        appliedDate: daysAgo(8),
        location: 'Jersey City, NJ',
        linkedIn: 'linkedin.com/in/devika-iyer',
        portfolio: 'devikaiyer.design',
        workHistory: [{ title: 'Senior Product Designer', company: 'Argo', duration: '5 yrs' }],
        education: [{ degree: 'M.A. Design', school: 'NYU' }]
    }),
    mk({
        id: 'c-2003', jobId: 'j-2002',
        name: 'Owen Riley', email: 'owen.riley@example.com', phone: '+1 (332) 555-0488',
        position: 'Senior Product Designer', experience: '6', source: 'Indeed',
        skills: ['Figma', 'Prototyping'], stage: 'screening', score: 82,
        aiReasoning: 'Strong craft, less depth in research and discovery.',
        appliedDate: daysAgo(6),
        location: 'Brooklyn, NY',
        linkedIn: 'linkedin.com/in/owen-riley',
        workHistory: [{ title: 'Product Designer', company: 'Sundial', duration: '4 yrs' }],
        education: [{ degree: 'B.A. Studio Art', school: 'Pratt Institute' }]
    }),
    mk({
        id: 'c-2004', jobId: 'j-2002',
        name: 'Imani Brooks', email: 'imani.b@example.com', phone: '+1 (212) 555-0567',
        position: 'Senior Product Designer', experience: '5', source: 'LinkedIn',
        skills: ['Figma', 'Research'], stage: 'applied', score: 78,
        aiReasoning: 'Promising mid-level. Would benefit from more leadership reps.',
        appliedDate: daysAgo(3),
        location: 'Manhattan, NY',
        workHistory: [{ title: 'Product Designer', company: 'Bridgewater', duration: '3 yrs' }],
        education: [{ degree: 'B.A. Communications', school: 'Columbia University' }]
    }),
    mk({
        id: 'c-2005', jobId: 'j-2002',
        name: 'Felix Tanaka', email: 'felix.tanaka@example.com', phone: '+1 (646) 555-0670',
        position: 'Senior Product Designer', experience: '9', source: 'Referral',
        skills: ['Figma', 'IA', 'Workshop Facilitation', 'Strategy'], stage: 'applied', score: 90,
        aiReasoning: 'Strategy-minded designer with strong portfolio. Worth fast-tracking.',
        appliedDate: daysAgo(2),
        location: 'New York, NY',
        linkedIn: 'linkedin.com/in/felixtanaka',
        portfolio: 'felixt.design',
        workHistory: [{ title: 'Lead Product Designer', company: 'Latitude', duration: '6 yrs' }],
        education: [{ degree: 'B.F.A. Design', school: 'SVA' }]
    }),
    mk({
        id: 'c-2006', jobId: 'j-2002',
        name: 'Camille Dubois', email: 'camille.dubois@example.com', phone: '+33 6 12 34 56 78',
        position: 'Senior Product Designer', experience: '7', source: 'Company Website',
        skills: ['Figma', 'Prototyping', 'Research'], stage: 'applied', score: 81,
        aiReasoning: 'European-based candidate; would require relocation conversation.',
        appliedDate: daysAgo(1),
        location: 'Paris, France',
        linkedIn: 'linkedin.com/in/camille-dubois',
        workHistory: [{ title: 'Senior Designer', company: 'Maison Studio', duration: '5 yrs' }],
        education: [{ degree: 'M.A. Design', school: 'ENSCI Les Ateliers' }]
    }),

    // ── j-2003 Full Stack Engineer · 10 applicants ──
    mk({
        id: 'c-3001', jobId: 'j-2003',
        name: 'Eleanor Vance', email: 'eleanor.vance@example.com', phone: '+1 (415) 555-0142',
        position: 'Full Stack Engineer', experience: '7', source: 'LinkedIn',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'], stage: 'offer', score: 95,
        aiReasoning: 'Strong React + TypeScript fit. Design-system experience. 7 yrs senior-level tenure.',
        appliedDate: daysAgo(15),
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/eleanor-vance',
        portfolio: 'eleanorvance.dev',
        github: 'github.com/evance',
        workHistory: [
            { title: 'Senior Frontend Engineer', company: 'Apex Solutions', duration: '4 yrs' },
            { title: 'Frontend Developer', company: 'BrightTech', duration: '3 yrs' }
        ],
        education: [
            { degree: 'M.S. Computer Science', school: 'Stanford University' },
            { degree: 'B.S. Information Technology', school: 'UC Berkeley' }
        ]
    }),
    mk({
        id: 'c-3002', jobId: 'j-2003',
        name: 'Lutra Boain', email: 'lutra.boain@example.com', phone: '+1 (628) 555-0211',
        position: 'Full Stack Engineer', experience: '6', source: 'Indeed',
        skills: ['Python', 'TypeScript', 'PostgreSQL', 'Docker'], stage: 'interview', score: 92,
        aiReasoning: 'Excellent Python/Django depth, clear ownership of past systems. Polyglot.',
        appliedDate: daysAgo(10),
        location: 'Seattle, WA',
        linkedIn: 'linkedin.com/in/lutra-boain',
        github: 'github.com/lutraboain',
        workHistory: [
            { title: 'Backend Developer', company: 'Sentinel API', duration: '4 yrs' },
            { title: 'Software Engineer', company: 'Quanta Systems', duration: '2 yrs' }
        ],
        education: [{ degree: 'B.S. Computer Engineering', school: 'University of Washington' }]
    }),
    mk({
        id: 'c-3003', jobId: 'j-2003',
        name: 'Priya Natarajan', email: 'priya.n@example.com', phone: '+91 98 4500 1133',
        position: 'Full Stack Engineer', experience: '6', source: 'Referral',
        skills: ['React', 'TypeScript', 'GraphQL'], stage: 'interview', score: 88,
        aiReasoning: 'Good frontend depth. Backend Node.js coverage would need to be verified.',
        appliedDate: daysAgo(8),
        location: 'Bangalore, India',
        linkedIn: 'linkedin.com/in/priya-natarajan',
        github: 'github.com/priyanat',
        workHistory: [{ title: 'Frontend Engineer', company: 'WaveCo', duration: '6 yrs' }],
        education: [{ degree: 'B.Tech. Computer Science', school: 'IIT Madras' }]
    }),
    mk({
        id: 'c-3004', jobId: 'j-2003',
        name: 'Sana Dlaun', email: 'sana.dlaun@example.com', phone: '+1 (628) 555-0234',
        position: 'Full Stack Engineer', experience: '5', source: 'Company Website',
        skills: ['AWS', 'Docker', 'Node.js'], stage: 'screening', score: 84,
        aiReasoning: 'Solid cloud + container expertise; coming from DevOps so app-layer reps lighter.',
        appliedDate: daysAgo(12),
        location: 'Remote',
        linkedIn: 'linkedin.com/in/sana-dlaun',
        github: 'github.com/sanadlaun',
        workHistory: [
            { title: 'DevOps Engineer', company: 'CloudForge', duration: '3 yrs' },
            { title: 'SRE', company: 'Hyperion', duration: '2 yrs' }
        ],
        education: [{ degree: 'B.S. Information Systems', school: 'Carnegie Mellon' }]
    }),
    mk({
        id: 'c-3005', jobId: 'j-2003',
        name: 'Jamal Hussein', email: 'jamal.h@example.com', phone: '+1 (650) 555-0322',
        position: 'Full Stack Engineer', experience: '4', source: 'LinkedIn',
        skills: ['React', 'TypeScript', 'Node.js'], stage: 'screening', score: 83,
        aiReasoning: 'Strong TS fundamentals. Less production experience with cloud infra.',
        appliedDate: daysAgo(9),
        location: 'Toronto, Canada',
        linkedIn: 'linkedin.com/in/jamalh',
        github: 'github.com/jamalh',
        workHistory: [{ title: 'Software Engineer', company: 'Riverline', duration: '4 yrs' }],
        education: [{ degree: 'B.Sc. Computer Science', school: 'University of Toronto' }]
    }),
    mk({
        id: 'c-3006', jobId: 'j-2003',
        name: 'Mei Tanaka', email: 'mei.tanaka@example.com', phone: '+1 (415) 555-0408',
        position: 'Full Stack Engineer', experience: '5', source: 'Referral',
        skills: ['React', 'GraphQL', 'PostgreSQL'], stage: 'screening', score: 86,
        aiReasoning: 'Polished portfolio of full-stack features. References strong.',
        appliedDate: daysAgo(5),
        location: 'San Mateo, CA',
        linkedIn: 'linkedin.com/in/mei-tanaka',
        github: 'github.com/meitanaka',
        workHistory: [{ title: 'Full Stack Engineer', company: 'Crescent', duration: '5 yrs' }],
        education: [{ degree: 'B.Sc. Computer Science', school: 'UC San Diego' }]
    }),
    mk({
        id: 'c-3007', jobId: 'j-2003',
        name: 'Tariq Khalid', email: 'tariq.khalid@example.com', phone: '+1 (332) 555-0511',
        position: 'Full Stack Engineer', experience: '3', source: 'Company Website',
        skills: ['React', 'Node.js'], stage: 'applied', score: 74,
        aiReasoning: 'Junior-leaning. Promising trajectory; will need mentorship runway.',
        appliedDate: daysAgo(2),
        location: 'Brooklyn, NY',
        linkedIn: 'linkedin.com/in/tariqk',
        github: 'github.com/tariqk',
        workHistory: [{ title: 'Junior Engineer', company: 'Pillar', duration: '3 yrs' }],
        education: [{ degree: 'B.A. CS', school: 'CUNY' }]
    }),
    mk({
        id: 'c-3008', jobId: 'j-2003',
        name: 'Reyna Castillo', email: 'reyna.c@example.com', phone: '+1 (310) 555-0614',
        position: 'Full Stack Engineer', experience: '6', source: 'LinkedIn',
        skills: ['React', 'TypeScript', 'Node.js', 'AWS'], stage: 'applied', score: 87,
        aiReasoning: 'Well-rounded full-stack. Recently shipped a major migration.',
        appliedDate: daysAgo(4),
        location: 'Los Angeles, CA',
        linkedIn: 'linkedin.com/in/reyna-castillo',
        github: 'github.com/reynac',
        workHistory: [{ title: 'Full Stack Engineer', company: 'Lyra', duration: '6 yrs' }],
        education: [{ degree: 'B.S. Computer Science', school: 'UCLA' }]
    }),
    mk({
        id: 'c-3009', jobId: 'j-2003',
        name: 'Oskar Lindqvist', email: 'oskar.l@example.com', phone: '+46 70 123 4567',
        position: 'Full Stack Engineer', experience: '8', source: 'Referral',
        skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'Kubernetes'], stage: 'applied', score: 90,
        aiReasoning: 'Strong senior candidate; track record of leading projects end-to-end.',
        appliedDate: daysAgo(3),
        location: 'Stockholm, Sweden',
        linkedIn: 'linkedin.com/in/oskar-lindqvist',
        github: 'github.com/oskarl',
        workHistory: [
            { title: 'Senior Engineer', company: 'Nordic Tech AB', duration: '5 yrs' },
            { title: 'Software Engineer', company: 'Polaris', duration: '3 yrs' }
        ],
        education: [{ degree: 'M.Sc. Computer Science', school: 'KTH Royal Institute of Technology' }]
    }),
    mk({
        id: 'c-3010', jobId: 'j-2003',
        name: 'Naveen Krishnan', email: 'naveen.k@example.com', phone: '+1 (469) 555-0720',
        position: 'Full Stack Engineer', experience: '4', source: 'Indeed',
        skills: ['React', 'Node.js', 'PostgreSQL'], stage: 'applied', score: 80,
        aiReasoning: 'Good fundamentals, motivated. Comfortable across stack.',
        appliedDate: daysAgo(1),
        location: 'Dallas, TX',
        linkedIn: 'linkedin.com/in/naveenk',
        github: 'github.com/naveenk',
        workHistory: [{ title: 'Software Engineer', company: 'BlueTrail', duration: '4 yrs' }],
        education: [{ degree: 'B.S. Computer Science', school: 'UT Dallas' }]
    }),

    // ── j-2004 Marketing Manager · 4 applicants ──
    mk({
        id: 'c-4001', jobId: 'j-2004',
        name: 'Elena Russo', email: 'elena.russo@example.com', phone: '+1 (512) 555-0190',
        position: 'Marketing Manager', experience: '8', source: 'LinkedIn',
        skills: ['SEO', 'Content Strategy', 'Analytics', 'Brand'], stage: 'interview', score: 93,
        aiReasoning: 'Operator who turned a small content team into a meaningful pipeline driver.',
        appliedDate: daysAgo(7),
        location: 'Austin, TX',
        linkedIn: 'linkedin.com/in/elena-russo',
        portfolio: 'elenarusso.com',
        workHistory: [
            { title: 'Content Lead', company: 'Bookline SaaS', duration: '5 yrs' },
            { title: 'Marketing Manager', company: 'Ember Co.', duration: '3 yrs' }
        ],
        education: [{ degree: 'B.A. Communications', school: 'UT Austin' }]
    }),
    mk({
        id: 'c-4002', jobId: 'j-2004',
        name: 'Vikram Shah', email: 'vikram.shah@example.com', phone: '+1 (737) 555-0288',
        position: 'Marketing Manager', experience: '7', source: 'Referral',
        skills: ['Lifecycle Marketing', 'Analytics', 'Brand'], stage: 'screening', score: 85,
        aiReasoning: 'Strong lifecycle background. Less hands-on SEO experience.',
        appliedDate: daysAgo(5),
        location: 'Austin, TX',
        linkedIn: 'linkedin.com/in/vikram-shah',
        workHistory: [{ title: 'Lifecycle Marketing Lead', company: 'Notable', duration: '4 yrs' }],
        education: [{ degree: 'M.B.A. Marketing', school: 'Kellogg School' }]
    }),
    mk({
        id: 'c-4003', jobId: 'j-2004',
        name: 'Sasha Patel', email: 'sasha.patel@example.com', phone: '+1 (737) 555-0392',
        position: 'Marketing Manager', experience: '6', source: 'Indeed',
        skills: ['Content Strategy', 'SEO'], stage: 'applied', score: 79,
        aiReasoning: 'Content-first marketer. Would benefit from broader funnel exposure.',
        appliedDate: daysAgo(3),
        location: 'Round Rock, TX',
        linkedIn: 'linkedin.com/in/sasha-patel',
        workHistory: [{ title: 'Content Strategist', company: 'Spruce', duration: '5 yrs' }],
        education: [{ degree: 'B.A. English', school: 'Rice University' }]
    }),
    mk({
        id: 'c-4004', jobId: 'j-2004',
        name: 'Hugo Martin', email: 'hugo.martin@example.com', phone: '+1 (512) 555-0481',
        position: 'Marketing Manager', experience: '9', source: 'LinkedIn',
        skills: ['SEO', 'Brand', 'Analytics', 'Content Strategy'], stage: 'applied', score: 88,
        aiReasoning: 'Versatile marketer with both brand and growth chops.',
        appliedDate: daysAgo(2),
        location: 'Austin, TX',
        linkedIn: 'linkedin.com/in/hugo-martin',
        workHistory: [
            { title: 'Head of Growth', company: 'Halo Labs', duration: '4 yrs' },
            { title: 'Marketing Manager', company: 'Trellis', duration: '5 yrs' }
        ],
        education: [{ degree: 'B.A. Business', school: 'UT Austin' }]
    }),

    // ── j-2005 Data Scientist · 7 applicants ──
    mk({
        id: 'c-5001', jobId: 'j-2005',
        name: 'Tobias Klein', email: 'tobias.klein@example.com', phone: '+1 (415) 555-0144',
        position: 'Data Scientist', experience: '6', source: 'Referral',
        skills: ['Python', 'SQL', 'ML', 'TensorFlow', 'Statistics'], stage: 'hired', score: 96,
        aiReasoning: 'Standout candidate — landed offer, accepted last week. Strong experimentation background.',
        appliedDate: daysAgo(28),
        location: 'Remote',
        linkedIn: 'linkedin.com/in/tobias-klein',
        github: 'github.com/tobiask',
        workHistory: [
            { title: 'Senior Data Scientist', company: 'Mirage Labs', duration: '3 yrs' },
            { title: 'Data Scientist', company: 'BlueCanvas', duration: '3 yrs' }
        ],
        education: [{ degree: 'Ph.D. Statistics', school: 'University of Chicago' }]
    }),
    mk({
        id: 'c-5002', jobId: 'j-2005',
        name: 'Yuki Sato', email: 'yuki.sato@example.com', phone: '+1 (628) 555-0259',
        position: 'Data Scientist', experience: '5', source: 'LinkedIn',
        skills: ['Python', 'SQL', 'ML', 'Pandas'], stage: 'interview', score: 91,
        aiReasoning: 'Clean experimentation portfolio, strong communicator.',
        appliedDate: daysAgo(4),
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/yuki-sato',
        github: 'github.com/yukisato',
        workHistory: [{ title: 'Data Scientist', company: 'Stage', duration: '5 yrs' }],
        education: [{ degree: 'M.S. Statistics', school: 'Stanford University' }]
    }),
    mk({
        id: 'c-5003', jobId: 'j-2005',
        name: 'Aditi Sharma', email: 'aditi.sharma@example.com', phone: '+91 99 1234 5678',
        position: 'Data Scientist', experience: '4', source: 'Referral',
        skills: ['Python', 'SQL', 'ML'], stage: 'interview', score: 87,
        aiReasoning: 'Mid-level with strong product-thinking. Past role at scale fintech.',
        appliedDate: daysAgo(6),
        location: 'Mumbai, India',
        linkedIn: 'linkedin.com/in/aditi-sharma',
        github: 'github.com/aditis',
        workHistory: [{ title: 'Data Scientist', company: 'Fynd', duration: '4 yrs' }],
        education: [{ degree: 'M.Sc. Statistics', school: 'IIM Calcutta' }]
    }),
    mk({
        id: 'c-5004', jobId: 'j-2005',
        name: 'Connor McLean', email: 'connor.mclean@example.com', phone: '+1 (917) 555-0368',
        position: 'Data Scientist', experience: '7', source: 'Indeed',
        skills: ['Python', 'SQL', 'TensorFlow'], stage: 'screening', score: 84,
        aiReasoning: 'Deep ML technical chops; product context less clear.',
        appliedDate: daysAgo(3),
        location: 'Boston, MA',
        linkedIn: 'linkedin.com/in/connorm',
        github: 'github.com/connorm',
        workHistory: [{ title: 'ML Engineer', company: 'Nimbus AI', duration: '5 yrs' }],
        education: [{ degree: 'M.S. Computer Science', school: 'MIT' }]
    }),
    mk({
        id: 'c-5005', jobId: 'j-2005',
        name: 'Renata Silva', email: 'renata.silva@example.com', phone: '+55 11 91234 5678',
        position: 'Data Scientist', experience: '5', source: 'LinkedIn',
        skills: ['Python', 'Pandas', 'SQL'], stage: 'screening', score: 82,
        aiReasoning: 'Analyst-leaning. Solid fundamentals, less ML modeling depth.',
        appliedDate: daysAgo(2),
        location: 'São Paulo, Brazil',
        linkedIn: 'linkedin.com/in/renata-silva',
        workHistory: [{ title: 'Data Analyst', company: 'Velocity', duration: '5 yrs' }],
        education: [{ degree: 'B.Sc. Statistics', school: 'University of São Paulo' }]
    }),
    mk({
        id: 'c-5006', jobId: 'j-2005',
        name: 'Aaron Becker', email: 'aaron.becker@example.com', phone: '+1 (415) 555-0477',
        position: 'Data Scientist', experience: '3', source: 'Company Website',
        skills: ['Python', 'SQL'], stage: 'applied', score: 73,
        aiReasoning: 'Junior-leaning; would benefit from a stretch mentor.',
        appliedDate: daysAgo(1),
        location: 'Oakland, CA',
        linkedIn: 'linkedin.com/in/aaronb',
        github: 'github.com/aaronb',
        workHistory: [{ title: 'Junior Data Scientist', company: 'Otter Analytics', duration: '3 yrs' }],
        education: [{ degree: 'B.Sc. Math', school: 'UC Santa Cruz' }]
    }),
    mk({
        id: 'c-5007', jobId: 'j-2005',
        name: 'Mariam El-Sayed', email: 'mariam.el@example.com', phone: '+1 (646) 555-0589',
        position: 'Data Scientist', experience: '6', source: 'Referral',
        skills: ['Python', 'ML', 'Pandas', 'Statistics'], stage: 'applied', score: 89,
        aiReasoning: 'Recently led a forecasting initiative; well-rounded.',
        appliedDate: daysAgo(2),
        location: 'New York, NY',
        linkedIn: 'linkedin.com/in/mariam-elsayed',
        github: 'github.com/mariame',
        workHistory: [{ title: 'Senior Data Scientist', company: 'Constellation', duration: '6 yrs' }],
        education: [{ degree: 'M.S. Applied Math', school: 'Columbia University' }]
    })
];

module.exports = { jobs, candidates };
