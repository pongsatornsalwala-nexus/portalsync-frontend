
import React, { useState } from 'react';
import { RegistrationType, BenefitType } from '../types';

const SummaryReport: React.FC = () => {
  const [activeRegType, setActiveRegType] = useState<RegistrationType>(RegistrationType.REGISTER_IN);
  const [selectedSite, setSelectedSite] = useState<string>('All');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  
  const registerInData = [
  { date: '2025-01-10', name: 'Somchai Saetang', site: 'Main Office', benefit: BenefitType.SSF, detail: 'Siriraj Hospital', status: 'Verified' },
  { date: '2025-01-12', name: 'Jane Smith', site: 'Branch East', benefit: BenefitType.AIA, detail: 'Plan 200 - Mid', status: 'Reported' },
  { date: '2025-01-15', name: 'Wichai Ubol', site: 'Factory Site A', benefit: BenefitType.SSF, detail: 'Vajira Hospital', status: 'Pending' },
  { date: '2025-01-18', name: 'Pim Rattana', site: 'Main Office', benefit: BenefitType.AIA, detail: 'Plan 300 - Premium', status: 'Verified' },
  { date: '2025-01-20', name: 'Niran Chakri', site: 'Factory Site A', benefit: BenefitType.SSF, detail: 'Ramathibodi Hospital', status: 'Verified' },
  { date: '2025-01-22', name: 'Sarah Johnson', site: 'Branch East', benefit: BenefitType.AIA, detail: 'Plan 150 - Basic', status: 'Pending' },
  { date: '2025-01-25', name: 'Apinya Somwang', site: 'Main Office', benefit: BenefitType.SSF, detail: 'Chulalongkorn Hospital', status: 'Reported' },
  { date: '2025-02-01', name: 'David Chen', site: 'Factory Site A', benefit: BenefitType.AIA, detail: 'Plan 200 - Mid', status: 'Verified' },
  { date: '2025-02-05', name: 'Suraphon Kasem', site: 'Branch East', benefit: BenefitType.SSF, detail: 'Bumrungrad Hospital', status: 'Verified' },
  { date: '2025-02-08', name: 'Maria Santos', site: 'Main Office', benefit: BenefitType.AIA, detail: 'Plan 300 - Premium', status: 'Pending' },
  { date: '2025-02-12', name: 'Thanawat Porn', site: 'Factory Site A', benefit: BenefitType.SSF, detail: 'Siriraj Hospital', status: 'Reported' },
  { date: '2025-02-15', name: 'Emily Watson', site: 'Branch East', benefit: BenefitType.AIA, detail: 'Plan 200 - Mid', status: 'Verified' },
  { date: '2025-03-01', name: 'Krit Somchai', site: 'Main Office', benefit: BenefitType.SSF, detail: 'Phramongkutklao Hospital', status: 'Pending' },
  { date: '2025-03-05', name: 'Lisa Anderson', site: 'Factory Site A', benefit: BenefitType.AIA, detail: 'Plan 150 - Basic', status: 'Verified' },
];

  const resignationData = [
  { date: '2025-01-05', name: 'Wichai Ubol', site: 'Factory Site A', benefit: BenefitType.SSF, reason: 'Voluntary Resign', status: 'Verified' },
  { date: '2025-01-08', name: 'Ananda Dev', site: 'Main Office', benefit: BenefitType.AIA, reason: 'Death', status: 'Pending' },
  { date: '2025-01-20', name: 'Robert Lee', site: 'Branch East', benefit: BenefitType.SSF, reason: 'Voluntary Resign', status: 'Verified' },
  { date: '2025-02-03', name: 'Sumitra Kaew', site: 'Main Office', benefit: BenefitType.AIA, reason: 'Retirement', status: 'Reported' },
  { date: '2025-02-10', name: 'James Wilson', site: 'Factory Site A', benefit: BenefitType.SSF, reason: 'Voluntary Resign', status: 'Verified' },
  { date: '2025-02-18', name: 'Pranee Thong', site: 'Branch East', benefit: BenefitType.AIA, reason: 'Contract End', status: 'Pending' },
  { date: '2025-02-25', name: 'Michael Brown', site: 'Main Office', benefit: BenefitType.SSF, reason: 'Voluntary Resign', status: 'Verified' },
  { date: '2025-03-02', name: 'Natasha Kumar', site: 'Factory Site A', benefit: BenefitType.AIA, reason: 'Retirement', status: 'Reported' },
];

  const handleExport = (type: 'csv' | 'pdf') => {
    const data = activeRegType === RegistrationType.REGISTER_IN ? registerInData : resignationData;
    if (data.length === 0) return;
    
    if (type === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," 
        + Object.keys(data[0]).join(",") + "\n"
        + data.map(row => Object.values(row).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PortalSync_Report_${activeRegType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("PDF Export Engine Initialized... Rendering high-fidelity audit report.");
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
      {/* High-Level Toggle Container */}
      <div className="bg-white p-3 rounded-[40px] shadow-sm border border-slate-100 flex gap-4">
        <button 
          onClick={() => setActiveRegType(RegistrationType.REGISTER_IN)}
          className={`flex-1 py-6 rounded-[32px] text-xs font-black tracking-[0.2em] transition-all uppercase flex items-center justify-center gap-4 ${activeRegType === RegistrationType.REGISTER_IN ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeRegType === RegistrationType.REGISTER_IN ? 'bg-blue-500' : 'bg-slate-100'}`}>
            <i className="fa-solid fa-user-plus text-xs"></i>
          </div>
          Register In Registry
        </button>
        <button 
          onClick={() => setActiveRegType(RegistrationType.REGISTER_OUT)}
          className={`flex-1 py-6 rounded-[32px] text-xs font-black tracking-[0.2em] transition-all uppercase flex items-center justify-center gap-4 ${activeRegType === RegistrationType.REGISTER_OUT ? 'bg-rose-600 text-white shadow-2xl shadow-rose-200' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeRegType === RegistrationType.REGISTER_OUT ? 'bg-rose-400' : 'bg-slate-100'}`}>
            <i className="fa-solid fa-user-minus text-xs"></i>
          </div>
          Employee Exit Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Advanced Filters */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[56px] shadow-sm border border-slate-100 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="font-black flex items-center gap-3 text-slate-800 uppercase text-[10px] tracking-[0.3em]">
              <div className="w-2 h-4 bg-blue-600 rounded-full"></div> Audit Query Parameters
            </h3>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Reset All Filters</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 ml-1 uppercase tracking-widest">Worksite</label>
              <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer">
                <option value="All">All Global Sites</option>
                <option value="Main Office">Main Office</option>
                <option value="Factory Site A">Factory Site A</option>
                <option value="Branch East">Branch East</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 ml-1 uppercase tracking-widest">Provider</label>
              <select value = {selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer">
                <option value="All">All Providers</option>
                <option value="SSF">Social Security (SSF)</option>
                <option value="AIA">Group AIA</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 ml-1 uppercase tracking-widest">Audit Period</label>
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer">
                <option value="All">All Time</option>
                <option value="January">January 2025</option>
                <option value="February">February 2025</option>
                <option value="March">March 2025</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
             <button className="flex-1 bg-slate-900 text-white font-black py-5 rounded-2xl text-[10px] tracking-widest uppercase shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all">
                Run Audit Report
             </button>
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm font-bold text-slate-700">Selected Site: {selectedSite}</p>
                <p className="text-sm font-bold text-slate-700">Selected Provider: {selectedProvider}</p>
                <p className="text-sm font-bold text-slate-700">Selected Period: {selectedPeriod}</p>
             </div>
          </div>
        </div>

        {/* Quick Stats Widget */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-10 text-[180px] group-hover:scale-110 transition-transform duration-700">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Health</p>
              <h4 className="text-3xl font-black">98.4%</h4>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Unreported Cases</p>
                 <p className="text-lg font-black text-rose-400">3 Overdue</p>
              </div>
              <button onClick={() => handleExport('pdf')} className="w-full bg-white text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
                 Download Executive Summary (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-[56px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
          <div className="space-y-1">
            <h3 className="font-black text-2xl text-slate-800 uppercase tracking-widest">
              {activeRegType === RegistrationType.REGISTER_IN ? 'Registry Audit' : 'Exit Logbook'}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fiscal Cycle 2025 • Verified Data</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => handleExport('csv')} className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-8 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-600 hover:text-white transition-all shadow-sm uppercase">
                <i className="fa-solid fa-file-csv"></i> Export CSV
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] border-b border-slate-100">
                <th className="px-12 py-10">Timestamp</th>
                <th className="px-12 py-10">Entity Name</th>
                <th className="px-12 py-10">Site Location</th>
                <th className="px-12 py-10">Benefit Plan</th>
                {activeRegType === RegistrationType.REGISTER_IN ? (
                  <th className="px-12 py-10">Policy Details</th>
                ) : (
                  <th className="px-12 py-10">Closure Reason</th>
                )}
                <th className="px-12 py-10 text-right">Portal Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(activeRegType === RegistrationType.REGISTER_IN ? registerInData : resignationData).map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-12 py-8 text-xs font-mono font-bold text-slate-400">{item.date}</td>
                  <td className="px-12 py-8 font-black text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{item.name}</td>
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                       <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.site}</span>
                    </div>
                  </td>
                  <td className="px-12 py-8">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest border ${item.benefit === BenefitType.SSF ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {item.benefit}
                    </span>
                  </td>
                  <td className="px-12 py-8">
                    <span className="text-xs font-bold text-slate-400 italic">
                      {activeRegType === RegistrationType.REGISTER_IN ? (item as any).detail : (item as any).reason}
                    </span>
                  </td>
                  <td className="px-12 py-8 text-right">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full text-[9px] font-black tracking-widest uppercase">
                      <div className={`w-2 h-2 rounded-full ${item.status === 'Verified' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : item.status === 'Reported' ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-amber-500 animate-pulse'}`}></div>
                      <span className={item.status === 'Verified' ? 'text-emerald-600' : item.status === 'Reported' ? 'text-blue-600' : 'text-amber-600'}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryReport;
