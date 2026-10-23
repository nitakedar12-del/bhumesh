import React, {
  useEffect, useId, useMemo, useRef, useState,
} from 'react';
import Eyebrow from '../ui/Eyebrow';
import { SQFT, inr } from '../../lib/units';
import { ACCENT, HAIR, MONO, PANEL, SANS } from '../../theme/tokens';
import {
  MODE_OPTIONS, SOURCE_OPTIONS, derive, emptyForm, toDateValue, toDoc, toForm, userUid,
} from '../../lib/Quote';
import { createQuotation, updateQuotation } from '../../services/Quotationservice';
import { printBooking } from '../../lib/quotationHtml';
import '../../styles/Quotationmodal.css';
import '../../styles/Quotationmodal.css';

/**
 * The booking form, ported from create_ozen_booking_form_screen.dart and
 * built the same way as QuotationModal.
 *
 * As with the quotation, the plot arrives from the layout you clicked, so
 * plot number and area come in read-only. The only computed-and-editable
 * field is the total plot value (green, ↺ to hand it back to derive()).
 */

const GREEN = '#8CC98F';
const GREEN_DIM = 'rgba(140,201,143,0.55)';

// Hoisted OUTSIDE the modal on purpose — see the note in QuotationModal:
// components defined inside another component are re-created every render,
// which unmounts the focused <input> on every keystroke.

function Field({
  label, name, value, onChange, type, mode, readOnly, autoComplete,
}) {
  return (
    <label className="qm-field">
      <Eyebrow style={{ marginBottom: 5 }}>{label}</Eyebrow>
      <input
        className={`qm-input${readOnly ? ' qm-input--readonly' : ''}`}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        type={type}
        inputMode={mode}
        autoComplete={autoComplete}
        readOnly={readOnly}
      />
    </label>
  );
}

function Derived({
  label, name, active, displayValue, onChange, onRelease,
}) {
  return (
    <label className="qm-field">
      <span className="qm-field-label-row">
        <Eyebrow style={{ marginBottom: 0 }}>{label}</Eyebrow>
        <button
          type="button"
          onClick={onRelease}
          disabled={!active}
          title="Back to the calculated value"
          className={`qm-auto-toggle${active ? ' is-active' : ''}`}
        >
          {active ? '↺ auto' : 'auto'}
        </button>
      </span>
      <input
        className="qm-input qm-input--auto"
        name={name}
        type="number"
        inputMode="decimal"
        value={displayValue ?? ''}
        onChange={onChange}
      />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="qm-section">
      <div className="qm-section-title">{title}</div>
      {children}
    </div>
  );
}

function DateField({
  label, name, value, onChange,
}) {
  const ref = useRef(null);
  const id = useId();
  const open = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (typeof el.showPicker !== 'function') return;
    try { el.showPicker(); } catch (e) { /* not a direct gesture, or already open */ }
  };
  return (
    <div className="qm-field">
      <label htmlFor={id}>
        <Eyebrow style={{ marginBottom: 5 }}>{label}</Eyebrow>
      </label>
      <span className="qm-date-wrap">
        <input
          ref={ref}
          id={id}
          className="qm-input qm-input--date"
          type="date"
          name={name}
          value={toDateValue(value)}
          onChange={onChange}
          onClick={open}
        />
      </span>
    </div>
  );
}

function PaymentRow({ row, index, onChange }) {
  const on = (k) => (e) => onChange(index, k, e.target.value);
  return (
    <div className="bm-pay">
      <div className="bm-pay-title">{row.condition.toUpperCase()}</div>
      <div className="qm-grid">
        <Field label="Payment %" name={`pct${index}`} value={row.percent} onChange={on('percent')} type="number" mode="decimal" />
        <Field label="Amount (INR)" name={`amt${index}`} value={row.amount} onChange={on('amount')} type="number" mode="decimal" />
        <DateField label="Date of payment" name={`date${index}`} value={row.date} onChange={on('date')} />
        <label className="qm-field">
          <Eyebrow style={{ marginBottom: 5 }}>Mode of payment</Eyebrow>
          <select className="qm-input" name={`mode${index}`} value={row.mode} onChange={on('mode')}>
            <option value="">Select</option>
            {MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <Field label="UTR no. / bank details" name={`utr${index}`} value={row.utr} onChange={on('utr')} />
      </div>
    </div>
  );
}

export default function QuotationModal({
  plot, user, existing, map, projectName = '', onClose, onSaved,
}) {
  const areaSqft = plot ? Math.round(plot.area * SQFT) : 0;
  const project = (projectName || map?.name || '').trim();

  const [f, setF] = useState(() => (existing
    ? toForm(existing)
    : emptyForm({ plotNo: plot?.name || '', areaSqft, projectName: project })));
  const [saveState, setSaveState] = useState('idle');   // idle|saving|saved|failed
  const [err, setErr] = useState('');

  const d = useMemo(() => derive(f), [f]);
  const dialogRef = useRef(null);

  /* Project name fills itself in when the map document arrives late.
     Anything the user typed wins; an existing record keeps its own name. */
  const projectTouched = useRef(false);
  useEffect(() => {
    if (!project || projectTouched.current) return;
    setF((s) => (s.projectName && s.projectName.trim() ? s : { ...s, projectName: project }));
  }, [project]);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Focus trap + Escape. MOUNT ONLY — depending on onClose re-focuses the
  // first field on every parent render and kills the native date picker.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const getFocusable = () => Array.from(dialog.querySelectorAll(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), '
      + 'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    getFocusable()[0]?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', onKeyDown);
    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, []);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setRow = (i, k, v) => setF((s) => ({
    ...s, payments: s.payments.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
  }));

  const save = async () => {
    /* Name, mobile and plot are what make a booking findable. */
    if (!(f.applicantName || '').trim()) { setErr('Applicant name is required.'); return; }
    if (!(f.applicantMobile || '').trim()) { setErr('Applicant mobile number is required.'); return; }
    if (!(f.projectName || '').trim() || !(f.plotNo || '').trim()) {
      setErr('Project name and plot number are required.');
      return;
    }
    if (!userUid(user)) {
      setErr('Not signed in properly — reload the page and sign in before saving.');
      return;
    }
    setErr('');
    setSaveState('saving');

    const data = toDoc(f, d, user);
    /* Authorship belongs to whoever created the record; an edit must not
       reassign it, or it drops out of the creator's list. */
    if (existing) {
      data.createdByUid = existing.createdByUid || data.createdByUid;
      data.createdByName = existing.createdByName || data.createdByName;
    }

    try {
      const id = existing?.id
        ? (await updateQuotation(existing.id, data), existing.id)
        : await createQuotation(data);
      setSaveState('saved');
      if (onSaved) onSaved({ ...data, id });
      setTimeout(() => setSaveState('idle'), 1600);
    } catch (e) {
      setSaveState('failed');
      setErr(e?.message || 'Firestore refused the write.');
    }
  };

  const print = async () => {
    /* Print what is on screen, saved or not. */
    const ok = await printBooking({ ...toDoc(f, d, user), id: existing?.id });
    if (!ok) setErr('The print window was blocked. Allow pop-ups for this site.');
  };

  const saveLabel = {
    idle: existing ? 'Update booking form' : 'Save booking form',
    saving: 'Saving…', saved: 'Saved', failed: 'Try again',
  }[saveState];

  return (
    <div onClick={onClose} role="presentation" className="qm-overlay">
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Booking form for plot ${f.plotNo}`}
        className="qm-dialog"
        style={{
          '--qm-accent': ACCENT,
          '--qm-hair': HAIR,
          '--qm-panel': PANEL,
          '--qm-mono': MONO,
          '--qm-sans': SANS,
          '--qm-green': GREEN,
          '--qm-green-dim': GREEN_DIM,
        }}
      >
        <Eyebrow>Booking form</Eyebrow>
        <div className="qm-title">
          PLOT {f.plotNo || '—'}
          {f.plotArea ? ` · ${Number(f.plotArea).toLocaleString('en-IN')} SQ FT` : ''}
        </div>

        <div className="qm-total">
          <span className="qm-total-label">Total plot value</span>
          <span className="qm-total-value">{inr(d.total)}</span>
        </div>

        <Section title="Applicant">
          <div className="qm-grid">
            <Field label="Full name" name="applicantName" value={f.applicantName} onChange={set('applicantName')} autoComplete="name" />
            <Field label="Mobile number" name="applicantMobile" value={f.applicantMobile} onChange={set('applicantMobile')} type="tel" mode="numeric" autoComplete="tel" />
            <Field label="Age" name="applicantAge" value={f.applicantAge} onChange={set('applicantAge')} type="number" mode="numeric" />
            <Field label="PAN number" name="applicantPan" value={f.applicantPan} onChange={set('applicantPan')} />
            <DateField label="Date of birth" name="applicantDob" value={f.applicantDob} onChange={set('applicantDob')} />
          </div>
          <label className="qm-field" style={{ marginTop: 10 }}>
            <Eyebrow style={{ marginBottom: 5 }}>Permanent address</Eyebrow>
            <textarea className="qm-input qm-textarea" name="applicantAddress" autoComplete="street-address"
              value={f.applicantAddress ?? ''} onChange={set('applicantAddress')} />
          </label>
        </Section>

        <Section title="Co-applicant (optional)">
          <div className="qm-grid">
            <Field label="Full name" name="coName" value={f.coName} onChange={set('coName')} />
            <Field label="Mobile number" name="coMobile" value={f.coMobile} onChange={set('coMobile')} type="tel" mode="numeric" />
            <Field label="Age" name="coAge" value={f.coAge} onChange={set('coAge')} type="number" mode="numeric" />
            <Field label="PAN number" name="coPan" value={f.coPan} onChange={set('coPan')} />
            <DateField label="Date of birth" name="coDob" value={f.coDob} onChange={set('coDob')} />
          </div>
          <label className="qm-field" style={{ marginTop: 10 }}>
            <Eyebrow style={{ marginBottom: 5 }}>Address</Eyebrow>
            <textarea className="qm-input qm-textarea" name="coAddress"
              value={f.coAddress ?? ''} onChange={set('coAddress')} />
          </label>
        </Section>

        <Section title="Project">
          <div className="qm-grid">
            <Field
              label="Project name"
              name="projectName"
              value={f.projectName}
              onChange={(e) => { projectTouched.current = true; set('projectName')(e); }}
            />
            <Field label="Plot number" name="plotNo" value={f.plotNo} onChange={set('plotNo')} readOnly={!!plot} />
            <DateField label="Booking form date" name="bookingFormDate" value={f.bookingFormDate} onChange={set('bookingFormDate')} />
          </div>
        </Section>

        <Section title="Plot value">
          <div className="qm-grid">
            <Field label="Plot area (sq ft)" name="plotArea" value={f.plotArea} onChange={set('plotArea')} type="number" mode="decimal" readOnly={!!plot} />
            <Field label="Plot rate / sq ft" name="plotRate" value={f.plotRate} onChange={set('plotRate')} type="number" mode="decimal" />
            <Field label="Maintenance charges" name="maintenance" value={f.maintenance} onChange={set('maintenance')} type="number" mode="decimal" />
            <Field label="Club membership" name="clubMembership" value={f.clubMembership} onChange={set('clubMembership')} type="number" mode="decimal" />
            <Derived
              label="Total plot value"
              name="totalPlotValue"
              active={f.totalEdited}
              displayValue={f.totalEdited ? f.totalPlotValue : Math.round(d.autoTotal)}
              onChange={(e) => setF((s) => ({ ...s, totalPlotValue: e.target.value, totalEdited: true }))}
              onRelease={() => setF((s) => ({ ...s, totalEdited: false }))}
            />
          </div>
        </Section>

        <Section title="Payment plan">
          {f.payments.map((r, i) => (
            <PaymentRow key={r.condition} row={r} index={i} onChange={setRow} />
          ))}
          <div className="qm-lines">
            <div className="qm-line"><span>Scheduled in plan</span><span>{inr(d.planAmount)}</span></div>
            <div className="qm-line"><span>Not yet allocated</span><span>{inr(d.unallocated)}</span></div>
          </div>
        </Section>

        <Section title="Booking details">
          <Eyebrow style={{ marginBottom: 8 }}>Source of booking</Eyebrow>
          <div className="bm-chips">
            {SOURCE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`bm-chip${f.sourceOfBooking === s ? ' is-on' : ''}`}
                onClick={() => setF((x) => ({ ...x, sourceOfBooking: x.sourceOfBooking === s ? '' : s }))}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="qm-grid" style={{ marginTop: 12 }}>
            <Field label="Channel partner" name="channelPartner" value={f.channelPartner} onChange={set('channelPartner')} />
            <Field label="CP code" name="cpCode" value={f.cpCode} onChange={set('cpCode')} />
          </div>
          <label className="qm-field" style={{ marginTop: 10 }}>
            <Eyebrow style={{ marginBottom: 5 }}>Attached client's documents</Eyebrow>
            <textarea className="qm-input qm-textarea" name="attachedDocs"
              value={f.attachedDocs ?? ''} onChange={set('attachedDocs')} />
          </label>
        </Section>

        {err && <div className="qm-error" role="alert">{err}</div>}

        <div className="qm-actions">
          <button type="button" onClick={save} disabled={saveState === 'saving'}
            className={`qm-btn qm-btn--primary${saveState === 'saved' ? ' is-saved' : ''}`}>
            {saveLabel}
          </button>
          <button type="button" onClick={print} className="qm-btn qm-btn--outline">Print / PDF</button>
          <button type="button" onClick={onClose} className="qm-btn qm-btn--ghost">Close</button>
        </div>
      </div>
    </div>
  );
}