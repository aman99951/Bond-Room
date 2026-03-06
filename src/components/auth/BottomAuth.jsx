import React from 'react';

const BottomAuth = () => {
  return (
    <footer className="bg-white border-t border-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 py-3 text-[11px] text-[#9CA3AF] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10 xl:px-14">
        <div className="text-center sm:text-left">(c) 2025 Bond Room Platform. All rights reserved.</div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end sm:gap-6">
          <a href="#" className="hover:text-[#36323D]">Privacy</a>
          <a href="#" className="hover:text-[#36323D]">Terms</a>
          <a href="#" className="hover:text-[#36323D]">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default BottomAuth;
