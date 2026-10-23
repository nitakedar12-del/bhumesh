// lib/Booking.js — the arithmetic and shapes behind a booking form.
// Same idea as lib/Quote.js: the form holds only what the user TYPED,
// derive() computes everything else on each render.

// userUid now comes from Session (the lowest layer), not from Quote,
// so Booking and Quote no longer depend on each other.
import { sessionUser, userUid } from './Session';

// Keep this only if other files import { userUid } from './Booking'.
export { userUid };

const num = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

export const PAYMENT_CONDITIONS = [
  'Booking Amount',
  'Agreement Amount',
  'Instalment - 1',
  'Instalment - 2',
  'Instalment - 3',
  'At the time of Sale Deed',
];
export const SOURCE_OPTIONS = [
  'Channel Partner', 'Paper Advertise', 'Hoarding', 'Website', 'Self Enquiry',
];
export const MODE_OPTIONS = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Bank Transfer'];

/* ── dates ────────────────────────────────────────────────────────────
   <input type="date"> accepts only yyyy-MM-dd. Normalise whatever comes
   in (Timestamp, Date, ISO string, dd/MM/yyyy) using LOCAL parts, never
   toISOString — that shifts the day in IST. */
export const toDateValue = (v) => {
  if (!v) return '';
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    const dmy = v.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }
  const d = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const dateOut = (s) => {
  const v = toDateValue(s);
  return v ? new Date(`${v}T00:00:00`) : null;
};
const asDate = (v) => {
  if (!v) return null;
  const x = v.toDate ? v.toDate() : new Date(v);
  return Number.isNaN(x.getTime()) ? null : x;
};
/** Timestamp / Date / ISO string → Date, or null. Safe for Intl.DateTimeFormat. */
export const toDate = asDate;

const blankRow = (condition) => ({
  condition, percent: '', date: '', amount: '', mode: '', utr: '',
});

export function emptyForm({ plotNo = '', areaSqft = 0, projectName = '' } = {}) {
  return {
    applicantName: '', applicantAge: '', applicantMobile: '',
    applicantAddress: '', applicantPan: '', applicantDob: '',
    coName: '', coAge: '', coMobile: '', coAddress: '', coPan: '', coDob: '',
    projectName,
    plotNo,
    plotArea: areaSqft ? String(Math.round(areaSqft)) : '',
    plotRate: '',
    maintenance: '',
    clubMembership: '',
    totalPlotValue: '',
    totalEdited: false,
    payments: PAYMENT_CONDITIONS.map(blankRow),
    sourceOfBooking: '',
    channelPartner: '',
    cpCode: '',
    attachedDocs: '',
    bookingFormDate: toDateValue(new Date()),
  };
}

/** Everything computed, in one pass. */
export function derive(f) {
  const area = num(f.plotArea);
  const rate = num(f.plotRate);
  const auto = area * rate + num(f.maintenance) + num(f.clubMembership);
  const total = f.totalEdited ? num(f.totalPlotValue) : auto;
  const planAmount = f.payments.reduce((s, r) => s + num(r.amount), 0);
  const planPercent = f.payments.reduce((s, r) => s + num(r.percent), 0);
  return {
    autoTotal: auto,
    total,
    planAmount,
    planPercent,
    unallocated: total - planAmount,
  };
}

/** Firestore shape. Field names match the Flutter OzenBookingFormModel. */
export function toDoc(f, d, user) {
  const stored = sessionUser();
  return {
    applicantName: f.applicantName.trim(),
    applicantAge: f.applicantAge.trim(),
    applicantMobile: f.applicantMobile.trim(),
    applicantPermanentAddress: f.applicantAddress.trim(),
    applicantPanNumber: f.applicantPan.trim().toUpperCase(),
    applicantDob: dateOut(f.applicantDob),
    coApplicantName: f.coName.trim(),
    coApplicantAge: f.coAge.trim(),
    coApplicantMobile: f.coMobile.trim(),
    coApplicantAddress: f.coAddress.trim(),
    coApplicantPanNumber: f.coPan.trim().toUpperCase(),
    coApplicantDob: dateOut(f.coDob),
    projectName: f.projectName.trim(),
    plotNo: f.plotNo.trim(),
    plotAreaSqFt: num(f.plotArea),
    plotRatePerSqFt: num(f.plotRate),
    maintenanceCharges: num(f.maintenance),
    clubMembership: num(f.clubMembership),
    totalPlotValue: d.total,
    paymentRows: f.payments.map((r) => ({
      condition: r.condition,
      paymentPercentage: String(r.percent || '').trim(),
      dateOfPayment: dateOut(r.date),
      amountInInr: num(r.amount),
      modeOfPayment: r.mode || '',
      utrOrBankDetails: (r.utr || '').trim(),
    })),
    sourceOfBooking: f.sourceOfBooking || '',
    channelPartner: f.channelPartner.trim(),
    cpCode: f.cpCode.trim(),
    attachedClientDocuments: f.attachedDocs.trim(),
    bookingFormDate: dateOut(f.bookingFormDate) || new Date(),
    createdByUid: userUid(user),
    createdByName: user?.name || user?.displayName || stored?.name || '',
  };
}

/* ── record kinds ─────────────────────────────────────────────────────
   The "quotations" collection holds two shapes:
     booking form → applicantName, plotAreaSqFt, bookingFormDate, paymentRows…
     quotation    → customerName, plotNumber, plotSize, ratePerSqFt,
                    totalPlotAmount, finalTotalAmount, quotationDate…
   fromDoc() accepts either and returns ONE view model. Both kinds carry
   the uniform fields  kind, name, mobile, plot, area, rate, total,
   finalTotal, date, charges, paymentRows  so the list, detail and printer
   never have to care which one they were handed. */
const isQuotationDoc = (d) =>
  d.kind === 'quotation'
  || (d.kind !== 'booking'
    && d.customerName !== undefined
    && d.applicantName === undefined
    && d.plotAreaSqFt === undefined);

const QUOTE_CHARGES = [
  ['Stamp duty', 'stampDutyAmount', 'stampDutyPercent'],
  ['Registration', 'registrationAmount', 'registrationPercent'],
  ['Legal fees', 'legalFees'],
  ['Mutation', 'mutation'],
  ['Agreement', 'agreement'],
  ['Data entry', 'dataEntry'],
  ['Society charges', 'societyCharges'],
  ['Corpus fund', 'corpusFund'],
];

function fromQuotationDoc(data, id) {
  const s = (v) => (v == null ? '' : String(v));
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const charges = QUOTE_CHARGES
    .map(([label, amountKey, pctKey]) => ({
      label,
      amount: n(data[amountKey]),
      note: pctKey && n(data[pctKey]) ? `${n(data[pctKey])}%` : '',
    }))
    .filter((c) => c.amount > 0);

  const total = n(data.totalPlotAmount);
  const finalTotal = n(data.finalTotalAmount) || total;
  const date = asDate(data.quotationDate);

  return {
    ...data,                       // keeps aadharNumber, facing, bookingAmount, downPayment, loanAmount…
    id,
    kind: 'quotation',

    // uniform fields
    name: s(data.customerName),
    mobile: s(data.mobileNumber),
    plot: s(data.plotNumber),
    area: n(data.plotSize),
    rate: n(data.ratePerSqFt),
    total,
    finalTotal,
    date,
    charges,
    paymentRows: [],

    // booking-shaped aliases, so anything still reading the old names works
    applicantName: s(data.customerName),
    applicantAge: '',
    applicantMobile: s(data.mobileNumber),
    applicantPermanentAddress: s(data.address),
    applicantPanNumber: s(data.panNumber),
    applicantDob: asDate(data.dateOfBirth),
    coApplicantName: '', coApplicantAge: '', coApplicantMobile: '',
    coApplicantAddress: '', coApplicantPanNumber: '', coApplicantDob: null,
    projectName: s(data.projectName),
    plotNo: s(data.plotNumber),
    plotAreaSqFt: n(data.plotSize),
    plotRatePerSqFt: n(data.ratePerSqFt),
    maintenanceCharges: 0,
    clubMembership: 0,
    totalPlotValue: finalTotal,
    sourceOfBooking: '', channelPartner: '', cpCode: '', attachedClientDocuments: '',
    bookingFormDate: date,
    createdByUid: data.createdByUid || data.employeeId || '',
    createdByName: s(data.createdByName),
  };
}

/** Firestore record (booking form OR quotation) → plain object for the detail view and printer. */
export function fromDoc(data, id = data?.id) {
  if (!data) return null;
  if (isQuotationDoc(data)) return fromQuotationDoc(data, id);

  const s = (v) => (v == null ? '' : String(v));
  const out = {
    id,
    kind: 'booking',
    applicantName: s(data.applicantName),
    applicantAge: s(data.applicantAge),
    applicantMobile: s(data.applicantMobile),
    applicantPermanentAddress: s(data.applicantPermanentAddress),
    applicantPanNumber: s(data.applicantPanNumber),
    applicantDob: asDate(data.applicantDob),
    coApplicantName: s(data.coApplicantName),
    coApplicantAge: s(data.coApplicantAge),
    coApplicantMobile: s(data.coApplicantMobile),
    coApplicantAddress: s(data.coApplicantAddress),
    coApplicantPanNumber: s(data.coApplicantPanNumber),
    coApplicantDob: asDate(data.coApplicantDob),
    projectName: s(data.projectName),
    plotNo: s(data.plotNo),
    plotAreaSqFt: Number(data.plotAreaSqFt) || 0,
    plotRatePerSqFt: Number(data.plotRatePerSqFt) || 0,
    maintenanceCharges: Number(data.maintenanceCharges) || 0,
    clubMembership: Number(data.clubMembership) || 0,
    totalPlotValue: Number(data.totalPlotValue) || 0,
    paymentRows: (Array.isArray(data.paymentRows) ? data.paymentRows : []).map((r) => ({
      condition: s(r.condition),
      paymentPercentage: s(r.paymentPercentage),
      dateOfPayment: asDate(r.dateOfPayment),
      amountInInr: Number(r.amountInInr) || 0,
      modeOfPayment: s(r.modeOfPayment),
      utrOrBankDetails: s(r.utrOrBankDetails),
    })),
    sourceOfBooking: s(data.sourceOfBooking),
    channelPartner: s(data.channelPartner),
    cpCode: s(data.cpCode),
    attachedClientDocuments: s(data.attachedClientDocuments),
    bookingFormDate: asDate(data.bookingFormDate) || new Date(),
    createdByUid: data.createdByUid || data.employeeId || '',
    createdByName: s(data.createdByName),
  };

  // uniform fields shared with quotations
  return {
    ...out,
    name: out.applicantName,
    mobile: out.applicantMobile,
    plot: out.plotNo,
    area: out.plotAreaSqFt,
    rate: out.plotRatePerSqFt,
    total: out.totalPlotValue,
    finalTotal: out.totalPlotValue,
    date: out.bookingFormDate,
    charges: [],
  };
}

/** A saved BOOKING FORM back into form state, for editing. (Not for quotations.) */
export function toForm(b) {
  const base = emptyForm();
  const byCondition = Object.fromEntries((b.paymentRows || []).map((r) => [r.condition, r]));
  const area = b.plotAreaSqFt || 0;
  const computed = area * (b.plotRatePerSqFt || 0)
    + (b.maintenanceCharges || 0) + (b.clubMembership || 0);
  const nz = (n) => (n ? String(n) : '');
  return {
    ...base,
    applicantName: b.applicantName, applicantAge: b.applicantAge,
    applicantMobile: b.applicantMobile, applicantAddress: b.applicantPermanentAddress,
    applicantPan: b.applicantPanNumber, applicantDob: toDateValue(b.applicantDob),
    coName: b.coApplicantName, coAge: b.coApplicantAge, coMobile: b.coApplicantMobile,
    coAddress: b.coApplicantAddress, coPan: b.coApplicantPanNumber,
    coDob: toDateValue(b.coApplicantDob),
    projectName: b.projectName, plotNo: b.plotNo,
    plotArea: nz(area), plotRate: nz(b.plotRatePerSqFt),
    maintenance: nz(b.maintenanceCharges), clubMembership: nz(b.clubMembership),
    totalPlotValue: String(b.totalPlotValue || 0),
    /* only an override if the saved total differs from the formula */
    totalEdited: Math.abs((b.totalPlotValue || 0) - computed) > 0.5,
    payments: PAYMENT_CONDITIONS.map((c) => {
      const r = byCondition[c];
      return r ? {
        condition: c, percent: r.paymentPercentage, date: toDateValue(r.dateOfPayment),
        amount: nz(r.amountInInr), mode: r.modeOfPayment, utr: r.utrOrBankDetails,
      } : blankRow(c);
    }),
    sourceOfBooking: b.sourceOfBooking,
    channelPartner: b.channelPartner, cpCode: b.cpCode,
    attachedDocs: b.attachedClientDocuments,
    bookingFormDate: toDateValue(b.bookingFormDate),
  };
}