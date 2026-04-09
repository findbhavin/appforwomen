// SymptomTracker.jsx
// Full symptom logger with every classified category.
// Toggled via window.toggleSymptomTracker() from any page.
// All data saved to localStorage.symptomsData — shared across dashboard & wellness.

function SymptomTracker() {
  const { useState, useEffect, useRef } = React;

  const todayStr = () => new Date().toISOString().split('T')[0];

  const [isOpen,      setIsOpen]      = useState(false);
  const [date,        setDate]        = useState(todayStr());
  const [selections,  setSelections]  = useState({});   // { catId: Set of labels }
  const [water,       setWater]       = useState(0);     // glasses (each 0.25 L, target 9)
  const [weight,      setWeight]      = useState('');
  const [editWeight,  setEditWeight]  = useState(false);
  const [note,        setNote]        = useState('');
  const [openCats,    setOpenCats]    = useState({});    // accordion state
  const [showLog,     setShowLog]     = useState(false);
  const [recentLogs,  setRecentLogs]  = useState([]);
  const weightRef = useRef(null);

  // Expose toggle globally (wellness/index may call before mount — see pending flag in HTML)
  useEffect(() => {
    const toggle = () => setIsOpen((p) => !p);
    window._symptomTrackerToggleImpl = toggle;
    window.toggleSymptomTracker = toggle;
    if (window._symptomTrackerOpenPending) {
      setIsOpen(true);
      window._symptomTrackerOpenPending = false;
    }
    return () => {
      delete window.toggleSymptomTracker;
      delete window._symptomTrackerToggleImpl;
    };
  }, []);

  // Auto-focus weight input when entering edit mode
  useEffect(() => {
    if (editWeight && weightRef.current) weightRef.current.focus();
  }, [editWeight]);

  // ── category data ─────────────────────────────────────────────────────────
  const CATS = [
    {
      id: 'mood', label: 'Mood', icon: '😊',
      opts: [
        ['😌','Calm'], ['😊','Happy'], ['🤩','Energetic'], ['😏','Frisky'],
        ['😐','Mood swings'], ['😤','Irritated'], ['😔','Sad'], ['😰','Anxious'],
        ['😢','Depressed'], ['😔','Feeling guilty'], ['🌀','Obsessive thoughts'],
        ['😑','Low energy'], ['😶','Apathetic'], ['😕','Confused'], ['😞','Very self-critical'],
      ],
    },
    {
      id: 'symptoms', label: 'Symptoms', icon: '🩺',
      opts: [
        ['👍','Everything is fine'], ['🔴','Cramps'], ['🔴','Tender breasts'],
        ['🤕','Headache'], ['⚫','Acne'], ['😩','Backache'], ['💤','Fatigue'],
        ['😋','Cravings'], ['😴','Insomnia'], ['🔴','Abdominal pain'],
        ['🔴','Vaginal itching'], ['💧','Vaginal dryness'],
      ],
    },
    {
      id: 'sex', label: 'Sex & sex drive', icon: '❤️',
      opts: [
        ['🚫',"Didn't have sex"], ['🛡️','Protected sex'], ['🔓','Unprotected sex'],
        ['💋','Oral sex'], ['🍑','Anal sex'], ['✋','Masturbation'],
        ['🤗','Sensual touch'], ['🎯','Sex toys'], ['💫','Orgasm'],
        ['❤️','High sex drive'], ['💗','Neutral sex drive'], ['🩶','Low sex drive'],
      ],
    },
    {
      id: 'flow', label: 'Menstrual flow', icon: '🩸',
      opts: [
        ['💧','Light'], ['💧💧','Medium'], ['💧💧💧','Heavy'], ['🩸','Blood clots'],
      ],
    },
    {
      id: 'discharge', label: 'Vaginal discharge', icon: '💧',
      opts: [
        ['🚫','No discharge'], ['💧','Creamy'], ['💦','Watery'], ['💧','Sticky'],
        ['🥚','Egg white'], ['🔴','Spotting'], ['⚠️','Unusual'],
        ['🤍','Clumpy white'], ['🩶','Gray'],
      ],
    },
    {
      id: 'digestion', label: 'Digestion & stool', icon: '🤢',
      opts: [
        ['🤢','Nausea'], ['💨','Bloating'], ['🚫','Constipation'], ['💩','Diarrhea'],
      ],
    },
    {
      id: 'activity', label: 'Physical activity', icon: '🏃',
      opts: [
        ['🚫',"Didn't exercise"], ['🧘','Yoga'], ['💪','Gym'],
        ['🎵','Aerobics & dancing'], ['🏊','Swimming'], ['⚽','Team sports'],
        ['🏃','Running'], ['🚴','Cycling'], ['🚶','Walking'],
      ],
    },
    {
      id: 'pregnancy', label: 'Pregnancy test', icon: '🧪',
      opts: [
        ['🚫',"Didn't take tests"], ['✅','Positive'], ['❌','Negative'], ['➖','Faint line'],
      ],
    },
    {
      id: 'ovulation', label: 'Ovulation test', icon: '📍',
      opts: [
        ['🚫',"Didn't take tests"], ['✅','Test: positive'],
        ['➖','Test: negative'], ['📍','Ovulation: my method'],
      ],
    },
    {
      id: 'oc', label: 'Oral contraceptives (OC)', icon: '💊',
      opts: [
        ['✅','Taken on time'], ['⏪',"Yesterday's pill"],
      ],
    },
    {
      id: 'other_pills', label: 'Other pills (non-OC)', icon: '💊',
      opts: [
        ['➕','Add pill'], ['⏰','Set up reminders'],
      ],
    },
    {
      id: 'other', label: 'Other', icon: '🌟',
      opts: [
        ['✈️','Travel'], ['⚡','Stress'], ['🧘','Meditation'], ['📓','Journaling'],
        ['💪','Kegel exercises'], ['🫁','Breathing exercises'],
        ['🤒','Disease or injury'], ['🍷','Alcohol'],
      ],
    },
  ];

  // ── state helpers ─────────────────────────────────────────────────────────
  const isSelected = (catId, label) => !!(selections[catId] && selections[catId].has(label));

  function toggleChip(catId, label) {
    setSelections(prev => {
      const set = new Set(prev[catId] || []);
      set.has(label) ? set.delete(label) : set.add(label);
      return { ...prev, [catId]: set };
    });
  }

  function toggleCat(id) {
    setOpenCats(p => ({ ...p, [id]: !p[id] }));
  }

  // Count selected items across all categories
  const totalSelected = Object.values(selections).reduce((n, s) => n + (s ? s.size : 0), 0);

  // ── load / save (symptoms.html uses legacy { symptoms, water, weight }; tracker uses trackerData) ──
  function legacyFlatSymptomsToSets(flat) {
    const rebuilt = {};
    if (!flat || typeof flat !== 'object') return rebuilt;
    Object.entries(flat).forEach(([catId, items]) => {
      if (!Array.isArray(items)) return;
      const set = new Set();
      items.forEach((item) => {
        const label = item && (typeof item === 'string' ? item : item.label);
        if (label) set.add(label);
      });
      if (set.size) rebuilt[catId] = set;
    });
    return rebuilt;
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('symptomsData') || '{}');
      const log = stored[date];
      if (!log || typeof log !== 'object') {
        setSelections({});
        setWater(0);
        setWeight('');
        setNote('');
        return;
      }
      if (log.trackerData) {
        const rebuilt = {};
        Object.entries(log.trackerData.selections || {}).forEach(([k, v]) => {
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
    } catch (_) {
      setSelections({});
      setWater(0);
      setWeight('');
      setNote('');
    }
  }, [date]);

  function handleSave() {
    // Serialise Sets to arrays for JSON storage
    const serialisedSelections = {};
    Object.entries(selections).forEach(([k, v]) => {
      if (v && v.size > 0) serialisedSelections[k] = [...v];
    });

    // Build flat symptom array for backwards-compat with symptoms.js
    const flatSymptoms = {};
    Object.entries(selections).forEach(([catId, set]) => {
      if (!set || set.size === 0) return;
      flatSymptoms[catId] = [...set].map(l => ({
        value: l.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label: l,
      }));
    });

    try {
      const stored = JSON.parse(localStorage.getItem('symptomsData') || '{}');
      stored[date] = {
        ...stored[date],
        date,
        symptoms: flatSymptoms,          // legacy format (symptoms.html compatible)
        trackerData: {                    // rich format (SymptomTracker)
          selections: serialisedSelections,
          water,
          weight,
          note,
        },
        timestamp: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('symptomsData', JSON.stringify(stored));
    } catch (_) {}

    // Save weight to userData too
    if (weight) {
      try {
        const ud = JSON.parse(localStorage.getItem('userData') || '{}');
        ud.weight = weight;
        localStorage.setItem('userData', JSON.stringify(ud));
      } catch (_) {}
    }

    setIsOpen(false);
    setShowLog(false);

    const toast = document.createElement('div');
    toast.textContent = '✅ Symptoms saved!';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      background: '#CF7486', color: '#fff',
      padding: '12px 24px', borderRadius: '12px',
      fontSize: '14px', fontWeight: '600',
      zIndex: '9999', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function loadRecentLogs() {
    try {
      const stored = JSON.parse(localStorage.getItem('symptomsData') || '{}');
      setRecentLogs(
        Object.entries(stored)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 7)
      );
    } catch (_) { setRecentLogs([]); }
    setShowLog(true);
  }

  // ── style helpers ─────────────────────────────────────────────────────────
  const chip = (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 13px', borderRadius: '20px', fontSize: '13px',
    border: `2px solid ${active ? '#CF7486' : '#F8BBD0'}`,
    background: active ? '#CF7486' : '#fff',
    color: active ? '#fff' : '#2D2D2D',
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  });

  const sectionHead = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #F8BBD0',
    userSelect: 'none',
  };

  if (!isOpen) return null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#fff', borderRadius: '20px', padding: '0',
      marginTop: '20px', boxShadow: '0 8px 28px rgba(207,116,134,0.18)',
      border: '1px solid #F8BBD0', overflow: 'hidden',
    }}>

      {/* ── sticky header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #CF7486, #F8BBD0)',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>🌸 Log Symptoms</h3>
          {totalSelected > 0 && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <button onClick={() => setIsOpen(false)} style={{
          background: 'rgba(255,255,255,0.25)', border: 'none',
          borderRadius: '50%', width: '32px', height: '32px',
          fontSize: '18px', cursor: 'pointer', color: '#fff', lineHeight: 1,
        }}>×</button>
      </div>

      {/* ── scrollable body ── */}
      <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>

        {/* Date */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#CF7486', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
          <input type="date" value={date}
            max={todayStr()}
            onChange={e => setDate(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #F8BBD0',
              fontSize: '14px', width: '100%', fontFamily: 'inherit', outline: 'none',
              background: '#FFF8F0',
            }} />
        </div>

        {/* ── chip categories (accordion) ── */}
        {CATS.map(cat => {
          const catCount = selections[cat.id] ? selections[cat.id].size : 0;
          const expanded = !!openCats[cat.id];
          return (
            <div key={cat.id} style={{ marginBottom: '4px' }}>
              <div style={sectionHead} onClick={() => toggleCat(cat.id)}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{cat.icon}</span>
                  {cat.label}
                  {catCount > 0 && (
                    <span style={{
                      background: '#CF7486', color: '#fff',
                      borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: '700',
                    }}>{catCount}</span>
                  )}
                </span>
                <span style={{ color: '#CF7486', fontSize: '18px', lineHeight: 1, fontWeight: '300' }}>
                  {expanded ? '−' : '+'}
                </span>
              </div>
              {expanded && (
                <div style={{ padding: '12px 0 8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cat.opts.map(([emoji, label]) => (
                    <button key={label}
                      onClick={() => toggleChip(cat.id, label)}
                      style={chip(isSelected(cat.id, label))}>
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Water tracker ── */}
        <div style={{ marginBottom: '4px' }}>
          <div style={sectionHead} onClick={() => toggleCat('__water')}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💧 Water intake
              {water > 0 && (
                <span style={{ background: '#6C9BD1', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: '700' }}>
                  {(water * 0.25).toFixed(2)} L
                </span>
              )}
            </span>
            <span style={{ color: '#CF7486', fontSize: '18px', fontWeight: '300' }}>{openCats['__water'] ? '−' : '+'}</span>
          </div>
          {openCats['__water'] && (
            <div style={{ padding: '12px 0 8px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                Target: 2.25 L (9 glasses × 0.25 L each)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => setWater(w => Math.max(0, w - 1))} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '2px solid #F8BBD0', background: '#fff',
                  fontSize: '20px', cursor: 'pointer', fontWeight: '300',
                }}>−</button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {Array.from({ length: 9 }, (_, i) => (
                      <span key={i} onClick={() => setWater(i + 1)}
                        style={{
                          fontSize: '20px', cursor: 'pointer', opacity: i < water ? 1 : 0.25,
                          transition: 'opacity 0.15s',
                        }}>💧</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                    {water} / 9 glasses — {(water * 0.25).toFixed(2)} / 2.25 L
                  </div>
                </div>
                <button onClick={() => setWater(w => Math.min(9, w + 1))} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '2px solid #CF7486', background: '#CF7486',
                  fontSize: '20px', cursor: 'pointer', color: '#fff', fontWeight: '300',
                }}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Weight ── */}
        <div style={{ marginBottom: '4px' }}>
          <div style={sectionHead} onClick={() => toggleCat('__weight')}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚖️ Weight
              {weight && <span style={{ background: '#B19CD9', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: '700' }}>{weight} kg</span>}
            </span>
            <span style={{ color: '#CF7486', fontSize: '18px', fontWeight: '300' }}>{openCats['__weight'] ? '−' : '+'}</span>
          </div>
          {openCats['__weight'] && (
            <div style={{ padding: '12px 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {editWeight ? (
                <>
                  <input ref={weightRef} type="number" min="20" max="300" step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    onBlur={() => setEditWeight(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditWeight(false)}
                    style={{
                      width: '90px', padding: '8px 12px', borderRadius: '10px',
                      border: '2px solid #CF7486', fontSize: '15px', fontFamily: 'inherit', outline: 'none',
                    }} />
                  <span style={{ fontSize: '14px', color: '#666' }}>kg</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>Enter to save</span>
                </>
              ) : (
                <button onClick={() => setEditWeight(true)} style={{
                  padding: '8px 20px', borderRadius: '20px',
                  border: '2px solid #F8BBD0', background: '#FFF8F0',
                  fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                  color: weight ? '#2D2D2D' : '#aaa',
                }}>
                  {weight ? `${weight} kg ✏️` : '+ Log weight'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        <div style={{ marginTop: '14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#CF7486', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Any additional notes..."
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '12px',
              border: '1.5px solid #F8BBD0', fontSize: '14px',
              minHeight: '72px', resize: 'vertical', fontFamily: 'inherit',
              outline: 'none', lineHeight: 1.5, background: '#FFF8F0',
            }} />
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <button onClick={handleSave} style={{
            flex: 1, minWidth: '120px',
            background: 'linear-gradient(135deg, #CF7486, #e08090)',
            color: '#fff', border: 'none',
            padding: '14px', borderRadius: '30px',
            fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(207,116,134,0.35)',
          }}>
            Save
          </button>
          <button onClick={showLog ? () => setShowLog(false) : loadRecentLogs} style={{
            padding: '14px 18px', borderRadius: '30px',
            border: '2px solid #F8BBD0', background: '#fff',
            fontSize: '14px', cursor: 'pointer', fontWeight: '500',
            fontFamily: 'inherit',
          }}>
            {showLog ? 'Hide log' : 'Show previous log'}
          </button>
        </div>

        {/* ── Recent log ── */}
        {showLog && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #F8BBD0', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#2D2D2D' }}>Last 7 Days</h4>
            {recentLogs.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>No logs yet. Start tracking today!</p>
            ) : recentLogs.map(([logDate, log]) => {
              const td = log.trackerData;
              const allLabels = td
                ? Object.values(td.selections || {}).flatMap(a => Array.isArray(a) ? a : [])
                : [];
              const oldLabels = !td && log.symptoms
                ? Object.values(log.symptoms).flatMap(arr => (arr || []).map(s => s.label || s))
                : [];
              const labels = allLabels.length ? allLabels : oldLabels;
              return (
                <div key={logDate} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#2D2D2D' }}>{logDate}</span>
                    {td && td.water > 0 && <span style={{ fontSize: '11px', color: '#6C9BD1' }}>💧 {(td.water * 0.25).toFixed(2)}L</span>}
                    {td && td.weight && <span style={{ fontSize: '11px', color: '#B19CD9' }}>⚖️ {td.weight}kg</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {labels.length
                      ? labels.slice(0, 5).join(' · ') + (labels.length > 5 ? ` +${labels.length - 5} more` : '')
                      : 'No items logged'}
                  </div>
                  {td && td.note && <div style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic', marginTop: '2px' }}>"{td.note}"</div>}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

(function() {
  const el = document.getElementById('symptom-tracker-root');
  if (el && window.ReactDOM && !el.dataset.rm) {
    el.dataset.rm = '1';
    ReactDOM.createRoot(el).render(React.createElement(SymptomTracker));
  }
})();
