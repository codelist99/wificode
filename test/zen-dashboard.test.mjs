import assert from 'node:assert/strict';
import test from 'node:test';
import { chargebackOccurredAt } from '../lib/zen-dashboard.mjs';

test('chargebacks use the received date instead of the original transaction posting date',()=>{
  assert.equal(chargebackOccurredAt({date:{posted:'2026-10-03',loaded:'2026-11-02',receivedDate:'2026-11-01'}}),'2026-11-01');
});

test('chargeback date falls back through dispute feed dates',()=>{
  assert.equal(chargebackOccurredAt({date:{posted:'2026-10-03',loaded:'2026-10-20',disputed:'2026-10-21 12:30:00'}}),'2026-10-21 12:30:00');
  assert.equal(chargebackOccurredAt({date:{posted:'2026-10-03',loaded:'2026-10-20'}}),'2026-10-20');
});
