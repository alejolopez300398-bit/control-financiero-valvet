(function () {
  'use strict';

  /**
   * Pega aquí la URL del despliegue “Web app” (termina en /exec).
   * POR QUÉ: la URL no es secreto del todo, pero conviene no versionar la producción en repos públicos sin control de acceso en GAS.
   */
  var SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzdhW-48WMlVQTqvPI6T4yIrwXZtKzgruU0ACYPvC6zNEBtrRAf_wtitFOFncMPPZdPJw/exec';

  var DEBOUNCE_MS = 320;
  var metaCache = null;
  var NA_VALUE = 'N/A';
  var SALARIO_DOC_PROFESIONAL = 'Valentina Triviño';
  var ALL_CONFIGURABLE_FIELDS = [
    'fecha',
    'paciente',
    'tutor',
    'tipo_examen',
    'observacion',
    'laboratorio_profesional',
    'pago_tercero',
    'pago_a_valvet',
    'ingresos',
    'salidas',
    'factura_electronica',
  ];
  var ALWAYS_VISIBLE_FIELDS = ['concepto', 'mes_anio', 'balance', 'factura_electronica'];
  var DEFAULT_VISIBLE_FIELDS = ALL_CONFIGURABLE_FIELDS.concat(ALWAYS_VISIBLE_FIELDS);
  var CONCEPT_VISIBLE_FIELDS = {
    Consulta: ['fecha', 'paciente', 'tutor', 'pago_a_valvet', 'ingresos', 'salidas', 'factura_electronica'],
    'Toma de examenes': [
      'fecha',
      'paciente',
      'tutor',
      'tipo_examen',
      'laboratorio_profesional',
      'observacion',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    Ecografia: [
      'fecha',
      'paciente',
      'tutor',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    Radiografia: [
      'fecha',
      'paciente',
      'tutor',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    Interconsulta: [
      'fecha',
      'paciente',
      'tutor',
      'laboratorio_profesional',
      'observacion',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    'Control medico': ['fecha', 'paciente', 'tutor', 'pago_a_valvet', 'ingresos', 'salidas', 'factura_electronica'],
    'Hospitalizacion en casa': [
      'fecha',
      'paciente',
      'tutor',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    Eutanasia: ['fecha', 'paciente', 'tutor', 'pago_a_valvet', 'ingresos', 'salidas', 'factura_electronica'],
    Guarderia: ['fecha', 'paciente', 'tutor', 'pago_a_valvet', 'ingresos', 'salidas', 'factura_electronica'],
    Inyectologia: [
      'fecha',
      'paciente',
      'tutor',
      'observacion',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    'Control vacuna': [
      'fecha',
      'paciente',
      'tutor',
      'observacion',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    'Implantación microchip': [
      'fecha',
      'paciente',
      'tutor',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    'Certificado nacional': [
      'fecha',
      'paciente',
      'tutor',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    'Certificado internacional': [
      'fecha',
      'paciente',
      'tutor',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    Procedimiento: [
      'fecha',
      'paciente',
      'tutor',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    'Compra insumos': [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'salidas',
    ],
    'Compra medicamentos': [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'salidas',
    ],
    'Compra equipos': [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'salidas',
    ],
    Transporte: [
      'fecha',
      'pago_tercero',
      'salidas',
    ],
    Viáticos: [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_a_valvet',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    'Gastos empresa': [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_a_valvet',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    Papelería: [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_a_valvet',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    Parafiscales: [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_a_valvet',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    'Salario doc': [
      'fecha',
      'laboratorio_profesional',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    Turnos: [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_a_valvet',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    'Préstamo Valentina': [
      'fecha',
      'observacion',
      'laboratorio_profesional',
      'pago_a_valvet',
      'salidas',
      'pago_tercero',
      'ingresos',
    ],
    Faja: [
      'fecha',
      'paciente',
      'tutor',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
    Cytopoint: [
      'fecha',
      'paciente',
      'tutor',
      'laboratorio_profesional',
      'pago_tercero',
      'pago_a_valvet',
      'ingresos',
      'salidas',
      'factura_electronica',
    ],
  };
  var fieldState = {
    hidden: {},
  };

  var el = {
    form: null,
    status: null,
    btn: null,
    fecha: null,
    fechaDisplay: null,
    fechaPicker: null,
    fechaToggle: null,
    fechaCalendar: null,
    fechaGrid: null,
    fechaMonthLabel: null,
    fechaPrev: null,
    fechaNext: null,
    mesPreview: null,
    ingresos: null,
    salidas: null,
    balance: null,
    fields: {},
    fieldsets: [],
    views: {},
    tableStatus: null,
    tableCount: null,
    tableHead: null,
    tableBody: null,
    tableFoot: null,
    tableRefresh: null,
    financeStatus: null,
    financeRefresh: null,
    financeKpis: null,
    financeMonthBody: null,
    financeDetail: null,
    financeDetailTitle: null,
    financeDetailBody: null,
  };

  var calendarState = {
    viewYear: 0,
    viewMonth: 0,
    selectedIso: '',
  };

  var recordsState = {
    loaded: false,
    loading: false,
    savingCell: false,
    headers: [],
    rows: [],
    totalRows: 0,
    maxRows: 0,
    columnFilters: [],
  };

  function $(id) {
    return document.getElementById(id);
  }

  function showView(viewName) {
    var targetName = el.views[viewName] ? viewName : 'home';
    var keys = Object.keys(el.views);
    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      el.views[name].hidden = name !== targetName;
    }
    document.body.dataset.currentView = targetName;
    closeCalendar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleViewShown(targetName);
  }

  function handleViewShown(viewName) {
    if (viewName === 'tabla' && !recordsState.loaded && !recordsState.loading) {
      fetchRecords();
    }
    if (viewName === 'resumen') {
      loadFinancialSummary();
    }
  }

  function wireNavigation() {
    var views = document.querySelectorAll('[data-view]');
    for (var i = 0; i < views.length; i++) {
      var viewName = views[i].dataset.view;
      if (viewName) el.views[viewName] = views[i];
    }

    document.addEventListener('click', function (ev) {
      var trigger = ev.target.closest('[data-open-view]');
      if (!trigger) return;
      ev.preventDefault();
      showView(trigger.dataset.openView || 'home');
    });

    showView('home');
  }

  function normalizeConcept(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function getConceptVisibleFields(concept) {
    var normalized = normalizeConcept(concept);
    var keys = Object.keys(CONCEPT_VISIBLE_FIELDS);
    for (var i = 0; i < keys.length; i++) {
      if (normalizeConcept(keys[i]) === normalized) {
        return CONCEPT_VISIBLE_FIELDS[keys[i]].concat(ALWAYS_VISIBLE_FIELDS);
      }
    }
    return DEFAULT_VISIBLE_FIELDS.slice();
  }

  function getFieldContainer(fieldId) {
    var node = null;
    if (fieldId === 'fecha') node = el.fechaPicker || el.fechaDisplay || el.fecha;
    else if (fieldId === 'mes_anio') node = el.mesPreview;
    else node = $(fieldId);
    return node && node.closest ? node.closest('.field') : null;
  }

  function cacheFieldContainers() {
    var allFields = DEFAULT_VISIBLE_FIELDS.concat(['concepto']);
    var seen = {};
    for (var i = 0; i < allFields.length; i++) {
      var fieldId = allFields[i];
      if (seen[fieldId]) continue;
      seen[fieldId] = true;
      el.fields[fieldId] = getFieldContainer(fieldId);
    }
    if (el.form) {
      el.fieldsets = Array.prototype.slice.call(el.form.querySelectorAll('.fieldset'));
    }
  }

  function clearFieldValue(fieldId) {
    if (fieldId === 'fecha' || fieldId === 'concepto' || fieldId === 'mes_anio' || fieldId === 'balance') return;
    var input = $(fieldId);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = false;
      return;
    }
    input.value = '';
  }

  function isFieldHidden(fieldId) {
    return !!fieldState.hidden[fieldId];
  }

  function updateFieldsetVisibility() {
    for (var i = 0; i < el.fieldsets.length; i++) {
      var fieldset = el.fieldsets[i];
      var fields = Array.prototype.slice.call(fieldset.querySelectorAll('.field'));
      var hasVisibleField = false;
      for (var f = 0; f < fields.length; f++) {
        if (!fields[f].hidden) {
          hasVisibleField = true;
          break;
        }
      }
      fieldset.hidden = !hasVisibleField;
    }
  }

  function applyConceptRules() {
    var conceptInput = $('concepto');
    var concept = conceptInput ? conceptInput.value : '';
    var visibleFields = getConceptVisibleFields(concept);
    var visible = {};

    for (var i = 0; i < visibleFields.length; i++) {
      visible[visibleFields[i]] = true;
    }

    fieldState.hidden = {};
    for (var j = 0; j < ALL_CONFIGURABLE_FIELDS.length; j++) {
      var fieldId = ALL_CONFIGURABLE_FIELDS[j];
      var hidden = !visible[fieldId];
      var container = el.fields[fieldId];
      fieldState.hidden[fieldId] = hidden;
      if (container) container.hidden = hidden;
      if (hidden) clearFieldValue(fieldId);
    }

    applyConceptDefaults(concept);
    updateBalancePreview();
    updateFieldsetVisibility();
  }

  function applyConceptDefaults(concept) {
    if (normalizeConcept(concept) !== normalizeConcept('Salario doc')) return;
    var laboratorio = $('laboratorio_profesional');
    if (laboratorio && !isFieldHidden('laboratorio_profesional')) {
      laboratorio.value = SALARIO_DOC_PROFESIONAL;
    }
  }

  function showStatus(message, variant) {
    if (!el.status) return;
    el.status.hidden = !message;
    el.status.textContent = message || '';
    el.status.dataset.variant = variant || 'info';
  }

  function setTableStatus(message, variant) {
    if (!el.tableStatus) return;
    el.tableStatus.textContent = message || '';
    el.tableStatus.dataset.variant = variant || 'info';
  }

  function setFinanceStatus(message, variant) {
    if (!el.financeStatus) return;
    el.financeStatus.textContent = message || '';
    el.financeStatus.dataset.variant = variant || 'info';
  }

  /**
   * POR QUÉ: un solo GET al inicio evita “picos” de tráfico en datos móviles con debounce solo en CPU local.
   */
  function fetchMeta() {
    if (!SCRIPT_URL || !SCRIPT_URL.trim()) {
      showStatus('Configura SCRIPT_URL en app.js para cargar listas y guardar.', 'info');
      return Promise.resolve(null);
    }
    var url = SCRIPT_URL.replace(/\?$/, '');
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    return fetch(url + sep + 'action=meta', { method: 'GET', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('Meta HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Meta inválida');
        metaCache = data;
        applyMetaToDatalists(data);
        showStatus('Listas cargadas desde la hoja.', 'success');
        return data;
      })
      .catch(function (err) {
        console.error(err);
        showStatus('No se pudieron cargar las listas: ' + (err.message || err), 'error');
        return null;
      });
  }

  function clearDatalist(id) {
    var dl = $(id);
    if (!dl) return;
    while (dl.firstChild) dl.removeChild(dl.firstChild);
  }

  function fillDatalist(id, values) {
    clearDatalist(id);
    var dl = $(id);
    if (!dl || !values) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      frag.appendChild(opt);
    }
    dl.appendChild(frag);
  }

  function applyMetaToDatalists(data) {
    fillDatalist('list-concepto', data.concepto);
    fillDatalist('list-tipo_examen', data.tipo_examen);
    fillDatalist('list-laboratorio_profesional', withRequiredOption(data.laboratorio_profesional, SALARIO_DOC_PROFESIONAL));
    fillDatalist('list-pago_tercero', data.pago_tercero);
    fillDatalist('list-pago_a_valvet', data.pago_a_valvet);
    fillDatalist('list-paciente', data.pacientes);
    fillDatalist('list-tutor', data.tutores);
  }

  function fetchRecords() {
    if (!SCRIPT_URL || !SCRIPT_URL.trim()) {
      setTableStatus('Configura SCRIPT_URL en app.js para cargar la tabla.', 'error');
      return Promise.resolve(null);
    }
    recordsState.loading = true;
    if (el.tableRefresh) el.tableRefresh.disabled = true;
    setTableStatus('Cargando registros...', 'info');

    var url = SCRIPT_URL.replace(/\?$/, '');
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    return fetch(url + sep + 'action=records', { method: 'GET', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('Tabla HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Tabla invalida');
        recordsState.loaded = true;
        recordsState.headers = data.headers || [];
        recordsState.rows = data.rows || [];
        recordsState.totalRows = data.totalRows || recordsState.rows.length;
        recordsState.maxRows = data.maxRows || recordsState.rows.length;
        syncColumnFilters();
        renderRecordsTable();
        return data;
      })
      .catch(function (err) {
        console.error(err);
        setTableStatus('No se pudo cargar la tabla: ' + (err.message || err), 'error');
        if (el.tableBody) el.tableBody.textContent = '';
        if (el.tableHead) el.tableHead.textContent = '';
        updateTableCount(0);
        return null;
      })
      .then(function (data) {
        recordsState.loading = false;
        if (el.tableRefresh) el.tableRefresh.disabled = false;
        return data;
      });
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function getFilteredRows() {
    return recordsState.rows.filter(function (row) {
      return rowMatchesColumnFilters(row);
    });
  }

  function syncColumnFilters() {
    var expectedLength = recordsState.headers.length;
    if (recordsState.columnFilters.length === expectedLength) return;
    recordsState.columnFilters = [];
    for (var i = 0; i < expectedLength; i++) {
      recordsState.columnFilters.push('');
    }
  }

  function rowMatchesColumnFilters(row) {
    for (var i = 0; i < recordsState.columnFilters.length; i++) {
      var needle = normalizeSearchText(recordsState.columnFilters[i]).trim();
      if (!needle) continue;

      var values = row.values || [];
      var value = values[i] || '';

      if (normalizeSearchText(value).indexOf(needle) < 0) return false;
    }
    return true;
  }

  function renderRecordsTable() {
    if (!el.tableHead || !el.tableBody) return;
    renderTableHead();
    renderTableBody();
  }

  function renderTableBody() {
    if (!el.tableBody) return;
    var rows = getFilteredRows();
    el.tableBody.textContent = '';

    if (!recordsState.rows.length) {
      setTableStatus('La hoja no tiene registros todavia.', 'info');
      updateTableCount(0);
      renderTableTotals([]);
      return;
    }

    if (!rows.length) {
      setTableStatus('No hay registros que coincidan con la busqueda.', 'info');
      updateTableCount(0);
      renderTableTotals([]);
      return;
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < rows.length; i++) {
      frag.appendChild(buildTableRow(rows[i]));
    }
    el.tableBody.appendChild(frag);
    setTableStatus('Tabla cargada desde Google Sheets.', 'success');
    updateTableCount(rows.length);
    renderTableTotals(rows);
  }

  function renderTableHead() {
    el.tableHead.textContent = '';
    syncColumnFilters();

    var labelRow = document.createElement('tr');
    for (var i = 0; i < recordsState.headers.length; i++) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = recordsState.headers[i];
      labelRow.appendChild(th);
    }
    el.tableHead.appendChild(labelRow);

    var filterRow = document.createElement('tr');
    filterRow.className = 'table-filter-row';
    for (var j = 0; j < recordsState.headers.length; j++) {
      filterRow.appendChild(buildColumnFilterCell(j, 'Filtrar ' + recordsState.headers[j]));
    }
    el.tableHead.appendChild(filterRow);
  }

  function buildColumnFilterCell(filterIndex, label) {
    var th = document.createElement('th');
    th.scope = 'col';

    var input = document.createElement('input');
    input.className = 'table-filter-input';
    input.type = 'search';
    input.placeholder = 'Filtrar';
    input.setAttribute('aria-label', label);
    input.dataset.filterIndex = String(filterIndex);
    input.value = recordsState.columnFilters[filterIndex] || '';
    th.appendChild(input);

    return th;
  }

  function buildTableRow(row) {
    var tr = document.createElement('tr');
    var values = row.values || [];
    for (var i = 0; i < recordsState.headers.length; i++) {
      var td = document.createElement('td');
      var value = values[i] === null || values[i] === undefined ? '' : String(values[i]).trim();
      td.textContent = value || 'N/A';
      td.dataset.row = String(row.sheetRow || '');
      td.dataset.field = recordsState.headers[i] || '';
      td.dataset.value = value;
      td.tabIndex = 0;
      td.title = 'Clic para editar';
      applyRecordCellClasses(td, recordsState.headers[i], value);
      tr.appendChild(td);
    }
    return tr;
  }

  function applyRecordCellClasses(cell, header, value) {
    var classes = [];
    var key = normalizeConcept(header);
    var normalizedValue = normalizeConcept(value);

    if (!value) classes.push('cell-muted');
    if (key === 'observacion') classes.push('cell-wrap');

    if (key === 'pago_tercero') {
      if (normalizedValue === 'ejecutado') classes.push('cell-state-success');
      else if (normalizedValue === 'pendiente') classes.push('cell-state-danger');
      else if (normalizedValue === normalizeConcept(NA_VALUE)) classes.push('cell-state-muted');
    }

    if (key === 'pago_a_valvet') {
      if (normalizedValue === 'efectivo' || normalizedValue === 'transferencia' || normalizedValue === 'datafono') {
        classes.push('cell-state-success');
      } else if (normalizedValue === 'pendiente') {
        classes.push('cell-state-danger');
      } else if (normalizedValue === normalizeConcept(NA_VALUE)) {
        classes.push('cell-state-muted');
      }
    }

    cell.className = classes.join(' ');
  }

  function renderTableTotals(rows) {
    if (!el.tableFoot) return;
    el.tableFoot.textContent = '';
    if (!recordsState.headers.length) return;

    var moneyIndexes = getMoneyColumnIndexes();
    if (!moneyIndexes.length) return;

    var totals = calculateMoneyTotals(rows, moneyIndexes);
    var tr = document.createElement('tr');
    tr.className = 'table-total-row';

    for (var i = 0; i < recordsState.headers.length; i++) {
      var td = document.createElement('td');
      if (i === 0) {
        td.className = 'table-total-label';
        td.textContent = 'Total';
      } else if (totals[i] !== undefined) {
        td.className = 'table-total-money';
        td.textContent = '$' + formatBalanceDisplay(totals[i]);
      }
      tr.appendChild(td);
    }

    el.tableFoot.appendChild(tr);
  }

  function getMoneyColumnIndexes() {
    var wanted = {
      ingresos: true,
      salidas: true,
      balance: true,
    };
    var indexes = [];
    for (var i = 0; i < recordsState.headers.length; i++) {
      if (wanted[normalizeConcept(recordsState.headers[i])]) indexes.push(i);
    }
    return indexes;
  }

  function calculateMoneyTotals(rows, moneyIndexes) {
    var totals = {};
    for (var i = 0; i < moneyIndexes.length; i++) {
      totals[moneyIndexes[i]] = 0;
    }

    for (var r = 0; r < rows.length; r++) {
      var values = rows[r].values || [];
      for (var k = 0; k < moneyIndexes.length; k++) {
        var index = moneyIndexes[k];
        totals[index] += parseDisplayMoney_(values[index]);
      }
    }

    return totals;
  }

  function parseDisplayMoney_(value) {
    var raw = String(value || '').trim();
    if (!raw || normalizeConcept(raw) === normalizeConcept(NA_VALUE)) return 0;

    var sign = raw.indexOf('-') >= 0 ? -1 : 1;
    var digits = raw.replace(/\D/g, '');
    if (!digits) return 0;

    var parsed = parseInt(digits, 10);
    return isNaN(parsed) ? 0 : sign * parsed;
  }

  function startCellEdit(cell) {
    if (!cell || recordsState.savingCell || cell.querySelector('.table-edit-control')) return;

    var originalValue = cell.dataset.value || '';
    cell.classList.remove('cell-muted');
    cell.classList.add('cell-editing');
    cell.textContent = '';

    var input = buildCellEditor(cell.dataset.field || '', originalValue);
    cell.appendChild(input);
    input.focus();
    if (input.select) input.select();

    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        commitCellEdit(cell, input.value, originalValue);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        cancelCellEdit(cell, originalValue);
      }
    });

    input.addEventListener('blur', function () {
      commitCellEdit(cell, input.value, originalValue);
    });
  }

  function buildCellEditor(fieldName, currentValue) {
    var options = getControlledFieldOptions(fieldName);
    if (options) return buildCellSelect(fieldName, currentValue, options);

    var input = document.createElement('input');
    input.className = 'table-edit-control table-edit-input';
    input.type = 'text';
    input.value = currentValue;
    input.setAttribute('aria-label', 'Editar ' + (fieldName || 'celda'));
    return input;
  }

  function buildCellSelect(fieldName, currentValue, options) {
    var select = document.createElement('select');
    select.className = 'table-edit-control table-edit-select';
    select.setAttribute('aria-label', 'Editar ' + (fieldName || 'celda'));

    var currentKey = normalizeConcept(currentValue);
    for (var i = 0; i < options.length; i++) {
      var option = document.createElement('option');
      option.value = options[i];
      option.textContent = options[i];
      if (normalizeConcept(options[i]) === currentKey) option.selected = true;
      select.appendChild(option);
    }

    return select;
  }

  function getControlledFieldOptions(fieldName) {
    var key = normalizeConcept(fieldName);
    if (key === 'pago_tercero') return ['Pendiente', 'Ejecutado', NA_VALUE];
    if (key === 'pago_a_valvet') return ['Datafono', 'efectivo', 'transferencia', NA_VALUE, 'Pendiente'];
    return null;
  }

  function cancelCellEdit(cell, originalValue) {
    renderCellValue(cell, originalValue);
  }

  function commitCellEdit(cell, nextValue, originalValue) {
    if (!cell || recordsState.savingCell) return;
    var cleanValue = String(nextValue || '').trim();
    if (cleanValue === originalValue) {
      renderCellValue(cell, originalValue);
      return;
    }

    recordsState.savingCell = true;
    cell.classList.remove('cell-editing');
    cell.classList.add('cell-saving');

    updateRecordCell(cell.dataset.row, cell.dataset.field, cleanValue)
      .then(function (ok) {
        if (!ok) {
          renderCellValue(cell, originalValue);
          return;
        }
        recordsState.loaded = false;
        fetchRecords();
      })
      .then(function () {
        recordsState.savingCell = false;
      });
  }

  function renderCellValue(cell, value) {
    var cleanValue = String(value || '').trim();
    cell.classList.remove('cell-editing', 'cell-saving');
    cell.dataset.value = cleanValue;
    cell.textContent = cleanValue || 'N/A';
    applyRecordCellClasses(cell, cell.dataset.field || '', cleanValue);
  }

  function updateRecordCell(row, field, value) {
    if (!SCRIPT_URL || !SCRIPT_URL.trim()) {
      setTableStatus('Configura SCRIPT_URL en app.js para editar la tabla.', 'error');
      return Promise.resolve(false);
    }

    setTableStatus('Guardando cambio...', 'info');

    return fetch(SCRIPT_URL.replace(/\?$/, ''), {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'updateCell',
        row: row,
        field: field,
        value: value,
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (r) {
        if (r.body && r.body.ok) {
          setTableStatus('Cambio guardado en Google Sheets.', 'success');
          return true;
        }
        throw new Error((r.body && r.body.error) || 'Error al guardar el cambio');
      })
      .catch(function (err) {
        console.error(err);
        setTableStatus(err.message || 'No se pudo guardar el cambio.', 'error');
        return false;
      });
  }

  function updateTableCount(visibleRows) {
    if (!el.tableCount) return;
    var total = recordsState.totalRows || recordsState.rows.length;
    if (recordsState.totalRows > recordsState.maxRows) {
      el.tableCount.textContent =
        visibleRows + ' visibles de los ultimos ' + recordsState.maxRows + ' registros (' + total + ' en la hoja).';
      return;
    }
    el.tableCount.textContent = visibleRows + ' visibles de ' + total + ' registros.';
  }

  function loadFinancialSummary() {
    if (recordsState.loaded) {
      renderFinancialSummary();
      return;
    }

    setFinanceStatus('Cargando resumen...', 'info');
    fetchRecords().then(function (data) {
      if (data) renderFinancialSummary();
      else setFinanceStatus('No se pudo cargar el resumen financiero.', 'error');
    });
  }

  function renderFinancialSummary() {
    if (!el.financeKpis || !el.financeMonthBody) return;
    var summary = buildFinancialSummary(recordsState.rows || []);
    renderFinancialKpis(summary.total);
    renderFinancialMonths(summary.months);
    hideFinancialDetail();
    setFinanceStatus('Resumen actualizado desde Google Sheets.', 'success');
  }

  function buildFinancialSummary(rows) {
    var index = buildHeaderIndexMap();
    var total = createFinancialBucket();
    var months = {};

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var values = row.values || [];
      var month = getCellByIndex(values, index, 'mes_anio') || 'Sin mes';
      if (!months[month]) months[month] = createFinancialBucket(month);
      addRowToFinancialBucket(total, values, index, row);
      addRowToFinancialBucket(months[month], values, index, row);
    }

    return {
      total: total,
      months: sortFinancialMonths(months),
    };
  }

  function createFinancialBucket(label) {
    return {
      label: label || '',
      ingresos: 0,
      salidas: 0,
      salarios: 0,
      ganancia: 0,
      pendientesPagar: 0,
      pendientesRecibir: 0,
      deberiaTener: 0,
      pendientesPagarRows: [],
      pendientesRecibirRows: [],
    };
  }

  function addRowToFinancialBucket(bucket, values, index, row) {
    var ingresos = parseDisplayMoney_(getCellByIndex(values, index, 'ingresos'));
    var salidas = parseDisplayMoney_(getCellByIndex(values, index, 'salidas'));
    var concepto = normalizeConcept(getCellByIndex(values, index, 'concepto'));
    var pagoTercero = normalizeConcept(getCellByIndex(values, index, 'pago_tercero'));
    var pagoValvet = normalizeConcept(getCellByIndex(values, index, 'pago_a_valvet'));

    bucket.ingresos += ingresos;
    bucket.salidas += salidas;
    if (concepto === normalizeConcept('Salario doc')) bucket.salarios += salidas;
    if (pagoTercero === 'pendiente') {
      bucket.pendientesPagar += salidas;
      if (row) bucket.pendientesPagarRows.push(row);
    }
    if (pagoValvet === 'pendiente') {
      bucket.pendientesRecibir += ingresos;
      if (row) bucket.pendientesRecibirRows.push(row);
    }

    bucket.ganancia = bucket.ingresos - bucket.salidas;
    bucket.deberiaTener = bucket.ganancia - bucket.pendientesPagar - bucket.pendientesRecibir;
  }

  function buildHeaderIndexMap() {
    var out = {};
    for (var i = 0; i < recordsState.headers.length; i++) {
      out[normalizeConcept(recordsState.headers[i])] = i;
    }
    return out;
  }

  function getCellByIndex(values, index, headerName) {
    var i = index[normalizeConcept(headerName)];
    if (i === undefined) return '';
    return values[i] || '';
  }

  function sortFinancialMonths(monthMap) {
    var months = Object.keys(monthMap).map(function (key) {
      return monthMap[key];
    });
    months.sort(function (a, b) {
      return monthSortValue(b.label) - monthSortValue(a.label);
    });
    return months;
  }

  function monthSortValue(label) {
    var m = String(label || '').match(/^(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;
    return parseInt(m[2], 10) * 100 + parseInt(m[1], 10);
  }

  function renderFinancialKpis(total) {
    el.financeKpis.textContent = '';
    var items = [
      { label: 'Ingresos', value: total.ingresos, tone: 'positive' },
      { label: 'Salidas', value: total.salidas, tone: 'negative' },
      { label: 'Salarios', value: total.salarios, tone: 'neutral' },
      { label: 'Ganancia', value: total.ganancia, tone: total.ganancia >= 0 ? 'positive' : 'negative' },
      { label: 'Pendientes por pagar', value: total.pendientesPagar, tone: 'warning', detailType: 'pagar' },
      { label: 'Pendientes por recibir', value: total.pendientesRecibir, tone: 'warning', detailType: 'recibir' },
      { label: 'Debería tener', value: total.deberiaTener, tone: total.deberiaTener >= 0 ? 'positive' : 'negative' },
    ];

    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      frag.appendChild(buildFinanceKpi(items[i]));
    }
    el.financeKpis.appendChild(frag);
  }

  function buildFinanceKpi(item) {
    var card = document.createElement(item.detailType ? 'button' : 'article');
    card.className = 'finance-kpi finance-kpi-' + item.tone;
    if (item.detailType) {
      card.type = 'button';
      card.className += ' finance-kpi-action';
      card.dataset.detailType = item.detailType;
      card.setAttribute('aria-label', 'Ver detalle de ' + item.label.toLowerCase());
    }

    var label = document.createElement('p');
    label.className = 'finance-kpi-label';
    label.textContent = item.label;

    var value = document.createElement('strong');
    value.className = 'finance-kpi-value';
    value.textContent = formatMoneyForSummary(item.value);

    card.appendChild(label);
    card.appendChild(value);
    return card;
  }

  function renderFinancialMonths(months) {
    el.financeMonthBody.textContent = '';
    if (!months.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 7;
      emptyCell.textContent = 'No hay registros para resumir.';
      emptyRow.appendChild(emptyCell);
      el.financeMonthBody.appendChild(emptyRow);
      return;
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < months.length; i++) {
      frag.appendChild(buildFinancialMonthRow(months[i]));
    }
    el.financeMonthBody.appendChild(frag);
  }

  function buildFinancialMonthRow(month) {
    var tr = document.createElement('tr');
    var values = [
      month.label,
      formatMoneyForSummary(month.ingresos),
      formatMoneyForSummary(month.salidas),
      formatMoneyForSummary(month.salarios),
      formatMoneyForSummary(month.ganancia),
      formatMoneyForSummary(month.pendientesPagar),
      formatMoneyForSummary(month.pendientesRecibir),
    ];

    for (var i = 0; i < values.length; i++) {
      var cell = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) cell.scope = 'row';
      cell.textContent = values[i];
      tr.appendChild(cell);
    }
    return tr;
  }

  function showFinancialDetail(type) {
    if (!el.financeDetail || !el.financeDetailTitle || !el.financeDetailBody) return;

    var summary = buildFinancialSummary(recordsState.rows || []);
    var isPayable = type === 'pagar';
    var rows = isPayable ? summary.total.pendientesPagarRows : summary.total.pendientesRecibirRows;
    var paymentHeader = isPayable ? 'pago_tercero' : 'pago_a_valvet';
    var valueHeader = isPayable ? 'salidas' : 'ingresos';
    var title = isPayable ? 'Detalle pendientes por pagar' : 'Detalle pendientes por recibir';

    el.financeDetailTitle.textContent = title;
    el.financeDetailBody.textContent = '';

    if (!rows.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 7;
      emptyCell.textContent = 'No hay registros pendientes para mostrar.';
      emptyRow.appendChild(emptyCell);
      el.financeDetailBody.appendChild(emptyRow);
    } else {
      var index = buildHeaderIndexMap();
      var frag = document.createDocumentFragment();
      for (var i = 0; i < rows.length; i++) {
        frag.appendChild(buildFinancialDetailRow(rows[i], index, paymentHeader, valueHeader));
      }
      el.financeDetailBody.appendChild(frag);
    }

    el.financeDetail.hidden = false;
    el.financeDetail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function hideFinancialDetail() {
    if (!el.financeDetail || !el.financeDetailBody) return;
    el.financeDetail.hidden = true;
    el.financeDetailBody.textContent = '';
  }

  function buildFinancialDetailRow(row, index, paymentHeader, valueHeader) {
    var values = row.values || [];
    var tr = document.createElement('tr');
    var cells = [
      getCellByIndex(values, index, 'fecha'),
      getCellByIndex(values, index, 'mes_anio'),
      getCellByIndex(values, index, 'concepto'),
      getCellByIndex(values, index, 'paciente'),
      getCellByIndex(values, index, 'tutor'),
      getCellByIndex(values, index, paymentHeader),
      formatMoneyForSummary(parseDisplayMoney_(getCellByIndex(values, index, valueHeader))),
    ];

    for (var i = 0; i < cells.length; i++) {
      var cell = document.createElement('td');
      cell.textContent = cells[i] || 'N/A';
      tr.appendChild(cell);
    }
    return tr;
  }

  function formatMoneyForSummary(value) {
    return '$' + formatBalanceDisplay(value || 0);
  }

  function withRequiredOption(values, requiredValue) {
    var out = values ? values.slice() : [];
    var requiredKey = normalizeConcept(requiredValue);
    for (var i = 0; i < out.length; i++) {
      if (normalizeConcept(out[i]) === requiredKey) return out;
    }
    out.unshift(requiredValue);
    return out;
  }

  /** Solo dígitos → entero (pesos COP sin decimales en MVP). */
  function parseDigitsToInt(str) {
    if (!str || typeof str !== 'string') return 0;
    var d = str.replace(/\D/g, '');
    if (!d) return 0;
    var n = parseInt(d, 10);
    return isNaN(n) ? 0 : n;
  }

  /**
   * POR QUÉ: el usuario escribe cifras; el formato con puntos es presentación, no otra capa de datos.
   */
  function formatCopMaskFromDigits(digitStr) {
    var n = parseDigitsToInt(digitStr);
    if (n === 0 && (!digitStr || !/\d/.test(digitStr))) return '';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function wireMoneyInput(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      var raw = input.value;
      var digits = raw.replace(/\D/g, '');
      var masked = formatCopMaskFromDigits(digits);
      input.value = masked;
      updateBalancePreview();
    });
    input.addEventListener('blur', function () {
      if (!input.value.trim()) input.value = '';
      updateBalancePreview();
    });
  }

  function getMoneyNumber(input) {
    if (input && isFieldHidden(input.id)) return 0;
    return parseDigitsToInt(input ? input.value : '');
  }

  function formatBalanceDisplay(num) {
    var n = Math.round(Number(num));
    if (isNaN(n)) n = 0;
    var neg = n < 0;
    var abs = Math.abs(n);
    var s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return neg ? '-' + s : s;
  }

  function updateBalancePreview() {
    if (!el.balance) return;
    var ing = getMoneyNumber(el.ingresos);
    var sal = getMoneyNumber(el.salidas);
    el.balance.textContent = formatBalanceDisplay(ing - sal);
  }

  /** Vista previa local; el valor oficial de mes_anio lo calcula GAS al guardar. */
  function updateMesAnioPreview() {
    if (!el.fecha || !el.mesPreview) return;
    var v = el.fecha.value;
    if (!v) {
      el.mesPreview.textContent = '—';
      return;
    }
    var p = v.split('-');
    if (p.length !== 3) {
      el.mesPreview.textContent = '—';
      return;
    }
    el.mesPreview.textContent = p[1] + '/' + p[0];
  }

  function parseIsoDateParts(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var p = iso.split('-');
    var year = parseInt(p[0], 10);
    var month = parseInt(p[1], 10);
    var day = parseInt(p[2], 10);
    var dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
    return { year: year, month: month, day: day, date: dt };
  }

  function formatIsoDate(year, monthIndex, day) {
    var mm = String(monthIndex + 1).padStart(2, '0');
    var dd = String(day).padStart(2, '0');
    return String(year) + '-' + mm + '-' + dd;
  }

  function formatDateDisplay(iso) {
    var parsed = parseIsoDateParts(iso);
    if (!parsed) return '';
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsed.date);
  }

  function setSelectedDate(iso) {
    calendarState.selectedIso = iso || '';
    if (el.fecha) el.fecha.value = iso || '';
    if (el.fechaDisplay) el.fechaDisplay.value = formatDateDisplay(iso);
    if (el.fechaDisplay) el.fechaDisplay.setAttribute('aria-invalid', iso ? 'false' : 'true');
    updateMesAnioPreview();
    renderCalendar();
  }

  function clearSelectedDate() {
    setSelectedDate('');
  }

  function syncCalendarViewFromSelected() {
    var parsed = parseIsoDateParts(calendarState.selectedIso);
    var base = parsed ? parsed.date : new Date();
    calendarState.viewYear = base.getFullYear();
    calendarState.viewMonth = base.getMonth();
  }

  function openCalendar() {
    if (!el.fechaCalendar) return;
    el.fechaCalendar.hidden = false;
    if (el.fechaToggle) el.fechaToggle.setAttribute('aria-expanded', 'true');
    if (el.fechaDisplay) el.fechaDisplay.setAttribute('aria-expanded', 'true');
    renderCalendar();
  }

  function closeCalendar() {
    if (!el.fechaCalendar) return;
    el.fechaCalendar.hidden = true;
    if (el.fechaToggle) el.fechaToggle.setAttribute('aria-expanded', 'false');
    if (el.fechaDisplay) el.fechaDisplay.setAttribute('aria-expanded', 'false');
  }

  function toggleCalendar() {
    if (!el.fechaCalendar) return;
    if (el.fechaCalendar.hidden) {
      openCalendar();
    } else {
      closeCalendar();
    }
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function renderCalendar() {
    if (!el.fechaGrid || !el.fechaMonthLabel) return;

    var monthDate = new Date(calendarState.viewYear, calendarState.viewMonth, 1);
    el.fechaMonthLabel.textContent = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(monthDate);

    el.fechaGrid.textContent = '';

    var firstDayIndex = (monthDate.getDay() + 6) % 7;
    var daysInMonth = new Date(calendarState.viewYear, calendarState.viewMonth + 1, 0).getDate();
    var prevMonthDays = new Date(calendarState.viewYear, calendarState.viewMonth, 0).getDate();
    var totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    var selected = parseIsoDateParts(calendarState.selectedIso);
    var selectedDate = selected ? selected.date : null;
    var today = new Date();

    for (var i = 0; i < totalCells; i++) {
      var dayNumber = i - firstDayIndex + 1;
      var cellYear = calendarState.viewYear;
      var cellMonth = calendarState.viewMonth;
      var inCurrentMonth = true;

      if (dayNumber < 1) {
        cellMonth -= 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear -= 1;
        }
        dayNumber = prevMonthDays + dayNumber;
        inCurrentMonth = false;
      } else if (dayNumber > daysInMonth) {
        dayNumber -= daysInMonth;
        cellMonth += 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear += 1;
        }
        inCurrentMonth = false;
      }

      var iso = formatIsoDate(cellYear, cellMonth, dayNumber);
      var cellDate = new Date(cellYear, cellMonth, dayNumber);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'date-day' + (inCurrentMonth ? '' : ' date-day-other');
      if (isSameDay(cellDate, today)) btn.className += ' date-day-today';
      if (selectedDate && isSameDay(cellDate, selectedDate)) btn.className += ' date-day-selected';
      btn.textContent = String(dayNumber);
      btn.dataset.iso = iso;
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute(
        'aria-label',
        new Intl.DateTimeFormat('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(cellDate)
      );
      btn.addEventListener('click', function (ev) {
        var nextIso = ev.currentTarget.dataset.iso;
        var parsed = parseIsoDateParts(nextIso);
        if (!parsed) return;
        calendarState.viewYear = parsed.year;
        calendarState.viewMonth = parsed.month - 1;
        setSelectedDate(nextIso);
        closeCalendar();
      });
      el.fechaGrid.appendChild(btn);
    }
  }

  function wireDatePicker() {
    if (!el.fecha || !el.fechaDisplay || !el.fechaPicker) return;

    var initial = parseIsoDateParts(el.fecha.value);
    if (initial) {
      calendarState.selectedIso = el.fecha.value;
      calendarState.viewYear = initial.year;
      calendarState.viewMonth = initial.month - 1;
      el.fechaDisplay.value = formatDateDisplay(el.fecha.value);
    } else {
      syncCalendarViewFromSelected();
      el.fechaDisplay.value = '';
    }

    el.fechaDisplay.addEventListener('click', openCalendar);
    el.fechaDisplay.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        openCalendar();
      }
    });

    if (el.fechaToggle) el.fechaToggle.addEventListener('click', toggleCalendar);
    if (el.fechaPrev) {
      el.fechaPrev.addEventListener('click', function () {
        calendarState.viewMonth -= 1;
        if (calendarState.viewMonth < 0) {
          calendarState.viewMonth = 11;
          calendarState.viewYear -= 1;
        }
        renderCalendar();
      });
    }
    if (el.fechaNext) {
      el.fechaNext.addEventListener('click', function () {
        calendarState.viewMonth += 1;
        if (calendarState.viewMonth > 11) {
          calendarState.viewMonth = 0;
          calendarState.viewYear += 1;
        }
        renderCalendar();
      });
    }

    document.addEventListener('click', function (ev) {
      if (!el.fechaPicker.contains(ev.target)) closeCalendar();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeCalendar();
    });

    renderCalendar();
    updateMesAnioPreview();
  }

  function buildPayload() {
    function textValue(fieldId) {
      if (isFieldHidden(fieldId)) return NA_VALUE;
      var input = $(fieldId);
      return input ? input.value.trim() : '';
    }

    function moneyValue(fieldId, input) {
      return isFieldHidden(fieldId) ? NA_VALUE : getMoneyNumber(input);
    }

    function checkboxValue(fieldId) {
      if (isFieldHidden(fieldId)) return NA_VALUE;
      var input = $(fieldId);
      return input && input.checked ? 'Si' : 'No';
    }

    return {
      fecha: el.fecha ? el.fecha.value : '',
      concepto: $('concepto').value.trim(),
      paciente: textValue('paciente'),
      tutor: textValue('tutor'),
      tipo_examen: textValue('tipo_examen'),
      observacion: textValue('observacion'),
      laboratorio_profesional: textValue('laboratorio_profesional'),
      pago_tercero: textValue('pago_tercero'),
      pago_a_valvet: textValue('pago_a_valvet'),
      ingresos: moneyValue('ingresos', el.ingresos),
      salidas: moneyValue('salidas', el.salidas),
      factura_electronica: checkboxValue('factura_electronica'),
      hidden_fields: ALL_CONFIGURABLE_FIELDS.filter(isFieldHidden),
    };
  }

  function submitForm(ev) {
    ev.preventDefault();
    if (!SCRIPT_URL || !SCRIPT_URL.trim()) {
      showStatus('Define SCRIPT_URL en app.js con la URL del Web App.', 'error');
      return;
    }
    var payload = buildPayload();
    if (!payload.fecha) {
      showStatus('Selecciona una fecha en el calendario.', 'error');
      return;
    }

    el.btn.disabled = true;
    showStatus('Guardando…', 'info');

    fetch(SCRIPT_URL.replace(/\?$/, ''), {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (r) {
        if (r.body && r.body.ok) {
          showStatus('Registro guardado en la hoja.', 'success');
          recordsState.loaded = false;
          el.form.reset();
          clearSelectedDate();
          if (el.balance) el.balance.textContent = '0';
          syncCalendarViewFromSelected();
          renderCalendar();
          applyConceptRules();
          return fetchMeta();
        }
        var msg = (r.body && r.body.error) || 'Error al guardar';
        throw new Error(msg);
      })
      .catch(function (err) {
        console.error(err);
        showStatus(err.message || 'Error de red o del servidor', 'error');
      })
      .then(function () {
        el.btn.disabled = false;
      });
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }

  function initRegistrationForm() {
    if (!el.form) return;

    wireMoneyInput(el.ingresos);
    wireMoneyInput(el.salidas);
    updateBalancePreview();

    wireDatePicker();
    cacheFieldContainers();

    el.form.addEventListener('submit', submitForm);
    var concepto = $('concepto');
    if (concepto) {
      concepto.addEventListener('input', applyConceptRules);
      concepto.addEventListener('change', applyConceptRules);
    }
    applyConceptRules();

    fetchMeta();
  }

  function initRecordsTable() {
    if (!el.tableRefresh) return;

    el.tableRefresh.addEventListener('click', function () {
      fetchRecords();
    });

    if (el.tableHead) {
      el.tableHead.addEventListener(
        'input',
        debounce(function (ev) {
          var input = ev.target.closest('.table-filter-input');
          if (!input) return;
          var index = parseInt(input.dataset.filterIndex, 10);
          if (isNaN(index)) return;
          recordsState.columnFilters[index] = input.value;
          renderTableBody();
        }, DEBOUNCE_MS)
      );
    }

    if (el.tableBody) {
      el.tableBody.addEventListener('click', function (ev) {
        var cell = ev.target.closest('td[data-field]');
        if (cell) startCellEdit(cell);
      });

      el.tableBody.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter') return;
        var cell = ev.target.closest('td[data-field]');
        if (!cell || cell.querySelector('.table-edit-control')) return;
        ev.preventDefault();
        startCellEdit(cell);
      });
    }
  }

  function initFinancialSummary() {
    if (!el.financeRefresh) return;

    el.financeRefresh.addEventListener('click', function () {
      recordsState.loaded = false;
      loadFinancialSummary();
    });

    if (el.financeKpis) {
      el.financeKpis.addEventListener('click', function (ev) {
        var card = ev.target.closest('.finance-kpi-action');
        if (!card) return;
        showFinancialDetail(card.dataset.detailType);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    el.form = $('registro-form');
    el.status = $('status-banner');
    el.btn = $('btn-enviar');
    el.fecha = $('fecha');
    el.fechaDisplay = $('fecha_display');
    el.fechaPicker = $('fecha_picker');
    el.fechaToggle = $('fecha_toggle');
    el.fechaCalendar = $('fecha_calendar');
    el.fechaGrid = $('fecha_grid');
    el.fechaMonthLabel = $('fecha_month_label');
    el.fechaPrev = $('fecha_prev');
    el.fechaNext = $('fecha_next');
    el.mesPreview = $('mes_anio_preview');
    el.ingresos = $('ingresos');
    el.salidas = $('salidas');
    el.balance = $('balance');
    el.tableStatus = $('table-status');
    el.tableCount = $('table-count');
    el.tableHead = $('records-table-head');
    el.tableBody = $('records-table-body');
    el.tableFoot = $('records-table-foot');
    el.tableRefresh = $('table-refresh');
    el.financeStatus = $('finance-status');
    el.financeRefresh = $('finance-refresh');
    el.financeKpis = $('finance-kpis');
    el.financeMonthBody = $('finance-month-body');
    el.financeDetail = $('finance-detail');
    el.financeDetailTitle = $('finance-detail-title');
    el.financeDetailBody = $('finance-detail-body');

    wireNavigation();
    initRegistrationForm();
    initRecordsTable();
    initFinancialSummary();
  });
})();
