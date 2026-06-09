// Zipline Jobs — Waitlist notification script
// Deploy as: Extensions > Apps Script, then Deploy > New deployment > Web App
// Execute as: Me | Who has access: Anyone

var NOTIFY_EMAIL = 'joonyjx@gmail.com';
var SHEET_NAME   = 'Waitlist';

function doGet(e) {
  var email     = (e.parameter.email     || '').trim();
  var companies = (e.parameter.companies || '').trim();

  if (!email) return ContentService.createTextOutput('missing email');

  logToSheet(email, companies);
  sendNotification(email, companies);

  return ContentService.createTextOutput('ok');
}

function logToSheet(email, companies) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Email', 'Companies']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }

  sheet.appendRow([new Date(), email, companies]);
}

function sendNotification(email, companies) {
  var subject = 'New Zipline waitlist signup: ' + email;
  var body    = 'Someone joined the Zipline waitlist.\n\n'
              + 'Email: ' + email + '\n'
              + 'Companies: ' + (companies || 'none listed') + '\n\n'
              + 'Timestamp: ' + new Date().toLocaleString();

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
