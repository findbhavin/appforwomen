// HistorySection.jsx
// Editable history panel – replaces the static History section in the right sidebar.
// Weight is click-to-edit inline; press Enter or blur to save.

function HistorySection() {
  const { useState, useEffect, useRef } = React;

  const [avgPeriod, setAvgPeriod] = useState('5 days');
  const [avgCycle,  setAvgCycle]  = useState('28 days');
  const [weight,    setWeight]    = useState('60');
  const [editing,   setEditing]   = useState(false);
  const [tempWt,    setTempWt]    = useState('60');
  const inputRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('userData') || '{}');
      if (d.periodLength) setAvgPeriod(`${d.periodLength} days`);
      if (d.cycleLength)  setAvgCycle(`${d.cycleLength} days`);
      if (d.weight) {
        setWeight(String(d.weight));
        setTempWt(String(d.weight));
      }
    } catch (_) {}
  }, []);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function startEdit() {
    setTempWt(weight.replace(/[^0-9.]/g, ''));
    setEditing(true);
  }

  function commitEdit() {
    const val = tempWt.trim().replace(/[^0-9.]/g, '');
    if (val && !isNaN(parseFloat(val))) {
      setWeight(val);
      try {
        const d = JSON.parse(localStorage.getItem('userData') || '{}');
        d.weight = val;
        localStorage.setItem('userData', JSON.stringify(d));
      } catch (_) {}
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

  // ── dot colours mirror styles.css ─────────────────────────────────────────
  const DOT = { teal: '#6BCF7F', purple: '#B19CD9', blue: '#6C9BD1' };
  const Dot = ({ c }) => (
    <span style={{
      width: 10, height: 10, borderRadius: '50%',
      backgroundColor: DOT[c], flexShrink: 0, display: 'inline-block',
    }} />
  );

  return (
    <div>
      <h3 style={{
        fontSize: '18px', fontWeight: '600', color: '#2D2D2D',
        marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        📊 History
      </h3>

      {/* Average period */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>
        <Dot c="teal" />
        <span style={{ flex: 1, color: '#2D2D2D' }}>Average period</span>
        <span style={{ fontWeight: '600', color: '#2D2D2D' }}>{avgPeriod}</span>
      </div>

      {/* Average cycle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>
        <Dot c="purple" />
        <span style={{ flex: 1, color: '#2D2D2D' }}>Average cycle</span>
        <span style={{ fontWeight: '600', color: '#2D2D2D' }}>{avgCycle}</span>
      </div>

      {/* Weight (inline-editable) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', fontSize: '14px' }}>
        <Dot c="blue" />
        <span style={{ flex: 1, color: '#2D2D2D' }}>Weight</span>

        {editing ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              ref={inputRef}
              type="text"
              value={tempWt}
              onChange={e => setTempWt(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              style={{
                width: '52px', padding: '3px 7px', borderRadius: '7px',
                border: '1.5px solid #CF7486', fontSize: '13px',
                textAlign: 'right', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <span style={{ fontSize: '13px', color: '#666' }}>kg</span>
          </span>
        ) : (
          <span
            title="Click to edit weight"
            onClick={startEdit}
            style={{
              fontWeight: '600', color: '#2D2D2D',
              cursor: 'pointer',
              borderBottom: '1.5px dashed #CF7486',
              paddingBottom: '1px',
              userSelect: 'none',
            }}
          >
            {weight} kg ✏️
          </span>
        )}
      </div>

      {editing && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', paddingLeft: '22px' }}>
          Press Enter to save · Esc to cancel
        </div>
      )}
    </div>
  );
}

(function() {
  const el = document.getElementById('history-root');
  if (el && window.ReactDOM && !el.dataset.rm) {
    el.dataset.rm = '1';
    ReactDOM.createRoot(el).render(React.createElement(HistorySection));
  }
})();
