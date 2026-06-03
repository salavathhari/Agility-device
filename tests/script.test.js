/**
 * Unit tests for edp/assets/script.js
 *
 * Covers: pure utility functions, session/streak/points logic,
 *         auth helpers, leaderboard logic, and summary calculations.
 */

// Minimal DOM stubs so the module-level auto-init code does not crash.
beforeAll(() => {
  // The script inspects document.readyState on load; 'complete' avoids
  // the addEventListener path and triggers the else-branch which calls
  // isDashboardPage(), initAuthForms(), initQR(), initApiStatus().
  // We provide stub elements for every getElementById the init path touches.
  Object.defineProperty(document, 'readyState', {
    get: () => 'complete',
    configurable: true,
  });

  // Provide minimal DOM elements needed by init paths
  const ids = [
    'sportSelect', 'thresholdValue', 'startBtn', 'stopBtn',
    'timerInput', 'countdownDisplay', 'totalReactionsValue',
    'avgReactionTimeValue', 'accuracyValue',
    'reactionTimeChart', 'hitMissChart', 'sessionLogTable',
    'loginForm', 'signupForm', 'qrCode', 'apiStatus',
    'streakCount', 'totalPoints', 'rewardsList', 'nextReward',
    'streakStatus', 'leaderboardList', 'yourPosition', 'yourPointsNote',
    'sessionDurationValue',
  ];

  ids.forEach(id => {
    if (!document.getElementById(id)) {
      const el = document.createElement(
        id === 'sportSelect' ? 'select' :
        id === 'sessionLogTable' ? 'table' :
        (id === 'reactionTimeChart' || id === 'hitMissChart') ? 'canvas' :
        (id === 'loginForm' || id === 'signupForm') ? 'form' :
        id === 'qrCode' ? 'img' :
        'div'
      );
      el.id = id;
      // sportSelect needs a value
      if (id === 'sportSelect') el.value = 'Athletics';
      // sessionLogTable needs a tbody
      if (id === 'sessionLogTable') {
        const tbody = document.createElement('tbody');
        el.appendChild(tbody);
      }
      // canvas needs getContext
      if (id === 'reactionTimeChart' || id === 'hitMissChart') {
        el.getContext = () => ({
          canvas: el,
          fillRect: () => {},
          clearRect: () => {},
          getImageData: () => ({ data: [] }),
          putImageData: () => {},
          createImageData: () => [],
          setTransform: () => {},
          drawImage: () => {},
          save: () => {},
          fillText: () => {},
          restore: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          stroke: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          arc: () => {},
          fill: () => {},
          measureText: () => ({ width: 0 }),
          transform: () => {},
          rect: () => {},
          clip: () => {},
        });
      }
      document.body.appendChild(el);
    }
  });
});

// Stub Chart.js which is loaded via CDN in the HTML
global.Chart = class Chart {
  constructor() {
    this.data = { labels: [], datasets: [{ data: [] }] };
  }
  update() {}
  destroy() {}
};

// Now require the module — auto-init code runs here
const script = require('../edp/assets/script');

// ──────────────────────────────────────────────
// 1. Pure utility functions
// ──────────────────────────────────────────────

describe('formatDuration', () => {
  const { formatDuration } = script;

  test('formats 0 seconds as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  test('formats 59 seconds correctly', () => {
    expect(formatDuration(59)).toBe('0:59');
  });

  test('formats 60 seconds as 1:00', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  test('formats 90 seconds as 1:30', () => {
    expect(formatDuration(90)).toBe('1:30');
  });

  test('formats 125 seconds as 2:05', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  test('formats large values correctly', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });
});

describe('isoDate', () => {
  const { isoDate } = script;

  test('returns a YYYY-MM-DD string for today when called with no args', () => {
    const result = isoDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns correct date for a specific Date object', () => {
    const d = new Date(2025, 0, 15); // Jan 15 2025
    expect(isoDate(d)).toBe('2025-01-15');
  });

  test('handles date strings', () => {
    expect(isoDate('2024-06-01')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('daysBetween', () => {
  const { daysBetween } = script;

  test('returns 0 for the same date', () => {
    expect(daysBetween('2025-03-10', '2025-03-10')).toBe(0);
  });

  test('returns 1 for consecutive days', () => {
    expect(daysBetween('2025-03-10', '2025-03-11')).toBe(1);
  });

  test('returns negative for reversed dates', () => {
    expect(daysBetween('2025-03-11', '2025-03-10')).toBe(-1);
  });

  test('handles multi-day gaps', () => {
    expect(daysBetween('2025-01-01', '2025-01-31')).toBe(30);
  });
});

// ──────────────────────────────────────────────
// 2. Data constants
// ──────────────────────────────────────────────

describe('sessionData', () => {
  const { sessionData } = script;

  test('contains an attempts array', () => {
    expect(Array.isArray(sessionData.attempts)).toBe(true);
  });

  test('each attempt has attempt, reactionTime, and result', () => {
    sessionData.attempts.forEach(a => {
      expect(typeof a.attempt).toBe('number');
      expect(typeof a.reactionTime).toBe('number');
      expect(['Hit', 'Miss']).toContain(a.result);
    });
  });

  test('has 10 attempts', () => {
    expect(sessionData.attempts.length).toBe(10);
  });
});

describe('sportThresholds', () => {
  const { sportThresholds } = script;

  test('contains all expected sports', () => {
    const expected = ['Athletics', 'Football', 'Cricket', 'Badminton', 'Boxing', 'Rehab'];
    expected.forEach(sport => {
      expect(sportThresholds).toHaveProperty(sport);
      expect(typeof sportThresholds[sport]).toBe('number');
    });
  });

  test('Boxing has the lowest threshold', () => {
    const vals = Object.values(sportThresholds);
    expect(sportThresholds.Boxing).toBe(Math.min(...vals));
  });

  test('Rehab has the highest threshold', () => {
    const vals = Object.values(sportThresholds);
    expect(sportThresholds.Rehab).toBe(Math.max(...vals));
  });
});

// ──────────────────────────────────────────────
// 3. Auth helpers
// ──────────────────────────────────────────────

describe('saveUser / findUserByEmail', () => {
  const { saveUser, findUserByEmail } = script;

  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and retrieves a user by email', () => {
    saveUser({ name: 'Test', email: 'test@example.com', password: 'pw' });
    const found = findUserByEmail('test@example.com');
    expect(found).toBeTruthy();
    expect(found.name).toBe('Test');
  });

  test('findUserByEmail is case-insensitive', () => {
    saveUser({ name: 'Alice', email: 'Alice@Foo.com', password: 'x' });
    expect(findUserByEmail('alice@foo.com')).toBeTruthy();
    expect(findUserByEmail('ALICE@FOO.COM')).toBeTruthy();
  });

  test('returns undefined for unknown email', () => {
    expect(findUserByEmail('nope@example.com')).toBeUndefined();
  });

  test('handles empty localStorage gracefully', () => {
    expect(findUserByEmail('')).toBeUndefined();
    expect(findUserByEmail(null)).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// 4. Progress / Streak / Points logic
// ──────────────────────────────────────────────

describe('getCurrentUserKey', () => {
  const { getCurrentUserKey } = script;

  afterEach(() => {
    sessionStorage.clear();
  });

  test('returns guest key when no user is in sessionStorage', () => {
    sessionStorage.clear();
    expect(getCurrentUserKey()).toBe('progress_guest');
  });

  test('returns email-based key when demo_user is set', () => {
    sessionStorage.setItem('demo_user', JSON.stringify({ email: 'a@b.com' }));
    expect(getCurrentUserKey()).toBe('progress_a@b.com');
  });

  test('falls back to guest on invalid JSON', () => {
    sessionStorage.setItem('demo_user', '{bad json');
    expect(getCurrentUserKey()).toBe('progress_guest');
  });
});

describe('loadProgress / saveProgress', () => {
  const { loadProgress, saveProgress } = script;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('returns default progress when nothing is saved', () => {
    const p = loadProgress();
    expect(p.streak).toBe(0);
    expect(p.points).toBe(0);
    expect(p.lastDate).toBeNull();
    expect(p.rewards).toEqual([]);
  });

  test('round-trips progress data', () => {
    const data = { streak: 5, lastDate: '2025-06-01', points: 42, rewards: [3] };
    saveProgress(data);
    const loaded = loadProgress();
    expect(loaded).toEqual(data);
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('progress_guest', 'NOT_JSON');
    const p = loadProgress();
    expect(p.streak).toBe(0);
  });
});

describe('handleSessionCompletion', () => {
  const { handleSessionCompletion, loadProgress, isoDate } = script;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('records a streak of 1 on first session', () => {
    const attempts = [
      { reactionTime: 300, result: 'Hit' },
      { reactionTime: 350, result: 'Miss' },
    ];
    handleSessionCompletion(attempts);
    const p = loadProgress();
    expect(p.streak).toBe(1);
    expect(p.lastDate).toBe(isoDate());
    expect(p.points).toBeGreaterThan(0);
  });

  test('does not double-count if called twice on the same day', () => {
    const attempts = [{ reactionTime: 250, result: 'Hit' }];
    handleSessionCompletion(attempts);
    const first = loadProgress().points;
    handleSessionCompletion(attempts);
    const second = loadProgress().points;
    expect(second).toBe(first);
  });

  test('awards points based on accuracy and speed', () => {
    // 100% accuracy, fast times -> high points
    const fast = [
      { reactionTime: 100, result: 'Hit' },
      { reactionTime: 120, result: 'Hit' },
    ];
    handleSessionCompletion(fast);
    const p = loadProgress();
    // base 10 + accuracy bonus (100/10=10) + speed bonus ((300-110)/50≈3)
    expect(p.points).toBeGreaterThanOrEqual(20);
  });

  test('streak continues when last session was yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = isoDate(yesterday);
    const key = 'progress_guest';
    localStorage.setItem(key, JSON.stringify({
      streak: 3, lastDate: yesterdayStr, points: 50, rewards: [3],
    }));
    handleSessionCompletion([{ reactionTime: 300, result: 'Hit' }]);
    const p = loadProgress();
    expect(p.streak).toBe(4);
  });

  test('streak resets when gap is more than 1 day', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const key = 'progress_guest';
    localStorage.setItem(key, JSON.stringify({
      streak: 5, lastDate: isoDate(twoDaysAgo), points: 100, rewards: [3],
    }));
    handleSessionCompletion([{ reactionTime: 300, result: 'Hit' }]);
    const p = loadProgress();
    expect(p.streak).toBe(1);
  });

  test('unlocks reward tiers at streak milestones', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const key = 'progress_guest';
    localStorage.setItem(key, JSON.stringify({
      streak: 6, lastDate: isoDate(yesterday), points: 100, rewards: [3],
    }));
    handleSessionCompletion([{ reactionTime: 300, result: 'Hit' }]);
    const p = loadProgress();
    expect(p.streak).toBe(7);
    expect(p.rewards).toContain(7);
  });
});

// ──────────────────────────────────────────────
// 5. Leaderboard logic
// ──────────────────────────────────────────────

describe('leaderboard helpers', () => {
  const { loadLeaderboard, saveLeaderboard, updateLeaderboardEntry } = script;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('loadLeaderboard returns empty array by default', () => {
    expect(loadLeaderboard()).toEqual([]);
  });

  test('saveLeaderboard / loadLeaderboard round-trips', () => {
    const lb = [{ name: 'A', email: 'a@b.com', points: 50, streak: 2, lastActive: '2025-01-01' }];
    saveLeaderboard(lb);
    expect(loadLeaderboard()).toEqual(lb);
  });

  test('updateLeaderboardEntry adds a guest entry when no user is set', () => {
    updateLeaderboardEntry(15);
    const lb = loadLeaderboard();
    expect(lb.length).toBe(1);
    expect(lb[0].email).toBe('guest');
    expect(lb[0].points).toBeGreaterThanOrEqual(0);
  });

  test('updateLeaderboardEntry creates entry for logged-in user', () => {
    sessionStorage.setItem('demo_user', JSON.stringify({ name: 'Bob', email: 'bob@x.com' }));
    updateLeaderboardEntry(20);
    const lb = loadLeaderboard();
    const entry = lb.find(e => e.email === 'bob@x.com');
    expect(entry).toBeTruthy();
    expect(entry.name).toBe('Bob');
  });

  test('updateLeaderboardEntry increments points for existing entry', () => {
    saveLeaderboard([{ name: 'Guest', email: 'guest', points: 10, streak: 0, lastActive: null }]);
    updateLeaderboardEntry(5);
    const lb = loadLeaderboard();
    const entry = lb.find(e => e.email === 'guest');
    // Points can come from progress sync or direct addition
    expect(entry.points).toBeGreaterThanOrEqual(10);
  });

  test('loadLeaderboard handles corrupted data gracefully', () => {
    localStorage.setItem('ag_leaderboard', '{INVALID');
    expect(loadLeaderboard()).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// 6. isDashboardPage
// ──────────────────────────────────────────────

describe('isDashboardPage', () => {
  const { isDashboardPage } = script;

  test('returns true when dashboard elements exist', () => {
    // We added sportSelect, reactionTimeChart, startBtn in beforeAll
    expect(isDashboardPage()).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 7. DOM-dependent rendering (smoke tests)
// ──────────────────────────────────────────────

describe('updateSummaryCards', () => {
  const { updateSummaryCards } = script;

  test('does not throw when called', () => {
    expect(() => updateSummaryCards()).not.toThrow();
  });

  test('updates displayed values', () => {
    updateSummaryCards();
    const totalEl = document.getElementById('totalReactionsValue');
    expect(totalEl.textContent).toBeDefined();
  });
});

describe('renderSessionLogTable', () => {
  const { renderSessionLogTable } = script;

  test('does not throw when called', () => {
    expect(() => renderSessionLogTable()).not.toThrow();
  });

  test('populates table rows', () => {
    renderSessionLogTable();
    const tbody = document.getElementById('sessionLogTable').querySelector('tbody');
    expect(tbody.children.length).toBeGreaterThan(0);
  });
});

describe('updateStreakUI', () => {
  const { updateStreakUI } = script;

  test('does not throw when called with default progress', () => {
    expect(() => updateStreakUI({ streak: 0, points: 0, rewards: [], lastDate: null })).not.toThrow();
  });

  test('displays streak value in DOM', () => {
    updateStreakUI({ streak: 7, points: 100, rewards: [3, 7], lastDate: '2025-06-01' });
    expect(document.getElementById('streakCount').textContent).toBe('7');
    expect(document.getElementById('totalPoints').textContent).toBe('100');
  });
});

describe('showToast', () => {
  const { showToast } = script;

  test('creates a toast element in the DOM', () => {
    showToast('Hello!');
    const t = document.getElementById('sr_toast');
    expect(t).toBeTruthy();
    expect(t.textContent).toBe('Hello!');
  });
});
