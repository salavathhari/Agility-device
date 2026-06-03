// utils.js - Shared utilities for Agility & Reflex Training Device

// ---------------------
// Storage helpers
// ---------------------

/** Safely read and parse JSON from localStorage with a fallback value. */
function getStorageJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/** Write a value as JSON to localStorage. */
function setStorageJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------
// Demo user helpers
// ---------------------

/** Sanitize an email address for use as a storage key segment. */
function sanitizeEmail(email) {
    return (email || '').replace(/[^a-z0-9@.\-_]/gi, '');
}

/** Get the current demo user from sessionStorage (or null). */
function getDemoUser() {
    const raw = sessionStorage.getItem('demo_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/** Store user in sessionStorage and redirect to the dashboard. */
function authRedirect(name, email) {
    sessionStorage.setItem('demo_user', JSON.stringify({ name, email }));
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
}

// ---------------------
// UI feedback helpers
// ---------------------

const MSG_COLORS = {
    success: '#064e3b',
    warning: '#b45309',
    error: '#7f1d1d'
};

/** Show a feedback message on a form element. */
function showFormMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.style.color = MSG_COLORS[type] || '#475569';
}
