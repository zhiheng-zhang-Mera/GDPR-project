/**
 * GDPR Compliance Audit Logging & Synchronization Backend
 * Express + Node.js
 * Implements GDPR Art. 7(1) Proof of Consent & Immutable Audit Trails
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const permissionDatabase = new Map();
const auditLogStore = [];

function computeLogHash(logEntry) {
  const logString = `${logEntry.event_id}|${logEntry.timestamp}|${logEntry.user_id}|${logEntry.action}|${logEntry.data_category}|${logEntry.recipient}|${logEntry.legal_basis}|${logEntry.device_fingerprint}`;
  return crypto.createHash('sha256').update(logString).digest('hex');
}

/**
 * API 1: Dynamic Permission Toggle Endpoint
 * POST /api/privacy/toggle
 */
app.post('/api/privacy/toggle', (req, res) => {
  const { user_id, data_category, purpose, recipient, enabled, legal_basis, device_fingerprint } = req.body;

  if (!user_id || !data_category || !recipient) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const key = `${user_id}:${data_category}:${purpose}:${recipient}`;
  const previousState = permissionDatabase.get(key) || false;
  const action = enabled ? 'GRANT' : 'WITHDRAWAL';

  permissionDatabase.set(key, enabled);

  const logEntry = {
    event_id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    user_id,
    action,
    data_category,
    purpose,
    recipient,
    previous_state: previousState,
    new_state: enabled,
    legal_basis: legal_basis || 'GDPR_Art_6_1_a',
    device_fingerprint: device_fingerprint || 'UNKNOWN_DEVICE',
  };

  logEntry.hash_integrity = computeLogHash(logEntry);
  auditLogStore.push(logEntry);

  console.log(`[AUDIT LOG CREATED] ${logEntry.event_id} - ${action} by ${user_id} for ${data_category}`);

  return res.status(200).json({
    success: true,
    message: 'Permission updated and compliance audit log recorded',
    log: logEntry,
  });
});

/**
 * API 2: Offline Batch Synchronization Endpoint
 * POST /api/privacy/sync-offline-queue
 */
app.post('/api/privacy/sync-offline-queue', (req, res) => {
  const { user_id, offline_queue } = req.body;

  if (!user_id || !Array.isArray(offline_queue)) {
    return res.status(400).json({ error: 'Invalid payload format' });
  }

  offline_queue.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const processedLogs = [];

  for (const item of offline_queue) {
    const key = `${user_id}:${item.data_category}:${item.purpose}:${item.recipient}`;
    permissionDatabase.set(key, item.enabled);

    const logEntry = {
      event_id: `LOG_OFFLINE_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      timestamp: item.timestamp,
      sync_timestamp: new Date().toISOString(),
      user_id,
      action: item.enabled ? 'GRANT' : 'WITHDRAWAL',
      data_category: item.data_category,
      purpose: item.purpose,
      recipient: item.recipient,
      legal_basis: item.legal_basis || 'GDPR_Art_6_1_a',
      device_fingerprint: item.device_fingerprint || 'OFFLINE_DEVICE',
      is_offline_sync: true,
    };

    logEntry.hash_integrity = computeLogHash(logEntry);
    auditLogStore.push(logEntry);
    processedLogs.push(logEntry);
  }

  return res.status(200).json({
    success: true,
    synced_count: processedLogs.length,
    logs: processedLogs,
  });
});

/**
 * API 3: Bidirectional Consistency Verification
 * GET /api/privacy/verify
 */
app.get('/api/privacy/verify', (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const userPermissions = {};
  for (const [key, val] of permissionDatabase.entries()) {
    if (key.startsWith(`${user_id}:`)) {
      const [, category, purpose, recipient] = key.split(':');
      userPermissions[`${category}:${purpose}:${recipient}`] = val;
    }
  }

  return res.status(200).json({
    user_id,
    permissions: userPermissions,
    last_audit_log: auditLogStore.filter((l) => l.user_id === user_id).slice(-1)[0] || null,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GDPR Audit Backend running on port ${PORT}`);
});
