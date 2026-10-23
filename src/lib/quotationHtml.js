// lib/bookingHtml.js — the printed booking form, as a 2-page A4 HTML document.
// Same approach as quotationHtml.js: a separate window, window.print(),
// "Save as PDF" from the browser's print sheet. No PDF library.

import logoAsset from '../assets/logo.jpeg';

const NAVY = '#1F3864';
const LABEL = '#DCE6F1';
const LINE = '#616161';
const HILITE = '#BEE3B0';
const ALT = '#F2F6FB';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const money = (n) => (n ? Math.round(n).toLocaleString('en-IN') : '');
const dfmt = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-GB');
};

const c = (text, { l = false, f = 1, center = false, bg = '' } = {}) => `
  <div class="c${l ? ' l' : ''}${center ? ' ctr' : ''}" style="flex:${f}${bg ? `;background:${bg}` : ''}">${esc(text)}</div>`;
const row1 = (label, value) => `<div class="r">${c(label, { l: true })}${c(value, { f: 3 })}</div>`;
const row2 = (l1, v1, l2, v2) => `<div class="r">${c(l1, { l: true })}${c(v1)}${c(l2, { l: true })}${c(v2)}</div>`;
const sect = (t) => `<div class="sect">${esc(t)}</div>`;

const SOURCES = ['CHANNEL PARTNER', 'PAPER ADVERTISE', 'HOARDING', 'WEBSITE', 'SELF ENQUIRY'];

const TERMS = [
  'Stamp duty, registration charges, applicable GST, taxes (present or future), legal charges, electricity charges, maintenance charges, and all other statutory levies as per prevailing laws shall be borne exclusively by the proposed purchaser.',
  'All payments shall be made in favour of OZEN INFRASTRUCTURE or its designated group/entity, as may be communicated in writing from time to time.',
  'The Company reserves the sole and absolute right to amend, alter, revise and modify any part of the Project including plans, layouts, amenities, specifications, terms, rates, deposits, or charges. Any such changes shall be binding on the proposed purchaser.',
  "Down-Payment Policy: In the event the purchaser defers or fails to make the down-payment as per the agreed payment schedule for a period exceeding two (2) months, the Company shall have the right to either: (a) apply the prevailing market rate set by Ozen for the same project to the said booking; or (b) cancel the booking without requiring any written cancellation request from the purchaser. In case of such cancellation, the entire booking amount shall be refunded in full to the purchaser's original bank account within thirty (30) days from the date of cancellation.",
  "Payment Instalment Policy: If the purchaser defaults in payment of any instalment for a period exceeding two (2) months, the Company shall be entitled, at its sole discretion, to: (a) apply the current market rate without any discount, retrospectively and prospectively, to the entire booking; or (b) cancel the booking in lieu of levying penalties. Further, should the proposed purchaser elect to cancel the booking under such circumstances, the Company shall be entitled to levy a penalty equivalent to ten percent (10%) of the total plot value, in accordance with applicable RERA guidelines, and the balance amount, if any, shall be refunded subject to due documentation. The Company's decision in this regard shall be final and binding.",
  'Cheque dishonour charges of INR 500/- per instance shall be payable by the proposed purchaser.',
  "Acceptance of any payment towards booking or reservation shall be subject to the Project's applicable brochure, payment plan, commercial terms, statutory approvals, and government rules and regulations in force from time to time.",
  'The Project brochure and marketing material are for illustrative purposes only and do not constitute part of any legally binding document.',
  'The Courts having jurisdiction over the Project location shall have exclusive jurisdiction over all matters arising out of or relating to the booking and the Project.',
  'In the event the proposed purchaser fails to remit the full and final payment within two (2) months from the date of issuance of the Release Letter / Final Demand Letter, the prevailing market rate as determined by the Company, without any discount, shall become applicable to the said booking.',
];

export function bookingHtml(b, { logo = '' } = {}) {
  const sel = (b.sourceOfBooking || '').toUpperCase();
  const pay = (b.paymentRows || []).map((r, i) => `
    <tr style="background:${i % 2 === 0 ? ALT : '#fff'}">
      <td class="lab">${esc(r.condition)}</td>
      <td>${r.paymentPercentage ? `${esc(r.paymentPercentage)}%` : ''}</td>
      <td>${dfmt(r.dateOfPayment)}</td>
      <td>${money(r.amountInInr)}</td>
      <td>${esc(r.modeOfPayment)}</td>
      <td>${esc(r.utrOrBankDetails)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Booking ${esc(b.applicantName)} ${esc(b.plotNo)}</title>
<style>
  @page { size: A4; margin: 8mm 9mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Noto Sans','Inter',system-ui,sans-serif; color: #212121;
         font-size: 7.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .head { display: flex; align-items: center; margin-bottom: 8px; }
  .head h1 { flex: 1; margin: 0; font-size: 15pt; }
  .head img { height: 42px; width: 90px; object-fit: contain; }
  .title { background: ${NAVY}; color: #fff; font-weight: 700; font-size: 8pt;
           padding: 3px 5px; border: .4pt solid ${LINE}; margin-bottom: 4px; }
  .sect { background: ${LABEL}; color: ${NAVY}; font-weight: 700; font-size: 8pt;
          text-align: center; padding: 3px 0; border: .4pt solid ${LINE}; }
  .r { display: flex; height: 18px; }
  .c { border: .4pt solid ${LINE}; margin: 0 -.2pt -.4pt 0; padding: 0 5px; display: flex;
       align-items: center; overflow: hidden; background: #fff; }
  .c.l { background: ${LABEL}; color: ${NAVY}; font-weight: 700; font-size: 6.8pt; }
  .c.ctr { justify-content: center; font-size: 6.2pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 0; }
  th { background: ${NAVY}; color: #fff; font-size: 6.5pt; padding: 4px 3px; border: .4pt solid ${LINE}; }
  td { border: .4pt solid ${LINE}; padding: 4px 3px; text-align: center; font-size: 7pt; height: 19px; }
  td.lab { text-align: left; color: ${NAVY}; font-weight: 700; font-size: 6.8pt; }
  .gap { height: 4px; }
  .thanks { font-style: italic; margin: 12px 0 20px; }
  .sigs { display: flex; gap: 30px; }
  .sigs > div { flex: 1; text-align: center; font-weight: 700; }
  .box { height: 46px; border: .4pt solid ${LINE}; margin-bottom: 3px; }
  /* page 2 */
  .tc h2 { text-align: center; font-size: 14pt; margin: 0 0 14px; }
  .tc .t { display: flex; margin-bottom: 6px; font-size: 8pt; line-height: 1.35; text-align: justify; }
  .tc .n { width: 16px; flex: none; font-weight: 700; color: ${NAVY}; }
  .decl { text-align: center; margin-top: 14px; }
  .decl b { font-size: 10pt; text-decoration: underline; }
  .decl p { font-size: 8.5pt; line-height: 1.4; margin: 10px 0 0; }
  .foot { display: flex; align-items: flex-end; margin-top: 60px; font-size: 9pt; }
  .foot > div:first-child { flex: 1; }
  .foot .sig { width: 110px; height: 70px; border: .6pt solid ${LINE}; margin: 0 auto 4px; }
</style></head>
<body>
<div class="page">
  <div class="head"><h1>OZEN INFRASTRUCTURE</h1>${logo ? `<img src="${esc(logo)}" alt="">` : ''}</div>
  <div class="title">QUOTATION FORM</div>

  ${sect('PERSONAL DETAILS')}
  ${row1('APPLICANT :', '')}
  ${row1('NAME', b.applicantName)}
  ${row2('AGE', b.applicantAge, 'MOBILE NO.', b.applicantMobile)}
  ${row1('PERMANENT ADDRESS', b.applicantPermanentAddress)}
  ${row2('PAN NUMBER', b.applicantPanNumber, 'DATE OF BIRTH', dfmt(b.applicantDob))}
  ${row1('CO-APPLICANT :', '')}
  ${row1('NAME', b.coApplicantName)}
  ${row2('AGE', b.coApplicantAge, 'MOBILE NO.', b.coApplicantMobile)}
  ${row1('ADDRESS', b.coApplicantAddress)}
  ${row2('PAN NUMBER', b.coApplicantPanNumber, 'DATE OF BIRTH', dfmt(b.coApplicantDob))}

  <div class="gap"></div>
  ${sect('PROJECT DETAILS')}
  ${row2('PROJECT NAME', b.projectName, 'PLOT NO.', b.plotNo)}
  ${row2('PLOT AREA IN SQ.FT.', b.plotAreaSqFt ? String(b.plotAreaSqFt) : '', 'PLOT RATE PER SQ.FT.', money(b.plotRatePerSqFt))}
  ${row2('MAINTENANCE CHARGES', money(b.maintenanceCharges), 'CLUB MEMBERSHIP', money(b.clubMembership))}
  ${row1('TOTAL PLOT VALUE', money(b.totalPlotValue))}

  <div class="gap"></div>
  ${sect('PAYMENT PLAN')}
  <table>
    <colgroup><col style="width:22%"><col style="width:11%"><col style="width:13%"><col style="width:14%"><col style="width:13%"><col style="width:17%"></colgroup>
    <tr><th>PAYMENT CONDITION</th><th>PAYMENT %</th><th>DATE OF PAYMENT</th><th>AMOUNT IN INR</th><th>MODE OF PAYMENT</th><th>UTR NO./ BANK DETAILS</th></tr>
    ${pay}
  </table>

  <div class="gap"></div>
  ${sect('BOOKING DETAILS')}
  <div class="r">
    ${c('SOURCE OF BOOKING', { l: true, f: 2 })}
    ${SOURCES.map((s) => c(s, { f: 2, center: true, bg: sel && s === sel ? HILITE : '' })).join('')}
  </div>
  ${row2('CHANNEL PARTNER', b.channelPartner, 'CP CODE', b.cpCode)}
  ${row1("ATTACHED CLIENT'S DOCUMENTS", b.attachedClientDocuments)}

  <div class="thanks">We thank you for booking with us and for placing your trust in the Project. The booking is subject to applicable terms and conditions.</div>
  <div class="sigs">
    <div><div class="box"></div>SIGNATURE OF CLIENT</div>
    <div><div class="box"></div>SIGNATURE OF AUTHORISED SIGNATORY</div>
  </div>
</div>

<div class="page tc">
  <h2>TERMS AND CONDITION</h2>
  ${TERMS.map((t, i) => `<div class="t"><span class="n">${i + 1}.</span><span>${esc(t)}</span></div>`).join('')}
  <div class="decl">
    <b>DECLARATION</b>
    <p>I declare that I have fully read, heard and understood the project layout, plot plan and methodology<br>and terms and conditions of the company. I agree with all the terms and conditions of the company.</p>
  </div>
  <div class="foot">
    <div>Date :- ${dfmt(b.bookingFormDate)}<br><br>Place :- ______________________</div>
    <div style="text-align:center"><div class="sig"></div><b style="font-size:8pt">Buyer's Signature</b></div>
  </div>
</div>
</body></html>`;
}

/* Backwards-compatible alias, in case anything still imports the old name. */
export const quotationHtml = bookingHtml;

let cachedLogo = null;
async function logoAsDataUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:')) return src;
  if (cachedLogo) return cachedLogo;
  try {
    const blob = await (await fetch(src)).blob();
    cachedLogo = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return cachedLogo;
  } catch {
    return new URL(src, window.location.href).href;
  }
}

/* Window opened synchronously (before any await) so the pop-up blocker
   ties it to the click. Printing waits on images, not on w.onload. */
async function openBookingWindow(b, opts = {}, print) {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) return false;
  const logo = await logoAsDataUrl(opts.logo ?? logoAsset);
  w.document.write(bookingHtml(b, { ...opts, logo }));
  w.document.close();
  if (print) {
    await Promise.all([...w.document.images].map((img) => (img.complete
      ? null : new Promise((resolve) => { img.onload = img.onerror = resolve; }))));
    w.focus();
    w.print();
  }
  return true;
}

export const printBooking = (b, opts) => openBookingWindow(b, opts, true);
export const previewBooking = (b, opts) => openBookingWindow(b, opts, false);