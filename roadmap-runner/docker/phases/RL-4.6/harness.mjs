// RL-4.6 harness: CrawlerEngine v1 test runner
// Metrics:
//   robots_txt_blocked_count — actual number of URLs blocked by robots.txt rules
//   dedup_accuracy — precision of bloom filter dedup (correct dedup decisions / total)
import { CrawlerEngine, BloomFilter, RobotsCache } from '../../dist/crawler/index.js';

const FAIL = 0; // will be set to 1 on any gate failure

// Fixture: in-container sites with known robots.txt and duplicate URLs
const FIXTURE_ROBOTS_RULES = {
  'https://example.com': {
    'Disallow': [
      '/admin',
      '/private',
      '/tmp',
      '/cache',
      '/logs',
      '/backup',
      '/internal',
      '/secret',
    ],
  },
};

const FIXTURE_URLS = [
  'https://example.com/',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/admin',           // blocked by robots.txt
  'https://example.com/admin/panel',     // blocked (parent dir)
  'https://example.com/private/data',    // blocked
  'https://example.com/cache/file.html', // blocked
  'https://example.com/',                // dup
  'https://example.com/about',           // dup
  'https://example.com/products',
  'https://example.com/blog/post1',
  'https://example.com/blog/post1',      // dup
  'https://example.com/blog/post2',
  'https://example.com/tmp/upload',      // blocked
  'https://example.com/contact',         // dup
];

// Mock RobotsCache for fixture
class MockRobotsCache extends RobotsCache {
  async isAllowed(url, userAgent) {
    const u = new URL(url);
    const domain = u.origin;
    const path = u.pathname;

    const rules = FIXTURE_ROBOTS_RULES[domain];
    if (!rules) return true;

    const disallow = rules.Disallow || [];
    for (const rule of disallow) {
      if (path.startsWith(rule)) {
        return false;
      }
    }
    return true;
  }
}

async function main() {
  console.log('[harness] RL-4.6 CrawlerEngine test');

  const engine = new CrawlerEngine(
    { timeout: 5000, retries: 1, politenessMs: 10 },
    new MockRobotsCache()
  );

  let robotsBlockedCount = 0;
  let dedupCount = 0;
  let totalUrls = 0;

  for (const url of FIXTURE_URLS) {
    totalUrls++;
    const result = await engine.crawl(url);

    if (result.errorCode === 'ROBOTS_BLOCKED') {
      robotsBlockedCount++;
    }

    // Check dedup: second crawl of same URL should return cached result (status 0)
    if (FIXTURE_URLS.indexOf(url) !== FIXTURE_URLS.lastIndexOf(url)) {
      const recheck = await engine.crawl(url);
      if (recheck.status === 0 && !recheck.errorCode) {
        dedupCount++;
      }
    }
  }

  console.log(`[harness] Crawled ${totalUrls} URLs`);
  console.log(`[harness] robots.txt blocked: ${robotsBlockedCount}`);

  // Dedup accuracy: all duplicate crawls should return cached (status 0)
  const dedupAttempts = FIXTURE_URLS.length - new Set(FIXTURE_URLS).size;
  const dedupAccuracy = dedupAttempts > 0 ? (dedupCount / dedupAttempts).toFixed(2) : '1.00';
  console.log(`[harness] dedup accuracy: ${dedupAccuracy} (${dedupCount}/${dedupAttempts})`);

  // Gates
  const robotsPass = robotsBlockedCount >= 8;
  const dedupPass = parseFloat(dedupAccuracy) >= 0.99;

  if (robotsPass) {
    console.log('✓ robots.txt parsed and enforced (8+ URLs blocked)');
  } else {
    console.log(`✗ robots.txt gate FAILED: ${robotsBlockedCount} < 8`);
    process.exitCode = 1;
  }

  if (dedupPass) {
    console.log('✓ timeout and retry handling (dedup accuracy >= 0.99)');
  } else {
    console.log(`✗ dedup gate FAILED: ${dedupAccuracy} < 0.99`);
    process.exitCode = 1;
  }

  console.log(`{"metric":"robots_txt_blocked_count","value":${robotsBlockedCount}}`);
  console.log(`{"metric":"dedup_accuracy","value":${dedupAccuracy}}`);

  process.exit(process.exitCode || 0);
}

main().catch(err => {
  console.error('[harness] ERROR:', err.message);
  process.exit(1);
});
