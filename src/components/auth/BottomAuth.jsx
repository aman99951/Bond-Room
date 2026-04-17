import React from 'react';

const BottomAuth = () => {
  return (
    <footer
      className="border-t border-[color:var(--theme-v-hero-border)] bg-[linear-gradient(180deg,var(--theme-v-bg-mid)_0%,var(--theme-v-bg-end)_100%)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 py-3 text-[11px] text-[color:var(--theme-v-text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10 xl:px-14">
        <div className="text-center sm:text-left">(c) 2026 Bond Room Platform. All rights reserved.</div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end sm:gap-6">
          <a href="#" className="text-[color:var(--theme-v-nav-text)] hover:text-[color:var(--theme-v-nav-hover-text)]">Privacy</a>
          <a href="#" className="text-[color:var(--theme-v-nav-text)] hover:text-[color:var(--theme-v-nav-hover-text)]">Terms</a>
          <a href="#" className="text-[color:var(--theme-v-nav-text)] hover:text-[color:var(--theme-v-nav-hover-text)]">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default BottomAuth;
