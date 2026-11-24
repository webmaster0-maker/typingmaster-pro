import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const isOnce = process.argv.includes('--once');

const IGNORE_PATTERNS = [
  /[\\/]\.git([\\/]|$)/,
  /[\\/]node_modules([\\/]|$)/,
  /[\\/]dist([\\/]|$)/,
  /[\\/]\.aistudio([\\/]|$)/,
  /[\\/]coverage([\\/]|$)/,
  /\.log$/,
  /\.tmp$/,
];

function isIgnored(filename) {
  if (!filename) return true;
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(filename)) return true;
  }
  return false;
}

function runGit(command) {
  try {
    return execSync(`git ${command}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString().trim() : err.message;
    return { error: errorMsg };
  }
}

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function log(msg, color = '\x1b[36m') {
  const reset = '\x1b[0m';
  console.log(`${color}[${getTimestamp()}] ${msg}${reset}`);
}

function performSync() {
  const status = runGit('status --porcelain');
  if (typeof status === 'object' && status.error) {
    log(`Git status error: ${status.error}`, '\x1b[31m');
    return false;
  }

  if (!status || status.trim() === '') {
    return false;
  }

  const lines = status.split('\n').filter(Boolean);
  log(`Detected ${lines.length} changed file(s):`, '\x1b[33m');
  lines.slice(0, 5).forEach((line) => console.log(`   ${line}`));
  if (lines.length > 5) console.log(`   ...and ${lines.length - 5} more`);

  log('Staging changes (git add .)...', '\x1b[34m');
  runGit('add .');

  const commitMsg = `Auto-sync: update files [${getTimestamp()}]`;
  log(`Committing: "${commitMsg}"...`, '\x1b[34m');
  const commitRes = runGit(`commit -m "${commitMsg}"`);
  if (typeof commitRes === 'object' && commitRes.error) {
    log(`Commit failed: ${commitRes.error}`, '\x1b[31m');
    return false;
  }

  log('Pushing to GitHub (origin main)...', '\x1b[35m');
  const pushRes = runGit('push origin main');
  if (typeof pushRes === 'object' && pushRes.error) {
    log(`Push error: ${pushRes.error}`, '\x1b[31m');
    return false;
  }

  log('Successfully synchronized with GitHub!', '\x1b[32m');
  log('Repository: https://github.com/webmaster0-maker/typingmaster-pro', '\x1b[32m');
  return true;
}

console.log('\x1b[32m===============================================================');
console.log('  TypingMaster Pro — Real-Time GitHub Auto-Sync Watcher');
console.log('  Repository: webmaster0-maker/typingmaster-pro (branch: main)');
console.log('===============================================================\x1b[0m');

// Initial check
performSync();

if (isOnce) {
  process.exit(0);
}

log('Watching project directory for changes... (Press Ctrl+C to stop)', '\x1b[33m');

let debounceTimer = null;
const changedFiles = new Set();

try {
  fs.watch(PROJECT_ROOT, { recursive: true }, (eventType, filename) => {
    if (!filename || isIgnored(filename)) return;

    changedFiles.add(filename);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      log(`Changes stabilized (${changedFiles.size} file event(s)). Commencing sync...`, '\x1b[33m');
      changedFiles.clear();
      performSync();
    }, 3000);
  });
} catch (err) {
  log(`Watcher error: ${err.message}`, '\x1b[31m');
}
