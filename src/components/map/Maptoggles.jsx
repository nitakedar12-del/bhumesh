import React from 'react';

import { HAIR, MONO } from '../../theme/tokens';

/* The switch itself */
function Switch({ on }) {
  return (
    <span
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        flex: '0 0 auto',
        background: on ? '#7CB342' : 'rgba(255,255,255,0.22)',
        transition: 'background 160ms ease',
        display: 'block',
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#FFFFFF',
          transition: 'left 160ms ease',
        }}
      />
    </span>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="map-toggle"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        font: `500 14px/1 ${MONO}`,
        color: '#E7E1D5',
        background: 'rgba(21,24,29,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${HAIR}`,
        borderRadius: 12,
        padding: '12px 16px',
        cursor: 'pointer',
      }}
    >
      {label}
      <Switch on={on} />
    </button>
  );
}

/* NO SETTER, NO SWITCH.

   A shared link is given setShowStatus null, and that is the whole
   test — the same one DetailPanel uses to decide whether to draw its
   quotation button and its status chips. So a buyer opening the link on
   WhatsApp gets the plan with no sale colours and nothing to turn them
   on with, while the salesman's own app is unchanged.

   Nothing here asks whether it is a share. If a third surface appears
   later that shouldn't expose the sale book, it withholds the setter
   and this file needs no edit.

   With every switch withheld the whole corner is dropped rather than
   left as an empty absolutely-positioned box: an invisible div in the
   bottom-right still eats the taps and drags that land on it, and that
   corner is map a customer is trying to turn. */
export default function MapToggles({
  showNumbers,
  setShowNumbers,
  showStatus,
  setShowStatus,
}) {
  if (!setShowStatus) return null;

  return (
    <>
      {/* Mobile responsive CSS */}
      <style>
        {`
          @media (max-width: 600px) {
            .map-toggle {
              gap: 8px !important;
              font-size: 11px !important;
              padding: 7px 9px !important;
              border-radius: 8px !important;
            }

            .map-toggle span {
              width: 32px !important;
              height: 18px !important;
            }

            .map-toggle span span {
              width: 14px !important;
              height: 14px !important;
              top: 2px !important;
            }
          }
        `}
      </style>

      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        {/* <Toggle
          label="Numbers"
          on={showNumbers}
          onChange={setShowNumbers}
        /> */}

        <Toggle
          label="Status"
          on={showStatus}
          onChange={setShowStatus}
        />
      </div>
    </>
  );
}