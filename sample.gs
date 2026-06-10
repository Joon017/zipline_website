// Cosmo — unified tracker
// Handles: page visits, Android waitlist signups
// Deploy as Web App: Execute as Me | Who has access: Anyone

var NOTIFY_EMAIL = 'jxspam17@gmail.com';

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var type = payload.type || 'visit';

    if      (type === 'android_waitlist') handleAndroidWaitlist(payload);
    else                                  handleVisit(payload);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, hint: 'Use POST' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Visit ────────────────────────────────────────────────────────
function handleVisit(p) {
  var ua         = p.ua   || 'unknown';
  var ref        = p.ref  || 'direct';
  var tz         = p.tz   || 'unknown';
  var page       = p.page || 'unknown';
  var now        = new Date();
  var sgTime     = Utilities.formatDate(now, 'Asia/Singapore', "d MMM yyyy, h:mm a 'SGT'");
  var browser    = parseBrowser(ua);
  var os         = parseOS(ua);
  var device     = /Mobile|Android|iPhone|iPad/i.test(ua) ? '📱 Mobile' : '💻 Desktop';
  var refDisplay = (ref === 'direct' || ref === '') ? 'Direct' : ref;

  logToSheet('Visits', [now, page, device + ' · ' + os, browser, tz, refDisplay]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '🔔 Cosmo visit · ' + page + ' · ' + sgTime,
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

// ── Android Waitlist ─────────────────────────────────────────────
function handleAndroidWaitlist(p) {
  var email  = p.email || '';
  var page   = p.page  || 'unknown';
  var ref    = p.ref   || 'direct';
  var now    = new Date();
  var sgTime = Utilities.formatDate(now, 'Asia/Singapore', "d MMM yyyy, h:mm a 'SGT'");

  logToSheet('Android Waitlist', [now, email, page, ref]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '✋ Cosmo Android waitlist · ' + email,
    htmlBody: card(
      'New Android waitlist signup',
      sgTime,
      [
        ['Email',    email],
        ['Page',     page],
        ['Referrer', ref === 'direct' ? 'Direct' : ref]
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
    var files = DriveApp.getFilesByName('Cosmo Tracker');
    ss = files.hasNext()
      ? SpreadsheetApp.open(files.next())
      : SpreadsheetApp.create('Cosmo Tracker');
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
