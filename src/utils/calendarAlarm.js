function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateICS(match) {
  const [y, m, d] = match.dateIST.split('-').map(Number);
  const [hh, mm] = match.timeIST.split(':').map(Number);
  const matchDate = new Date(Date.UTC(y, m - 1, d, hh, mm) - (5.5 * 60 * 60 * 1000));

  const uid = `kickoffist-${match.id}@worldcup2026`;
  const startStr = formatICSDate(matchDate);
  const endStr = formatICSDate(new Date(matchDate.getTime() + 2 * 60 * 60 * 1000));

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KICKOFF IST//World Cup 2026//EN
BEGIN:VEVENT
UID:${uid}
SUMMARY:⚽ ${match.teamA} vs ${match.teamB} — World Cup 2026
DESCRIPTION:FIFA World Cup 2026\\nIST Time: ${match.displayTime || match.timeIST}\\nStadium: ${match.stadium}\\nKICKOFF IST — Converted to Indian Standard Time
DTSTART:${startStr}
DTEND:${endStr}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Match starting in 30 minutes! ${match.teamA} vs ${match.teamB}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

export function downloadICSFile(match, onAlarmSet) {
  const content = generateICS(match);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kickoffist_alarm_${match.teamA}_vs_${match.teamB}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (onAlarmSet) onAlarmSet();
}
