'use client';

import Script from 'next/script';

export default function PaddleLoader({ vendorId }) {
  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/paddle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window.Paddle !== 'undefined') {
            // 대소문자 구분 없이 Setup/setup 모두 시도
            const setupFn = window.Paddle.Setup || window.Paddle.setup;
            if (typeof setupFn === 'function') {
              setupFn({ vendor: vendorId });
              console.log("✅ Paddle SDK Initialized (onLoad)");
            }
          }
        }}
      />
      <Script id="paddle-init-inline" strategy="afterInteractive">
        {`
          (function() {
            function init() {
              if (typeof window.Paddle !== 'undefined') {
                const setupFn = window.Paddle.Setup || window.Paddle.setup;
                if (typeof setupFn === 'function') {
                  setupFn({ vendor: ${vendorId} });
                  console.log("✅ Paddle Setup Complete via inline check");
                }
              }
            }
            init();
            window.addEventListener('load', init);
          })();
        `}
      </Script>
    </>
  );
}