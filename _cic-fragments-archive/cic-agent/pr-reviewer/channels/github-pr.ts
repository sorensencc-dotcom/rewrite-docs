/**
 * Channel: github-pr
 * Listens for GitHub PR events and routes them to agent sessions
 */

import { defineChannelAdapter, ChannelEvent } from '../../../cic-runtime/channelAdapter';
import express from 'express';
import crypto from 'crypto';

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'dev-secret';
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3001');

export default defineChannelAdapter({
  name: 'github-pr',
  description: 'Listens for GitHub PR events and routes them to agent sessions',
  supportedEventTypes: [
    'github.pr.opened',
    'github.pr.synchronize',
    'github.pr.closed',
  ],

  async subscribe(handler) {
    const app = express();
    app.use(express.json());

    app.post('/webhook/github/pr', (req, res) => {
      try {
        // Verify GitHub signature
        const signature = req.headers['x-hub-signature-256'] as string;
        if (!signature) {
          return res.status(401).json({ error: 'Missing signature' });
        }

        const body = JSON.stringify(req.body);
        const hash = crypto
          .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
          .update(body)
          .digest('hex');

        if (`sha256=${hash}` !== signature) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        const ghEvent = req.body;

        // Filter for PR events
        if (
          !ghEvent.pull_request ||
          !['opened', 'synchronize', 'closed'].includes(ghEvent.action)
        ) {
          return res.json({ skipped: true });
        }

        // Map GitHub event to channel event
        const event: ChannelEvent = {
          id: `${ghEvent.repository.id}-${ghEvent.pull_request.id}`,
          type: `github.pr.${ghEvent.action}`,
          source: 'github',
          payload: {
            prNumber: ghEvent.pull_request.number,
            repo: ghEvent.repository.full_name,
            branch: ghEvent.pull_request.head.ref,
            baseBranch: ghEvent.pull_request.base.ref,
            title: ghEvent.pull_request.title,
            author: ghEvent.pull_request.user.login,
            url: ghEvent.pull_request.html_url,
            body: ghEvent.pull_request.body,
            draft: ghEvent.pull_request.draft,
            createdAt: ghEvent.pull_request.created_at,
            updatedAt: ghEvent.pull_request.updated_at,
            commits: ghEvent.pull_request.commits,
            additions: ghEvent.pull_request.additions,
            deletions: ghEvent.pull_request.deletions,
            changedFiles: ghEvent.pull_request.changed_files,
          },
          timestamp: Date.now(),
        };

        // Route to agent
        handler(event)
          .then(() => {
            res.json({ success: true, eventId: event.id });
          })
          .catch(err => {
            res.status(500).json({ error: err.message });
          });
      } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Start server
    await new Promise<void>((resolve, reject) => {
      app.listen(WEBHOOK_PORT, () => {
        resolve();
      }).on('error', reject);
    });
  },
});
