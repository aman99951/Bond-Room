import React from 'react';
import logo from '../assets/Logo.png';

const BottomAuth = () => {
  return (
    <footer className="bg-accent text-gray-300 text-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-4 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Bond Room" className="h-8 w-auto" />
        </div>
        <div className="text-[11px] text-subtle text-center">© 2025 Bond Room Platform. All rights reserved.</div>
        <div className="flex items-center gap-4 text-[11px] text-subtle">
          <a href="#" className="hover:text-gray-200">Privacy</a>
          <a href="#" className="hover:text-gray-200">Terms</a>
          <a href="#" className="hover:text-gray-200">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default BottomAuth;
