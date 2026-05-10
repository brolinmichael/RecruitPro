// Centralized API Client for RecruitPro

const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('rh-token') || null;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('rh-token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('rh-token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Only set Content-Type to JSON if it's not FormData
        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Handle unauthorized (e.g., redirect to login)
                this.clearToken();
                window.location.reload(); 
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // --- Auth ---
    login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // --- Dashboard ---
    getKPIs() {
        return this.request('/dashboard/kpis');
    }

    // --- Jobs ---
    getJobs() {
        return this.request('/jobs');
    }

    createJob(jobData) {
        return this.request('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    }

    // --- Candidates ---
    getCandidates() {
        return this.request('/candidates');
    }

    addCandidate(formData) {
        // formData should be an instance of FormData to handle file uploads
        return this.request('/candidates', {
            method: 'POST',
            body: formData
        });
    }

    updateCandidateStage(id, stage) {
        return this.request(`/candidates/${id}/stage`, {
            method: 'PATCH',
            body: JSON.stringify({ stage })
        });
    }

    // --- AI Scoring ---
    scoreResume(formData) {
        return this.request('/candidates/score', {
            method: 'POST',
            body: formData
        });
    }
}

// Expose instance globally
window.api = new ApiClient();
