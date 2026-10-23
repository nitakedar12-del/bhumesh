
// import React from 'react';
// import { pathWithHoles } from '../../lib/geometry';
// import { fittedNumberSize } from '../../lib/labels';
// import { STATUS, statusKeyOf } from '../../theme/status';
// import {
//   DIM_EDGE, DIM_FILL, DIM_INK,
//   KIND, MAPFONT, MONO, SANS, PLOT_STROKE, SEL_STROKE, SOCKET_FILL,
// } from '../../theme/tokens';

// /* EVERY plot on the layout, off-white. This replaces toneOf's per-block
//    master-plan tones outright — one plot reads the same as the next, so
//    the only colour anywhere on the plan is a sale colour, and a coloured
//    plot means something rather than being one more shade among twelve.

//    Roads, open spaces and amenities are untouched: their colours come
//    from KIND, not from here.

//    Change this one constant to recolour the whole layout. */
// const PLAIN_FILL = '#F1ECE2';

// /* ── THE LAYOUT BOUNDARY ─────────────────────────────────────────────
//    The outer edge of the whole site, carried down from Firestore's map
//    meta document as `layoutBoundary` and converted in buildLayout.js
//    through the same frame every plot corner goes through — so by the
//    time it reaches here it is already a plain ring of [x, y] points in
//    drawing-space metres, exactly like any feature's own `pts`. Not every
//    project has one, so this draws nothing when the field is absent
//    rather than guessing at an edge from the plots' own extent.

//    FILLED IN THE EXACT ROAD COLOUR (KIND.road.fill), NO STROKE — it's a
//    ground tone, not an outlined shape, matching how a road itself sits
//    on the sheet with no border of its own.

//    DRAWN FIRST, before plots, roads and every label, so it sits under
//    the whole layout as a backdrop rather than covering any of it. */
// export default function PlanContent({
//   layout, selected, matches, status, showNumbers, showStatus, hover, setHover, onPick,
// }) {
//   /* One reading of a plot's status, shared by the shape and its number:
//      they have to agree, or a plot ends up with dark ink on a red fill.

//      `status` is undefined for the first frames, before the Firestore
//      read lands, so it is guarded here rather than indexed raw. */
//   const stateOf = (name) => STATUS[statusKeyOf((status || {})[name])];

//   const layoutBoundary = layout.layoutBoundary;

//   return (
//     <g>
//       {layoutBoundary && layoutBoundary.length > 2 && (
//         <path
//           d={pathWithHoles(layoutBoundary)}
//           fill={KIND.road.fill}
//           fillRule="evenodd"
//           stroke="none"
//           style={{ pointerEvents: 'none' }}
//         />
//       )}

//       {layout.sorted.map((f) => {
//         const k = KIND[f.kind];
//         const isPlot = f.kind === 'plot';
//         const isSel = isPlot && selected === f.name;
//         const dim = isPlot && matches && !matches.has(f.name);

//         let fill = k.fill;
//         if (isPlot) {
//           /* Off-white unless the plot has a sale state AND the status
//              view is up. Nothing else colours a plot. */
//           const st = stateOf(f.name);
//           fill = (showStatus && st.fill) || PLAIN_FILL;
//         }
//         if (isSel) fill = SOCKET_FILL;   // the raised copy carries the real colour

//         return (
//           <path
//             key={f.i}
//             data-plot={isPlot ? f.name : undefined}
//             d={pathWithHoles(f.pts, f.holes)}
//             fill={fill}
//             fillRule="evenodd"
//             stroke={isSel ? '#E9C6F2' : k.stroke}
//             strokeWidth={isSel ? SEL_STROKE : PLOT_STROKE}
//             fillOpacity={dim ? DIM_FILL : 0.92}
//             strokeOpacity={dim ? DIM_EDGE : 1}
//             opacity={hover === f.name && isPlot ? 0.85 : 1}
//             onMouseEnter={() => isPlot && setHover(f.name)}
//             onClick={() => isPlot && onPick(f.name)}
//             style={{ cursor: isPlot ? 'pointer' : 'default' }}
//           />
//         );
//       })}

//       {showNumbers && layout.plots.map((f) => {
//         if (f.name === selected) return null;
//         const dim = matches && !matches.has(f.name);
//         const size = fittedNumberSize(f, 3.2);
//         if (size < 0.85) return null;   // smaller than this is a smudge, not a number
//         /* Dark ink vanishes on the red and blue fills, so the number
//            takes whatever the status says is legible on it — and stays
//            dark on an off-white plot, which has no status to ask. */
//         const st = showStatus ? stateOf(f.name) : null;
//         const ink = (st && st.fill && st.ink) || '#1A1208';
//         return (
//           <text
//             key={`n${f.i}`} x={f.lp[0]} y={f.lp[1]} textAnchor="middle" dy="0.35em"
//             fontFamily={MAPFONT} fontSize={size} fontWeight="600" fill={ink}
//             fillOpacity={dim ? DIM_INK : 1}
//             style={{ pointerEvents: 'none' }}
//           >
//             {f.name}
//           </text>
//         );
//       })}

//       {/* Roads, open spaces, amenities and utilities name themselves. A
//           road polygon is long and thin, so its longest edge is the
//           direction the name should run — which is how the CAD sheet set
//           "9 MT. WIDE ROAD" along each carriageway. */}
//       {layout.features.map((f) => {
//         if (f.kind === 'plot') return null;
//         const label = (f.title || f.name || '').trim();
//         if (!label) return null;

//         const isRoad = f.kind === 'road';
//         const size = Math.min(Math.max(f.ir * (isRoad ? 0.55 : 0.9), 1.2), isRoad ? 2.8 : 3.8);
//         if (size < 1.2) return null;

//         const ink = KIND[f.kind].ink;
//         const [x, y] = f.lp;

//         return (
//           <g
//             key={`l${f.i}`} style={{ pointerEvents: 'none' }} paintOrder="stroke"
//             stroke="rgba(0,0,0,0.45)" strokeWidth={size * 0.028}
//             transform={`rotate(${f.angle} ${x} ${y})`}
//           >
//             <text
//               x={x} y={isRoad ? y : y - size * 0.4} textAnchor="middle" dy="0.35em"
//               fontFamily={isRoad ? MAPFONT : SANS} fontSize={size}
//               letterSpacing={isRoad ? 0 : 0.5} fill={ink} fontWeight="600"
//             >
//               {label}
//             </text>
//             {!isRoad && f.area > 200 && (
//               <text
//                 x={x} y={y + size * 0.85} textAnchor="middle" dy="0.35em"
//                 fontFamily={MONO} fontSize={size * 0.62} fill={ink} opacity="0.85"
//               >
//                 {Math.round(f.area).toLocaleString('en-IN')} m²
//               </text>
//             )}
//           </g>
//         );
//       })}
//     </g>
//   );
// }
import React, { useMemo } from 'react';
import { pathWithHoles } from '../../lib/geometry';
import { fittedNumberSize } from '../../lib/labels';
import { STATUS, statusKeyOf } from '../../theme/status';
import {
  DIM_EDGE, DIM_FILL, DIM_INK,
  KIND, MAPFONT, MONO, SANS, PLOT_STROKE, SEL_STROKE, SOCKET_FILL,
} from '../../theme/tokens';

/* EVERY plot on the layout, off-white. Change this one constant to
   recolour the whole layout. Sale colours are the only other colour. */
const PLAIN_FILL = '#F1ECE2';

const ROAD_FONT_BOOST = 2;

/* One reading of a plot's status, shared by the shape and its number:
   they have to agree, or a plot ends up with dark ink on a red fill.
   `status` is undefined for the first frames, so it is guarded. */
const stateOf = (status, name) => STATUS[statusKeyOf((status || {})[name])];

/* ── single plot / feature shape: re-renders only if its own props change ── */
const Shape = React.memo(function Shape({
  d, plotName, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, opacity,
}) {
  return (
    <path
      data-plot={plotName}
      d={d}
      fill={fill}
      fillRule="evenodd"
      stroke={stroke}
      strokeWidth={strokeWidth}
      fillOpacity={fillOpacity}
      strokeOpacity={strokeOpacity}
      opacity={opacity}
      style={{ cursor: plotName ? 'pointer' : 'default' }}
    />
  );
});

/* ── plot numbers: sizes are precomputed per layout ── */
const NumbersLayer = React.memo(function NumbersLayer({
  plots, sizes, selected, matches, status, showStatus,
}) {
  return plots.map((f, i) => {
    if (f.name === selected) return null;
    const size = sizes[i];
    if (size < 0.85) return null;   // smaller than this is a smudge, not a number
    const dim = matches && !matches.has(f.name);
    /* Dark ink vanishes on the red and blue fills, so the number takes
       whatever the status says is legible on it — and stays dark on an
       off-white plot, which has no status to ask. */
    const st = showStatus ? stateOf(status, f.name) : null;
    const ink = (st && st.fill && st.ink) || '#1A1208';
    return (
      <text
        key={`n${f.i}`} x={f.lp[0]} y={f.lp[1]} textAnchor="middle" dy="0.35em"
        fontFamily={MAPFONT} fontSize={size} fontWeight="600" fill={ink}
        fillOpacity={dim ? DIM_INK : 1}
        style={{ pointerEvents: 'none' }}
      >
        {f.name}
      </text>
    );
  });
});

/* ── road / space / amenity names: depend only on layout ──
   A road polygon is long and thin, so its longest edge is the direction
   the name should run, like "9 MT. WIDE ROAD" on the CAD sheet. */
const FeatureLabels = React.memo(function FeatureLabels({ features }) {
  return features.map((f) => {
    if (f.kind === 'plot') return null;
    const label = (f.title || f.name || '').trim();
    if (!label) return null;

    const isRoad = f.kind === 'road';
    const baseSize = Math.min(Math.max(f.ir * (isRoad ? 0.55 : 0.9), 1.2), isRoad ? 2.8 : 3.8);
    const size = isRoad ? baseSize + ROAD_FONT_BOOST : baseSize;
    if (size < 1.2) return null;

    const ink = KIND[f.kind].ink;
    const [x, y] = f.lp;

    return (
      <g
        key={`l${f.i}`} style={{ pointerEvents: 'none' }} paintOrder="stroke"
        stroke="rgba(0,0,0,0.45)" strokeWidth={size * 0.028}
        transform={`rotate(${f.angle} ${x} ${y})`}
      >
        <text
          x={x} y={isRoad ? y : y - size * 0.4} textAnchor="middle" dy="0.35em"
          fontFamily={isRoad ? MAPFONT : SANS} fontSize={size}
          letterSpacing={isRoad ? 0 : 0.5} fill={ink} fontWeight="600"
        >
          {label}
        </text>
        {!isRoad && f.area > 200 && (
          <text
            x={x} y={y + size * 0.85} textAnchor="middle" dy="0.35em"
            fontFamily={MONO} fontSize={size * 0.62} fill={ink} opacity="0.85"
          >
            {Math.round(f.area).toLocaleString('en-IN')} m²
          </text>
        )}
      </g>
    );
  });
});

/* ── THE LAYOUT BOUNDARY ─────────────────────────────────────────────
   Outer edge of the whole site (`layoutBoundary`), already a ring of
   [x, y] points in drawing-space metres. Draws nothing when absent.
   Filled in the exact road colour, no stroke, and drawn FIRST so it
   sits under the whole layout as a backdrop. */
export default function PlanContent({
  layout, selected, matches, status, showNumbers, showStatus, hover, setHover, onPick,
}) {
  /* ── everything below depends only on `layout`, so it runs once ── */
  const boundaryD = useMemo(() => {
    const b = layout.layoutBoundary;
    return b && b.length > 2 ? pathWithHoles(b) : null;
  }, [layout]);

  const pathById = useMemo(() => {
    const m = {};
    layout.features.forEach((f) => { m[f.i] = pathWithHoles(f.pts, f.holes); });
    return m;
  }, [layout]);

  const numberSizes = useMemo(
    () => layout.plots.map((f) => fittedNumberSize(f, 3.2)),
    [layout]
  );

  /* ── one delegated handler pair instead of two closures per plot ── */
  const handleOver = (e) => {
    const n = e.target.getAttribute && e.target.getAttribute('data-plot');
    if (n) setHover(n);
  };
  const handleClick = (e) => {
    const n = e.target.getAttribute && e.target.getAttribute('data-plot');
    if (n) onPick(n);
  };

  return (
    <g>
      {boundaryD && (
        <path
          d={boundaryD}
          fill={KIND.road.fill}
          fillRule="evenodd"
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      )}

      <g onMouseOver={handleOver} onClick={handleClick}>
        {layout.sorted.map((f) => {
          const k = KIND[f.kind];
          const isPlot = f.kind === 'plot';
          const isSel = isPlot && selected === f.name;
          const dim = isPlot && matches && !matches.has(f.name);

          let fill = k.fill;
          if (isPlot) {
            /* Off-white unless the plot has a sale state AND the status
               view is up. Nothing else colours a plot. */
            const st = stateOf(status, f.name);
            fill = (showStatus && st.fill) || PLAIN_FILL;
          }
          if (isSel) fill = SOCKET_FILL;   // the raised copy carries the real colour

          return (
            <Shape
              key={f.i}
              d={pathById[f.i]}
              plotName={isPlot ? f.name : undefined}
              fill={fill}
              stroke={isSel ? '#E9C6F2' : k.stroke}
              strokeWidth={isSel ? SEL_STROKE : PLOT_STROKE}
              fillOpacity={dim ? DIM_FILL : 0.92}
              strokeOpacity={dim ? DIM_EDGE : 1}
              opacity={hover === f.name && isPlot ? 0.85 : 1}
            />
          );
        })}
      </g>

      {showNumbers && (
        <NumbersLayer
          plots={layout.plots}
          sizes={numberSizes}
          selected={selected}
          matches={matches}
          status={status}
          showStatus={showStatus}
        />
      )}

      <FeatureLabels features={layout.features} />
    </g>
  );
}