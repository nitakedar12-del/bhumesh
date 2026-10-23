// // components/map/MapHeader.jsx
// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// import prospera from '../../assets/logo.jpeg';
// import infra from '../../assets/map-logo.jpeg';
// import '../../styles/home.css';

// export default function MapHeader({ onBack }) {
//   const navigate = useNavigate();
//   const back = onBack || (() => navigate("/"));

//   return (
//     <div className="mh">
//       <button type="button" className="mh-back" onClick={back} aria-label="Back">
//         ‹
//       </button>
//       <div className="mh-logos">
//         <img src={prospera} alt="Prospera Saraswati" className="mh-logo" />
//         <span className="mh-rule" />
//         <img src={infra} alt="Saraswati Infra" className="mh-logo" />
//       </div>
//     </div>
//   );
// }




// components/map/MapHeader.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import prospera from '../../assets/logo.jpeg';
// import infra from '../../assets/map-logo.jpeg';
import '../../styles/home.css';

export default function MapHeader({ onBack, showBack }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  /* A share link opens on a device that has no app behind it — no map
     list, often no session. "Back" there lands the customer on a page
     they were never meant to see, so the control is not rendered at all
     rather than disabled: a dead arrow invites the tap that a missing
     one never gets.

     An explicit showBack from the parent always wins; this is only the
     default for routes that mount the viewer directly. */
  const isShared = pathname.startsWith('/share')
    || new URLSearchParams(search).has('share');

  const visible = showBack ?? !isShared;
  const back = onBack || (() => navigate('/'));

  return (
    <div className="mh">
      {visible ? (
        <button type="button" className="mh-back" onClick={back} aria-label="Back">
          ‹
        </button>
      ) : (
        /* Holds the column the button occupied. Without it the logos
           slide left on shared links only, so the layout the customer
           sees is not the one you checked internally. */
        // <span className="mh-back mh-back--placeholder" aria-hidden="true" />
        ""
      )}
      <div className="mh-logos">
        <img src={prospera} alt="Prospera Saraswati" className="mh-logo" />
        <span className="mh-rule" />
        {/* <img src={infra} alt="Saraswati Infra" className="mh-logo" /> */}
      </div>
    </div>
  );
}