/* ── Schedule ALL match reminders ─────────── */
export async function scheduleAllReminders(matches, teamMap = {}) {
  if (!matches?.length) return 0;

  const now = new Date();
  let count = 0;

  for (const match of matches) {
    const matchTime = new Date(match.local_date || match.datetime);
    const alertTime = new Date(matchTime.getTime() - 15 * 60 * 1000);

    // Skip past alerts
    if (alertTime <= now) continue;

    const homeTeam = teamMap[match.home_team_id]?.name
      || match.home_team?.name || 'Team A';
    const awayTeam = teamMap[match.away_team_id]?.name
      || match.away_team?.name || 'Team B';
    const homeFlag = teamMap[match.home_team_id]?.flag
      || match.home_team?.flag || '🏳';
    const awayFlag = teamMap[match.away_team_id]?.flag
      || match.away_team?.flag || '🏳';

    const istTime = matchTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    await scheduleOneReminder({
      matchId: match.id,
      homeTeam, awayTeam,
      homeFlag, awayFlag,
      istTime,
      alertTime,
      matchTime: matchTime.toISOString(),
    });

    count++;
  }

  // Tell service worker to take over scheduling
  syncRemindersToSW();
  return count;
}

/* ── Schedule ONE specific match reminder ─── */
export async function scheduleOneReminder({
  matchId, homeTeam, awayTeam,
  homeFlag, awayFlag,
  istTime, alertTime, matchTime,
}) {
  // Save to localStorage reminder list
  const key = 'kickoff_reminders';
  const stored = JSON.parse(localStorage.getItem(key) || '[]');

  // Remove duplicate for same match
  const filtered = stored.filter(r => r.matchId !== String(matchId));
  filtered.push({
    matchId: String(matchId),
    homeTeam, awayTeam,
    homeFlag, awayFlag,
    istTime,
    alertTime: alertTime.toISOString(),
    matchTime,
    scheduledAt: new Date().toISOString(),
  });

  localStorage.setItem(key, JSON.stringify(filtered));
  syncRemindersToSW();
}

/* ── Remove a specific reminder ──────────── */
export function cancelReminder(matchId) {
  const key = 'kickoff_reminders';
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  const updated = stored.filter(r => r.matchId !== String(matchId));
  localStorage.setItem(key, JSON.stringify(updated));
  syncRemindersToSW();
}

/* ── Check if a match has reminder set ───── */
export function hasReminder(matchId) {
  const remindAll = localStorage.getItem('kickoff_remind_all') === 'true';
  if (remindAll) return true;
  const stored = JSON.parse(localStorage.getItem('kickoff_reminders') || '[]');
  return stored.some(r => r.matchId === String(matchId));
}

/* ── Sync all reminders to Service Worker ── */
export function syncRemindersToSW() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    // SW not ready — schedule via setTimeout fallback
    scheduleLocalTimeouts();
    return;
  }
  const reminders = JSON.parse(localStorage.getItem('kickoff_reminders') || '[]');
  navigator.serviceWorker.controller.postMessage({
    type: 'SCHEDULE_REMINDERS',
    data: { reminders },
  });
}

/* ── Fallback: browser setTimeout scheduling ─
   Works when tab is open but SW not active    */
const activeTimers = new Map();

export function scheduleLocalTimeouts() {
  // Clear existing
  activeTimers.forEach(id => clearTimeout(id));
  activeTimers.clear();

  const reminders = JSON.parse(localStorage.getItem('kickoff_reminders') || '[]');
  const now = Date.now();

  reminders.forEach(reminder => {
    const alertTime = new Date(reminder.alertTime).getTime();
    const delay = alertTime - now;

    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return;

    const timerId = setTimeout(async () => {
      await fireNotification(reminder);
    }, delay);

    activeTimers.set(reminder.matchId, timerId);
  });
}

/* ── Fire a browser notification ─────────── */
export async function fireNotification(reminder) {
  if (Notification.permission !== 'granted') return;

  try {
    // Try Service Worker notification (works when tab closed)
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(
        `Match Starting Soon: KICKOFF IST`,
        {
          body: `${reminder.homeFlag} ${reminder.homeTeam} vs ${reminder.awayTeam} ${reminder.awayFlag}\n🕐 ${reminder.istTime} IST`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `match-${reminder.matchId}`,
          vibrate: [200],
          data: {
            matchId: reminder.matchId,
            url: `/?match=${reminder.matchId}`,
          }
        }
      );
      return;
    }
  } catch {}

  // Fallback: basic Notification API
  new Notification(`Match Starting Soon`, {
    body: `${reminder.homeFlag} ${reminder.homeTeam} vs ${reminder.awayTeam} ${reminder.awayFlag} — ${reminder.istTime} IST`,
    icon: '/icons/icon-192x192.png',
    tag: `match-${reminder.matchId}`,
  });
}

/* ── Re-sync on every page load ─────────── */
export function initReminders(matches, teamMap) {
  const remindAll = localStorage.getItem('kickoff_remind_all') === 'true';
  const alreadyAsked = localStorage.getItem('kickoff_reminder_asked') === 'true';

  if (!alreadyAsked) return; // Popup handles first-time

  if (remindAll && matches?.length) {
    // Re-schedule all on each visit (catches new matches from API)
    scheduleAllReminders(matches, teamMap);
  } else {
    // Re-sync existing specific reminders to SW
    syncRemindersToSW();
    scheduleLocalTimeouts();
  }
}
