// script.js - Demo data and dashboard logic for Agility & Reflex Training Device

// Dummy session data (full dataset used for demo)
const sessionData = {
    attempts: [
        { attempt: 1, reactionTime: 320, result: 'Hit' },
        { attempt: 2, reactionTime: 410, result: 'Miss' },
        { attempt: 3, reactionTime: 295, result: 'Hit' },
        { attempt: 4, reactionTime: 360, result: 'Hit' },
        { attempt: 5, reactionTime: 420, result: 'Miss' },
        { attempt: 6, reactionTime: 310, result: 'Hit' },
        { attempt: 7, reactionTime: 305, result: 'Hit' },
        { attempt: 8, reactionTime: 390, result: 'Hit' },
        { attempt: 9, reactionTime: 340, result: 'Hit' },
        { attempt: 10, reactionTime: 370, result: 'Miss' }
    ]
};

// Removed demo password/tunnel gate — no-op in production flow.

// Sport thresholds (ms) - used to evaluate reaction speed per sport
const sportThresholds = {
    Athletics: 250,
    Football: 300,
    Cricket: 220,
    Badminton: 200,
    Boxing: 180,
    Rehab: 450
};

// State for playback and UI
let currentThreshold = sportThresholds.Athletics;
let displayedAttempts = [...sessionData.attempts]; // initial full view
let reactionChart = null;
let hitMissChart = null;
let playbackInterval = null;
let countdownInterval = null;
let remainingSec = 0;
let playIndex = 0;

// Format seconds to mm:ss
function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Update summary cards based on displayedAttempts
function updateSummaryCards() {
    const totalReactions = displayedAttempts.length;
    const totalHits = displayedAttempts.filter(a => a.result === 'Hit').length;
    const totalMisses = displayedAttempts.filter(a => a.result === 'Miss').length;
    const avgReactionTime = totalReactions ? Math.round(displayedAttempts.reduce((sum, a) => sum + a.reactionTime, 0) / totalReactions) : 0;
    const accuracy = totalReactions ? Math.round((totalHits / totalReactions) * 100) : 0;

    document.getElementById('totalReactionsValue').textContent = totalReactions;
    document.getElementById('avgReactionTimeValue').textContent = avgReactionTime + ' ms';
    document.getElementById('accuracyValue').textContent = accuracy + '%';
}

// Create or update reaction time chart
function initReactionTimeChart() {
    const ctx = document.getElementById('reactionTimeChart').getContext('2d');
    const labels = displayedAttempts.map(a => a.attempt);
    const data = displayedAttempts.map(a => a.reactionTime);
    if (reactionChart) {
        reactionChart.data.labels = labels;
        reactionChart.data.datasets[0].data = data;
        reactionChart.update();
        return;
    }
    reactionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Reaction Time (ms)',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.08)',
                fill: true,
                tension: 0.25,
                pointRadius: 4,
                pointBackgroundColor: '#1e3a8a',
                pointBorderColor: '#fff',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { title: { display: true, text: 'Attempt' }, grid: { color: '#e5e7eb' } },
                y: { title: { display: true, text: 'Reaction Time (ms)' }, min: 0, grid: { color: '#e5e7eb' } }
            }
        }
    });
}

// Create or update hit/miss chart
function initHitMissChart() {
    const ctx = document.getElementById('hitMissChart').getContext('2d');
    const hits = displayedAttempts.filter(a => a.result === 'Hit').length;
    const misses = displayedAttempts.filter(a => a.result === 'Miss').length;
    if (hitMissChart) {
        hitMissChart.data.datasets[0].data = [hits, misses];
        hitMissChart.update();
        return;
    }
    hitMissChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Hits', 'Misses'],
            datasets: [{ data: [hits, misses], backgroundColor: ['#2563eb', '#e0e7ef'], borderColor: ['#1e3a8a', '#cbd5e1'], borderWidth: 2 }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true, position: 'bottom', labels: { color: '#1e3a8a', font: { size: 14 } } } }
        }
    });
}

// Render session log table from displayedAttempts and apply threshold styling
function renderSessionLogTable() {
    const tbody = document.getElementById('sessionLogTable').querySelector('tbody');
    tbody.innerHTML = '';
    displayedAttempts.forEach(a => {
        const tr = document.createElement('tr');
        const speedClass = a.reactionTime > currentThreshold ? 'slow' : '';
        tr.innerHTML = `
            <td>${a.attempt}</td>
            <td>${a.reactionTime}</td>
            <td class="${a.result === 'Hit' ? 'hit' : 'miss'} ${speedClass}">${a.result}${speedClass ? ' (Slow)' : ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Initialize UI components and charts
function initDashboard() {
    // set initial threshold display
    const sportSelect = document.getElementById('sportSelect');
    const thresholdEl = document.getElementById('thresholdValue');
    currentThreshold = sportThresholds[sportSelect.value] || 300;
    thresholdEl.textContent = currentThreshold;

    // wire sport selector
    sportSelect.addEventListener('change', () => {
        currentThreshold = sportThresholds[sportSelect.value] || 300;
        thresholdEl.textContent = currentThreshold;
        // re-render table to reflect threshold changes
        renderSessionLogTable();
    });

    // Start / Stop buttons
    document.getElementById('startBtn').addEventListener('click', startSession);
    document.getElementById('stopBtn').addEventListener('click', stopSession);

    // initial full render
    updateSummaryCards();
    initReactionTimeChart();
    initHitMissChart();
    renderSessionLogTable();
}

// Return true when current document contains dashboard-specific elements
function isDashboardPage() {
    // core IDs used by the dashboard UI
    return !!(document.getElementById('sportSelect') || document.getElementById('reactionTimeChart') || document.getElementById('startBtn'));
}

// Start session playback (simulated) with countdown
function startSession() {
    // reset any running sessions
    stopSession();

    const timerInput = document.getElementById('timerInput');
    remainingSec = Math.max(5, parseInt(timerInput.value, 10) || 60);
    document.getElementById('countdownDisplay').textContent = formatDuration(remainingSec);

    // prepare for playback: start empty and push attempts one by one
    displayedAttempts = [];
    playIndex = 0;
    updateSummaryCards();
    initReactionTimeChart();
    initHitMissChart();
    renderSessionLogTable();

    // countdown interval
    countdownInterval = setInterval(() => {
        remainingSec -= 1;
        document.getElementById('countdownDisplay').textContent = formatDuration(Math.max(0, remainingSec));
        if (remainingSec <= 0) {
            stopSession();
        }
    }, 1000);

    // playback attempts every 1.2s until timer runs out or attempts exhausted
    playbackInterval = setInterval(() => {
        if (remainingSec <= 0 || playIndex >= sessionData.attempts.length) {
            stopSession();
            return;
        }
        // push next attempt
        const next = sessionData.attempts[playIndex];
        displayedAttempts.push(next);
        playIndex += 1;

        // update charts and table
        initReactionTimeChart();
        initHitMissChart();
        renderSessionLogTable();
        updateSummaryCards();
    }, 1200);

    // disable start while running
    document.getElementById('startBtn').disabled = true;
}

// Stop playback and countdown
function stopSession() {
    if (playbackInterval) { clearInterval(playbackInterval); playbackInterval = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    document.getElementById('startBtn').disabled = false;
    // if timer expired and no displayed attempts, ensure UI shows final state
    document.getElementById('countdownDisplay').textContent = formatDuration(Math.max(0, remainingSec || 0));
}

// --- Simple client-side auth (demo only) ---
function saveUser(user) {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    users.push(user);
    localStorage.setItem('demo_users', JSON.stringify(users));
}

function findUserByEmail(email) {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    return users.find(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase());
}

function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = (document.getElementById('signupName').value || '').trim();
            const email = (document.getElementById('signupEmail').value || '').trim();
            const pw = document.getElementById('signupPassword').value || '';
            const pw2 = document.getElementById('signupConfirm').value || '';
            const msg = document.getElementById('signupMessage');

            if (!name || !email || !pw) {
                msg.textContent = 'Please complete all fields.';
                msg.style.color = '#b45309';
                return;
            }
            if (pw !== pw2) {
                msg.textContent = 'Passwords do not match.';
                msg.style.color = '#7f1d1d';
                return;
            }
            if (findUserByEmail(email)) {
                msg.textContent = 'An account with this email already exists.';
                msg.style.color = '#7f1d1d';
                return;
            }

            // NOTE: This demo stores credentials in localStorage. Do NOT use in production.
            saveUser({ name, email, password: pw });
            msg.textContent = 'Account created — redirecting to login...';
            msg.style.color = '#064e3b';
            setTimeout(() => { window.location.href = 'login.html'; }, 800);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (document.getElementById('loginEmail').value || '').trim();
            const pw = document.getElementById('loginPassword').value || '';
            const msg = document.getElementById('loginMessage');

            const user = findUserByEmail(email);
            if (!user) {
                msg.textContent = 'No account found. Please sign up.';
                msg.style.color = '#b45309';
                return;
            }
            if (user.password !== pw) {
                msg.textContent = 'Incorrect password.';
                msg.style.color = '#7f1d1d';
                return;
            }

            sessionStorage.setItem('demo_user', JSON.stringify({ name: user.name, email: user.email }));
            msg.textContent = 'Login successful — redirecting...';
            msg.style.color = '#064e3b';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
        });
    }
}

// On page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isDashboardPage()) initDashboard();
        initAuthForms();
    });
} else {
    if (isDashboardPage()) initDashboard();
    initAuthForms();
}
