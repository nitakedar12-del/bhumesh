import React, { useState } from 'react';
import { motion } from 'framer-motion';

import { inr, plain, shortDate } from './HomeParts';
import { ACCENT, HAIR, MONO, PANEL, SANS } from '../theme/tokens';
import { printBooking, previewBooking } from '../lib/quotationHtml';
import { deleteQuotation } from '../services/Quotationservice';

/**
 * The booking form itself, ported from ozen_booking_form_detail_screen.dart.
 * Printing lives IN here, not on the list card — a printed booking form
 * carries the customer's name and PAN, so the figures get read once first.
 * The sheet itself comes from bookingHtml, so screen and paper cannot drift.
 */

const GREEN = '#8CC98F';
const DIM = '#8B96A3';

const dateOr = (d) => (d ? shortDate.format(d) : '');
const money = (n) => (n ? inr.format(n) : '');

function Row({ label, value, strong }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      padding: '9px 0', borderBottom: `1px solid ${HAIR}`,
      fontFamily: MONO, fontSize: strong ? 14 : 13, fontWeight: strong ? 700 : 500,
      color: strong ? ACCENT : '#D5DBE2',
    }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        fontFamily: SANS, fontSize: 12, color: DIM, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontFamily: SANS, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#6F7A87', marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 13, color: '#EFEAE0', wordBreak: 'break-word' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function Facts({ children }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12, padding: '12px 14px', background: '#0D1117',
      border: `1px solid ${HAIR}`, borderRadius: 10,
    }}>
      {children}
    </div>
  );
}

const btn = {
  padding: '13px 20px', borderRadius: 8, fontFamily: SANS, fontSize: 14,
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  touchAction: 'manipulation',
};

export default function QuotationDetail({
  quotation: b, isAdmin = false, onClose, onEdit, onDeleted,
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const print = async () => {
    if (!(await printBooking(b))) setErr('The print window was blocked. Allow pop-ups for this site.');
  };
  const preview = async () => {
    if (!(await previewBooking(b))) setErr('The preview window was blocked. Allow pop-ups for this site.');
  };

  const remove = async () => {
    if (!b.id) return;
    setBusy(true);
    try {
      await deleteQuotation(b.id);
      if (onDeleted) onDeleted(b.id);
      onClose();
    } catch (e) {
      setBusy(false);
      setErr(e?.message || 'Could not delete this booking form.');
    }
  };

  const hasCo = !!b.coApplicantName;

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8,11,15,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 40,
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Booking form for ${b.applicantName}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 560, background: PANEL, border: `1px solid ${HAIR}`,
          borderRadius: 14, padding: 20, maxHeight: '90vh', overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#6F7A87',
            }}>
              Booking form{b.id ? ` · ${b.id.slice(0, 8).toUpperCase()}` : ''}
            </div>
            <div style={{
              fontFamily: SANS, fontSize: 24, color: ACCENT, fontWeight: 700,
              letterSpacing: '0.02em', marginTop: 2, wordBreak: 'break-word',
            }}>
              {b.applicantName || 'Unnamed applicant'}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: DIM, marginTop: 4 }}>
              {b.projectName} · Plot {b.plotNo} · {shortDate.format(b.bookingFormDate)}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', color: DIM, fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 4 }}>
            ×
          </button>
        </div>

        <Section title="Applicant">
          <Facts>
            <Fact label="Mobile" value={b.applicantMobile} />
            <Fact label="Age" value={b.applicantAge} />
            <Fact label="PAN" value={b.applicantPanNumber} />
            <Fact label="Date of birth" value={dateOr(b.applicantDob)} />
            {b.applicantPermanentAddress && <Fact label="Address" value={b.applicantPermanentAddress} />}
          </Facts>
        </Section>

        {hasCo && (
          <Section title="Co-applicant">
            <Facts>
              <Fact label="Name" value={b.coApplicantName} />
              <Fact label="Mobile" value={b.coApplicantMobile} />
              <Fact label="Age" value={b.coApplicantAge} />
              <Fact label="PAN" value={b.coApplicantPanNumber} />
              <Fact label="Date of birth" value={dateOr(b.coApplicantDob)} />
              {b.coApplicantAddress && <Fact label="Address" value={b.coApplicantAddress} />}
            </Facts>
          </Section>
        )}

        <Section title="Project details">
          <Row label="Plot area" value={`${plain.format(b.plotAreaSqFt)} sq ft`} />
          <Row label="Plot rate" value={`${inr.format(b.plotRatePerSqFt)} / sq ft`} />
          {b.maintenanceCharges > 0 && <Row label="Maintenance charges" value={inr.format(b.maintenanceCharges)} />}
          {b.clubMembership > 0 && <Row label="Club membership" value={inr.format(b.clubMembership)} />}
          <Row label="Total plot value" value={inr.format(b.totalPlotValue)} strong />
        </Section>

        <Section title="Payment plan">
          {b.paymentRows.map((r) => {
            const meta = [
              r.paymentPercentage && `${r.paymentPercentage}%`,
              dateOr(r.dateOfPayment),
              r.modeOfPayment,
              r.utrOrBankDetails,
            ].filter(Boolean).join(' · ');
            return (
              <div key={r.condition} style={{ padding: '9px 0', borderBottom: `1px solid ${HAIR}` }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', gap: 12,
                  fontFamily: MONO, fontSize: 13, color: '#D5DBE2',
                }}>
                  <span>{r.condition}</span>
                  <span style={{ color: r.amountInInr ? GREEN : '#5C666F' }}>{money(r.amountInInr) || '—'}</span>
                </div>
                {meta && <div style={{ fontFamily: MONO, fontSize: 11, color: DIM, marginTop: 3 }}>{meta}</div>}
              </div>
            );
          })}
        </Section>

        <Section title="Booking details">
          <Facts>
            <Fact label="Source" value={b.sourceOfBooking} />
            <Fact label="Channel partner" value={b.channelPartner} />
            <Fact label="CP code" value={b.cpCode} />
            <Fact label="Prepared by" value={b.createdByName} />
            {b.attachedClientDocuments && <Fact label="Documents" value={b.attachedClientDocuments} />}
          </Facts>
        </Section>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          gap: 12, padding: '14px 16px', marginTop: 18,
          background: '#0D1117', border: `1px solid ${HAIR}`, borderRadius: 10,
        }}>
          <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>
            Total plot value
          </span>
          <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: GREEN }}>
            {inr.format(b.totalPlotValue)}
          </span>
        </div>

        {err && <div style={{ fontFamily: MONO, fontSize: 12, color: '#E68A72', marginTop: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button type="button" onClick={print}
            style={{ ...btn, flex: '1 1 170px', border: 'none', background: ACCENT, color: '#141820', fontWeight: 700, letterSpacing: '0.1em' }}>
            Print / PDF
          </button>
          <button type="button" onClick={preview}
            style={{ ...btn, flex: '0 1 130px', background: 'transparent', border: `1px solid ${HAIR}`, color: '#B7C0CA' }}>
            Preview
          </button>
          {onEdit && (
            <button type="button" onClick={() => onEdit(b)}
              style={{ ...btn, flex: '0 1 110px', background: 'transparent', border: `1px solid ${HAIR}`, color: '#B7C0CA' }}>
              Edit
            </button>
          )}
          {isAdmin && b.id && (
            <button type="button" disabled={busy}
              onClick={confirmDelete ? remove : () => setConfirmDelete(true)}
              style={{ ...btn, flex: '0 1 130px', background: 'transparent', border: '1px solid rgba(230,138,114,0.5)', color: '#E68A72' }}>
              {busy ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}