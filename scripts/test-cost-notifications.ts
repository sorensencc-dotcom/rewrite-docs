#!/usr/bin/env node

/**
 * Test script: Send sample cost notifications to Slack/Email
 * Usage: npx tsx scripts/test-cost-notifications.ts
 */

import { generateCicCostComputeReport } from '../src/lib/report/CicCostComputeReport';
import { CostNotifier } from '../src/lib/notify/CostNotifier';

async function testNotifications() {
  console.log('[TEST] Generating sample cost report...');
  const report = generateCicCostComputeReport();

  console.log('[TEST] Report summary:');
  console.log(`  Daily tokens: ${report.usage?.dailyTokens}`);
  console.log(`  Daily cost: $${report.cost?.dailyCost?.toFixed(2)}`);
  console.log(`  Agents: ${Object.keys(report.agents?.burn || {}).join(', ')}`);

  const notifyEnabled = process.env.CIC_NOTIFY_ENABLED === 'true';
  const slackWebhook = process.env.CIC_SLACK_WEBHOOK_URL;
  const emailAddr = process.env.CIC_NOTIFY_EMAIL;

  console.log(`\n[TEST] Configuration:`);
  console.log(`  CIC_NOTIFY_ENABLED: ${notifyEnabled}`);
  console.log(`  CIC_SLACK_WEBHOOK_URL: ${slackWebhook ? '✓ SET' : '✗ NOT SET'}`);
  console.log(`  CIC_NOTIFY_EMAIL: ${emailAddr ? '✓ SET' : '✗ NOT SET'}`);

  if (!notifyEnabled) {
    console.log('\n[TEST] Notifications disabled. Set CIC_NOTIFY_ENABLED=true to test.');
    return;
  }

  console.log('\n[TEST] Sending daily digest notifications...');

  // Test Slack
  if (slackWebhook) {
    console.log('[TEST] Testing Slack notification...');
    const slackResult = await CostNotifier.sendSlackDaily(report, 'daily');
    console.log(`  Result: ${slackResult ? '✓ SENT' : '✗ FAILED'}`);
  }

  // Test Email
  if (emailAddr) {
    console.log('[TEST] Testing email notification...');
    const emailResult = await CostNotifier.sendEmailDaily(report, 'daily');
    console.log(`  Result: ${emailResult ? '✓ SENT' : '✗ FAILED'}`);
  }

  console.log('\n[TEST] Complete');
}

testNotifications().catch(err => {
  console.error('[TEST] Error:', err);
  process.exit(1);
});
