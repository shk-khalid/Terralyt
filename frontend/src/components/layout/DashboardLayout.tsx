import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-esg-ivory">
      {/* Sticky navigation sidebar */}
      <Sidebar />

      {/* Main app viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden ml-20 xl:ml-0">
        {/* Top controls and alert feed */}
        <Navbar />

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-8 w-full fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
