import React from 'react';

const BottomAuth = () => {
  return (
    <footer className="bg-white border-t border-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-full mx-auto px-6 lg:px-[88px] h-[64px] flex items-center justify-between text-[11px] text-[#9CA3AF]">
        <div>© 2025 Bond Room Platform. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[#36323D]">Privacy</a>
          <a href="#" className="hover:text-[#36323D]">Terms</a>
          <a href="#" className="hover:text-[#36323D]">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default BottomAuth;
