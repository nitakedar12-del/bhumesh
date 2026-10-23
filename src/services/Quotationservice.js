import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy,
  query, updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase/config';
import { MAP_ID } from '../config/site';
import { fromDoc } from '../lib/Quote';

export const QUOTATIONS = 'ozen_booking_forms';

const col = () => collection(db, QUOTATIONS);

const ts = (v) => {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const t = (v instanceof Date ? v : new Date(v)).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/* Field names a quotation's owner uid might be stored under. */
const OWNER_FIELDS = [
  'createdByUid', 'created_by_uid', 'createdBy', 'employeeId',
  'employeeUid', 'userId', 'uid',
];

const ownedBy = (raw, uid) =>
  OWNER_FIELDS.some((f) => raw[f] != null && String(raw[f]) === String(uid));

export async function createQuotation(data) {
  const ref = await addDoc(col(), data);
  return ref.id;
}

export function updateQuotation(id, data) {
  return updateDoc(doc(db, QUOTATIONS, id), data);
}

export function deleteQuotation(id) {
  return deleteDoc(doc(db, QUOTATIONS, id));
}

export async function getQuotation(id) {
  const snap = await getDoc(doc(db, QUOTATIONS, id));
  return snap.exists() ? fromDoc(snap.data(), snap.id) : null;
}

export function watchAllQuotations(onChange, onError) {
  return onSnapshot(
    query(col(), orderBy('quotationDate', 'desc')),
    (snap) => onChange(snap.docs.map((d) => fromDoc(d.data(), d.id))),
    onError,
  );
}

/**
 * Live quotations for one employee. No composite index needed.
 * Reads the collection and matches the owner in JS, so it still works
 * when the owner field has a different name in older documents.
 */
export function watchEmployeeQuotations(uid, onChange, onError) {
  return onSnapshot(
    col(),
    (snap) => {
      try {
        const all = snap.docs.map((d) => ({ id: d.id, raw: d.data() }));
        console.log('[quotations] total docs:', all.length, 'my uid:', uid);
        all.forEach((x) => console.log('[quotations]', x.id, x.raw));

        // TEMPORARY: no owner filter, so every document shows.
        const list = all.map((x) => fromDoc(x.raw, x.id));
        list.sort((a, b) => ts(b.quotationDate) - ts(a.quotationDate));
        onChange(list);
      } catch (e) {
        // fromDoc throwing here would otherwise leave the list stuck on "Loading"
        console.error('[quotations] processing failed', e);
        onError(e);
      }
    },
    onError,
  );
}

export async function fetchMaps() {
  const snap = await getDoc(doc(db, 'maps', MAP_ID));
  if (!snap.exists()) return [];
  const map = { id: snap.id, ...snap.data() };
  return map.isEnabled === false ? [] : [map];
}


// // services/Bookingservice.js — mirror of Quotationservice.js.
// import {
//   addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where,
// } from 'firebase/firestore';
// import { db } from '../firebase/config';
// import { fromDoc } from '../lib/Quote';

// const COL = 'ozen_booking_forms'; // same collection the Flutter app uses

// export const createBooking = async (data) => (await addDoc(collection(db, COL), data)).id;
// export const updateBooking = (id, data) => updateDoc(doc(db, COL, id), data);
// export const deleteBooking = (id) => deleteDoc(doc(db, COL, id));

// const byDateDesc = (a, b) => b.bookingFormDate - a.bookingFormDate;

// /* Filtering on createdByUid AND ordering on another field needs a composite
//    index in Firestore. Sorting client-side avoids that setup entirely. */
// export const watchEmployeeBookings = (uid, onChange, onError) => onSnapshot(
//   query(collection(db, COL), where('createdByUid', '==', uid)),
//   (snap) => onChange(snap.docs.map((d) => fromDoc(d.data(), d.id)).sort(byDateDesc)),
//   onError,
// );

// export const watchAllBookings = (onChange, onError) => onSnapshot(
//   query(collection(db, COL), orderBy('bookingFormDate', 'desc')),
//   (snap) => onChange(snap.docs.map((d) => fromDoc(d.data(), d.id))),
//   onError,
// );
// export async function fetchMaps() {
//   const snap = await getDoc(doc(db, 'maps', MAP_ID));
//   if (!snap.exists()) return [];
//   const map = { id: snap.id, ...snap.data() };
//   return map.isEnabled === false ? [] : [map];
// }
// // export function watchEmployeeQuotations(uid, onChange, onError) {
// //   return onSnapshot(
// //     col(),
// //     (snap) => {
// //       try {
// //         const all = snap.docs.map((d) => ({ id: d.id, raw: d.data() }));
// //         console.log('[quotations] total docs:', all.length, 'my uid:', uid);
// //         all.forEach((x) => console.log('[quotations]', x.id, x.raw));

// //         // TEMPORARY: no owner filter, so every document shows.
// //         const list = all.map((x) => fromDoc(x.raw, x.id));
// //         list.sort((a, b) => ts(b.quotationDate) - ts(a.quotationDate));
// //         onChange(list);
// //       } catch (e) {
// //         // fromDoc throwing here would otherwise leave the list stuck on "Loading"
// //         console.error('[quotations] processing failed', e);
// //         onError(e);
// //       }
// //     },
// //     onError,
// //   );
// // }