const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'analytics_store.json');

// ─── Constants ────────────────────────────────────────────────────────────────

// Manual creation ≈6-8 min (avg 7 min) minus 20 sec AI time = 6 mins 40 secs (400 seconds) saved per module
const SECONDS_SAVED_PER_MODULE = 400;

// Fixed baseline — represents real usage before this system was installed.
// Journals and students cannot be re-derived. Hours are set via BASELINE_HOURS in .env
const BASELINE = {
    journals  : 1214,
    students  : 115,
    hoursBase : () => parseInt(process.env.BASELINE_HOURS || '142', 10)
};

// ─── In-memory DB ─────────────────────────────────────────────────────────────

/*
  Schema:
  {
    students: [
      {
        regNumber    : "22A91A0501",  // uppercase, trimmed
        name         : "Rahul",
        classSection : "CSE-A",
        firstSeenAt  : "ISO string",
        totalJournals: 3,
        totalModules : 5,
        lastGeneratedAt: "ISO string",
        history: [
          { type: "MODULE", moduleCount: 1, generatedAt: "ISO string" },
          { type: "SUBJECT", moduleCount: 8, generatedAt: "ISO string" }
        ]
      }
    ],
    journals        : 0,    // total generations tracked by this system
    totalModules    : 0,    // total modules tracked (used for hours calculation)
    durationTotalMs : 0,
    durationCount   : 0
  }
*/

let db = freshDB();

function freshDB() {
    return {
        students       : [],
        journals       : 0,
        totalModules   : 0,
        durationTotalMs: 0,
        durationCount  : 0
    };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function ensureDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadDB() {
    try {
        ensureDir();
        if (!fs.existsSync(DATA_FILE)) { saveDB(); return; }

        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        // ── Migrate from old schema (no history / no totalModules) ──
        if (Array.isArray(parsed.students)) {
            db.journals        = parsed.journals        || 0;
            db.durationTotalMs = parsed.durationTotalMs || 0;
            db.durationCount   = parsed.durationCount   || 0;

            // If old schema stored minutesSaved, convert to modules
            if (parsed.minutesSaved && !parsed.totalModules) {
                db.totalModules = Math.round(parsed.minutesSaved / MINUTES_PER_MODULE);
            } else {
                db.totalModules = parsed.totalModules || 0;
            }

            // Migrate student records — add history/totalModules if missing
            db.students = parsed.students.map(s => ({
                regNumber      : s.regNumber       || '',
                name           : s.name            || '',
                classSection   : s.classSection    || '',
                firstSeenAt    : s.firstSeenAt || s.addedAt || new Date().toISOString(),
                totalJournals  : s.totalJournals   || 1,
                totalModules   : s.totalModules    || 1,
                lastGeneratedAt: s.lastGeneratedAt || s.addedAt || new Date().toISOString(),
                history        : s.history         || []
            }));
        }
    } catch (err) {
        console.error('[AnalyticsDB] Load error:', err.message);
    }
}

function saveDB() {
    try {
        ensureDir();
        const tmp = `${DATA_FILE}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
        fs.renameSync(tmp, DATA_FILE);
    } catch (err) {
        console.error('[AnalyticsDB] Save error:', err.message);
    }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function buildSummary() {
    const totalJournals  = BASELINE.journals + db.journals;
    const totalStudents  = BASELINE.students; // Fixed at 115 (manual increase only)
    const totalSecondsSaved = db.totalModules * SECONDS_SAVED_PER_MODULE;
    const totalHours     = BASELINE.hoursBase() + Math.round(totalSecondsSaved / 3600);

    let avgTimeSec = 12.5; // Average speed within 10-15s target range
    if (db.durationCount > 0) {
        avgTimeSec = Math.round(db.durationTotalMs / db.durationCount / 1000 * 10) / 10;
    }

    return {
        total_journals_generated : totalJournals,
        total_students_helped    : totalStudents,
        total_hours_saved        : totalHours,
        avg_generation_time_sec  : avgTimeSec
    };
}

// ─── Public API ───────────────────────────────────────────────────────────────

function recordEvent({ studentName, regNumber, classSection, generationType, moduleCount, durationMs }) {
    const type        = (generationType || 'MODULE').toUpperCase();
    const modCount    = (typeof moduleCount === 'number' && moduleCount > 0) ? moduleCount : 1;
    const now         = new Date().toISOString();

    // ── Global counters (adds exact module count: 1 for single module, 8-10 for subject, 30-50 for term) ──
    db.journals      += modCount;
    db.totalModules  += modCount;

    // ── Average duration per single module (ms) ──
    if (typeof durationMs === 'number' && durationMs > 500) {
        const perModuleMs = durationMs / modCount;
        db.durationTotalMs += perModuleMs;
        db.durationCount   += 1;
    }

    // ── Student upsert (Deduplicated by Unique Reg Number) ──
    const reg = (regNumber || '').trim().toUpperCase();
    if (reg.length >= 2) {
        const existing = db.students.find(s => s.regNumber === reg);
        if (existing) {
            existing.totalJournals    += 1;
            existing.totalModules     += modCount;
            existing.lastGeneratedAt   = now;
            if (!existing.history) existing.history = [];
            existing.history.push({ type, moduleCount: modCount, generatedAt: now });
        } else {
            db.students.push({
                regNumber      : reg,
                name           : (studentName   || '').trim(),
                classSection   : (classSection  || '').trim(),
                firstSeenAt    : now,
                totalJournals  : 1,
                totalModules   : modCount,
                lastGeneratedAt: now,
                history        : [{ type, moduleCount: modCount, generatedAt: now }]
            });
        }
    }

    saveDB();
    return buildSummary();
}

function getSummary() {
    return buildSummary();
}

// Returns all students (for admin dashboard)
function getStudents() {
    return db.students.map(s => ({
        regNumber      : s.regNumber,
        name           : s.name,
        classSection   : s.classSection,
        totalJournals  : s.totalJournals,
        lastGeneratedAt: s.lastGeneratedAt
    }));
}

// Returns full detail for one student
function getStudentDetail(regNumber) {
    const reg = (regNumber || '').trim().toUpperCase();
    return db.students.find(s => s.regNumber === reg) || null;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadDB();

module.exports = { recordEvent, getSummary, getStudents, getStudentDetail };
