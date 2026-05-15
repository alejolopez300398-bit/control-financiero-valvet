/**
 * Backend Google Apps Script — Valvet → Google Sheets.
 * POR QUÉ: el mapa por nombre de cabecera (fila 1) es la “interventoría” frente a columnas
 * que se reordenan; así no rompemos filas si alguien mueve una columna en la hoja.
 */

var SPREADSHEET_ID = '1dmSLDEMn4V2cWlI-7hhSkjmeQEqtVdtKyDONnO2RuRQ';
/** Máximo de filas a escanear para valores distintos (costo vs datos en campo). */
var MAX_SCAN_ROWS = 8000;
var MAX_STRING_LEN = 5000;
var NA_VALUE = 'N/A';

function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action;
    if (action === 'meta') {
      return jsonResponse_(buildMeta_());
    }
    return jsonResponse_({ ok: true, message: 'Valvet GAS activo', action: action || null });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Cuerpo vacío' });
    }
    var data = JSON.parse(e.postData.contents);
    appendRowFromPayload_(data);
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

/**
 * POR QUÉ: `ContentService.createTextOutput` no implementa `setHeader` en el runtime actual de GAS,
 * lo que rompeía todo el endpoint con TypeError; el despliegue Web App suele responder igual ante fetch moderno.
 */
function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function buildMeta_() {
  var sheet = getTargetSheet_();
  var hm = readHeaderMap_(sheet);
  var map = hm.map;

  function listFor(headerKey) {
    var col = map[headerKey];
    return col ? uniqueColumnValues_(sheet, col, MAX_SCAN_ROWS) : [];
  }

  return {
    ok: true,
    concepto: listFor('concepto'),
    tipo_examen: listFor('tipo_examen'),
    laboratorio_profesional: listFor('laboratorio_profesional'),
    pago_tercero: listFor('pago_tercero'),
    pago_a_valvet: listFor('pago_a_valvet'),
    pacientes: listFor('paciente'),
    tutores: listFor('tutor'),
  };
}

function getTargetSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheets()[0];
}

function readHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('Hoja sin cabeceras');
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i]).trim();
    if (key) map[key] = i + 1;
  }
  return { map: map, colCount: headers.length };
}

function uniqueColumnValues_(sheet, colIndex1Based, maxRows) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var end = Math.min(lastRow, 1 + maxRows);
  var range = sheet.getRange(2, colIndex1Based, end, colIndex1Based);
  var vals = range.getValues();
  var seen = {};
  var out = [];
  for (var r = 0; r < vals.length; r++) {
    var v = vals[r][0];
    if (v === null || v === '') continue;
    var s = String(v).trim();
    if (!s || seen[s]) continue;
    seen[s] = true;
    out.push(s);
  }
  out.sort(function (a, b) {
    return a.localeCompare(b, 'es');
  });
  return out;
}

function appendRowFromPayload_(data) {
  var sheet = getTargetSheet_();
  var hm = readHeaderMap_(sheet);
  var headers = sheet.getRange(1, 1, 1, hm.colCount).getValues()[0];
  var record = buildRecordFromPayload_(data, hm.map);
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var name = String(headers[i]).trim();
    if (!name) {
      row.push('');
      continue;
    }
    row.push(record[name] !== undefined && record[name] !== null ? record[name] : '');
  }
  var targetRow = findFirstEmptyRecordRow_(sheet, hm.map);
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
}

function findFirstEmptyRecordRow_(sheet, headerMap) {
  var firstDataRow = 2;
  var lastRow = Math.max(sheet.getLastRow(), firstDataRow);
  var checkHeaders = ['fecha', 'concepto'];
  var checkCols = [];

  for (var i = 0; i < checkHeaders.length; i++) {
    var col = headerMap[checkHeaders[i]];
    if (col) checkCols.push(col);
  }

  if (!checkCols.length) return lastRow + 1;

  var numRows = lastRow - firstDataRow + 1;
  var ranges = [];
  for (var c = 0; c < checkCols.length; c++) {
    ranges.push(sheet.getRange(firstDataRow, checkCols[c], numRows, 1).getValues());
  }

  for (var r = 0; r < numRows; r++) {
    var isEmpty = true;
    for (var k = 0; k < ranges.length; k++) {
      if (String(ranges[k][r][0] || '').trim()) {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) return firstDataRow + r;
  }

  return lastRow + 1;
}

/**
 * POR QUÉ: mes_anio y balance se recalculan aquí para una sola fuente de verdad (evita
 * discrepancias entre lo que muestra el celular y lo que queda en obra / hoja).
 */
function buildRecordFromPayload_(data, headerMap) {
  var out = {};
  var hidden = hiddenFieldMap_(data.hidden_fields);
  var fechaIso = data.fecha ? sanitizeString_(data.fecha, 32) : '';
  var d = parseIsoDate_(fechaIso);
  if (!d) throw new Error('Fecha inválida');

  var tz = Session.getScriptTimeZone();
  var fechaDisplay = Utilities.formatDate(d, tz, 'dd/MM/yyyy');
  var mesAnio = Utilities.formatDate(d, tz, 'MM/yyyy');

  var ing = parseCopInteger_(data.ingresos);
  var sal = parseCopInteger_(data.salidas);
  var bal = ing - sal;

  out.fecha = fechaDisplay;
  out.mes_anio = mesAnio;
  out.concepto = sanitizeString_(data.concepto, MAX_STRING_LEN);
  out.paciente = payloadTextValue_(data, hidden, 'paciente');
  out.tutor = payloadTextValue_(data, hidden, 'tutor');
  out.tipo_examen = payloadTextValue_(data, hidden, 'tipo_examen');
  out.observacion = payloadTextValue_(data, hidden, 'observacion');
  out.laboratorio_profesional = payloadTextValue_(data, hidden, 'laboratorio_profesional');
  out.pago_tercero = payloadTextValue_(data, hidden, 'pago_tercero');
  out.pago_a_valvet = payloadTextValue_(data, hidden, 'pago_a_valvet');
  out.ingresos = hidden.ingresos ? NA_VALUE : ing;
  out.salidas = hidden.salidas ? NA_VALUE : sal;
  out.balance = bal;
  out.factura_electronica = payloadTextValue_(data, hidden, 'factura_electronica');

  var needed = [
    'fecha',
    'mes_anio',
    'concepto',
    'paciente',
    'tutor',
    'tipo_examen',
    'observacion',
    'laboratorio_profesional',
    'pago_tercero',
    'pago_a_valvet',
    'ingresos',
    'salidas',
    'balance',
    'factura_electronica',
  ];
  for (var i = 0; i < needed.length; i++) {
    if (!headerMap[needed[i]]) {
      throw new Error('Falta cabecera en la hoja: ' + needed[i]);
    }
  }
  return out;
}

function hiddenFieldMap_(fields) {
  var out = {};
  if (!fields || !fields.length) return out;
  for (var i = 0; i < fields.length; i++) {
    var key = String(fields[i] || '').trim();
    if (key) out[key] = true;
  }
  return out;
}

function payloadTextValue_(data, hidden, fieldName) {
  if (hidden[fieldName]) return NA_VALUE;
  return sanitizeString_(data[fieldName], MAX_STRING_LEN);
}

function sanitizeString_(s, maxLen) {
  if (s === null || s === undefined) return '';
  var t = String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
  if (t.length > maxLen) t = t.substring(0, maxLen);
  return t;
}

function parseIsoDate_(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  var p = iso.split('-');
  var y = parseInt(p[0], 10);
  var m = parseInt(p[1], 10);
  var day = parseInt(p[2], 10);
  var dt = new Date(y, m - 1, day);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== day) return null;
  return dt;
}

function parseCopInteger_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number' && !isNaN(v)) return Math.round(v);
  var s = String(v).replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
  var n = parseInt(s, 10);
  if (isNaN(n)) return 0;
  return n;
}
