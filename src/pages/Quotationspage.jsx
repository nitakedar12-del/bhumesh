import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import QuotationsList from '../components/QuotationsList';
import QuotationDetail from '../components/QuotationDetail';
import { useAuth } from '../context/Authcontext';
import { userUid } from '../lib/Quote';
import { ACCENT, CANVAS, HAIR, MONO, SANS } from '../theme/tokens';

/* Shows a render crash inside the detail dialog on screen, instead of the
   dialog silently disappearing. Remove once everything works. */
class DetailBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[quotation detail crashed]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)',
          color: '#E68A72', padding: 24, fontFamily: 'monospace', fontSize: 13,
          lineHeight: 1.7, overflow: 'auto',
        }}>
          Detail crashed: {String(this.state.error.message || this.state.error)}
          <br /><br />
          <button type="button" onClick={this.props.onClose}>Close</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* The stored owner may sit under any of these names (Flutter vs web). */
const OWNER_FIELDS = [
  'createdByUid', 'created_by_uid', 'createdBy', 'employeeId',
  'employeeUid', 'userId', 'uid',
];

const ownerMatches = (q, uid) =>
  !!q && !!uid
  && OWNER_FIELDS.some((f) => q[f] != null && String(q[f]) === String(uid));

export default function QuotationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  /* Guests can read the layouts but must not put their name on a
     customer-facing document. */
  const canCreate = user?.role !== 'guest';

  /* Delete is allowed for the owner of the record. */
  const owns = ownerMatches(selected, userUid(user));

  const open = (q) => {
    console.log('[quotations] OPEN', q);
    setSelected(q);
  };

  return (
    <div style={{
      minHeight: '100vh', background: CANVAS, padding: '22px 18px 60px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#6F7A87',
            }}>
              {user?.name || 'Saraswati Infra'}
            </div>
            <h1 style={{
              fontFamily: SANS, fontSize: 26, fontWeight: 700, color: ACCENT,
              letterSpacing: '0.02em', margin: '2px 0 0',
            }}>
              Quotations
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 15px', borderRadius: 8, background: 'transparent',
                border: `1px solid ${HAIR}`, color: '#B7C0CA',
                fontFamily: MONO, fontSize: 12, cursor: 'pointer',
              }}
            >
              Back
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => navigate('/quotations/new')}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: ACCENT, color: '#141820', fontWeight: 700,
                  fontFamily: SANS, fontSize: 12, letterSpacing: '0.08em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                New quotation
              </button>
            )}
          </div>
        </div>

        <QuotationsList user={user} onOpen={open} />
      </div>

      {selected && (
        <DetailBoundary onClose={() => setSelected(null)}>
          <QuotationDetail
            quotation={selected}
            isAdmin={owns}
            onClose={() => setSelected(null)}
            onEdit={(q) => navigate(`/quotations/${q.id}/edit`)}
            onDeleted={() => setSelected(null)}
          />
        </DetailBoundary>
      )}
    </div>
  );
}