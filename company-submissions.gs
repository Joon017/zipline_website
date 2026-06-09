// Zipline Jobs — Company submission notification script
// Deploy as: Extensions > Apps Script, then Deploy > New deployment > Web App
// Execute as: Me | Who has access: Anyone

var NOTIFY_EMAIL = 'joonyjx@gmail.com';
var SHEET_NAME   = 'Submissions';

function doGet(e) {
  var company = (e.parameter.company || '').trim();
  var url     = (e.parameter.url     || '').trim();
  var email   = (e.parameter.email   || '').trim();

  if (!company || !url) return ContentService.createTextOutput('missing fields');

  logToSheet(company, url, email);
  sendNotification(company, url, email);

  return ContentService.createTextOutput('ok');
}

function logToSheet(company, url, email) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Company', 'URL', 'Submitted by']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }

  sheet.appendRow([new Date(), company, url, email]);
}

function sendNotification(company, url, email) {
  var subject = 'New company submission: ' + company;
  var body    = 'Someone submitted a company for tracking.\n\n'
              + 'Company: ' + company + '\n'
              + 'URL: https://' + url + '\n'
              + 'Submitted by: ' + (email || 'no email provided') + '\n\n'
              + 'Timestamp: ' + new Date().toLocaleString();

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
