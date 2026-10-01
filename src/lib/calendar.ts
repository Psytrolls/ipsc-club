import { TrainingSession } from '../types';

/**
 * Downloads a standard .ics calendar event file for Apple / Outlook / Google
 */
export function downloadIcsFile(training: TrainingSession) {
  const cleanDate = training.date.replace(/-/g, '');
  const cleanStart = training.startTime.replace(/:/g, '') + '00';
  const cleanEnd = training.endTime.replace(/:/g, '') + '00';
  const startIso = `${cleanDate}T${cleanStart}`;
  const endIso = `${cleanDate}T${cleanEnd}`;
  
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Desert Falcon IPSC//Club Training//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:training-${training.id}-${cleanDate}@ipsc.magavnegev.co.il`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:נץ המדבר - ${training.title}`,
    `DESCRIPTION:${training.type}\\nמדריכים: ${training.instructorNames.join(', ')}\\n${(training.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${training.location || 'מטווח נץ המדבר'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `desert-falcon-${training.date}-${training.title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct Google Calendar add event URL
 */
export function getGoogleCalendarUrl(training: TrainingSession): string {
  const cleanDate = training.date.replace(/-/g, '');
  const cleanStart = training.startTime.replace(/:/g, '') + '00';
  const cleanEnd = training.endTime.replace(/:/g, '') + '00';
  const startIso = `${cleanDate}T${cleanStart}`;
  const endIso = `${cleanDate}T${cleanEnd}`;
  
  const details = `${training.type}\nמדריכים: ${training.instructorNames.join(', ')}\n\n${training.description || ''}\n\nאתר המועדון: https://ipsc.magavnegev.co.il`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('נץ המדבר: ' + training.title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(training.location || 'מטווח נץ המדבר')}`;
}
