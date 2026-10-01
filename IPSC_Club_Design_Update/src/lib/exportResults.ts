import { ExerciseResult, TrainingSession, Registration } from '../types';

/**
 * Exports exercise results to a downloadable CSV file
 */
export function exportResultsToCsv(
  training: TrainingSession,
  results: ExerciseResult[]
) {
  const headers = [
    'שם היורה',
    'תרגיל',
    'מחלקה',
    'Power Factor',
    'A',
    'C',
    'D',
    'Miss',
    'מתכת פגע',
    'מתכת החטאה',
    'No Shoot',
    'פרוצדורלי',
    'זמן (שניות)',
    'נקודות גולמיות',
    'Hit Factor'
  ];

  const rows = results.map(r => [
    `"${(r.userName || '').replace(/"/g, '""')}"`,
    `"${(r.exerciseTemplateName || '').replace(/"/g, '""')}"`,
    `"${(r.division || '').replace(/"/g, '""')}"`,
    `"${r.powerFactor || 'minor'}"`,
    r.hitsA || 0,
    r.hitsC || 0,
    r.hitsD || 0,
    r.misses || 0,
    r.metalHits || 0,
    r.metalMisses || 0,
    r.noShootHits || 0,
    r.procedurals || 0,
    r.timeSeconds || 0,
    r.rawPoints || 0,
    (r.hitFactor || 0).toFixed(4)
  ]);

  const csvContent = '\uFEFF' + [
    `"מועדון ירי מעשי נץ המדבר - תוצאות אימון: ${training.title} (${training.date})"`,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `results-${training.date}-${training.title.slice(0, 15).replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a print preview of the training summary and results table
 */
export function printTrainingSummary(
  training: TrainingSession,
  registrations: Registration[],
  results: ExerciseResult[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const confirmed = registrations.filter(r => r.trainingId === training.id && r.status === 'confirmed');

  const html = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>נץ המדבר - סיכום אימון ${training.date}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1a1a1a; direction: rtl; }
        h1, h2, h3 { margin: 0 0 8px 0; color: #111; }
        .header { border-bottom: 2px solid #8C6228; padding-bottom: 12px; margin-bottom: 20px; }
        .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; font-size: 14px; }
        .card { background: #f9f8f6; border: 1px solid #e0d8cb; border-radius: 8px; padding: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
        th { background: #8C6228; color: white; }
        tr:nth-child(even) { background: #fdfaf5; }
        .hf { font-weight: bold; color: #8C6228; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🦅 מועדון ירי מעשי נץ המדבר</h1>
        <h2>פרוטוקול אימון: ${training.title}</h2>
      </div>

      <div class="details-grid">
        <div class="card"><strong>תאריך:</strong> ${training.date}</div>
        <div class="card"><strong>שעות:</strong> ${training.startTime} - ${training.endTime}</div>
        <div class="card"><strong>מיקום:</strong> ${training.location}</div>
        <div class="card"><strong>מדריכים:</strong> ${training.instructorNames.join(', ') || 'מדריכי המועדון'}</div>
        <div class="card"><strong>משתתפים:</strong> ${confirmed.length} יורים</div>
        <div class="card"><strong>סטטוס:</strong> ${training.status === 'completed' ? 'הסתיים' : 'מתוכנן'}</div>
      </div>

      <h3>🎯 תוצאות תרגילים</h3>
      ${results.length === 0 ? '<p>טרם הוזנו תוצאות לאימון זה.</p>' : `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>שם היורה</th>
              <th>תרגיל</th>
              <th>מחלקה</th>
              <th>A</th>
              <th>C</th>
              <th>D</th>
              <th>Miss</th>
              <th>זמן</th>
              <th>נקודות</th>
              <th>Hit Factor</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${r.userName}</strong></td>
                <td>${r.exerciseTemplateName}</td>
                <td>${r.division || '—'}</td>
                <td>${r.hitsA}</td>
                <td>${r.hitsC}</td>
                <td>${r.hitsD}</td>
                <td>${r.misses + (r.metalMisses || 0)}</td>
                <td>${r.timeSeconds.toFixed(2)}s</td>
                <td>${r.rawPoints}</td>
                <td class="hf">${r.hitFactor.toFixed(4)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}

      <h3>👥 רשימת משתתפים</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>שם מלא</th>
            <th>טלפון</th>
            <th>נוכחות</th>
            <th>תשלום</th>
          </tr>
        </thead>
        <tbody>
          ${confirmed.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.userName}</td>
              <td>${r.userPhone}</td>
              <td>${r.attendance === 'attended' ? '✅ נכח' : r.attendance === 'absent' ? '❌ נעדר' : 'טרם סומן'}</td>
              <td>${r.paymentOnSite ? 'שולם במקום' : 'רגיל'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
