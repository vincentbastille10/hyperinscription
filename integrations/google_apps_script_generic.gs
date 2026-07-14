/*
  HyperInscription — connecteur Google Sheet générique

  1. Créez une Google Sheet.
  2. Extensions > Apps Script, collez ce fichier.
  3. Exécutez setupHyperInscription().
  4. Déployez en application web (exécuter en tant que vous, accès à toute personne disposant du lien).
  5. Collez l'URL /exec dans la configuration du client HyperInscription.
*/

const SHEET_NAME = 'Inscriptions';
const HEADERS = [
  'Date', 'Organisation', 'Formulaire', 'Nom', 'Email', 'Téléphone',
  'Date de naissance', 'Sélections', 'Total', 'Message', 'Payload brut'
];

function setupHyperInscription() {
  const sheet = sheet_();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function doPost(e) {
  try {
    setupHyperInscription();
    const payload = parse_(e);
    const fields = payload.fields || {};
    const choices = (payload.selectedOptions || []).map(function(item) {
      return [item.title || '', item.schedule || '', Number(item.price || 0) + ' EUR'].filter(Boolean).join(' · ');
    }).join('\n');

    sheet_().appendRow([
      new Date(), payload.organization || '', payload.sourceSlug || payload.slug || '',
      fields.name || '', fields.email || '', fields.phone || '', fields.birthDate || '',
      choices, Number(payload.total || 0), fields.message || '', JSON.stringify(payload)
    ]);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'HyperInscription Google Sheet' });
}

function sheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function parse_(e) {
  if (e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  if (e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  return {};
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
