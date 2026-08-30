// A full board can become available when a teacher removes a song. Tell a
// client when it is reasonable to check again instead of leaving a bare 429.
const FULL_GALLERY_RETRY_AFTER_SECONDS = 60;
const GALLERY_RETENTION_DAYS = 90;
const GALLERY_RETENTION_MS = GALLERY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

module.exports = { FULL_GALLERY_RETRY_AFTER_SECONDS, GALLERY_RETENTION_DAYS, GALLERY_RETENTION_MS };
