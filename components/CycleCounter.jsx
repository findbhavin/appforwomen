// CycleCounter.jsx
// Live "Today" panel – replaces the static Today section in the right sidebar.
// Refreshes cycle info every minute automatically.

function CycleCounter() {
  const { useState, useEffect } = React;
  const [info, setInfo] = useState(null);

  // ── helpers ──────────────────────────────────────────────────────────────
  function computeCycleInfo() {
    try {
      const d           = JSON.parse(localStorage.getItem('userData') || '{}');
      const lastPeriod  = d.lastPeriod   ? new Date(d.lastPeriod)     : new Date(2026, 0, 1);
      const cycleLength = parseInt(d.cycleLength)  || 28;
      const periodLen   = parseInt(d.periodLength) || 5;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const msDiff     = now - lastPeriod;
      const daysDiff   = Math.floor(msDiff / 86400000);
      const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
      const cycleDay   = dayInCycle + 1;
      const ovDay      = Math.max(cycleLength - 14, periodLen + 1);

      let phase, phaseColor, productivity, tip;
      if (dayInCycle < periodLen) {
        phase = 'Menstrual'; phaseColor = '#FF6B9D'; productivity = 40;
        tip = 'Rest and hydrate. Light yoga can help ease cramps.';
      } else if (dayInCycle < ovDay - 3) {
        phase = 'Follicular'; phaseColor = '#FFD93D'; productivity = 78;
        tip = 'Energy is rising! Great time to start new projects.';
      } else if (dayInCycle <= ovDay + 1) {
        phase = 'Ovulation'; phaseColor = '#4ECDC4'; productivity = 95;
        tip = 'Peak energy and communication. Make bold moves today!';
      } else {
        phase = 'Luteal'; phaseColor = '#B19CD9'; productivity = 58;
        tip = 'Wind down and prioritise self-care and reflection.';
      }

      // Next period date
      const cycleStartMs   = lastPeriod.getTime() + (daysDiff - dayInCycle) * 86400000;
      const nextPeriodMs   = cycleStartMs + cycleLength * 86400000;
      const nextPeriod     = new Date(nextPeriodMs);
      const daysUntilNext  = Math.max(0, Math.ceil((nextPeriod - now) / 86400000));
      const progressPct    = Math.round((dayInCycle / cycleLength) * 100);

      return { cycleDay, cycleLength, phase, phaseColor, productivity, tip, daysUntilNext, nextPeriod, progressPct };
    } catch (_) {
      return {
        cycleDay: 1, cycleLength: 28, phase: 'Follicular', phaseColor: '#FFD93D',
        productivity: 78, tip: '', daysUntilNext: 28,
        nextPeriod: new Date(), progressPct: 4,
      };
    }
  }

  useEffect(() => {
    setInfo(computeCycleInfo());
    const timer = setInterval(() => setInfo(computeCycleInfo()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!info) return null;

  const { cycleDay, cycleLength, phase, phaseColor, productivity, tip, daysUntilNext, nextPeriod, progressPct } = info;

  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const dotColors = { green: '#4ECDC4', red: '#FF6B9D', yellow: '#FFD93D', teal: '#6BCF7F' };
  const Dot = ({ c }) => (
    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColors[c], flexShrink: 0, display: 'inline-block' }} />
  );
  const InfoRow = ({ dot, label, value, valueColor }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>
      <Dot c={dot} />
      <span style={{ flex: 1, color: '#2D2D2D' }}>{label}</span>
      <span style={{ fontWeight: '600', color: valueColor || '#2D2D2D' }}>{value}</span>
    </div>
  );

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D2D2D', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📅 Today
      </h3>

      <InfoRow dot="green"  label="Cycle Day"   value={`Day ${cycleDay}`} />
      <InfoRow dot="red"    label="Cycle Phase"  value={phase}       valueColor={phaseColor} />
      <InfoRow dot="yellow" label="Productivity" value={`${productivity}%`} />
      <InfoRow dot="teal"   label="Next Period"  value={fmtDate(nextPeriod)} />

      {/* Animated progress bar */}
      <div style={{ marginTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
          <span>Day {cycleDay} of {cycleLength}</span>
          <span>{daysUntilNext}d until next period</span>
        </div>
        <div style={{ height: '8px', borderRadius: '10px', background: '#f0f0f0', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: `linear-gradient(to right, #FF6B9D, ${phaseColor})`,
            borderRadius: '10px',
            transition: 'width 1s ease-out',
          }} />
        </div>
      </div>

      {/* Phase tip */}
      <div style={{
        marginTop: '14px', padding: '12px 14px',
        background: '#FFF0F5', borderRadius: '12px',
        fontSize: '13px', color: '#666', fontStyle: 'italic', lineHeight: 1.5,
      }}>
        💡 {tip}
      </div>
    </div>
  );
}

(function() {
  const el = document.getElementById('today-root');
  if (el && window.ReactDOM && !el.dataset.rm) {
    el.dataset.rm = '1';
    ReactDOM.createRoot(el).render(React.createElement(CycleCounter));
  }
})();
