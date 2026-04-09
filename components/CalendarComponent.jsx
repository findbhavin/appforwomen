// CalendarComponent.jsx — reference implementation (JSX).
// Dashboard + Wellness load the runtime from /js/eraya-react-dashboard.js (plain React.createElement, no Babel fetch).
// Update that file when changing behaviour, or keep using this file with a JSX build step.
// Self-mount below is skipped if #calendar-root already has data-rm (bundle mounted first).

function CalendarComponent() {
  const { useState } = React;

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedYmd, setSelectedYmd] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
    d: today.getDate(),
  });
  const [phaseInfo, setPhaseInfo] = useState(null);

  // ── helpers ──────────────────────────────────────────────────────────────
  function getCycleData() {
    try {
      const d = JSON.parse(localStorage.getItem('userData') || '{}');
      return {
        lastPeriod:   d.lastPeriod   ? new Date(d.lastPeriod) : new Date(2026, 0, 1),
        cycleLength:  parseInt(d.cycleLength)  || 28,
        periodLength: parseInt(d.periodLength) || 5,
      };
    } catch (_) {
      return { lastPeriod: new Date(2026, 0, 1), cycleLength: 28, periodLength: 5 };
    }
  }

  // Returns 'period' | 'ovulation' | 'fertile' | null for a given calendar date
  function getDayType(year, month, day) {
    const { lastPeriod, cycleLength, periodLength } = getCycleData();
    const date = new Date(year, month, day);
    const msDiff = date - lastPeriod;
    const daysDiff = Math.floor(msDiff / 86400000);
    // Handle days before last period by projecting backwards
    const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
    const ovDay = Math.max(cycleLength - 14, periodLength + 1);

    if (dayInCycle < periodLength) return 'period';
    if (dayInCycle === ovDay) return 'ovulation';
    if (dayInCycle >= ovDay - 3 && dayInCycle <= ovDay + 1) return 'fertile';
    return null;
  }

  function getPhaseName(dayInCycle, cycleLength, periodLength) {
    const ovDay = Math.max(cycleLength - 14, periodLength + 1);
    if (dayInCycle < periodLength)                         return { name: 'Menstrual',  color: '#FF6B9D' };
    if (dayInCycle < ovDay - 3)                            return { name: 'Follicular', color: '#FFD93D' };
    if (dayInCycle >= ovDay - 3 && dayInCycle <= ovDay + 1) return { name: 'Fertile / Ovulation', color: '#4ECDC4' };
    return { name: 'Luteal', color: '#B19CD9' };
  }

  // ── derived values ────────────────────────────────────────────────────────
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDow      = new Date(year, month, 1).getDay();          // 0=Sun
  const adjustedStart = firstDow === 0 ? 6 : firstDow - 1;         // Mon-based
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const daysInPrev    = new Date(year, month, 0).getDate();

  // Build flat cell array
  const cells = [];
  for (let i = adjustedStart - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, kind: 'other' });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, kind: getDayType(year, month, d) || 'current' });
  const need = cells.length <= 35 ? 35 - cells.length : 42 - cells.length;
  for (let d = 1; d <= need; d++)
    cells.push({ day: d, kind: 'other' });

  // ── handlers ──────────────────────────────────────────────────────────────
  function handleDayClick(day) {
    setSelectedYmd({ y: year, m: month, d: day });
    const { lastPeriod, cycleLength, periodLength } = getCycleData();
    const clicked   = new Date(year, month, day);
    const msDiff    = clicked - lastPeriod;
    const daysDiff  = Math.floor(msDiff / 86400000);
    const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
    const phase = getPhaseName(dayInCycle, cycleLength, periodLength);
    setPhaseInfo({ cycleDay: dayInCycle + 1, ...phase });
  }

  function isToday(d) {
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  }

  // ── style helpers ─────────────────────────────────────────────────────────
  const TYPE_COLORS = {
    period:    { bg: '#FF6B9D', fg: '#fff' },
    ovulation: { bg: '#4ECDC4', fg: '#fff' },
    fertile:   { bg: '#FFD93D', fg: '#2D2D2D' },
  };

  function cellStyle(cell, isSelected) {
    const base = {
      aspectRatio: '1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '8px', fontSize: '13px',
      cursor: cell.kind !== 'other' ? 'pointer' : 'default',
      transition: 'all 0.15s ease',
      fontWeight: isSelected ? '700' : '400',
      color: cell.kind === 'other' ? '#ccc' : '#2D2D2D',
    };
    if (cell.kind === 'other') return base;
    if (isSelected) return { ...base, backgroundColor: '#CF7486', color: '#fff', fontWeight: '700' };
    if (TYPE_COLORS[cell.kind]) {
      return { ...base, backgroundColor: TYPE_COLORS[cell.kind].bg, color: TYPE_COLORS[cell.kind].fg };
    }
    if (isToday(cell.day)) return { ...base, outline: '2px solid #CF7486', outlineOffset: '1px', fontWeight: '600' };
    return base;
  }

  const todayOutline = (cell, isSelected) =>
    !isSelected && isToday(cell.day) && cell.kind !== 'other'
      ? { outline: '2px solid #CF7486', outlineOffset: '1px' }
      : {};

  function goToToday() {
    const t = new Date();
    const ty = t.getFullYear();
    const tm = t.getMonth();
    const td = t.getDate();
    setCurrentDate(new Date(ty, tm, 1));
    setSelectedYmd({ y: ty, m: tm, d: td });
    const { lastPeriod, cycleLength, periodLength } = getCycleData();
    const clicked = new Date(ty, tm, td);
    const msDiff = clicked - lastPeriod;
    const daysDiff = Math.floor(msDiff / 86400000);
    const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
    const phase = getPhaseName(dayInCycle, cycleLength, periodLength);
    setPhaseInfo({ cycleDay: dayInCycle + 1, ...phase });
  }

  // ── render ────────────────────────────────────────────────────────────────
  const navBtn = (label, onClick) => (
    <button type="button" onClick={onClick} aria-label={label === '‹' ? 'Previous month' : 'Next month'} style={{
      background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.65)',
      borderRadius: '10px', padding: '4px 12px',
      cursor: 'pointer', fontSize: '18px', lineHeight: '1',
      color: '#fff', fontWeight: '600',
    }}>{label}</button>
  );

  return (
    <div className="eraya-react-calendar">
      <div className="eraya-cal-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <h3>{monthName} {year}</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {navBtn('‹', () => {
              setCurrentDate(new Date(year, month - 1, 1));
              setPhaseInfo(null);
            })}
            {navBtn('›', () => {
              setCurrentDate(new Date(year, month + 1, 1));
              setPhaseInfo(null);
            })}
          </div>
        </div>
      </div>

      <div className="eraya-cal-body">
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '10px' }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {cells.map((cell, i) => {
            const inCurrentMonth = cell.kind !== 'other';
            const isSelected = inCurrentMonth
              && cell.day === selectedYmd.d
              && month === selectedYmd.m
              && year === selectedYmd.y;
            const style = {
              ...cellStyle(cell, isSelected),
              ...todayOutline(cell, isSelected),
            };
            return (
              <div
                key={i}
                className={cell.kind === 'other' ? 'eraya-cal-day eraya-cal-day--muted' : 'eraya-cal-day'}
                style={style}
                onClick={() => cell.kind !== 'other' && handleDayClick(cell.day)}
                role={cell.kind === 'other' ? undefined : 'button'}
                tabIndex={cell.kind === 'other' ? undefined : -1}
              >
                {cell.day}
              </div>
            );
          })}
        </div>

        <button type="button" className="eraya-cal-today-btn" onClick={goToToday}>
          📍 Jump to today
        </button>

        {/* Selected day info */}
        {phaseInfo && (
          <div style={{
            marginTop: '14px', padding: '12px 14px',
            background: 'var(--milky-white, #FFF8F0)', borderRadius: '12px', fontSize: '13px',
            border: '1px solid rgba(248, 187, 208, 0.5)',
          }}>
            <strong>Cycle day {phaseInfo.cycleDay}</strong>
            {' — '}
            <span style={{ color: phaseInfo.color, fontWeight: '600' }}>{phaseInfo.name}</span>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: '#555' }}>
          {[
            { color: '#FF6B9D', label: 'Period' },
            { color: '#FFD93D', label: 'Fertile' },
            { color: '#4ECDC4', label: 'Ovulation' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: '8px', border: '1px solid #f0e0e5' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, display: 'inline-block', flexShrink: 0 }}></span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Self-mount: Babel Standalone executes this after async XHR fetch + transpile,
// so the DOM is always ready. data-rm flag prevents double-mounting by the fallback.
(function() {
  const el = document.getElementById('calendar-root');
  if (el && window.ReactDOM && !el.dataset.rm) {
    el.dataset.rm = '1';
    ReactDOM.createRoot(el).render(React.createElement(CalendarComponent));
  }
})();
