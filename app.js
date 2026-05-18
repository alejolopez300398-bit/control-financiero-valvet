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
  };

  var calendarState = {
    viewYear: 0,
    viewMonth: 0,
    selectedIso: '',
  };

  function $(id) {
    return document.getElementById(id);
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

    wireMoneyInput(el.ingresos);
    wireMoneyInput(el.salidas);
    updateBalancePreview();

    wireDatePicker();
    cacheFieldContainers();

    if (el.form) el.form.addEventListener('submit', submitForm);
    var concepto = $('concepto');
    if (concepto) {
      concepto.addEventListener('input', applyConceptRules);
      concepto.addEventListener('change', applyConceptRules);
    }
    applyConceptRules();

    fetchMeta();
  });
})();
