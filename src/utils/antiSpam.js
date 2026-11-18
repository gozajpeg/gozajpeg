// Anti-Spam Cooldown Utility (localStorage & Browser Fingerprint)
const STORAGE_KEY = 'portfolio_dm_lock_v1';
export const COOLDOWN_DURATION_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Generate a deterministic client fingerprint based on hardware/screen/canvas properties
 */
export function getDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server';
  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';
    const ua = navigator.userAgent || '';
    const cores = navigator.hardwareConcurrency || 1;

    // Fast canvas render hash
    let canvasHash = '';
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(10, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('antispam_fp', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('antispam_fp', 4, 17);
      canvasHash = canvas.toDataURL().slice(-40);
    }

    const raw = `${screenInfo}|${tz}|${lang}|${cores}|${ua}|${canvasHash}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  } catch {
    return 'fp_fallback';
  }
}

/**
 * Clean up legacy cookies and IndexedDB if present from previous versions
 */
function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;
  try {
    document.cookie = `${STORAGE_KEY}=; Max-Age=0; path=/; SameSite=Lax`;
    if (window.indexedDB?.deleteDatabase) {
      window.indexedDB.deleteDatabase('portfolio_antispam_db');
    }
  } catch {
    // Ignore errors during legacy cleanup
  }
}

/**
 * Get remaining cooldown time in milliseconds (0 if unlocked)
 */
export async function getCooldownRemaining() {
  if (typeof window === 'undefined') return 0;

  cleanupLegacyStorage();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;

    const record = JSON.parse(raw);
    if (record?.sent === true && record?.timestamp) {
      const elapsed = Date.now() - record.timestamp;
      const remaining = COOLDOWN_DURATION_MS - elapsed;

      if (remaining > 0) {
        return remaining;
      }

      // Cooldown expired: remove record
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage read errors
  }

  return 0;
}

/**
 * Check if the user is currently in the 3-minute cooldown window
 */
export async function hasUserSentMessage() {
  const remaining = await getCooldownRemaining();
  return remaining > 0;
}

/**
 * Record a message submission in localStorage (starts 3-minute cooldown)
 */
export async function recordMessageSent(sender = '') {
  if (typeof window === 'undefined') return;

  const fingerprint = getDeviceFingerprint();
  const record = {
    sent: true,
    sender,
    fingerprint,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore localStorage write errors (e.g. storage disabled / quota exceeded)
  }
}
