/**
 * Eraya dashboard React bundle — NO JSX, NO Babel.
 * Loads with a normal <script> so calendar & tracker work on file:// and http://
 */
(function (global) {
  'use strict';

  var React = global.React;
  var ReactDOM = global.ReactDOM;
  if (!React || !ReactDOM) {
    console.error('[Eraya] React or ReactDOM missing — load UMD builds before eraya-react-dashboard.js');
    return;
  }

  function el(type, props) {
    var args = [type, props || null];
    for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
    return React.createElement.apply(React, args);
  }

  function flatMap(arr, fn) {
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var r = fn(arr[i], i);
      if (Array.isArray(r)) for (var j = 0; j < r.length; j++) out.push(r[j]);
      else out.push(r);
    }
    return out;
  }

  // ── CalendarComponent ─────────────────────────────────────────────────────
  function CalendarComponent() {
    var useState = React.useState;
    var today = new Date();
    var _cur = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    var currentDate = _cur[0];
    var setCurrentDate = _cur[1];
    var _sel = useState({ y: today.getFullYear(), m: today.getMonth(), d: today.getDate() });
    var selectedYmd = _sel[0];
    var setSelectedYmd = _sel[1];
    var _ph = useState(null);
    var phaseInfo = _ph[0];
    var setPhaseInfo = _ph[1];

    function getCycleData() {
      try {
        var d = JSON.parse(localStorage.getItem('userData') || '{}');
        return {
          lastPeriod: d.lastPeriod ? new Date(d.lastPeriod) : new Date(2026, 0, 1),
          cycleLength: parseInt(d.cycleLength, 10) || 28,
          periodLength: parseInt(d.periodLength, 10) || 5,
        };
      } catch (e) {
        return { lastPeriod: new Date(2026, 0, 1), cycleLength: 28, periodLength: 5 };
      }
    }

    function getDayType(year, month, day) {
      var cd = getCycleData();
      var lastPeriod = cd.lastPeriod;
      var cycleLength = cd.cycleLength;
      var periodLength = cd.periodLength;
      var date = new Date(year, month, day);
      var msDiff = date - lastPeriod;
      var daysDiff = Math.floor(msDiff / 86400000);
      var dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
      var ovDay = Math.max(cycleLength - 14, periodLength + 1);
      if (dayInCycle < periodLength) return 'period';
      if (dayInCycle === ovDay) return 'ovulation';
      if (dayInCycle >= ovDay - 3 && dayInCycle <= ovDay + 1) return 'fertile';
      return null;
    }

    function getPhaseName(dayInCycle, cycleLength, periodLength) {
      var ovDay = Math.max(cycleLength - 14, periodLength + 1);
      if (dayInCycle < periodLength) return { name: 'Menstrual', color: '#FF6B9D' };
      if (dayInCycle < ovDay - 3) return { name: 'Follicular', color: '#FFD93D' };
      if (dayInCycle >= ovDay - 3 && dayInCycle <= ovDay + 1) return { name: 'Fertile / Ovulation', color: '#4ECDC4' };
      return { name: 'Luteal', color: '#B19CD9' };
    }

    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();
    var monthName = currentDate.toLocaleString('default', { month: 'long' });
    var firstDow = new Date(year, month, 1).getDay();
    var adjustedStart = firstDow === 0 ? 6 : firstDow - 1;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrev = new Date(year, month, 0).getDate();

    var cells = [];
    var i;
    for (i = adjustedStart - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, kind: 'other' });
    for (i = 1; i <= daysInMonth; i++) cells.push({ day: i, kind: getDayType(year, month, i) || 'current' });
    var need = cells.length <= 35 ? 35 - cells.length : 42 - cells.length;
    for (i = 1; i <= need; i++) cells.push({ day: i, kind: 'other' });

    var TYPE_COLORS = {
      period: { bg: '#FF6B9D', fg: '#fff' },
      ovulation: { bg: '#4ECDC4', fg: '#fff' },
      fertile: { bg: '#FFD93D', fg: '#2D2D2D' },
    };

    function isToday(d) {
      return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    }

    function cellStyle(cell, isSelected) {
      var base = {
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: cell.kind !== 'other' ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        fontWeight: isSelected ? '700' : '400',
        color: cell.kind === 'other' ? '#ccc' : '#2D2D2D',
      };
      if (cell.kind === 'other') return base;
      if (isSelected) return Object.assign({}, base, { backgroundColor: '#CF7486', color: '#fff', fontWeight: '700' });
      if (TYPE_COLORS[cell.kind]) {
        return Object.assign({}, base, { backgroundColor: TYPE_COLORS[cell.kind].bg, color: TYPE_COLORS[cell.kind].fg });
      }
      if (isToday(cell.day)) return Object.assign({}, base, { outline: '2px solid #CF7486', outlineOffset: '1px', fontWeight: '600' });
      return base;
    }

    function todayOutline(cell, isSelected) {
      if (!isSelected && isToday(cell.day) && cell.kind !== 'other') return { outline: '2px solid #CF7486', outlineOffset: '1px' };
      return {};
    }

    function handleDayClick(day) {
      setSelectedYmd({ y: year, m: month, d: day });
      var cd = getCycleData();
      var clicked = new Date(year, month, day);
      var msDiff = clicked - cd.lastPeriod;
      var daysDiff = Math.floor(msDiff / 86400000);
      var dayInCycle = ((daysDiff % cd.cycleLength) + cd.cycleLength) % cd.cycleLength;
      var phase = getPhaseName(dayInCycle, cd.cycleLength, cd.periodLength);
      setPhaseInfo(Object.assign({ cycleDay: dayInCycle + 1 }, phase));
    }

    function goToToday() {
      var t = new Date();
      var ty = t.getFullYear();
      var tm = t.getMonth();
      var td = t.getDate();
      setCurrentDate(new Date(ty, tm, 1));
      setSelectedYmd({ y: ty, m: tm, d: td });
      var cd = getCycleData();
      var clicked = new Date(ty, tm, td);
      var msDiff = clicked - cd.lastPeriod;
      var daysDiff = Math.floor(msDiff / 86400000);
      var dayInCycle = ((daysDiff % cd.cycleLength) + cd.cycleLength) % cd.cycleLength;
      var phase = getPhaseName(dayInCycle, cd.cycleLength, cd.periodLength);
      setPhaseInfo(Object.assign({ cycleDay: dayInCycle + 1 }, phase));
    }

    function navBtn(label, aria, onClick) {
      return el(
        'button',
        {
          type: 'button',
          'aria-label': aria,
          onClick: onClick,
          style: {
            background: 'rgba(255,255,255,0.35)',
            border: '1px solid rgba(255,255,255,0.65)',
            borderRadius: '10px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: '1',
            color: '#fff',
            fontWeight: '600',
          },
        },
        label
      );
    }

    var weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var dayCells = cells.map(function (cell, idx) {
      var inCurrent = cell.kind !== 'other';
      var isSelected =
        inCurrent && cell.day === selectedYmd.d && month === selectedYmd.m && year === selectedYmd.y;
      var st = Object.assign({}, cellStyle(cell, isSelected), todayOutline(cell, isSelected));
      return el(
        'div',
        {
          key: idx,
          className: cell.kind === 'other' ? 'eraya-cal-day eraya-cal-day--muted' : 'eraya-cal-day',
          style: st,
          onClick: function () {
            if (cell.kind !== 'other') handleDayClick(cell.day);
          },
          role: cell.kind === 'other' ? undefined : 'button',
          tabIndex: cell.kind === 'other' ? undefined : -1,
        },
        cell.day
      );
    });

    return el(
      'div',
      { className: 'eraya-react-calendar' },
      el(
        'div',
        { className: 'eraya-cal-header' },
        el(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' } },
          el('h3', null, monthName + ' ' + year),
          el(
            'div',
            { style: { display: 'flex', gap: '6px' } },
            navBtn('‹', 'Previous month', function () {
              setCurrentDate(new Date(year, month - 1, 1));
              setPhaseInfo(null);
            }),
            navBtn('›', 'Next month', function () {
              setCurrentDate(new Date(year, month + 1, 1));
              setPhaseInfo(null);
            })
          )
        )
      ),
      el(
        'div',
        { className: 'eraya-cal-body' },
        el(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
              marginBottom: '10px',
            },
          },
          weekdays.map(function (d, i) {
            return el(
              'div',
              {
                key: i,
                style: {
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#888',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                },
              },
              d
            );
          })
        ),
        el(
          'div',
          { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' } },
          dayCells
        ),
        el(
          'button',
          { type: 'button', className: 'eraya-cal-today-btn', onClick: goToToday },
          '📍 Jump to today'
        ),
        phaseInfo
          ? el(
              'div',
              {
                style: {
                  marginTop: '14px',
                  padding: '12px 14px',
                  background: 'var(--milky-white, #FFF8F0)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  border: '1px solid rgba(248, 187, 208, 0.5)',
                },
              },
              el('strong', null, 'Cycle day ' + phaseInfo.cycleDay),
              ' — ',
              el('span', { style: { color: phaseInfo.color, fontWeight: '600' } }, phaseInfo.name)
            )
          : null,
        el(
          'div',
          {
            style: {
              marginTop: '14px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              fontSize: '11px',
              color: '#555',
            },
          },
          [
            { color: '#FF6B9D', label: 'Period' },
            { color: '#FFD93D', label: 'Fertile' },
            { color: '#4ECDC4', label: 'Ovulation' },
          ].map(function (item) {
            return el(
              'span',
              {
                key: item.label,
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid #f0e0e5',
                },
              },
              el('span', {
                style: {
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: item.color,
                  display: 'inline-block',
                  flexShrink: 0,
                },
              }),
              item.label
            );
          })
        )
      )
    );
  }

  // ── CycleCounter ────────────────────────────────────────────────────────────
  function CycleCounter() {
    var useState = React.useState;
    var useEffect = React.useEffect;
    var _i = useState(null);
    var info = _i[0];
    var setInfo = _i[1];

    function computeCycleInfo() {
      try {
        var d = JSON.parse(localStorage.getItem('userData') || '{}');
        var lastPeriod = d.lastPeriod ? new Date(d.lastPeriod) : new Date(2026, 0, 1);
        var cycleLength = parseInt(d.cycleLength, 10) || 28;
        var periodLen = parseInt(d.periodLength, 10) || 5;
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        var msDiff = now - lastPeriod;
        var daysDiff = Math.floor(msDiff / 86400000);
        var dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
        var cycleDay = dayInCycle + 1;
        var ovDay = Math.max(cycleLength - 14, periodLen + 1);
        var phase,
          phaseColor,
          productivity,
          tip;
        if (dayInCycle < periodLen) {
          phase = 'Menstrual';
          phaseColor = '#FF6B9D';
          productivity = 40;
          tip = 'Rest and hydrate. Light yoga can help ease cramps.';
        } else if (dayInCycle < ovDay - 3) {
          phase = 'Follicular';
          phaseColor = '#FFD93D';
          productivity = 78;
          tip = 'Energy is rising! Great time to start new projects.';
        } else if (dayInCycle <= ovDay + 1) {
          phase = 'Ovulation';
          phaseColor = '#4ECDC4';
          productivity = 95;
          tip = 'Peak energy and communication. Make bold moves today!';
        } else {
          phase = 'Luteal';
          phaseColor = '#B19CD9';
          productivity = 58;
          tip = 'Wind down and prioritise self-care and reflection.';
        }
        var cycleStartMs = lastPeriod.getTime() + (daysDiff - dayInCycle) * 86400000;
        var nextPeriodMs = cycleStartMs + cycleLength * 86400000;
        var nextPeriod = new Date(nextPeriodMs);
        var daysUntilNext = Math.max(0, Math.ceil((nextPeriod - now) / 86400000));
        var progressPct = Math.round((dayInCycle / cycleLength) * 100);
        return {
          cycleDay: cycleDay,
          cycleLength: cycleLength,
          phase: phase,
          phaseColor: phaseColor,
          productivity: productivity,
          tip: tip,
          daysUntilNext: daysUntilNext,
          nextPeriod: nextPeriod,
          progressPct: progressPct,
        };
      } catch (e) {
        return {
          cycleDay: 1,
          cycleLength: 28,
          phase: 'Follicular',
          phaseColor: '#FFD93D',
          productivity: 78,
          tip: '',
          daysUntilNext: 28,
          nextPeriod: new Date(),
          progressPct: 4,
        };
      }
    }

    useEffect(function () {
      setInfo(computeCycleInfo());
      var timer = setInterval(function () {
        setInfo(computeCycleInfo());
      }, 60000);
      return function () {
        clearInterval(timer);
      };
    }, []);

    if (!info) return null;

    var dotColors = { green: '#4ECDC4', red: '#FF6B9D', yellow: '#FFD93D', teal: '#6BCF7F' };
    function Dot(p) {
      return el('span', {
        style: {
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: dotColors[p.c],
          flexShrink: 0,
          display: 'inline-block',
        },
      });
    }
    function InfoRow(p) {
      return el(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 0',
            fontSize: '14px',
            borderBottom: '1px solid #f5f5f5',
          },
        },
        el(Dot, { c: p.dot }),
        el('span', { style: { flex: 1, color: '#2D2D2D' } }, p.label),
        el('span', { style: { fontWeight: '600', color: p.valueColor || '#2D2D2D' } }, p.value)
      );
    }

    function fmtDate(d) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    return el(
      'div',
      null,
      el(
        'h3',
        {
          style: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#2D2D2D',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          },
        },
        '📅 Today'
      ),
      el(InfoRow, { dot: 'green', label: 'Cycle Day', value: 'Day ' + info.cycleDay }),
      el(InfoRow, { dot: 'red', label: 'Cycle Phase', value: info.phase, valueColor: info.phaseColor }),
      el(InfoRow, { dot: 'yellow', label: 'Productivity', value: info.productivity + '%' }),
      el(InfoRow, { dot: 'teal', label: 'Next Period', value: fmtDate(info.nextPeriod) }),
      el(
        'div',
        { style: { marginTop: '18px' } },
        el(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#888',
              marginBottom: '6px',
            },
          },
          el('span', null, 'Day ' + info.cycleDay + ' of ' + info.cycleLength),
          el('span', null, info.daysUntilNext + 'd until next period')
        ),
        el(
          'div',
          { style: { height: '8px', borderRadius: '10px', background: '#f0f0f0', overflow: 'hidden' } },
          el('div', {
            style: {
              height: '100%',
              width: info.progressPct + '%',
              background: 'linear-gradient(to right, #FF6B9D, ' + info.phaseColor + ')',
              borderRadius: '10px',
              transition: 'width 1s ease-out',
            },
          })
        )
      ),
      el(
        'div',
        {
          style: {
            marginTop: '14px',
            padding: '12px 14px',
            background: '#FFF0F5',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#666',
            fontStyle: 'italic',
            lineHeight: 1.5,
          },
        },
        '💡 ' + info.tip
      )
    );
  }

  // ── HistorySection ─────────────────────────────────────────────────────────
  function HistorySection() {
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;

    var _a = useState('5 days');
    var avgPeriod = _a[0];
    var setAvgPeriod = _a[1];
    var _b = useState('28 days');
    var avgCycle = _b[0];
    var setAvgCycle = _b[1];
    var _w = useState('60');
    var weight = _w[0];
    var setWeight = _w[1];
    var _e = useState(false);
    var editing = _e[0];
    var setEditing = _e[1];
    var _t = useState('60');
    var tempWt = _t[0];
    var setTempWt = _t[1];
    var inputRef = useRef(null);

    useEffect(function () {
      try {
        var d = JSON.parse(localStorage.getItem('userData') || '{}');
        if (d.periodLength) setAvgPeriod(d.periodLength + ' days');
        if (d.cycleLength) setAvgCycle(d.cycleLength + ' days');
        if (d.weight) {
          setWeight(String(d.weight));
          setTempWt(String(d.weight));
        }
      } catch (e) {}
    }, []);

    useEffect(
      function () {
        if (editing && inputRef.current) inputRef.current.focus();
      },
      [editing]
    );

    function startEdit() {
      setTempWt(weight.replace(/[^0-9.]/g, ''));
      setEditing(true);
    }

    function commitEdit() {
      var val = tempWt.trim().replace(/[^0-9.]/g, '');
      if (val && !isNaN(parseFloat(val))) {
        setWeight(val);
        try {
          var d = JSON.parse(localStorage.getItem('userData') || '{}');
          d.weight = val;
          localStorage.setItem('userData', JSON.stringify(d));
        } catch (e) {}
      }
      setEditing(false);
    }

    function handleKeyDown(e) {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') {
        setTempWt(weight);
        setEditing(false);
      }
    }

    var DOT = { teal: '#6BCF7F', purple: '#B19CD9', blue: '#6C9BD1' };
    function DotH(p) {
      return el('span', {
        style: {
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: DOT[p.c],
          flexShrink: 0,
          display: 'inline-block',
        },
      });
    }

    return el(
      'div',
      null,
      el(
        'h3',
        {
          style: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#2D2D2D',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          },
        },
        '📊 History'
      ),
      el(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 0',
            fontSize: '14px',
            borderBottom: '1px solid #f5f5f5',
          },
        },
        el(DotH, { c: 'teal' }),
        el('span', { style: { flex: 1, color: '#2D2D2D' } }, 'Average period'),
        el('span', { style: { fontWeight: '600', color: '#2D2D2D' } }, avgPeriod)
      ),
      el(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 0',
            fontSize: '14px',
            borderBottom: '1px solid #f5f5f5',
          },
        },
        el(DotH, { c: 'purple' }),
        el('span', { style: { flex: 1, color: '#2D2D2D' } }, 'Average cycle'),
        el('span', { style: { fontWeight: '600', color: '#2D2D2D' } }, avgCycle)
      ),
      el(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 0',
            fontSize: '14px',
          },
        },
        el(DotH, { c: 'blue' }),
        el('span', { style: { flex: 1, color: '#2D2D2D' } }, 'Weight'),
        editing
          ? el(
              'span',
              { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
              el('input', {
                ref: inputRef,
                type: 'text',
                value: tempWt,
                onChange: function (e) {
                  setTempWt(e.target.value);
                },
                onBlur: commitEdit,
                onKeyDown: handleKeyDown,
                style: {
                  width: '52px',
                  padding: '3px 7px',
                  borderRadius: '7px',
                  border: '1.5px solid #CF7486',
                  fontSize: '13px',
                  textAlign: 'right',
                  fontFamily: 'inherit',
                  outline: 'none',
                },
              }),
              el('span', { style: { fontSize: '13px', color: '#666' } }, 'kg')
            )
          : el(
              'span',
              {
                title: 'Click to edit weight',
                onClick: startEdit,
                style: {
                  fontWeight: '600',
                  color: '#2D2D2D',
                  cursor: 'pointer',
                  borderBottom: '1.5px dashed #CF7486',
                  paddingBottom: '1px',
                  userSelect: 'none',
                },
              },
              weight + ' kg ✏️'
            )
      ),
      editing
        ? el(
            'div',
            { style: { fontSize: '11px', color: '#999', marginTop: '4px', paddingLeft: '22px' } },
            'Press Enter to save · Esc to cancel'
          )
        : null
    );
  }

  // ── SymptomTracker (data + UI) ────────────────────────────────────────────
  var SYMPTOM_CATS = [
    {
      id: 'mood',
      label: 'Mood',
      icon: '😊',
      opts: [
        ['😌', 'Calm'],
        ['😊', 'Happy'],
        ['🤩', 'Energetic'],
        ['😏', 'Frisky'],
        ['😐', 'Mood swings'],
        ['😤', 'Irritated'],
        ['😔', 'Sad'],
        ['😰', 'Anxious'],
        ['😢', 'Depressed'],
        ['😔', 'Feeling guilty'],
        ['🌀', 'Obsessive thoughts'],
        ['😑', 'Low energy'],
        ['😶', 'Apathetic'],
        ['😕', 'Confused'],
        ['😞', 'Very self-critical'],
      ],
    },
    {
      id: 'symptoms',
      label: 'Symptoms',
      icon: '🩺',
      opts: [
        ['👍', 'Everything is fine'],
        ['🔴', 'Cramps'],
        ['🔴', 'Tender breasts'],
        ['🤕', 'Headache'],
        ['⚫', 'Acne'],
        ['😩', 'Backache'],
        ['💤', 'Fatigue'],
        ['😋', 'Cravings'],
        ['😴', 'Insomnia'],
        ['🔴', 'Abdominal pain'],
        ['🔴', 'Vaginal itching'],
        ['💧', 'Vaginal dryness'],
      ],
    },
    {
      id: 'sex',
      label: 'Sex & sex drive',
      icon: '❤️',
      opts: [
        ['🚫', "Didn't have sex"],
        ['🛡️', 'Protected sex'],
        ['🔓', 'Unprotected sex'],
        ['💋', 'Oral sex'],
        ['🍑', 'Anal sex'],
        ['✋', 'Masturbation'],
        ['🤗', 'Sensual touch'],
        ['🎯', 'Sex toys'],
        ['💫', 'Orgasm'],
        ['❤️', 'High sex drive'],
        ['💗', 'Neutral sex drive'],
        ['🩶', 'Low sex drive'],
      ],
    },
    {
      id: 'flow',
      label: 'Menstrual flow',
      icon: '🩸',
      opts: [
        ['💧', 'Light'],
        ['💧💧', 'Medium'],
        ['💧💧💧', 'Heavy'],
        ['🩸', 'Blood clots'],
      ],
    },
    {
      id: 'discharge',
      label: 'Vaginal discharge',
      icon: '💧',
      opts: [
        ['🚫', 'No discharge'],
        ['💧', 'Creamy'],
        ['💦', 'Watery'],
        ['💧', 'Sticky'],
        ['🥚', 'Egg white'],
        ['🔴', 'Spotting'],
        ['⚠️', 'Unusual'],
        ['🤍', 'Clumpy white'],
        ['🩶', 'Gray'],
      ],
    },
    {
      id: 'digestion',
      label: 'Digestion & stool',
      icon: '🤢',
      opts: [
        ['🤢', 'Nausea'],
        ['💨', 'Bloating'],
        ['🚫', 'Constipation'],
        ['💩', 'Diarrhea'],
      ],
    },
    {
      id: 'activity',
      label: 'Physical activity',
      icon: '🏃',
      opts: [
        ['🚫', "Didn't exercise"],
        ['🧘', 'Yoga'],
        ['💪', 'Gym'],
        ['🎵', 'Aerobics & dancing'],
        ['🏊', 'Swimming'],
        ['⚽', 'Team sports'],
        ['🏃', 'Running'],
        ['🚴', 'Cycling'],
        ['🚶', 'Walking'],
      ],
    },
    {
      id: 'pregnancy',
      label: 'Pregnancy test',
      icon: '🧪',
      opts: [
        ['🚫', "Didn't take tests"],
        ['✅', 'Positive'],
        ['❌', 'Negative'],
        ['➖', 'Faint line'],
      ],
    },
    {
      id: 'ovulation',
      label: 'Ovulation test',
      icon: '📍',
      opts: [
        ['🚫', "Didn't take tests"],
        ['✅', 'Test: positive'],
        ['➖', 'Test: negative'],
        ['📍', 'Ovulation: my method'],
      ],
    },
    {
      id: 'oc',
      label: 'Oral contraceptives (OC)',
      icon: '💊',
      opts: [
        ['✅', 'Taken on time'],
        ['⏪', "Yesterday's pill"],
      ],
    },
    {
      id: 'other_pills',
      label: 'Other pills (non-OC)',
      icon: '💊',
      opts: [
        ['➕', 'Add pill'],
        ['⏰', 'Set up reminders'],
      ],
    },
    {
      id: 'other',
      label: 'Other',
      icon: '🌟',
      opts: [
        ['✈️', 'Travel'],
        ['⚡', 'Stress'],
        ['🧘', 'Meditation'],
        ['📓', 'Journaling'],
        ['💪', 'Kegel exercises'],
        ['🫁', 'Breathing exercises'],
        ['🤒', 'Disease or injury'],
        ['🍷', 'Alcohol'],
      ],
    },
  ];

  function SymptomTracker() {
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;

    function todayStr() {
      return new Date().toISOString().split('T')[0];
    }

    var _o = useState(false);
    var isOpen = _o[0];
    var setIsOpen = _o[1];
    var _d = useState(todayStr());
    var date = _d[0];
    var setDate = _d[1];
    var _s = useState({});
    var selections = _s[0];
    var setSelections = _s[1];
    var _w = useState(0);
    var water = _w[0];
    var setWater = _w[1];
    var _wt = useState('');
    var weight = _wt[0];
    var setWeight = _wt[1];
    var _ew = useState(false);
    var editWeight = _ew[0];
    var setEditWeight = _ew[1];
    var _n = useState('');
    var note = _n[0];
    var setNote = _n[1];
    var _oc = useState({});
    var openCats = _oc[0];
    var setOpenCats = _oc[1];
    var _sl = useState(false);
    var showLog = _sl[0];
    var setShowLog = _sl[1];
    var _rl = useState([]);
    var recentLogs = _rl[0];
    var setRecentLogs = _rl[1];
    var weightRef = useRef(null);

    useEffect(function () {
      var toggle = function () {
        return setIsOpen(function (p) {
          return !p;
        });
      };
      global._symptomTrackerToggleImpl = toggle;
      global.toggleSymptomTracker = toggle;
      if (global._symptomTrackerOpenPending) {
        setIsOpen(true);
        global._symptomTrackerOpenPending = false;
      }
      return function () {
        delete global.toggleSymptomTracker;
        delete global._symptomTrackerToggleImpl;
      };
    }, []);

    useEffect(
      function () {
        if (editWeight && weightRef.current) weightRef.current.focus();
      },
      [editWeight]
    );

    function isSel(catId, label) {
      return !!(selections[catId] && selections[catId].has(label));
    }

    function toggleChip(catId, label) {
      setSelections(function (prev) {
        var set = new Set(prev[catId] || []);
        if (set.has(label)) set.delete(label);
        else set.add(label);
        var next = Object.assign({}, prev);
        next[catId] = set;
        return next;
      });
    }

    function toggleCat(id) {
      setOpenCats(function (p) {
        var n = Object.assign({}, p);
        n[id] = !p[id];
        return n;
      });
    }

    var totalSelected = Object.keys(selections).reduce(function (n, k) {
      var s = selections[k];
      return n + (s ? s.size : 0);
    }, 0);

    function legacyFlatSymptomsToSets(flat) {
      var rebuilt = {};
      if (!flat || typeof flat !== 'object') return rebuilt;
      Object.keys(flat).forEach(function (catId) {
        var items = flat[catId];
        if (!Array.isArray(items)) return;
        var set = new Set();
        items.forEach(function (item) {
          var label = item && (typeof item === 'string' ? item : item.label);
          if (label) set.add(label);
        });
        if (set.size) rebuilt[catId] = set;
      });
      return rebuilt;
    }

    useEffect(
      function () {
        try {
          var stored = JSON.parse(localStorage.getItem('symptomsData') || '{}');
          var log = stored[date];
          if (!log || typeof log !== 'object') {
            setSelections({});
            setWater(0);
            setWeight('');
            setNote('');
            return;
          }
          if (log.trackerData) {
            var rebuilt = {};
            Object.keys(log.trackerData.selections || {}).forEach(function (k) {
              var v = log.trackerData.selections[k];
              rebuilt[k] = new Set(Array.isArray(v) ? v : []);
            });
            setSelections(rebuilt);
            setWater(typeof log.trackerData.water === 'number' ? log.trackerData.water : 0);
            setWeight(log.trackerData.weight != null && log.trackerData.weight !== '' ? String(log.trackerData.weight) : '');
            setNote(log.trackerData.note || '');
          } else if (log.symptoms) {
            setSelections(legacyFlatSymptomsToSets(log.symptoms));
            setWater(typeof log.water === 'number' ? log.water : 0);
            setWeight(log.weight != null && log.weight !== '' ? String(log.weight) : '');
            setNote('');
          } else {
            setSelections({});
            setWater(0);
            setWeight('');
            setNote('');
          }
        } catch (e) {
          setSelections({});
          setWater(0);
          setWeight('');
          setNote('');
        }
      },
      [date]
    );

    function handleSave() {
      var serialisedSelections = {};
      Object.keys(selections).forEach(function (k) {
        var v = selections[k];
        if (v && v.size > 0) serialisedSelections[k] = Array.from(v);
      });
      var flatSymptoms = {};
      Object.keys(selections).forEach(function (catId) {
        var set = selections[catId];
        if (!set || set.size === 0) return;
        flatSymptoms[catId] = Array.from(set).map(function (l) {
          return { value: l.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: l };
        });
      });
      try {
        var stored = JSON.parse(localStorage.getItem('symptomsData') || '{}');
        stored[date] = Object.assign({}, stored[date], {
          date: date,
          symptoms: flatSymptoms,
          trackerData: {
            selections: serialisedSelections,
            water: water,
            weight: weight,
            note: note,
          },
          timestamp: new Date().toISOString(),
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem('symptomsData', JSON.stringify(stored));
      } catch (e) {}
      if (weight) {
        try {
          var ud = JSON.parse(localStorage.getItem('userData') || '{}');
          ud.weight = weight;
          localStorage.setItem('userData', JSON.stringify(ud));
        } catch (e) {}
      }
      setIsOpen(false);
      setShowLog(false);
      var toast = document.createElement('div');
      toast.textContent = '✅ Symptoms saved!';
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: '#CF7486',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
      });
      document.body.appendChild(toast);
      setTimeout(function () {
        toast.remove();
      }, 2500);
    }

    function loadRecentLogs() {
      try {
        var stored = JSON.parse(localStorage.getItem('symptomsData') || '{}');
        var entries = Object.keys(stored).map(function (k) {
          return [k, stored[k]];
        });
        entries.sort(function (a, b) {
          return b[0].localeCompare(a[0]);
        });
        setRecentLogs(entries.slice(0, 7));
      } catch (e) {
        setRecentLogs([]);
      }
      setShowLog(true);
    }

    function chipStyle(active) {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 13px',
        borderRadius: '20px',
        fontSize: '13px',
        border: '2px solid ' + (active ? '#CF7486' : '#F8BBD0'),
        background: active ? '#CF7486' : '#fff',
        color: active ? '#fff' : '#2D2D2D',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      };
    }

    var sectionHead = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      cursor: 'pointer',
      borderBottom: '1px solid #F8BBD0',
      userSelect: 'none',
    };

    if (!isOpen) return null;

    var catBlocks = SYMPTOM_CATS.map(function (cat) {
      var catCount = selections[cat.id] ? selections[cat.id].size : 0;
      var expanded = !!openCats[cat.id];
      return el(
        'div',
        { key: cat.id, style: { marginBottom: '4px' } },
        el(
          'div',
          { style: sectionHead, onClick: function () { toggleCat(cat.id); } },
          el(
            'span',
            {
              style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#2D2D2D',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              },
            },
            el('span', null, cat.icon),
            cat.label,
            catCount > 0
              ? el(
                  'span',
                  {
                    style: {
                      background: '#CF7486',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                    },
                  },
                  String(catCount)
                )
              : null
          ),
          el('span', { style: { color: '#CF7486', fontSize: '18px', lineHeight: 1, fontWeight: '300' } }, expanded ? '−' : '+')
        ),
        expanded
          ? el(
              'div',
              { style: { padding: '12px 0 8px', display: 'flex', flexWrap: 'wrap', gap: '8px' } },
              cat.opts.map(function (pair) {
                var emoji = pair[0];
                var lbl = pair[1];
                return el(
                  'button',
                  {
                    key: lbl,
                    type: 'button',
                    onClick: function () {
                      toggleChip(cat.id, lbl);
                    },
                    style: chipStyle(isSel(cat.id, lbl)),
                  },
                  el('span', null, emoji),
                  el('span', null, lbl)
                );
              })
            )
          : null
      );
    });

    var waterRow = el(
      'div',
      { style: { marginBottom: '4px' } },
      el(
        'div',
        { style: sectionHead, onClick: function () { toggleCat('__water'); } },
        el(
          'span',
          {
            style: {
              fontSize: '14px',
              fontWeight: '600',
              color: '#2D2D2D',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
          },
          '💧 Water intake',
          water > 0
            ? el(
                'span',
                {
                  style: {
                    background: '#6C9BD1',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                  },
                },
                (water * 0.25).toFixed(2) + ' L'
              )
            : null
        ),
        el('span', { style: { color: '#CF7486', fontSize: '18px', fontWeight: '300' } }, openCats['__water'] ? '−' : '+')
      ),
      openCats['__water']
        ? el(
            'div',
            { style: { padding: '12px 0 8px' } },
            el(
              'div',
              { style: { fontSize: '12px', color: '#888', marginBottom: '10px' } },
              'Target: 2.25 L (9 glasses × 0.25 L each)'
            ),
            el(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
              el(
                'button',
                {
                  type: 'button',
                  onClick: function () {
                    setWater(function (w) {
                      return Math.max(0, w - 1);
                    });
                  },
                  style: {
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid #F8BBD0',
                    background: '#fff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    fontWeight: '300',
                  },
                },
                '−'
              ),
              el(
                'div',
                { style: { flex: 1 } },
                el(
                  'div',
                  { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
                  Array.from({ length: 9 }, function (_, i) {
                    return el(
                      'span',
                      {
                        key: i,
                        onClick: function () {
                          setWater(i + 1);
                        },
                        style: {
                          fontSize: '20px',
                          cursor: 'pointer',
                          opacity: i < water ? 1 : 0.25,
                          transition: 'opacity 0.15s',
                        },
                      },
                      '💧'
                    );
                  })
                ),
                el(
                  'div',
                  { style: { fontSize: '13px', color: '#666', marginTop: '6px' } },
                  water + ' / 9 glasses — ' + (water * 0.25).toFixed(2) + ' / 2.25 L'
                )
              ),
              el(
                'button',
                {
                  type: 'button',
                  onClick: function () {
                    setWater(function (w) {
                      return Math.min(9, w + 1);
                    });
                  },
                  style: {
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid #CF7486',
                    background: '#CF7486',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontWeight: '300',
                  },
                },
                '+'
              )
            )
          )
        : null
    );

    var weightBlock = el(
      'div',
      { style: { marginBottom: '4px' } },
      el(
        'div',
        { style: sectionHead, onClick: function () { toggleCat('__weight'); } },
        el(
          'span',
          {
            style: {
              fontSize: '14px',
              fontWeight: '600',
              color: '#2D2D2D',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
          },
          '⚖️ Weight',
          weight
            ? el(
                'span',
                {
                  style: {
                    background: '#B19CD9',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                  },
                },
                weight + ' kg'
              )
            : null
        ),
        el('span', { style: { color: '#CF7486', fontSize: '18px', fontWeight: '300' } }, openCats['__weight'] ? '−' : '+')
      ),
      openCats['__weight']
        ? el(
            'div',
            { style: { padding: '12px 0 8px', display: 'flex', alignItems: 'center', gap: '12px' } },
            editWeight
              ? el(
                  React.Fragment,
                  null,
                  el('input', {
                    ref: weightRef,
                    type: 'number',
                    min: 20,
                    max: 300,
                    step: 0.1,
                    value: weight,
                    onChange: function (e) {
                      setWeight(e.target.value);
                    },
                    onBlur: function () {
                      setEditWeight(false);
                    },
                    onKeyDown: function (e) {
                      if (e.key === 'Enter') setEditWeight(false);
                    },
                    style: {
                      width: '90px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '2px solid #CF7486',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    },
                  }),
                  el('span', { style: { fontSize: '14px', color: '#666' } }, 'kg'),
                  el('span', { style: { fontSize: '12px', color: '#999' } }, 'Enter to save')
                )
              : el(
                  'button',
                  {
                    type: 'button',
                    onClick: function () {
                      setEditWeight(true);
                    },
                    style: {
                      padding: '8px 20px',
                      borderRadius: '20px',
                      border: '2px solid #F8BBD0',
                      background: '#FFF8F0',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      color: weight ? '#2D2D2D' : '#aaa',
                    },
                  },
                  weight ? weight + ' kg ✏️' : '+ Log weight'
                )
          )
        : null
    );

    var logSection =
      showLog &&
      el(
        'div',
        { style: { marginTop: '20px', borderTop: '1px solid #F8BBD0', paddingTop: '16px' } },
        el('h4', { style: { fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#2D2D2D' } }, 'Last 7 Days'),
        recentLogs.length === 0
          ? el('p', { style: { color: '#999', fontSize: '14px' } }, 'No logs yet. Start tracking today!')
          : recentLogs.map(function (pair) {
              var logDate = pair[0];
              var log = pair[1];
              var td = log.trackerData;
              var allLabels = td
                ? flatMap(Object.keys(td.selections || {}), function (k) {
                    var a = td.selections[k];
                    return Array.isArray(a) ? a : [];
                  })
                : [];
              var oldLabels = [];
              if (!td && log.symptoms) {
                Object.keys(log.symptoms).forEach(function (k) {
                  var arr = log.symptoms[k] || [];
                  arr.forEach(function (s) {
                    oldLabels.push(s.label || s);
                  });
                });
              }
              var labels = allLabels.length ? allLabels : oldLabels;
              return el(
                'div',
                { key: logDate, style: { padding: '10px 0', borderBottom: '1px solid #f5f5f5' } },
                el(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' } },
                  el('span', { style: { fontWeight: '700', fontSize: '13px', color: '#2D2D2D' } }, logDate),
                  td && td.water > 0
                    ? el('span', { style: { fontSize: '11px', color: '#6C9BD1' } }, '💧 ' + (td.water * 0.25).toFixed(2) + 'L')
                    : null,
                  td && td.weight
                    ? el('span', { style: { fontSize: '11px', color: '#B19CD9' } }, '⚖️ ' + td.weight + 'kg')
                    : null
                ),
                el(
                  'div',
                  { style: { fontSize: '12px', color: '#666' } },
                  labels.length
                    ? labels.slice(0, 5).join(' · ') + (labels.length > 5 ? ' +' + (labels.length - 5) + ' more' : '')
                    : 'No items logged'
                ),
                td && td.note
                  ? el(
                      'div',
                      { style: { fontSize: '11px', color: '#aaa', fontStyle: 'italic', marginTop: '2px' } },
                      '"' + td.note + '"'
                    )
                  : null
              );
            })
      );

    return el(
      'div',
      {
        style: {
          background: '#fff',
          borderRadius: '20px',
          padding: '0',
          marginTop: '20px',
          boxShadow: '0 8px 28px rgba(207,116,134,0.18)',
          border: '1px solid #F8BBD0',
          overflow: 'hidden',
        },
      },
      el(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #CF7486, #F8BBD0)',
          },
        },
        el(
          'div',
          null,
          el('h3', { style: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' } }, '🌸 Log Symptoms'),
          totalSelected > 0
            ? el(
                'span',
                { style: { fontSize: '12px', color: 'rgba(255,255,255,0.85)' } },
                totalSelected + ' item' + (totalSelected !== 1 ? 's' : '') + ' selected'
              )
            : null
        ),
        el(
          'button',
          {
            type: 'button',
            onClick: function () {
              setIsOpen(false);
            },
            style: {
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#fff',
              lineHeight: 1,
            },
          },
          '×'
        )
      ),
      el(
        'div',
        { style: { padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' } },
        el(
          'div',
          { style: { marginBottom: '18px' } },
          el(
            'div',
            {
              style: {
                fontSize: '12px',
                fontWeight: '700',
                color: '#CF7486',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            },
            'Date'
          ),
          el('input', {
            type: 'date',
            value: date,
            max: todayStr(),
            onChange: function (e) {
              setDate(e.target.value);
            },
            style: {
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid #F8BBD0',
              fontSize: '14px',
              width: '100%',
              fontFamily: 'inherit',
              outline: 'none',
              background: '#FFF8F0',
            },
          })
        ),
        catBlocks,
        waterRow,
        weightBlock,
        el(
          'div',
          { style: { marginTop: '14px', marginBottom: '18px' } },
          el(
            'div',
            {
              style: {
                fontSize: '12px',
                fontWeight: '700',
                color: '#CF7486',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            },
            'Notes'
          ),
          el('textarea', {
            value: note,
            onChange: function (e) {
              setNote(e.target.value);
            },
            placeholder: 'Any additional notes...',
            style: {
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1.5px solid #F8BBD0',
              fontSize: '14px',
              minHeight: '72px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              lineHeight: 1.5,
              background: '#FFF8F0',
            },
          })
        ),
        el(
          'div',
          { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' } },
          el(
            'button',
            {
              type: 'button',
              onClick: handleSave,
              style: {
                flex: 1,
                minWidth: '120px',
                background: 'linear-gradient(135deg, #CF7486, #e08090)',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '30px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(207,116,134,0.35)',
              },
            },
            'Save'
          ),
          el(
            'button',
            {
              type: 'button',
              onClick: function () {
                if (showLog) setShowLog(false);
                else loadRecentLogs();
              },
              style: {
                padding: '14px 18px',
                borderRadius: '30px',
                border: '2px solid #F8BBD0',
                background: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                fontFamily: 'inherit',
              },
            },
            showLog ? 'Hide log' : 'Show previous log'
          )
        ),
        logSection
      )
    );
  }

  // ── Mount helper ──────────────────────────────────────────────────────────
  function mountErayaReactRoots() {
    function tryRoot(id, Comp) {
      var node = document.getElementById(id);
      if (!node || node.getAttribute('data-rm')) return;
      node.setAttribute('data-rm', '1');
      var root = ReactDOM.createRoot(node);
      root.render(el(Comp));
    }
    tryRoot('calendar-root', CalendarComponent);
    tryRoot('today-root', CycleCounter);
    tryRoot('history-root', HistorySection);
    tryRoot('symptom-tracker-root', SymptomTracker);
  }

  global.ErayaReact = {
    mount: mountErayaReactRoots,
    CalendarComponent: CalendarComponent,
    CycleCounter: CycleCounter,
    HistorySection: HistorySection,
    SymptomTracker: SymptomTracker,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountErayaReactRoots);
  } else {
    mountErayaReactRoots();
  }
})(typeof window !== 'undefined' ? window : this);
