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

        let response;
        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });
        } catch (networkErr) {
            // fetch only rejects on network failure — surface a friendly message.
            const err = new Error('Could not reach the server. Check your connection and try again.');
            err.cause = networkErr;
            err.networkError = true;
            throw err;
        }

        if (response.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            this.clearToken();
            window.location.reload();
            // Halt this request chain so callers don't see a partial response.
            throw new Error('Session expired. Please sign in again.');
        }

        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try { data = await response.json(); } catch (_) { data = null; }
        } else {
            try { data = { error: (await response.text()).slice(0, 200) }; } catch (_) { data = null; }
        }

        if (!response.ok) {
            const err = new Error((data && data.error) || `Request failed (${response.status}).`);
            err.status = response.status;
            err.fields = (data && data.fields) || null;
            throw err;
        }

        return data;
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
    getJobs(params = {}) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        return this.request(`/jobs${query ? `?${query}` : ''}`);
    }

    getJobsInsights() {
        return this.request('/jobs/insights');
    }

    getJob(id) {
        if (!id) return Promise.reject(new Error('Job id is required.'));
        return this.request(`/jobs/${encodeURIComponent(id)}`);
    }

    createJob(jobData) {
        return this.request('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    }

    // --- Candidates ---
    getCandidates(params = {}) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        return this.request(`/candidates${query ? `?${query}` : ''}`);
    }

    getCandidatesInsights() {
        return this.request('/candidates/insights');
    }

    getCandidate(id) {
        if (!id) return Promise.reject(new Error('Candidate id is required.'));
        return this.request(`/candidates/${encodeURIComponent(id)}`);
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
