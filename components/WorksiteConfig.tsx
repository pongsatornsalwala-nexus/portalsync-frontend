
import React, { useState, useEffect } from 'react';
import { Worksite } from '../types';
import { getWorksites, createWorksite, updateWorksite, deleteWorksite } from '../services/apiService';

const WorksiteConfig: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [ssfSync, setSsfSync] = useState(true);
  const [aiaSync, setAiaSync] = useState(false);

type RegistrationSchedule = '1st' | '16th' | 'custom';

  // SSF schedule settings
  const [ssfSchedule, setSsfSchedule] = useState<RegistrationSchedule>('1st');
  const [ssfCustomDate, setSsfCustomDate] = useState<string>('');
  const [ssfResignLimit, setSsfResignLimit] = useState(15);

  // AIA schedule settings
  const [aiaSchedule, setAiaSchedule] = useState<RegistrationSchedule>('1st');
  const [aiaCustomDate, setAiaCustomDate] = useState<string>('');
  const [aiaResignLimit, setAiaResignLimit] = useState(15);

  const [selectedIcon, setSelectedIcon] = useState('fa-building');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteColor, setNewSiteColor] = useState('blue');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [sites, setSites] = useState<Worksite[]>([]);
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState<string | null>(null); // Track errors

  const availableIcons = ['fa-building', 'fa-industry', 'fa-shop', 'fa-warehouse', 'fa-truck-fast', 'fa-microchip'];

  useEffect(() => {
    const fetchWorksites = async () => {
      try {
        setLoading(true);
        const data = await getWorksites();
        setSites(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch worksites:', err);
        setError('Failed to load worksites. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorksites();
  }, []); // Empty array means "run once when component mounts"

  const resetForm = () => {
    setEditingId(null);
    setNewSiteName('');
    setNewSiteColor('blue');
    setSelectedIcon('fa-building');
    setSsfSync(true);
    setAiaSync(false);
    setSsfSchedule('1st');
    setSsfCustomDate('');
    setSsfResignLimit(15);
    setAiaSchedule('1st');
    setAiaCustomDate('');
    setAiaResignLimit(15);
  };

  const handleCreateWorksite = async () => {
    if (!newSiteName.trim()) {
      alert('Please enter a worksite name');
      return;
    }

    try {
      const worksiteData = {
        name: newSiteName,
        icon: selectedIcon,
        color: newSiteColor,
        syncSSF: ssfSync,
        syncAIA: aiaSync,
        ssfRegistrationSchedule: ssfSchedule,
        ssfCustomDate: ssfSchedule === 'custom' ? ssfCustomDate : null,
        ssfResignLimit,
        aiaRegistrationSchedule: aiaSchedule,
        aiaCustomDate: aiaSchedule === 'custom' ? aiaCustomDate : null,
        aiaResignLimit,
      };

      console.log('🔧 Edit mode?', !!editingId);
      console.log('🆔 Editing ID:', editingId);
      console.log('📦 Worksite data:', worksiteData);

      if (editingId) {
        console.log('📤 Calling updateWorksite with ID:', editingId);
        await updateWorksite(editingId, worksiteData);
      } else {
        console.log('📤 Calling createWorksite');
        await createWorksite(worksiteData);
      }

      const updatedSites = await getWorksites();
      setSites(updatedSites);

      // Reset form
      resetForm();
      setShowModal(false);

    } catch (error) {
      console.error('❌ Error saving worksite:', error);
      alert('Failed to save worksite. Please try again.');
    }
  };

  const handleDeleteWorksite = async (siteId: string) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this worksite?");

    if (confirmDelete) {
      try {
        // Call API to delete
        await deleteWorksite(siteId);

        // Refresh the list from database
        const updatedSites = await getWorksites();
        setSites(updatedSites);
      } catch (error) {
        console.error('Error deleting worksite:', error);
        alert('Failed to delete worksite. Please try again.');
      }
    }
  };

  const handleEditWorksite = (site: Worksite) => {
    // Load the site's data into the form
    setEditingId(site.id);
    setNewSiteName(site.name);
    setNewSiteColor(site.color);
    setSelectedIcon(site.icon);
    setSsfSync(site.syncSSF);
    setAiaSync(site.syncAIA);
    setSsfSchedule(site.ssfRegistrationSchedule);
    setSsfCustomDate(site.ssfCustomDate ?? '');
    setSsfResignLimit(site.ssfResignLimit);
    setAiaSchedule(site.aiaRegistrationSchedule);
    setAiaCustomDate(site.aiaCustomDate ?? '');
    setAiaResignLimit(site.aiaResignLimit);

    // Open the modal
    setShowModal(true);
  }

  const scheduleLabel = (schedule: string, customDate: string | null) => {
    const today = new Date();
    const currentDay = today.getDate();

    const next1st = new Date(today.getFullYear(), today.getMonth() + 1)
      .toLocaleString('en-US', { month: 'long' }) + ' 1st';

    const next16th = new Date(today.getFullYear(), currentDay < 16 ? today.getMonth() : today.getMonth() + 1)
      .toLocaleString('en-US', { month: 'long' }) + ' 16th';

    if (schedule === '1st') return next1st;
    if (schedule === '16th') return next16th;
    return customDate ? customDate : 'Custom Date';
  };

  const SchedulePicker = ({
    value,
    onChange,
    customDate,
    onCustomDateChange,
    accentColor,
  }: {
    value: RegistrationSchedule;
    onChange: (v: RegistrationSchedule) => void;
    customDate: string;
    onCustomDateChange: (v: string) => void;
    accentColor: 'blue' | 'rose';
  }) => {
    const active = accentColor === 'blue'
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
      : 'bg-rose-600 text-white shadow-lg shadow-rose-100';

    const today = new Date();
    const currentDay = today.getDate(); // e.g. 10

    // The next "1st" is always next month
    const next1stMonth = new Date(today.getFullYear(), today.getMonth() + 1);

    // The next "16th is THIS month if we haven't hit it yet, otherwise next month"
    const next16thMonth = new Date(
      today.getFullYear(),
      currentDay < 16 ? today.getMonth() : today.getMonth() + 1
    );

    const label1st = next1stMonth.toLocaleString('en-US', { month: 'short' }) + ' 1st';
    const label16th = next16thMonth.toLocaleString('en-US', { month: 'short' }) + ' 16sth';


    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(['1st', '16th', 'custom'] as RegistrationSchedule[]).map((option) => (
            <button 
              key={option}
              onClick={() => onChange(option)}
              className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${value === option ? active : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {option === '1st' ? label1st : option === '16th' ? label16th : 'Custom'}
            </button>
          ))}
        </div>
        {value === 'custom' && (
          <input 
            type="date"
            value={customDate}
            onChange={(e) => onCustomDateChange(e.target.value)}
            className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold">Loading worksites...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8">
          <p className="text-rose-700 font-bold">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content - Only show when not loading and no error */}
      {!loading && !error && (
        <>
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

          {sites.length === 0 ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-map-location-dot text-3xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No Worksites Yet</h3>
              <p className="text-slate-600 mb-6">Get started by creating your first worksite location.</p>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all"
              >
                Create First Worksite
              </button>
            </div>
          ) : (
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

                    <div className="space-y-2">
                      {site.syncSSF && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-0.5">SSF Registration</p>
                            <p className="text-sm font-black text-slate-700">{scheduleLabel(site.ssfRegistrationSchedule, site.ssfCustomDate)}</p>
                          </div>
                          <span className="text-[9px] font-black text-blue-400">{site.ssfResignLimit}d exit</span>
                        </div>
                      )}
                      {site.syncAIA && (
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-0.5">AIA Registration</p>
                            <p className="text-sm font-black text-slate-700">{scheduleLabel(site.aiaRegistrationSchedule, site.aiaCustomDate)}</p>
                          </div>
                          <span className="text-[9px] font-black text-rose-400">{site.aiaResignLimit}d exit</span>
                        </div>
                      )}
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
                    <button onClick={() => handleEditWorksite(site)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Edit Policy</button>
                    <button onClick={() => handleDeleteWorksite(site.id)} className="w-8 h-8 rounded-full hover:bg-slate-50 text-slate-200 hover:text-slate-400 transition-colors flex items-center justify-center">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
              <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-lg transform animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-12 space-y-10 overflow-y-auto flex-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-widest">
                        {editingId ? 'Edit Site' : 'New Site'}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Define location identity and rules</p>
                    </div>
                    <button onClick={() => { setShowModal(false); resetForm(); }} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-slate-500 transition-all flex items-center justify-center">
                      <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identify Worksite</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} className="col-span-1 w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold" placeholder="Worksite Name" />
                        <div className="relative">
                          <select value={newSiteColor} onChange={(e) => setNewSiteColor(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold appearance-none">
                            <option value="blue">Blue Theme</option>
                            <option value="emerald">Emerald Theme</option>
                            <option value="orange">Orange Theme</option>
                            <option value="purple">Purple Theme</option>
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

                    {/* SSF Settings */}
                    {ssfSync && (
                      <div className="space-y-4 p-6 bg-blue-50/40 rounded-3xl border border-blue-100">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                          <i className="fa-solid fa-shield"></i> SSF Registration Schedule
                        </label>
                        <SchedulePicker 
                          value={ssfSchedule}
                          onChange={setSsfSchedule}
                          customDate={ssfCustomDate}
                          onCustomDateChange={setSsfCustomDate}
                          accentColor="blue"
                        />
                        <div className="space-y-2">
                          <label className="text-[9px] text-blue-400 ml-2">SSF Resignation Window (Days)</label>
                          <input 
                            type="number"
                            value={ssfResignLimit}
                            onChange={(e) => setSsfResignLimit(Number(e.target.value))}
                            className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold border border-blue-100"
                            min="1"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* AIA Settings */}
                    {aiaSync && (
                      <div className="space-y-4 p-6 bg-rose-50/40 rounded-3xl border border-rose-100">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                          <i className="fa-solid fa-heart-pulse"></i> AIA Registration Schedule
                        </label>
                        <SchedulePicker 
                          value={aiaSchedule}
                          onChange={setAiaSchedule}
                          customDate={aiaCustomDate}
                          onCustomDateChange={setAiaCustomDate}
                          accentColor="rose"
                        />
                        <div className="space-y-2">
                          <label className="text-[9px] text-rose-400 ml-2">AIA Resignation Window (Days)</label>
                          <input 
                            type="number"
                            value={aiaResignLimit}
                            onChange={(e) => setAiaResignLimit(Number(e.target.value))}
                            className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-rose-50 transition-all text-sm font-bold border border-rose-100"
                            min="1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-12 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0 rounded-b-[56px]">
                  <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest">Abandon</button>
                  <button onClick={handleCreateWorksite} className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                    <i className="fa-solid fa-check"></i> {editingId ? 'Update Worksite' : 'Register Worksite'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorksiteConfig;
