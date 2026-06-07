export function getLocalDateKey(utcDateString, targetTimezone) {
  try {
    return new Date(utcDateString).toLocaleDateString('en-CA', {
      timeZone: targetTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export function convertToTimezone(utcDateString, targetTimezone) {
  try {
    const date = new Date(utcDateString);

    const timeStr = date.toLocaleString('en-US', {
      timeZone: targetTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const dateStr = date.toLocaleString('en-US', {
      timeZone: targetTimezone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const dayStr = date.toLocaleString('en-US', {
      timeZone: targetTimezone,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });

    // Get offset label
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzAbbr = parts.find((p) => p.type === 'timeZoneName')?.value || '';

    // Full local date object in target timezone
    const localDate = new Date(
      date.toLocaleString('en-US', { timeZone: targetTimezone })
    );

    return { timeStr, dateStr, dayStr, tzAbbr, localDate, valid: true };
  } catch (err) {
    console.error('Time conversion error:', err);
    return { timeStr: '--:--', dateStr: '---', dayStr: '---', tzAbbr: '', localDate: null, valid: false };
  }
}

// Groups matches by date in the TARGET timezone (not UTC)
export function groupMatchesByLocalDate(matches, targetTimezone) {
  const groups = {};

  matches.forEach((match) => {
    try {
      const utcDate = match.utcDateString || match.local_date || match.datetime;
      const localDateStr = new Date(utcDate).toLocaleDateString('en-US', {
        timeZone: targetTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      if (!groups[localDateStr]) {
        groups[localDateStr] = {
          dateKey: localDateStr,
          label: new Date(utcDate).toLocaleDateString('en-US', {
            timeZone: targetTimezone,
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          matches: [],
        };
      }

      groups[localDateStr].matches.push({
        ...match,
        _convertedTime: convertToTimezone(utcDate, targetTimezone),
      });
    } catch (e) {
      console.error('Grouping error:', e);
    }
  });

  // Sort by date
  return Object.values(groups).sort(
    (a, b) => new Date(a.dateKey) - new Date(b.dateKey)
  );
}

// Check if a match is "today" in the target timezone
export function isMatchToday(utcDateString, targetTimezone) {
  const now = new Date();
  const matchDate = new Date(utcDateString);

  const todayStr = now.toLocaleDateString('en-US', { timeZone: targetTimezone });
  const matchStr = matchDate.toLocaleDateString('en-US', { timeZone: targetTimezone });

  return todayStr === matchStr;
}

// Format: "Today at 7:30 PM" or "Tomorrow at 2:00 AM"
export function getRelativeTimeLabel(utcDateString, targetTimezone, t) {
  const now = new Date();
  const matchDate = new Date(utcDateString);

  const todayStr = now.toLocaleDateString('en-US', { timeZone: targetTimezone });
  const matchStr = matchDate.toLocaleDateString('en-US', { timeZone: targetTimezone });

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-US', { timeZone: targetTimezone });

  const timeOnly = matchDate.toLocaleString('en-US', {
    timeZone: targetTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (matchStr === todayStr) return `${t?.today || 'Today'} • ${timeOnly}`;
  if (matchStr === tomorrowStr) return `${t?.tomorrow || 'Tomorrow'} • ${timeOnly}`;
  return timeOnly;
}
