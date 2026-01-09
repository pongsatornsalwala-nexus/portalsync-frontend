
import React, { useState } from 'react';
import { Worksite } from '../types';

type ComplianceLogic = 'days' | 'fixed';

const WorksiteConfig: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [logic, setLogic] = useState<ComplianceLogic>('days');
  const [ssfSync, setSsfSync] = useState(true);
  const [aiaSync, setAiaSync] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('fa-building');
  
  const [sites, setSites] = useState<Worksite[]>([
    { id: '1', name: 'Main Office', icon: 'fa-building', color: 'blue', hireLimit: 30, resignLimit: 15, syncSSF: true, syncAIA: true },
    { id: '2', name: 'Factory Site A', icon: 'fa-industry', color: 'emerald', hireLimit: 45, resignLimit: 10, syncSSF: true, syncAIA: false },
    { id: '3', name: 'Branch East', icon: 'fa-shop', color: 'orange', hireLimit: 15, resignLimit: 5, syncSSF: false, syncAIA: true },
  ]);

  const availableIcons = ['fa-building', 'fa-industry', 'fa-shop', 'fa-warehouse', 'fa-truck-fast', 'fa-microchip'];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Worksite Management</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Configure sync policies per location</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-3"
        >
          <i className="fa-solid fa-plus"></i> New Worksite
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div key={site.id} className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-100/50 transition-all group relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-${site.color}-600`}>
              <i className={`fa-solid ${site.icon} text-8xl`}></i>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-xl bg-${site.color}-50 text-${site.color}-600 shadow-inner`}>
                  <i className={`fa-solid ${site.icon}`}></i>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">{site.name}</h4>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: WS-{site.id.padStart(3, '0')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Registration</p>
                   <p className="text-sm font-black text-slate-700">{site.hireLimit} Days</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Resignation</p>
                   <p className="text-sm font-black text-slate-700">{site.resignLimit} Days</p>
                </div>
              </div>

              <div className="flex gap-2">
                {site.syncSSF && (
                  <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">SSF Sync Active</span>
                )}
                {site.syncAIA && (
                  <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-4 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest">AIA Sync Active</span>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Edit Policy</button>
              <button className="w-8 h-8 rounded-full hover:bg-slate-50 text-slate-200 hover:text-slate-400 transition-colors flex items-center justify-center">
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="p-12 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-widest">New Site</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Define location identity and rules</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-slate-500 transition-all flex items-center justify-center">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identify Worksite</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" className="col-span-1 w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold" placeholder="Worksite Name" />
                    <div className="relative">
                      <select className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold appearance-none">
                        <option>Blue Theme</option>
                        <option>Emerald Theme</option>
                        <option>Orange Theme</option>
                        <option>Purple Theme</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-6 top-5 text-slate-300 pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Visual Icon</label>
                  <div className="grid grid-cols-6 gap-3">
                    {availableIcons.map(icon => (
                      <button 
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${selectedIcon === icon ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-110' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                      >
                        <i className={`fa-solid ${icon}`}></i>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sync Engine Selection</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSsfSync(!ssfSync)}
                      className={`flex items-center gap-3 justify-center border-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${ssfSync ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-50' : 'border-slate-100 text-slate-300 hover:bg-slate-50'}`}
                    >
                      <i className="fa-solid fa-shield"></i> SSF Sync
                    </button>
                    <button 
                      onClick={() => setAiaSync(!aiaSync)}
                      className={`flex items-center gap-3 justify-center border-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${aiaSync ? 'border-rose-600 bg-rose-50 text-rose-600 shadow-lg shadow-rose-50' : 'border-slate-100 text-slate-300 hover:bg-slate-50'}`}
                    >
                      <i className="fa-solid fa-heart-pulse"></i> AIA Sync
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Processing Window Logic</label>
                   <div className="flex bg-slate-100 p-1.5 rounded-[22px]">
                      <button 
                        onClick={() => setLogic('days')}
                        className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${logic === 'days' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                      >
                        Rolling (Within X Days)
                      </button>
                      <button 
                        onClick={() => setLogic('fixed')}
                        className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${logic === 'fixed' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                      >
                        Fixed (Specific Date)
                      </button>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-12 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest">Abandon</button>
              <button onClick={() => setShowModal(false)} className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                <i className="fa-solid fa-check"></i> Register Worksite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorksiteConfig;
