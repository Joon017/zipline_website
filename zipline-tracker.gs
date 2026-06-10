// Zipline Jobs — unified tracker
// Handles: page visits, waitlist signups, company submissions
// Deploy as Web App: Execute as Me | Who has access: Anyone
// Replace the two old .gs files with this one endpoint.

var NOTIFY_EMAIL = 'joonyjx@gmail.com';

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || '{}');
    var type = payload.type || 'visit';

    if      (type === 'waitlist')    handleWaitlist(payload);
    else if (type === 'submission')  handleSubmission(payload);
    else                             handleVisit(payload);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// keep GET alive so the URL health-check works
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, hint: 'Use POST' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Visit ────────────────────────────────────────────────────────
function handleVisit(p) {
  var ua        = p.ua  || 'unknown';
  var ref       = p.ref || 'direct';
  var tz        = p.tz  || 'unknown';
  var page      = p.page || 'unknown';
  var now       = new Date();
  var sgTime    = Utilities.formatDate(now, 'Asia/Singapore', "d MMM yyyy, h:mm a 'SGT'");
  var browser   = parseBrowser(ua);
  var os        = parseOS(ua);
  var device    = /Mobile|Android|iPhone|iPad/i.test(ua) ? '📱 Mobile' : '💻 Desktop';
  var refDisplay = (ref === 'direct' || ref === '') ? 'Direct' : ref;

  logToSheet('Visits', [now, page, device + ' · ' + os, browser, tz, refDisplay]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '🔔 Zipline visit · ' + page + ' · ' + sgTime,
    htmlBody: card(
      'New visit · ' + page,
      sgTime,
      [
        ['Page',     page],
        ['Device',   device + ' · ' + os],
        ['Browser',  browser],
        ['Timezone', tz],
        ['Referrer', refDisplay]
      ]
    )
  });
}

// ── Waitlist ─────────────────────────────────────────────────────
function handleWaitlist(p) {
  var email     = p.email     || '';
  var companies = p.companies || 'none listed';
  var ref       = p.ref       || 'direct';
  var now       = new Date();
  var sgTime    = Utilities.formatDate(now, 'Asia/Singapore', "d MMM yyyy, h:mm a 'SGT'");

  logToSheet('Waitlist', [now, email, companies, ref]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '✋ Zipline waitlist · ' + email,
    htmlBody: card(
      'New waitlist signup',
      sgTime,
      [
        ['Email',     email],
        ['Companies', companies],
        ['Referrer',  ref === 'direct' ? 'Direct' : ref]
      ]
    )
  });
}

// ── Company submission ───────────────────────────────────────────
function handleSubmission(p) {
  var company = p.company || '';
  var url     = p.url     || '';
  var email   = p.email   || 'no email';
  var now     = new Date();
  var sgTime  = Utilities.formatDate(now, 'Asia/Singapore', "d MMM yyyy, h:mm a 'SGT'");

  logToSheet('Submissions', [now, company, url, email]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '🏢 Zipline submission · ' + company,
    htmlBody: card(
      'New company submission',
      sgTime,
      [
        ['Company', company],
        ['URL',     'https://' + url],
        ['Email',   email]
      ]
    )
  });
}

// ── Helpers ──────────────────────────────────────────────────────
function logToSheet(sheetName, rowData) {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    var files = DriveApp.getFilesByName('Zipline Tracker');
    ss = files.hasNext()
      ? SpreadsheetApp.open(files.next())
      : SpreadsheetApp.create('Zipline Tracker');
  }
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.appendRow(rowData);
}

function card(title, subtitle, rows) {
  var rowsHtml = rows.map(function (r) {
    return "<div style='display:flex;justify-content:space-between;padding:10px 0;" +
           "border-bottom:1px solid #e5e7eb;font-size:13px'>" +
           "<span style='color:#6b7280'>" + r[0] + "</span>" +
           "<span style='font-weight:600;color:#111827'>" + r[1] + "</span></div>";
  }).join('');

  return "<div style='font-family:Arial,sans-serif;max-width:460px;padding:24px;" +
         "background:#f9fafb;border-radius:12px'>" +
         "<h2 style='margin:0 0 4px;color:#111827;font-size:18px'>" + title + "</h2>" +
         "<p style='margin:0 0 20px;color:#6b7280;font-size:13px'>" + subtitle + "</p>" +
         rowsHtml + "</div>";
}

function parseBrowser(ua) {
  if (/Edg\//i.test(ua))     return 'Edge';
  if (/Chrome\//i.test(ua))  return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua))  return 'Safari';
  return 'Unknown';
}

function parseOS(ua) {
  if (/iPhone/i.test(ua))        return 'iPhone';
  if (/iPad/i.test(ua))          return 'iPad';
  if (/Android/i.test(ua))       return 'Android';
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Mac OS X/i.test(ua))      return 'macOS';
  if (/Linux/i.test(ua))         return 'Linux';
  return 'Unknown OS';
}
