const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const REG_FILE = path.join(DATA_DIR, 'registrations.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// ---------------------------------------------------------------------------
// Password configuration (domain-based)
// ---------------------------------------------------------------------------
const DOMAIN_PASSWORDS = {
  'salesforce.com': process.env.SF_PASSWORD || 'Röstigraben_SF26!1',
  'iwc.com': process.env.IWC_PASSWORD || 'Watchmaking26!1'
};

// ---------------------------------------------------------------------------
// Ensure data files exist
// ---------------------------------------------------------------------------
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REG_FILE)) fs.writeFileSync(REG_FILE, '[]');
if (!fs.existsSync(PROGRESS_FILE)) fs.writeFileSync(PROGRESS_FILE, '{}');

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (_) { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://play.vidyard.com"]
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'iwc-datacloud-workshop-2026-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 4 * 24 * 60 * 60 * 1000 } // 4 days
}));

// EJS templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) return next();
  res.status(403).render('error', { title: 'Access Denied', message: 'This page is restricted to Salesforce employees.', user: req.session ? req.session.user : null, currentPage: '' });
}

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session ? req.session.user : null;
  res.locals.currentPage = '';
  next();
});

// ---------------------------------------------------------------------------
// Page routes
// ---------------------------------------------------------------------------

// Login page (no auth required)
app.get('/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/');
  res.render('login', { error: null, currentPage: 'login', user: null });
});

// Login POST
app.post('/api/login', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  const domain = email.split('@')[1].toLowerCase();
  if (!['iwc.com', 'salesforce.com'].includes(domain)) {
    return res.status(403).json({ error: 'Access restricted to IWC and Salesforce employees' });
  }
  // Validate password
  const expectedPassword = DOMAIN_PASSWORDS[domain];
  if (password !== expectedPassword) {
    return res.status(403).json({ error: 'Invalid password' });
  }

  const isAdmin = domain === 'salesforce.com';
  const userObj = {
    email: email.trim().toLowerCase(),
    name: (name || '').trim() || email.split('@')[0],
    isAdmin,
    domain
  };

  // Save registration
  const registrations = readJSON(REG_FILE, []);
  const existing = registrations.find(r => r.email.toLowerCase() === userObj.email);
  if (!existing) {
    registrations.push({
      email: userObj.email,
      name: userObj.name,
      company: domain === 'iwc.com' ? 'IWC Schaffhausen' : 'Salesforce',
      registeredAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || ''
    });
    writeJSON(REG_FILE, registrations);
  }

  req.session.user = userObj;
  res.json({ success: true, isAdmin, name: userObj.name });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});
app.get('/api/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Home
app.get('/', requireAuth, (req, res) => {
  const justLoggedIn = req.query.welcome === '1';
  res.render('home', { currentPage: 'home', justLoggedIn });
});

// Data 360 Track (the active track)
app.get('/data360', requireAuth, (req, res) => {
  res.render('data360', { currentPage: 'data360' });
});
app.get('/tracks/data360', requireAuth, (req, res) => {
  res.render('data360', { currentPage: 'data360' });
});

// Personalization
app.get('/personalization', requireAuth, (req, res) => {
  res.render('personalization', { currentPage: 'personalization' });
});
app.get('/tracks/personalization', requireAuth, (req, res) => {
  res.render('personalization', { currentPage: 'personalization' });
});

// Marketing Intelligence (Agentforce Marketing)
app.get('/marketing-intelligence', requireAuth, (req, res) => {
  res.render('marketing-intelligence', { currentPage: 'marketing-intelligence' });
});
app.get('/tracks/marketing-intelligence', requireAuth, (req, res) => {
  res.render('marketing-intelligence', { currentPage: 'marketing-intelligence' });
});

// Use Cases
app.get('/use-cases', requireAuth, (req, res) => {
  res.render('use-cases', { currentPage: 'use-cases' });
});

// Glossary
app.get('/glossary', requireAuth, (req, res) => {
  res.render('glossary', { currentPage: 'glossary' });
});

// Admin
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
  res.render('admin', { currentPage: 'admin' });
});

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

// Save progress
app.post('/api/progress', requireAuth, (req, res) => {
  const { stepId, checked } = req.body;
  const email = req.session.user.email;
  const progress = readJSON(PROGRESS_FILE, {});
  if (!progress[email]) progress[email] = {};
  progress[email][stepId] = checked;
  progress[email]._lastActive = new Date().toISOString();
  writeJSON(PROGRESS_FILE, progress);
  res.json({ success: true });
});

// Get user progress
app.get('/api/progress', requireAuth, (req, res) => {
  const email = req.session.user.email;
  const progress = readJSON(PROGRESS_FILE, {});
  res.json(progress[email] || {});
});

// Admin: all registrations
app.get('/api/admin/registrations', requireAuth, requireAdmin, (req, res) => {
  const registrations = readJSON(REG_FILE, []);
  const progress = readJSON(PROGRESS_FILE, {});
  const enriched = registrations.map(r => {
    const userProgress = progress[r.email] || {};
    const steps = Object.keys(userProgress).filter(k => !k.startsWith('_'));
    const completed = steps.filter(k => userProgress[k] === true).length;
    return {
      ...r,
      progress: userProgress,
      totalSteps: steps.length,
      completedSteps: completed,
      lastActive: userProgress._lastActive || r.registeredAt
    };
  });
  res.json({ total: enriched.length, registrations: enriched });
});

// Admin: all progress data
app.get('/api/admin/progress', requireAuth, requireAdmin, (req, res) => {
  const progress = readJSON(PROGRESS_FILE, {});
  res.json(progress);
});

// Admin: get IWC password (for debugging support)
app.get('/api/admin/iwc-password', requireAuth, requireAdmin, (req, res) => {
  res.json({ password: DOMAIN_PASSWORDS['iwc.com'] });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n  Data 360 Incubation Workshop - IWC Schaffhausen`);
  console.log(`  Running on http://localhost:${PORT}\n`);
});
