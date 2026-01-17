// Configuration - automatically detects repository from GitHub Pages URL
const DEFAULT_OWNER = 'anonymity12';
const DEFAULT_REPO = 'issueBlog';

// GitHub API Token Management
const TOKEN_STORAGE_KEY = 'github_api_token';

/**
 * Retrieves the stored GitHub Personal Access Token from session storage
 * @returns {string|null} The stored token or null if not found
 */
function getStoredToken() {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Stores the GitHub Personal Access Token in session storage
 * @param {string} token - The GitHub PAT to store
 */
function saveToken(token) {
    if (token && token.trim()) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
    }
}

/**
 * Removes the stored GitHub Personal Access Token from session storage
 */
function clearToken() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Creates HTTP headers for GitHub API requests
 * Includes Authorization header if a token is available
 * @returns {Object} Headers object for fetch requests
 */
function getApiHeaders() {
    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };
    
    const token = getStoredToken();
    if (token) {
        // Using Bearer token format (recommended by GitHub)
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

const getRepoInfo = () => {
    const hostname = window.location.hostname;
    
    // For GitHub Pages: username.github.io/repository
    if (hostname.endsWith('.github.io') && hostname.includes('.')) {
        const parts = hostname.split('.');
        if (parts.length >= 3) { // Ensure proper format: username.github.io
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const username = parts[0];
            const repo = pathParts[0] || DEFAULT_REPO;
            return { owner: username, repo: repo };
        }
    }
    
    // Default fallback
    return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO };
};

const repoInfo = getRepoInfo();
const GITHUB_API = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/issues`;

// Supported GitHub token prefixes for validation
const SUPPORTED_TOKEN_PREFIXES = ['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_'];

// Fetch issues from GitHub
async function fetchIssues() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const errorMessageEl = document.getElementById('error-message');
    const entriesEl = document.getElementById('blog-entries');

    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        // Make authenticated request if token is available
        const headers = getApiHeaders();
        const response = await fetch(GITHUB_API + '?state=all&sort=created&direction=desc', {
            headers: headers
        });
        
        if (!response.ok) {
            // Handle rate limiting
            if (response.status === 403) {
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                if (rateLimitRemaining === '0') {
                    throw new Error('Rate limit exceeded. Please provide a GitHub Personal Access Token to increase your rate limit.');
                }
            }
            
            // Handle authentication errors
            if (response.status === 401) {
                clearToken();
                updateTokenUI();
                throw new Error('Invalid GitHub token. Please check your Personal Access Token and try again.');
            }
            
            throw new Error(`Failed to fetch issues: ${response.status} ${response.statusText}`);
        }

        const issues = await response.json();
        
        loadingEl.style.display = 'none';

        if (issues.length === 0) {
            const emptyEntry = document.createElement('div');
            emptyEntry.className = 'entry';
            const emptyContent = document.createElement('p');
            emptyContent.className = 'entry-content';
            emptyContent.style.textAlign = 'center';
            emptyContent.style.fontStyle = 'italic';
            emptyContent.textContent = 'No entries have been recorded yet. Begin your journey by creating an issue in this repository.';
            emptyEntry.appendChild(emptyContent);
            entriesEl.appendChild(emptyEntry);
            return;
        }

        displayIssues(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorMessageEl.textContent = error.message;
    }
}

// Format date in historical style
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const daySuffix = getDaySuffix(day);
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `The ${day}${daySuffix} day of ${month}, Year ${year}`;
}

function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Display issues as diary entries
function displayIssues(issues) {
    const entriesEl = document.getElementById('blog-entries');
    entriesEl.innerHTML = '';

    issues.forEach(issue => {
        // Skip pull requests (they appear in issues API)
        if (issue.pull_request) {
            return;
        }

        const entry = document.createElement('div');
        entry.className = 'entry';
        
        const date = document.createElement('div');
        date.className = 'entry-date';
        date.textContent = formatDate(issue.created_at);
        
        const title = document.createElement('h2');
        title.className = 'entry-title';
        title.textContent = issue.title;
        
        const content = document.createElement('div');
        content.className = 'entry-content';
        content.textContent = issue.body || 'No details recorded for this entry.';
        
        entry.appendChild(date);
        entry.appendChild(title);
        entry.appendChild(content);
        
        // Add labels if present
        if (issue.labels && issue.labels.length > 0) {
            const meta = document.createElement('div');
            meta.className = 'entry-meta';
            
            const labelsContainer = document.createElement('div');
            labelsContainer.className = 'entry-labels';
            
            const labelsText = document.createElement('span');
            labelsText.textContent = 'Categories: ';
            labelsContainer.appendChild(labelsText);
            
            issue.labels.forEach(label => {
                const labelEl = document.createElement('span');
                labelEl.className = 'label';
                labelEl.textContent = label.name;
                labelsContainer.appendChild(labelEl);
            });
            
            meta.appendChild(labelsContainer);
            entry.appendChild(meta);
        }
        
        // Add author and state information
        const authorInfo = document.createElement('div');
        authorInfo.className = 'entry-meta';
        authorInfo.style.marginTop = '0.5rem';
        
        const recordedText = document.createTextNode('Recorded by ');
        const authorStrong = document.createElement('strong');
        authorStrong.textContent = issue.user.login;
        const statusText = document.createTextNode(` • Status: ${issue.state === 'open' ? 'Ongoing Voyage' : 'Completed Journey'}`);
        
        authorInfo.appendChild(recordedText);
        authorInfo.appendChild(authorStrong);
        authorInfo.appendChild(statusText);
        entry.appendChild(authorInfo);
        
        entriesEl.appendChild(entry);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTokenUI();
    fetchIssues();
});

/**
 * Initializes the token input UI and event listeners
 */
function initializeTokenUI() {
    const tokenInput = document.getElementById('github-token');
    const saveButton = document.getElementById('save-token-btn');
    const clearButton = document.getElementById('clear-token-btn');
    const statusEl = document.getElementById('token-status');

    // Set up event listeners
    saveButton.addEventListener('click', handleSaveToken);
    clearButton.addEventListener('click', handleClearToken);
    
    // Allow Enter key to save token
    tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSaveToken();
        }
    });

    // Update UI based on stored token
    updateTokenUI();
}

/**
 * Updates the UI to reflect the current token state
 */
function updateTokenUI() {
    const tokenInput = document.getElementById('github-token');
    const saveButton = document.getElementById('save-token-btn');
    const clearButton = document.getElementById('clear-token-btn');
    const statusEl = document.getElementById('token-status');
    
    const storedToken = getStoredToken();
    
    if (storedToken) {
        // Token is stored
        tokenInput.value = '••••••••••••••••••••';
        tokenInput.disabled = true;
        saveButton.style.display = 'none';
        clearButton.style.display = 'inline-block';
        
        statusEl.textContent = '✓ Token saved and active for this session';
        statusEl.className = 'token-status success';
        statusEl.style.display = 'block';
    } else {
        // No token stored
        tokenInput.value = '';
        tokenInput.disabled = false;
        saveButton.style.display = 'inline-block';
        clearButton.style.display = 'none';
        statusEl.style.display = 'none';
    }
}

/**
 * Handles the save token button click
 */
function handleSaveToken() {
    const tokenInput = document.getElementById('github-token');
    const statusEl = document.getElementById('token-status');
    const token = tokenInput.value.trim();
    
    if (!token) {
        statusEl.textContent = '⚠ Please enter a token';
        statusEl.className = 'token-status error';
        statusEl.style.display = 'block';
        return;
    }
    
    // Basic validation - GitHub tokens have specific formats:
    // Classic tokens (ghp_): 40 chars total (4 prefix + 36 alphanumeric)
    // Fine-grained tokens (github_pat_): variable length, typically 80+ chars
    // Other types (gho_, ghu_, ghs_, ghr_): similar to classic, 40 chars total
    const tokenPattern = /^(ghp_[a-zA-Z0-9]{36}|github_pat_.{50,}|gh[ouhsr]_[a-zA-Z0-9]{36})$/;
    if (!tokenPattern.test(token)) {
        const prefixList = SUPPORTED_TOKEN_PREFIXES.join(', ');
        statusEl.textContent = `⚠ Token format appears invalid. GitHub tokens typically start with ${prefixList}`;
        statusEl.className = 'token-status error';
        statusEl.style.display = 'block';
        return;
    }
    
    // Save the token
    saveToken(token);
    updateTokenUI();
    
    // Reload issues with the new token
    statusEl.textContent = '✓ Token saved! Reloading entries...';
    statusEl.className = 'token-status info';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        fetchIssues();
    }, 500);
}

/**
 * Handles the clear token button click
 */
function handleClearToken() {
    const statusEl = document.getElementById('token-status');
    
    clearToken();
    updateTokenUI();
    
    statusEl.textContent = 'Token cleared. Reloading entries...';
    statusEl.className = 'token-status info';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        fetchIssues();
        statusEl.style.display = 'none';
    }, 1500);
}
