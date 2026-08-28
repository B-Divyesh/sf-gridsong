const MAX_SONG_BYTES = 30_000;

// Azure Table compares JavaScript epoch milliseconds as Edm.Int64 values.
function expiredFilter(timestamp) {
  return `expiresAt le ${Math.trunc(timestamp)}L`;
}

function validNickname(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 24 || /[\u0000-\u001f\u007f]/.test(name)) return null;
  return name;
}

// Validate the compact GS2S payload without retaining any extra request fields.
function validSong(value) {
  if (typeof value !== 'string' || value.length > MAX_SONG_BYTES || !/^GS2S\.[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    const bytes = Buffer.from(value.slice(5), 'base64url');
    if (bytes.length < 7 || bytes[0] !== 1) return false;
    const bars = bytes[1], octaves = bytes[2], scale = bytes[3], tempo = bytes[4] + 50;
    const titleLength = bytes[5] * 256 + bytes[6];
    if (![1, 2, 4, 8, 16, 32, 64].includes(bars) || octaves < 1 || octaves > 4 || scale > 3 || tempo < 50 || tempo > 200 || titleLength > 240) return false;
    new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(7, 7 + titleLength));
    const scaleRows = [7, 7, 5, 12][scale] * octaves + 2;
    const cells = scaleRows * bars * 16;
    const expected = 7 + titleLength + Math.ceil(cells * 3 / 8);
    if (bytes.length !== expected) return false;
    for (let cell = 0; cell < cells; cell++) {
      const bit = cell * 3, byte = Math.floor(bit / 8), offset = bit % 8;
      let code = (bytes[7 + titleLength + byte] >> offset) & 7;
      if (offset > 5) code |= (bytes[7 + titleLength + byte + 1] << (8 - offset)) & 7;
      if (code > 6) return false;
    }
    return true;
  } catch { return false; }
}

module.exports = { expiredFilter, validNickname, validSong };
