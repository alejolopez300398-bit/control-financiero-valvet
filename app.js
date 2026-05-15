(function () {
  'use strict';

  var SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzdhW-48WMlVQTqvPI6T4yIrwXZtKzgruU0ACYPvC6zNEBtrRAf_wtitFOFncMPPZdPJw/exec';

  var NA_VALUE = 'N/A';
  var CONFIG_FIELDS = [
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
  var CONCEPT_HIDDEN = {
    Consulta: ['tipo_examen', 'observacion', 'laboratorio_profesional', 'pago_tercero'],
    'Toma de examenes': [],
    Ecografia: ['tipo_examen', 'observacion'],
    Radiografia: ['tipo_examen', 'observacion'],
    Interconsulta: ['tipo_examen'],
    'Control medico': ['tipo_examen', 'observacion', 'laboratorio_profesional', 'pago_tercero'],
    'Hospitalizacion en casa': ['tipo_examen', 'observacion', 'laboratorio_profesional', 'pago_tercero'],
    Eutanasia: ['tipo_examen', 'observacion', 'laboratorio_profesional', 'pago_tercero'],
    Guarderia: ['tipo_examen', 'observacion', 'laboratorio_profesional', 'pago_tercero'],
    Inyectologia: ['tipo_examen', 'laboratorio_profesional', 'pago_tercero'],
    'Control vacuna': ['tipo_examen', 'laboratorio_profesional', 'pago_tercero'],
    'Implantación microchip': ['tipo_examen'],
    'Certificado nacional': ['tipo_examen'],
    'Certificado internacional': ['tipo_examen'],
    Procedimiento: ['tipo_examen'],
    'Compra insumos': ['paciente', 'tutor', 'tipo_examen', 'ingresos', 'factura_electronica'],
    'Compra medicamentos': ['paciente', 'tutor', 'tipo_examen', 'ingresos', 'factura_electronica'],
    'Compra equipos': ['paciente', 'tutor', 'tipo_examen', 'ingresos', 'factura_electronica'],
    Transporte: ['paciente', 'tutor', 'tipo_examen', 'ingresos', 'factura_electronica'],
    Viáticos: ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    'Gastos empresa': ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    Papelería: ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    Parafiscales: ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    'Salario doc': ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    Turnos: ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    'Préstamo Valentina': ['paciente', 'tutor', 'tipo_examen', 'factura_electronica'],
    Faja: ['tipo_examen', 'observacion'],
    Cytopoint: ['tipo_examen', 'observacion'],
  };

  var hiddenFields = {};
  var fieldContainers = {};
  var fieldsets = [];
  var calendarState = { viewYear: 0, viewMonth: 0, selectedIso: '' };
  var el = {};

  function $(id) {
    return document.getElementById(id);
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function hideListForConcept(concept) {
    var normalized = normalizeText(concept);
    var keys = Object.keys(CONCEPT_HIDDEN);
    for (var i = 0; i < keys.length; i++) {
      if (normalizeText(keys[i]) === normalized) return CONCEPT_HIDDEN[keys[i]];
    }
    return [];
  }

  function showStatus(message, variant) {
    if (!el.status) return;
    el.status.hidden = !message;
    el.status.textContent = message || '';
    el.status.dataset.variant = variant || 'info';
  }

  function fieldContainer(fieldId) {
    var node = fieldId === 'fecha' ? el.fechaPicker : $(fieldId);
    return node && node.closest ? node.closest('.field') : null;
  }

  function cacheFields() {
    for (var i = 0; i < CONFIG_FIELDS.length; i++) {
      fieldContainers[CONFIG_FIELDS[i]] = fieldContainer(CONFIG_FIELDS[i]);
    }
    fieldsets = el.form ? Array.prototype.slice.call(el.form.querySelectorAll('.fieldset')) : [];
  }

  function clearField(fieldId) {
    if (fieldId === 'fecha') return;
    var input = $(fieldId);
    if (input) input.value = '';
  }

  function isHidden(fieldId) {
    return !!hiddenFields[fieldId];
  }

  function updateFieldsets() {
    for (var i = 0; i < fieldsets.length; i++) {
      var fields = Array.prototype.slice.call(fieldsets[i].querySelectorAll('.field'));
      fieldsets[i].hidden = !fields.some(function (field) {
        return !field.hidden;
      });
    }
  }

  function applyConceptRules() {
    var hidden = hideListForConcept($('concepto') ? $('concepto').value : '');
    hiddenFields = {};
    for (var i = 0; i < hidden.length; i++) hiddenFields[hidden[i]] = true;

    for (var j = 0; j < CONFIG_FIELDS.length; j++) {
      var fieldId = CONFIG_FIELDS[j];
      var shouldHide = isHidden(fieldId);
      if (fieldContainers[fieldId]) fieldContainers[fieldId].hidden = shouldHide;
      if (shouldHide) clearField(fieldId);
    }
    updateBalancePreview();
    updateFieldsets();
  }

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
        fillDatalist('list-concepto', data.concepto);
        fillDatalist('list-tipo_examen', data.tipo_examen);
        fillDatalist('list-laboratorio_profesional', data.laboratorio_profesional);
        fillDatalist('list-pago_tercero', data.pago_tercero);
        fillDatalist('list-pago_a_valvet', data.pago_a_valvet);
        fillDatalist('list-paciente', data.pacientes);
        fillDatalist('list-tutor', data.tutores);
        showStatus('Listas cargadas desde la hoja.', 'success');
        return data;
      })
      .catch(function (err) {
        console.error(err);
        showStatus('No se pudieron cargar las listas: ' + (err.message || err), 'error');
        return null;
      });
  }

  function fillDatalist(id, values) {
    var dl = $(id);
    if (!dl) return;
    dl.textContent = '';
    var frag = document.createDocumentFragment();
    (values || []).forEach(function (value) {
      var opt = document.createElement('option');
      opt.value = value;
      frag.appendChild(opt);
    });
    dl.appendChild(frag);
  }

  function parseDigitsToInt(str) {
    if (!str || typeof str !== 'string') return 0;
    var digits = str.replace(/\D/g, '');
    var n = parseInt(digits, 10);
    return isNaN(n) ? 0 : n;
  }

  function formatCopMaskFromDigits(digitStr) {
    var n = parseDigitsToInt(digitStr);
    if (n === 0 && (!digitStr || !/\d/.test(digitStr))) return '';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function wireMoneyInput(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      input.value = formatCopMaskFromDigits(input.value.replace(/\D/g, ''));
      updateBalancePreview();
    });
    input.addEventListener('blur', updateBalancePreview);
  }

  function getMoneyNumber(input) {
    if (input && isHidden(input.id)) return 0;
    return parseDigitsToInt(input ? input.value : '');
  }

  function formatBalanceDisplay(num) {
    var n = Math.round(Number(num));
    if (isNaN(n)) n = 0;
    var sign = n < 0 ? '-' : '';
    return sign + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function updateBalancePreview() {
    if (!el.balance) return;
    el.balance.textContent = formatBalanceDisplay(getMoneyNumber(el.ingresos) - getMoneyNumber(el.salidas));
  }

  function updateMesAnioPreview() {
    if (!el.fecha || !el.mesPreview) return;
    var parts = (el.fecha.value || '').split('-');
    el.mesPreview.textContent = parts.length === 3 ? parts[1] + '/' + parts[0] : '—';
  }

  function parseIsoDateParts(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var p = iso.split('-');
    var year = parseInt(p[0], 10);
    var month = parseInt(p[1], 10);
    var day = parseInt(p[2], 10);
    var date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return { year: year, month: month, day: day, date: date };
  }

  function formatIsoDate(year, monthIndex, day) {
    return String(year) + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function formatDateDisplay(iso) {
    var parsed = parseIsoDateParts(iso);
    if (!parsed) return '';
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(parsed.date);
  }

  function setSelectedDate(iso) {
    calendarState.selectedIso = iso || '';
    if (el.fecha) el.fecha.value = iso || '';
    if (el.fechaDisplay) el.fechaDisplay.value = formatDateDisplay(iso);
    updateMesAnioPreview();
    renderCalendar();
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

  function renderCalendar() {
    if (!el.fechaGrid || !el.fechaMonthLabel) return;
    var monthDate = new Date(calendarState.viewYear, calendarState.viewMonth, 1);
    var firstDayIndex = (monthDate.getDay() + 6) % 7;
    var daysInMonth = new Date(calendarState.viewYear, calendarState.viewMonth + 1, 0).getDate();
    var prevMonthDays = new Date(calendarState.viewYear, calendarState.viewMonth, 0).getDate();
    var totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    var selected = parseIsoDateParts(calendarState.selectedIso);
    var today = new Date();

    el.fechaMonthLabel.textContent = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(monthDate);
    el.fechaGrid.textContent = '';

    for (var i = 0; i < totalCells; i++) {
      var dayNumber = i - firstDayIndex + 1;
      var cellYear = calendarState.viewYear;
      var cellMonth = calendarState.viewMonth;
      var inCurrentMonth = true;

      if (dayNumber < 1) {
        cellMonth--;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear--;
        }
        dayNumber = prevMonthDays + dayNumber;
        inCurrentMonth = false;
      } else if (dayNumber > daysInMonth) {
        dayNumber -= daysInMonth;
        cellMonth++;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear++;
        }
        inCurrentMonth = false;
      }

      var iso = formatIsoDate(cellYear, cellMonth, dayNumber);
      var cellDate = new Date(cellYear, cellMonth, dayNumber);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'date-day' + (inCurrentMonth ? '' : ' date-day-other');
      if (sameDay(cellDate, today)) btn.className += ' date-day-today';
      if (selected && sameDay(cellDate, selected.date)) btn.className += ' date-day-selected';
      btn.textContent = String(dayNumber);
      btn.dataset.iso = iso;
      btn.setAttribute('role', 'gridcell');
      btn.addEventListener('click', function (ev) {
        var parsed = parseIsoDateParts(ev.currentTarget.dataset.iso);
        if (!parsed) return;
        calendarState.viewYear = parsed.year;
        calendarState.viewMonth = parsed.month - 1;
        setSelectedDate(ev.currentTarget.dataset.iso);
        closeCalendar();
      });
      el.fechaGrid.appendChild(btn);
    }
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
    }

    el.fechaDisplay.addEventListener('click', openCalendar);
    el.fechaDisplay.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        openCalendar();
      }
    });
    if (el.fechaToggle) el.fechaToggle.addEventListener('click', function () {
      if (el.fechaCalendar.hidden) openCalendar();
      else closeCalendar();
    });
    if (el.fechaPrev) el.fechaPrev.addEventListener('click', function () {
      calendarState.viewMonth--;
      if (calendarState.viewMonth < 0) {
        calendarState.viewMonth = 11;
        calendarState.viewYear--;
      }
      renderCalendar();
    });
    if (el.fechaNext) el.fechaNext.addEventListener('click', function () {
      calendarState.viewMonth++;
      if (calendarState.viewMonth > 11) {
        calendarState.viewMonth = 0;
        calendarState.viewYear++;
      }
      renderCalendar();
    });
    document.addEventListener('click', function (ev) {
      if (!el.fechaPicker.contains(ev.target)) closeCalendar();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeCalendar();
    });
    renderCalendar();
    updateMesAnioPreview();
  }

  function textValue(fieldId) {
    if (isHidden(fieldId)) return NA_VALUE;
    var input = $(fieldId);
    return input ? input.value.trim() : '';
  }

  function moneyValue(fieldId, input) {
    return isHidden(fieldId) ? NA_VALUE : getMoneyNumber(input);
  }

  function buildPayload() {
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
      factura_electronica: textValue('factura_electronica'),
      hidden_fields: CONFIG_FIELDS.filter(isHidden),
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
          setSelectedDate('');
          if (el.balance) el.balance.textContent = '0';
          syncCalendarViewFromSelected();
          renderCalendar();
          applyConceptRules();
          return fetchMeta();
        }
        throw new Error((r.body && r.body.error) || 'Error al guardar');
      })
      .catch(function (err) {
        console.error(err);
        showStatus(err.message || 'Error de red o del servidor', 'error');
      })
      .then(function () {
        el.btn.disabled = false;
      });
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
    cacheFields();

    if (el.form) el.form.addEventListener('submit', submitForm);
    if ($('concepto')) {
      $('concepto').addEventListener('input', applyConceptRules);
      $('concepto').addEventListener('change', applyConceptRules);
    }
    applyConceptRules();
    fetchMeta();
  });
})();
