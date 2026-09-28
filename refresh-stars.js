#!/usr/bin/env node
/**
 * Refresh the star counts in integrations.json from the GitHub API.
 *
 *   node refresh-stars.js                 # updates integrations.json in place
 *   node refresh-stars.js --dry-run       # prints what would change
 *   GITHUB_TOKEN=... node refresh-stars.js
 *
 * The page never calls GitHub at render time (rate limits, and it would expose every
 * visitor's IP to GitHub). This script is what keeps the numbers current instead.
 *
 * Rules, because a wrong star count on a page that credits other people is worse than a
 * stale one:
 *   - a repo that cannot be read (404, rate limit, network) keeps its previous value
 *   - `stars_checked_at` only moves forward when a fresh value was actually read
 *   - entries whose repo is not a plain github.com/<owner>/<name> URL are left alone
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const FILE = path.join(__dirname, 'integrations.json');
const DRY_RUN = process.argv.includes('--dry-run');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

function repoSlug(url) {
  const match = String(url || '').match(/^https:\/\/github\.com\/([^/?#]+)\/([^/?#]+?)(?:\.git)?\/?$/);
  return match ? `${match[1]}/${match[2]}` : null;
}

async function fetchStars(slug) {
  const res = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'apimaster-community-integrations',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) return { error: 'not found (repo not created yet, or renamed)' };
  if (res.status === 403 || res.status === 429) return { error: 'rate limited — set GITHUB_TOKEN' };
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const body = await res.json();
  return { stars: body.stargazers_count, canonical: body.full_name };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  let updated = 0;
  let kept = 0;
  let skipped = 0;

  for (const item of data.integrations) {
    const slug = repoSlug(item.repo);
    if (!slug) {
      skipped += 1;
      console.log(`  skip   ${item.id}  (not a plain GitHub repo URL)`);
      continue;
    }
    let result;
    try {
      result = await fetchStars(slug);
    } catch (err) {
      result = { error: err.message };
    }
    if (result.error) {
      kept += 1;
      console.log(`  keep   ${item.id}  ${slug}: ${result.error} — leaving ${item.stars}`);
      continue;
    }
    const before = item.stars;
    item.stars = result.stars;
    item.stars_checked_at = today;
    updated += 1;
    const moved = result.canonical && result.canonical.toLowerCase() !== slug.toLowerCase()
      ? `  (moved to ${result.canonical})`
      : '';
    console.log(`  ok     ${item.id}  ${slug}: ${before} → ${result.stars}${moved}`);
  }

  console.log(`\n${updated} updated, ${kept} kept, ${skipped} skipped`);
  if (!updated) {
    console.log('Nothing fresh was read; file left untouched.');
    return;
  }
  data.updated_at = today;
  if (DRY_RUN) {
    console.log('--dry-run: not writing');
    return;
  }
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
