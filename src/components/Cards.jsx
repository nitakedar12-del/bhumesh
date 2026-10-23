// // components/Cards.jsx — the two list cards.
// //
// // The Dart cards each ran their own AnimationController with a delay keyed
// // off the list index. framer-motion does the same with `custom`, and it
// // cancels cleanly when a card leaves the list — which the Future.delayed
// // version could not, hence its `if (mounted)` guard.

// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import {useNavigate} from 'react-router-dom';

// import { inr, plain, shortDate } from './HomeParts';

// const reveal = {
//   hidden: { opacity: 0, y: 18 },
//   show: (i) => ({
//     opacity: 1,
//     y: 0,
//     transition: { delay: Math.min(i, 8) * 0.06, duration: 0.36, ease: [0.16, 1, 0.3, 1] },
//   }),
// };

// export function QuotationCard({ quotation: q, index, onOpen }) {
//   const [pressed, setPressed] = useState(false);

//   return (
//     <motion.button
//       type="button"
//       className={`qcard${pressed ? ' is-pressed' : ''}`}
//       custom={index}
//       variants={reveal}
//       initial="hidden"
//       animate="show"
//       onPointerDown={() => setPressed(true)}
//       onPointerUp={() => setPressed(false)}
//       onPointerLeave={() => setPressed(false)}
//       onClick={onOpen}
//     >
//       <span className="qcard-spine" aria-hidden="true" />
//       <span className="qcard-body">
//         <span className="qcard-top">
//           <span className="qcard-glyph" aria-hidden="true">📄</span>
//           <span className="qcard-who">
//             <strong>{q.customerName}</strong>
//             <span>{q.projectName} · Plot {q.plotNumber}</span>
//           </span>
//           <span className="qcard-money">
//             <strong>{inr.format(q.finalTotalAmount)}</strong>
//             <span>{shortDate.format(q.quotationDate)}</span>
//           </span>
//         </span>
//         <span className="qcard-chips">
//           <span className="pill">{plain.format(q.plotSize)} sq ft</span>
//           <span className="pill">{inr.format(q.ratePerSqFt)}/sq ft</span>
//         </span>
//       </span>
//     </motion.button>
//   );
// }

// export function MapCard({ map, index, onOpen }) {
//   const navigate = useNavigate();
//   const [pressed, setPressed] = useState(false);
//   const [broken, setBroken] = useState(false);
// const openMap = () => {
//   navigate(`/maps/${map.id}`);
// };
//   return (
//     <motion.div
//       className={`mcard${pressed ? ' is-pressed' : ''}`}
//       custom={index}
//       variants={reveal}
//       initial="hidden"
//       animate="show"
//       onPointerDown={() => setPressed(true)}
//       onPointerUp={() => setPressed(false)}
//       onPointerLeave={() => setPressed(false)}
//     >
//       <div className="mcard-cover">
//         {broken
//           ? <div className="mcard-fallback" aria-hidden="true">🗺</div>
//           : (
//             <img
//               src="/images/prospera-brochure.jpg"
//               alt=""
//               onError={() => setBroken(true)}
//             />
//           )}
//         <span className="mcard-fade" aria-hidden="true" />
//       </div>

//       <div className="mcard-foot">
//         <div className="mcard-name">
//           <strong>{map.name || map.id}</strong>
//           {map.createdDate && (
//             <span>{shortDate.format(
//               map.createdDate?.toDate ? map.createdDate.toDate() : new Date(map.createdDate),
//             )}</span>
//           )}
//         </div>
//         <button type="button" className="mcard-open" onClick={onOpen}>
//           Open map
//         </button>
//       </div>
//     </motion.div>
//   );
// }

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LOGO_SRC from '../assets/logo.jpeg';

/* ---------------------------------------------------------------
   Formatters
------------------------------------------------------------------ */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const plain = new Intl.NumberFormat('en-IN');
const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/* Accepts Firestore Timestamp, serialized {seconds}, Date, ISO string
   or epoch ms. Returns null instead of throwing on bad input. */
const toDate = (v) => {
  if (v === null || v === undefined || v === '') return null;
  let d = v;
  if (typeof v.toDate === 'function') d = v.toDate();
  else if (typeof v === 'object' && !(v instanceof Date) && 'seconds' in v)
    d = new Date(v.seconds * 1000);
  else if (!(v instanceof Date)) d = new Date(v);
  return d instanceof Date && !isNaN(d.getTime()) ? d : null;
};

const shortDate = {
  format: (v) => {
    const d = toDate(v);
    return d ? dateFmt.format(d) : '—';
  },
};

/* Safe number helper: strings from the database won't break formatting */
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ---------------------------------------------------------------
   Motion
------------------------------------------------------------------ */
const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 8) * 0.06, duration: 0.36, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* =================================================================
   QuotationCard
================================================================= */
export function QuotationCard({ quotation: q, index, onOpen }) {
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      type="button"
      className={`qcard${pressed ? ' is-pressed' : ''}`}
      custom={index}
      variants={reveal}
      initial="hidden"
      animate="show"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={() => onOpen(q)}
    >
      <span className="qcard-spine" aria-hidden="true" />
      <span className="qcard-body">
        <span className="qcard-top">
          <span className="qcard-glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M15 3v4h4" />
              <path d="M9 13h6M9 16.5h6M9 9.5h3" />
            </svg>
          </span>
          <span className="qcard-who">
            <strong>{q.customerName}</strong>
            <span>{q.projectName} · Plot {q.plotNumber}</span>
          </span>
          <span className="qcard-money">
            <strong>{inr.format(num(q.finalTotalAmount))}</strong>
            <span>{shortDate.format(q.quotationDate)}</span>
          </span>
        </span>
        <span className="qcard-chips">
          <span className="pill">{plain.format(num(q.plotSize))} sq ft</span>
          <span className="pill">{inr.format(num(q.ratePerSqFt))}/sq ft</span>
        </span>
      </span>
    </motion.button>
  );
}

/* =================================================================
   MapCard
================================================================= */
export function MapCard({ map, index, onOpen }) {
  const [pressed, setPressed] = useState(false);
  const [broken, setBroken] = useState(false);

  const open = onOpen || (() => {});

  return (
    <motion.div
      className={`mcard${pressed ? ' is-pressed' : ''}`}
      custom={index}
      variants={reveal}
      initial="hidden"
      animate="show"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div className="mcard-cover">
        {broken ? (
          <div className="mcard-fallback" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2z" />
              <path d="M10 4v14M14 6v14" />
            </svg>
          </div>
        ) : (
          <>
            <img
              src={LOGO_SRC}
              alt="Prospera Saraswati crest"
              className="mcard-crest"
              onError={() => setBroken(true)}
            />
            <span className="mcard-corner mcard-corner--tl" aria-hidden="true" />
            <span className="mcard-corner mcard-corner--br" aria-hidden="true" />
          </>
        )}
        <span className="mcard-fade" aria-hidden="true" />
      </div>

      <div className="mcard-foot">
        <div className="mcard-name">
          <strong>{map.name || map.id}</strong>
          {map.createdDate && <span>{shortDate.format(map.createdDate)}</span>}
        </div>
        <button type="button" className="mcard-open" onClick={open}>
          Open map
        </button>
      </div>
    </motion.div>
  );
}

/* =================================================================
   Demo shell: sample data + styling for previewing the cards
================================================================= */
const sampleQuotations = [
  {
    customerName: 'Rohan Deshmukh',
    projectName: 'Prospera Saraswati',
    plotNumber: 'A-14',
    finalTotalAmount: 4850000,
    quotationDate: new Date('2026-07-18'),
    plotSize: 2400,
    ratePerSqFt: 2020,
  },
  {
    customerName: 'Ananya & Kunal Rao',
    projectName: 'Prospera Saraswati',
    plotNumber: 'C-07',
    finalTotalAmount: 6120000,
    quotationDate: new Date('2026-08-02'),
    plotSize: 3000,
    ratePerSqFt: 2040,
  },
];

const sampleMaps = [
  { id: 'layout-master', name: 'Master Layout Plan', createdDate: new Date('2026-05-11') },
  { id: 'layout-phase2', name: 'Phase II — Plot Grid', createdDate: new Date('2026-06-28') },
];

export default function ProsperaCardsPreview() {
  return (
    <div className="ps-shell">
      <header className="ps-header">
        <span className="ps-eyebrow">Ozen</span>
        <h1>Site records</h1>
        <p>Quotations issued and layout maps on file for the project.</p>
      </header>

      <section>
        <h2>Quotations</h2>
        <div className="ps-qgrid">
          {sampleQuotations.map((q, i) => (
            <QuotationCard key={q.plotNumber} quotation={q} index={i} onOpen={() => {}} />
          ))}
        </div>
      </section>

      <section>
        <h2>Maps</h2>
        <div className="ps-mgrid">
          {sampleMaps.map((m, i) => (
            <MapCard key={m.id} map={m} index={i} onOpen={() => {}} />
          ))}
        </div>
      </section>

      <style>{`
        :root {
          --ink: #211c14;
          --ivory: #faf6ee;
          --panel: #fffdf9;
          --gold: #a9812f;
          --gold-deep: #7c5e21;
          --gold-soft: #e7d4a1;
          --hair: #e4d9bf;
          --muted: #7a715f;
          --charcoal: #201c17;
        }

        .ps-shell {
          background: var(--ivory);
          color: var(--ink);
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          padding: 48px 32px 72px;
          max-width: 920px;
          margin: 0 auto;
        }

        .ps-header {
          margin-bottom: 44px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--hair);
        }
        .ps-eyebrow {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: 15px;
          color: var(--gold-deep);
        }
        .ps-header h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: 34px;
          margin: 6px 0 8px;
          letter-spacing: 0.2px;
        }
        .ps-header p {
          color: var(--muted);
          font-size: 15px;
          margin: 0;
        }

        section { margin-bottom: 40px; }
        section h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: 19px;
          margin: 0 0 16px;
          color: var(--ink);
        }

        .ps-qgrid, .ps-mgrid {
          display: grid;
          gap: 16px;
        }
        .ps-mgrid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

        /* ---------- Quotation card ---------- */
        .qcard {
          display: flex;
          align-items: stretch;
          width: 100%;
          background: var(--panel);
          border: 1px solid var(--hair);
          border-radius: 10px;
          padding: 0;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .qcard:hover {
          border-color: var(--gold);
          box-shadow: 0 6px 24px rgba(122, 92, 33, 0.12);
        }
        .qcard.is-pressed { transform: scale(0.995); }
        .qcard-spine {
          width: 4px;
          flex-shrink: 0;
          background: linear-gradient(180deg, var(--gold), var(--gold-deep));
        }
        .qcard-body {
          flex: 1;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .qcard-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .qcard-glyph {
          color: var(--gold-deep);
          margin-top: 2px;
          flex-shrink: 0;
        }
        .qcard-who {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .qcard-who strong {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
        }
        .qcard-who span {
          font-size: 12.5px;
          color: var(--muted);
        }
        .qcard-money {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .qcard-money strong {
          font-size: 15.5px;
          font-weight: 700;
          color: var(--gold-deep);
        }
        .qcard-money span {
          font-size: 11.5px;
          color: var(--muted);
        }
        .qcard-chips {
          display: flex;
          gap: 8px;
          padding-left: 30px;
        }
        .pill {
          font-size: 11.5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--gold-soft);
          color: var(--gold-deep);
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        /* ---------- Map card ---------- */
        .mcard {
          background: var(--panel);
          border: 1px solid var(--hair);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .mcard:hover {
          border-color: var(--gold);
          box-shadow: 0 10px 28px rgba(122, 92, 33, 0.14);
        }
        .mcard.is-pressed { transform: scale(0.99); }

        .mcard-cover {
          position: relative;
          aspect-ratio: 16 / 10;
          background: radial-gradient(120% 120% at 50% 20%, #2c261c 0%, var(--charcoal) 70%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mcard-crest {
          width: 62%;
          max-width: 220px;
          height: auto;
          filter: drop-shadow(0 4px 14px rgba(0,0,0,0.35));
        }
        .mcard-fallback {
          color: var(--gold-soft);
          opacity: 0.8;
        }
        .mcard-corner {
          position: absolute;
          width: 22px;
          height: 22px;
          border: 1.5px solid var(--gold);
          opacity: 0.55;
        }
        .mcard-corner--tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
        .mcard-corner--br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
        .mcard-fade {
          position: absolute;
          inset: auto 0 0 0;
          height: 46%;
          background: linear-gradient(180deg, rgba(32,28,23,0) 0%, rgba(32,28,23,0.55) 100%);
          pointer-events: none;
        }

        .mcard-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
        }
        .mcard-name {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .mcard-name strong {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14.5px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mcard-name span {
          font-size: 11.5px;
          color: var(--muted);
        }
        .mcard-open {
          flex-shrink: 0;
          font-size: 12.5px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid var(--gold);
          background: transparent;
          color: var(--gold-deep);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .mcard-open:hover {
          background: var(--gold);
          color: #fff;
        }
      `}</style>
    </div>
  );
}