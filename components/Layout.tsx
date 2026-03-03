
import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'employee', label: 'Employee', icon: 'fa-users' },
    { id: 'portalSync', label: 'Portal Sync', icon: 'fa-rotate' },
    { id: 'summary', label: 'Summary & Report', icon: 'fa-file-lines' },
    { id: 'worksite', label: 'Worksite', icon: 'fa-map-location-dot' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 fixed h-full z-20">
        <div className="p-10">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-base not-italic shadow-lg shadow-blue-100">
              <i className="fa-solid fa-link"></i>
            </div>
            Portal<span className="text-blue-600">Sync</span>
          </h1>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 font-bold translate-x-2' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="font-black uppercase tracking-widest text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-10 left-0 right-0 px-8">
           <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">System Health</p>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-slate-600">SSO API Connected</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        <div className="py-12 px-6">
          <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
            <h2 className="text-4xl font-black text-slate-900 capitalize tracking-tight">
              {activeTab === 'summary' ? 'Reporting Hub' : activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">PortalSync v1.0 • Unified Compliance Interface</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
