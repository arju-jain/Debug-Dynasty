import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#020817] text-[#F1F7FF] transition-colors duration-200 antialiased selection:bg-[#087CFF]/30 selection:text-[#22D3EE]">
      {/* Top Navigation Bar matching reference design */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
