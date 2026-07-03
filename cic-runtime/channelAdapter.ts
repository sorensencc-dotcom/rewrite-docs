/**
 * Channel adapter definitions and helpers
 */

import { z } from 'zod';

export type ChannelEvent = {
  id: string;
  type: string;
  source: string;
  payload: unknown;
  timestamp?: number;
};

export type EventHandler = (event: ChannelEvent) => Promise<void>;

export type ChannelAdapter = {
  name: string;
  description: string;
  supportedEventTypes: string[];
  subscribe(handler: EventHandler): Promise<void> | void;
};

export function defineChannelAdapter(def: ChannelAdapter): ChannelAdapter {
  return def;
}

// Example usage:
/*

import { defineChannelAdapter, ChannelEvent } from '../channelAdapter';
import axios from 'axios';

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const GITHUB_WEBHOOK_PORT = 3001;

export default defineChannelAdapter({
  name: 'github-pr',
  description: 'Listens for GitHub PR events and routes them to agent sessions',
  supportedEventTypes: ['github.pr.opened', 'github.pr.synchronize', 'github.pr.closed'],

  async subscribe(handler) {
    const express = require('express');
    const crypto = require('crypto');
    const app = express();

    app.use(express.json());

    app.post('/webhook/github/pr', (req, res) => {
      // Verify GitHub signature
      const signature = req.headers['x-hub-signature-256'];
      const body = JSON.stringify(req.body);
      const hash = crypto
        .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (`sha256=${hash}` !== signature) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const ghEvent = req.body;

      // Map GitHub event to channel event
      const event: ChannelEvent = {
        id: `${ghEvent.repository.id}-${ghEvent.pull_request.id}`,
        type: `github.pr.${ghEvent.action}`,
        source: 'github',
        payload: {
          prNumber: ghEvent.pull_request.number,
          repo: ghEvent.repository.full_name,
          branch: ghEvent.pull_request.head.ref,
          title: ghEvent.pull_request.title,
          author: ghEvent.pull_request.user.login,
          url: ghEvent.pull_request.html_url,
          body: ghEvent.pull_request.body,
        },
        timestamp: Date.now(),
      };

      // Route to agent
      handler(event).catch(err => {
        // Error handling
      });

      res.json({ success: true });
    });

    app.listen(GITHUB_WEBHOOK_PORT, () => {
      // Webhook server started
    });
  },
});

*/
