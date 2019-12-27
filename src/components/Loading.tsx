import * as React from 'react';

export const LoadingSpinner = () => {
  return (
    <div style={{ lineHeight: "100vh" }}>
      <div
        style={{
          verticalAlign: "middle",
          width: "80px",
          height: "auto",

          fill: "white",
          margin: "0 auto",
          zIndex: 999
        }}
      >
        <svg
          version="1.1"
          viewBox="0 0 352.4 352.4"
          preserveAspectRatio="none"
          style={{ overflow: "unset" }}
        >
          <g
            className="rotating"
            style={{ transformOrigin: "50% 50%", padding: "120px" }}
          >
            <g>
              <g>
                <path
                  d="M332.6,16.4C322.2,6,308.2,0,292.6,0h-54v21.6h53.6c9.6,0,18.4,4,24.8,10.4c6.4,6.4,10.4,15.2,10.4,24.8V114H349V56.4
C349,40.8,342.6,26.8,332.6,16.4z"
                />
                <path
                  d="M35.4,320C29,313.6,25,304.8,25,295.2v-56.8H3.4v57.2c0,15.6,6.4,29.6,16.4,40c10.8,10,24.8,16.4,40.4,16.4h53.6v-21.6
H60.2C50.6,330.4,41.8,326.4,35.4,320z"
                />
                <path
                  d="M327,295.6c0,9.6-4,18.4-10.4,24.8c-6.4,6.4-15.2,10.4-24.8,10.4h-53.2v21.6h53.6c15.6,0,29.6-6.4,40-16.4
c10.4-10.4,16.4-24.4,16.4-40v-57.6H327V295.6z"
                />
                <path
                  d="M20.2,16.4C9.8,26.8,3.8,40.8,3.8,56.4v57.2h21.6V56.4c0-9.6,4-18.4,10.4-24.8c6.4-6.4,15.2-10.4,24.8-10.4h53.6V0h-54
C44.6,0,30.6,6.4,20.2,16.4z"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
