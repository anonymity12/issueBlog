// Configuration - automatically detects repository from GitHub Pages URL
const getRepoInfo = () => {
    const hostname = window.location.hostname;
    
    // For GitHub Pages: username.github.io/repository
    if (hostname.endsWith('.github.io')) {
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const username = hostname.split('.')[0];
        const repo = pathParts[0] || 'issueBlog';
        return { owner: username, repo: repo };
    }
    
    // Default fallback
    return { owner: 'anonymity12', repo: 'issueBlog' };
};

const repoInfo = getRepoInfo();
const GITHUB_API = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/issues`;

// Fetch issues from GitHub
async function fetchIssues() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const errorMessageEl = document.getElementById('error-message');
    const entriesEl = document.getElementById('blog-entries');

    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        const response = await fetch(GITHUB_API + '?state=all&sort=created&direction=desc');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch issues: ${response.status} ${response.statusText}`);
        }

        const issues = await response.json();
        
        loadingEl.style.display = 'none';

        if (issues.length === 0) {
            entriesEl.innerHTML = '<div class="entry"><p class="entry-content" style="text-align: center; font-style: italic;">No entries have been recorded yet. Begin your journey by creating an issue in this repository.</p></div>';
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
        authorInfo.innerHTML = `Recorded by <strong>${issue.user.login}</strong> • Status: ${issue.state === 'open' ? 'Ongoing Voyage' : 'Completed Journey'}`;
        entry.appendChild(authorInfo);
        
        entriesEl.appendChild(entry);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', fetchIssues);
