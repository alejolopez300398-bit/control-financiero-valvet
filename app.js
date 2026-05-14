(function () {
  'use strict';

  /**
   * Pega aquí la URL del despliegue “Web app” (termina en /exec).
   * POR QUÉ: la URL no es secreto del todo, pero conviene no versionar la producción en repos públicos sin control de acceso en GAS.
   */
  var SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbztu6T1TZFVi00rfgdQNQRPSVz5Nmg7YRFD0ka5cbnqVapdjJbC5cdndHFx4CYaIAPo/exec';

  var DEBOUNCE_MS = 320;
  var metaCache = null;

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
  };

  var calendarState = {
    viewYear: 0,
    viewMonth: 0,
    selectedIso: '',
  };

  function $(id) {
    return document.getElementById(id);
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
    fillDatalist('list-laboratorio_profesional', data.laboratorio_profesional);
    fillDatalist('list-pago_tercero', data.pago_tercero);
    fillDatalist('list-pago_a_valvet', data.pago_a_valvet);
    fillDatalist('list-paciente', data.pacientes);
    fillDatalist('list-tutor', data.tutores);
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
    return {
      fecha: el.fecha ? el.fecha.value : '',
      concepto: $('concepto').value.trim(),
      paciente: $('paciente').value.trim(),
      tutor: $('tutor').value.trim(),
      tipo_examen: $('tipo_examen').value.trim(),
      observacion: $('observacion').value.trim(),
      laboratorio_profesional: $('laboratorio_profesional').value.trim(),
      pago_tercero: $('pago_tercero').value.trim(),
      pago_a_valvet: $('pago_a_valvet').value.trim(),
      ingresos: getMoneyNumber(el.ingresos),
      salidas: getMoneyNumber(el.salidas),
      factura_electronica: $('factura_electronica').value.trim(),
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

    if (el.form) el.form.addEventListener('submit', submitForm);

    fetchMeta();
  });
})();
