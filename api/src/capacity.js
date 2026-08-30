const { randomInt } = require('node:crypto');

const MAX_SUBMISSIONS = 120;
const SLOT_PREFIX = 'submission-';

function slotRowKey(slot) {
  return `${SLOT_PREFIX}${String(slot).padStart(3, '0')}`;
}

function slotNumber(rowKey) {
  const match = typeof rowKey === 'string' && new RegExp(`^${SLOT_PREFIX}(\\d{3})$`).exec(rowKey);
  if (!match) return null;
  const slot = Number(match[1]);
  return slot >= 0 && slot < MAX_SUBMISSIONS ? slot : null;
}

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function isAlreadyReserved(error) {
  return error?.statusCode === 409 || error?.status === 409;
}

async function currentSubmissionRows(client, galleryId) {
  const rows = [];
  for await (const entity of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${galleryId}' and kind eq 'submission'` } })) rows.push(entity);
  return rows;
}

// New submissions use one of 120 fixed row keys. Azure Table's create operation
// is atomic for a partition/row-key pair, so concurrent requests cannot reserve
// the same slot. Legacy UUID rows count against the same bound while active
// galleries move to the fixed-slot format.
async function reserveSubmissionSlot(client, gallery, submission) {
  const rows = await currentSubmissionRows(client, gallery.partitionKey);
  const legacyCount = rows.filter(row => slotNumber(row.rowKey) === null).length;
  const occupied = new Set(rows.map(row => slotNumber(row.rowKey)).filter(slot => slot !== null));
  const allowedSlots = Math.max(0, MAX_SUBMISSIONS - legacyCount);
  const available = [];
  for (let slot = 0; slot < allowedSlots; slot++) if (!occupied.has(slot)) available.push(slot);

  for (const slot of shuffled(available)) {
    try {
      await client.createEntity({
        partitionKey: gallery.partitionKey,
        rowKey: slotRowKey(slot),
        kind: 'submission',
        nickname: submission.nickname,
        song: submission.song,
        createdAt: submission.createdAt,
        expiresAt: gallery.expiresAt
      });
      return true;
    } catch (error) {
      if (!isAlreadyReserved(error)) throw error;
    }
  }
  return false;
}

function isSubmissionRowKey(value) {
  return /^[a-f0-9-]{36}$/i.test(value) || slotNumber(value) !== null;
}

module.exports = { MAX_SUBMISSIONS, isSubmissionRowKey, reserveSubmissionSlot, slotNumber, slotRowKey };
