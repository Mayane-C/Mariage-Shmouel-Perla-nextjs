/**
 * Google Apps Script — RSVP Mariage Shmouel & Perla.
 *
 * MISE EN PLACE
 * 1. Va sur https://script.google.com/ → Nouveau projet.
 * 2. Colle TOUT ce code dans l'éditeur → Enregistre (icône disquette).
 * 3. Sélectionne la fonction « setup » dans le menu déroulant en haut → clic ▶ Exécuter.
 *    (Google demande une autorisation — accepte. Le sheet « RSVP — Mariage
 *    Shmouel & Perla » est créé automatiquement dans ton Drive.)
 * 4. Déployer (bouton bleu en haut à droite) → Nouveau déploiement
 *      → Type : Web App
 *      → Description : « RSVP v1 »
 *      → Exécuter en tant que : moi
 *      → Qui a accès : Tout le monde
 *    → Cliquer « Déployer », puis copier l'URL « /exec » qui s'affiche.
 * 5. Colle cette URL dans js/main.js → variable RSVP_ENDPOINT.
 *
 * MISE À JOUR DU CODE
 * → Déployer → Gérer les déploiements → ✏️ éditer → Nouvelle version → Déployer
 * (sinon les changements ne s'appliquent pas côté frontend).
 *
 * VOIR LES RÉPONSES
 * → Exécute la fonction « lienDuSheet » et regarde les logs (Ctrl/Cmd + Enter).
 */

var PROP_KEY = 'RSVP_SHEET_ID';
var SECRET = 'shmouel-perla-2026';

// Palette Sable Chaud alignée sur l'invitation.
var C_HEADER = '#6B5B4A';      // taupe deep
var C_HEADER_BG = '#F5EFE6';   // cream
var C_ACCENT = '#C9A87D';      // sand
var C_BORDER = '#DDC6A5';      // sand soft
var C_INK = '#4A3F35';         // taupe deepest

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_KEY);
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create('RSVP — Mariage Shmouel & Perla');
  props.setProperty(PROP_KEY, ss.getId());
  return ss;
}

function buildHeader_(sheet) {
  sheet.setFrozenRows(1);
  var hdr = sheet.getRange(1, 1, 1, 9);
  hdr.breakApart();
  hdr.clearContent();
  hdr.clearFormat();

  var headers = [
    'Date',
    'Prénom',
    'Nom',
    'Invité(e) par',
    'Présence',
    'Adultes',
    'Enfants',
    'Total',
    'Message'
  ];
  hdr.setValues([headers]);
  hdr.setFontWeight('bold')
     .setFontFamily('Georgia')
     .setFontSize(11)
     .setFontColor(C_INK)
     .setBackground(C_HEADER_BG)
     .setVerticalAlignment('middle')
     .setHorizontalAlignment('center')
     .setBorder(true, true, true, true, true, true, C_BORDER, SpreadsheetApp.BorderStyle.SOLID);

  sheet.setRowHeight(1, 34);
  sheet.setColumnWidth(1, 100);   // Date
  sheet.setColumnWidth(2, 110);   // Prénom
  sheet.setColumnWidth(3, 110);   // Nom
  sheet.setColumnWidth(4, 150);   // Famille
  sheet.setColumnWidth(5, 90);    // Présence
  sheet.setColumnWidth(6, 70);    // Adultes
  sheet.setColumnWidth(7, 70);    // Enfants
  sheet.setColumnWidth(8, 70);    // Total
  sheet.setColumnWidth(9, 300);   // Message
}

function getDataSheet_(ss) {
  ss = ss || getSpreadsheet_();
  var sheet = ss.getSheetByName('Réponses');
  if (!sheet) {
    sheet = ss.insertSheet('Réponses', 0);
    buildHeader_(sheet);
    updateSummary(ss);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = {};
    if (e && e.postData && e.postData.contents) {
      try { d = JSON.parse(e.postData.contents); } catch (er) {
        d = (e && e.parameter) ? e.parameter : {};
      }
    } else if (e && e.parameter) {
      d = e.parameter;
    }

    if (String(d.token) !== SECRET) {
      return json_({ result: 'error', error: 'unauthorized' });
    }

    var num = function (v) {
      var n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    };
    var adultes = num(d.adultes);
    var enfants = num(d.enfants);
    var presence = String(d.presence || '').toLowerCase() === 'oui' ? 'Oui, avec joie' : 'Non, absent(e)';

    var ss = getSpreadsheet_();
    var sheet = getDataSheet_(ss);

    var row = [
      d.date || new Date().toLocaleDateString('fr-FR'),
      d.prenom || '',
      d.nom || '',
      d.famille || '',
      presence,
      adultes,
      enfants,
      adultes + enfants,
      d.message || ''
    ];

    sheet.appendRow(row);

    var r = sheet.getLastRow();
    sheet.getRange(r, 6, 1, 3).setHorizontalAlignment('center');
    sheet.getRange(r, 8).setFontWeight('bold');

    // Colorer la ligne selon présence (vert doux pour oui, gris pour non)
    var rowBg = presence === 'Oui, avec joie' ? '#F5F0E7' : '#EFEFEF';
    sheet.getRange(r, 1, 1, 9).setBackground(rowBg);

    updateSummary(ss);
    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('Le service RSVP du mariage Shmouel & Perla est actif.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function updateSummary(ss) {
  ss = ss || getSpreadsheet_();
  var data = ss.getSheetByName('Réponses');
  if (!data) return;
  var last = data.getLastRow();
  var totalOui = 0, totalNon = 0, totalAd = 0, totalEn = 0;
  if (last >= 2) {
    var values = data.getRange(2, 5, last - 1, 3).getValues(); // Présence, Adultes, Enfants
    values.forEach(function (r) {
      var isOui = String(r[0]).indexOf('Oui') === 0;
      if (isOui) {
        totalOui++;
        totalAd += Number(r[1]) || 0;
        totalEn += Number(r[2]) || 0;
      } else {
        totalNon++;
      }
    });
  }

  var sum = ss.getSheetByName('Récapitulatif');
  if (!sum) sum = ss.insertSheet('Récapitulatif');
  sum.clear();

  sum.getRange('A1').setValue('Récapitulatif RSVP').setFontSize(16).setFontWeight('bold').setFontColor(C_INK);
  sum.getRange('A3').setValue('Nombre de réponses');
  sum.getRange('B3').setValue(totalOui + totalNon);
  sum.getRange('A4').setValue('Présents (Oui)');
  sum.getRange('B4').setValue(totalOui).setFontColor(C_ACCENT).setFontWeight('bold');
  sum.getRange('A5').setValue('Absents (Non)');
  sum.getRange('B5').setValue(totalNon);

  sum.getRange('A7').setValue('Total adultes');
  sum.getRange('B7').setValue(totalAd).setFontWeight('bold');
  sum.getRange('A8').setValue('Total enfants');
  sum.getRange('B8').setValue(totalEn).setFontWeight('bold');
  sum.getRange('A9').setValue('TOTAL invités présents');
  sum.getRange('B9').setValue(totalAd + totalEn)
                      .setFontSize(14)
                      .setFontWeight('bold')
                      .setFontColor(C_INK)
                      .setBackground(C_HEADER_BG);

  sum.getRange('A3:A9').setFontFamily('Georgia');
  sum.setColumnWidth(1, 220);
  sum.setColumnWidth(2, 100);
}

function setup() {
  var ss = getSpreadsheet_();
  var sheet = getDataSheet_(ss);
  buildHeader_(sheet);
  updateSummary(ss);
  installOnChangeTrigger_(ss);
  Logger.log('Setup terminé.');
  Logger.log('Feuille RSVP : ' + ss.getUrl());
}

function lienDuSheet() {
  Logger.log('FEUILLE RSVP : ' + getSpreadsheet_().getUrl());
}

/**
 * Installe le trigger onChange (nécessaire pour détecter les
 * suppressions manuelles de lignes — le simple onEdit ne fire pas
 * sur les changements structurels). Idempotent : ne réinstalle pas
 * si un trigger existe déjà.
 */
function installOnChangeTrigger_(ss) {
  ss = ss || getSpreadsheet_();
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'onSheetChange') return;
  }
  ScriptApp.newTrigger('onSheetChange')
    .forSpreadsheet(ss)
    .onChange()
    .create();
}

/**
 * Handler du trigger onChange — rafraîchit le récapitulatif à chaque
 * modification structurelle du sheet (ligne ajoutée, supprimée,
 * cellule editée). Silencieux en cas d'erreur pour ne pas bloquer.
 */
function onSheetChange(e) {
  try {
    updateSummary();
  } catch (err) {
    Logger.log('onSheetChange error: ' + err);
  }
}

/**
 * Ajoute un menu personnalisé « RSVP » quand le sheet est ouvert.
 * Simple trigger (installé automatiquement, pas besoin d'autorisation).
 * Permet de rafraîchir manuellement le récap en cas de besoin.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RSVP')
    .addItem('Actualiser le récapitulatif', 'refreshSummary')
    .addSeparator()
    .addItem('Voir le lien du sheet', 'lienDuSheet')
    .addToUi();
}

/**
 * Rafraîchit manuellement le récap (bouton menu).
 */
function refreshSummary() {
  updateSummary();
  SpreadsheetApp.getActive().toast('Récapitulatif mis à jour.', 'RSVP', 3);
}
