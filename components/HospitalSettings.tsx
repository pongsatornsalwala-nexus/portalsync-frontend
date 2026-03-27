import React, { useState, useEffect } from 'react';
import { getHospitals, toggleHospitalFull, createHospital, deleteHospital } from '../services/apiService';

interface Hospital {
  id: number;
  name: string;
  province: string;
  hospital_type: 'PUBLIC' | 'PRIVATE';
  is_full: boolean;
}

const HospitalSettings: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null); // tracks which hospital is mid-toggle
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: '',
    province: '',
    hospital_type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const data = await getHospitals();
        setHospitals(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
        setError('Failed to load hospitals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  const handleToggle = async (hospitalId: number) => {
    setTogglingId(hospitalId); // show loading state on this specific button

    // Optimistic update — flip it immediately in UI
    const previousHospitals = hospitals;
    setHospitals(prev =>
      prev.map(h => h.id === hospitalId ? { ...h, is_full: !h.is_full } : h)
    );

    try {
      await toggleHospitalFull(hospitalId);
      console.log(`✅ Toggled hospital ${hospitalId}`);
    } catch (err) {
      // Rollback on failure
      console.error('❌ Failed to toggle hospital:', err);
      setHospitals(previousHospitals);
      alert('Failed to update hospital status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newHospital.name.trim() || !newHospital.province.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createHospital(newHospital);
      setHospitals(prev => [...prev, { ...created, is_full: false }]);
      setShowAddModal(false);
      setNewHospital({ name: '', province: '', hospital_type: 'PUBLIC' });
    } catch (err) {
      alert('Failed to add hospital. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (hospitalId: number) => {
    setDeletingId(hospitalId);
    try {
      await deleteHospital(hospitalId);
      setHospitals(prev => prev.filter(h => h.id !== hospitalId));
      setConfirmDeleteId(null);
    } catch (err) {
      alert('Failed to delete hospital. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter hospitals by search query (name or province)
  const filteredHospitals = hospitals.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.province.toLowerCase().includes(q);
  });

  // Group filtered hospitals by province
  // reduce() builds an object like { "กรุงเทพมหานคร": [...], "ชลบุรี": [...] }
  const grouped = filteredHospitals.reduce((acc, hospital) => {
    if (!acc[hospital.province]) {
      acc[hospital.province] = [];
    }
    acc[hospital.province].push(hospital);
    return acc;
  }, {} as Record<string, Hospital[]>);

  const fullCount = hospitals.filter(h => h.is_full).length;

  return (
    <>
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold">Loading hospitals...</p>
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

      {!loading && !error && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Hospital Availability</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Mark hospitals as full to prevent new SSF registrations</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <i className="fa-solid fa-plus"></i> Add Hospital
            </button>
            {/* Stats badges */}
            <div className="flex gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-center">
                <p className="text-2xl font-black text-slate-800">{hospitals.length}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl px-6 py-3 text-center">
                <p className="text-2xl font-black text-rose-600">{fullCount}</p>
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Full</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-3 text-center">
                <p className="text-2xl font-black text-emerald-600">{hospitals.length - fullCount}</p>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Available</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by hospital name or province..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-400 font-medium mt-3 ml-2">
                Found <span className="font-black text-slate-600">{filteredHospitals.length}</span> hospitals matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Grouped Hospital List */}
          {Object.keys(grouped).length === 0 ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-[32px] border border-slate-100">
              <div className="text-center">
                <i className="fa-solid fa-hospital text-4xl text-slate-300 mb-4"></i>
                <p className="text-sm font-bold text-slate-400">No hospitals found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.entries(grouped) as [string, Hospital[]][]).map(([province, provinceHospitals]) => (
                <div key={province} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  {/* Province Header */}
                  <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-location-dot text-blue-400"></i>
                      <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest">{province}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Show how many are full in this province */}
                      {provinceHospitals.filter(h => h.is_full).length > 0 && (
                        <span className="px-3 py-1 bg-rose-50 text-rose-500 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {provinceHospitals.filter(h => h.is_full).length} Full
                        </span>
                      )}
                      <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {provinceHospitals.length} Hospitals
                      </span>
                    </div>
                  </div>

                  {/* Hospital Rows */}
                  <div className="divide-y divide-slate-50">
                    {provinceHospitals.map(hospital => (
                      <div
                        key={hospital.id}
                        className={`px-8 py-5 flex items-center justify-between transition-all ${
                          hospital.is_full ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Hospital type indicator */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            hospital.hospital_type === 'PUBLIC' ? 'bg-blue-400' : 'bg-purple-400'
                          }`}></div>
                          <div>
                            <p className={`text-sm font-bold ${hospital.is_full ? 'text-slate-400' : 'text-slate-700'}`}>
                              {hospital.name}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                              {hospital.hospital_type === 'PUBLIC' ? 'Public' : 'Private'}
                            </p>
                          </div>
                          {/* Full badge */}
                          {hospital.is_full && (
                            <span className="px-2 py-1 bg-rose-100 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              Full
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Delete button */}
                          {confirmDeleteId === hospital.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Sure?</span>
                              <button
                                onClick={() => handleDelete(hospital.id)}
                                disabled={deletingId === hospital.id}
                                className="px-3 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                              >
                                {deletingId === hospital.id ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Yes'}
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(hospital.id)}
                              className="p-2.5 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          )}
                          
                          {/* Toggle button */}
                          <button
                            onClick={() => handleToggle(hospital.id)}
                            disabled={togglingId === hospital.id}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              togglingId === hospital.id
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : hospital.is_full
                                ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 border border-transparent'
                            }`}
                          >
                            {togglingId === hospital.id ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : hospital.is_full ? (
                              <><i className="fa-solid fa-lock"></i> Mark Available</>
                            ) : (
                              <><i className="fa-solid fa-lock-open"></i> Mark Full</>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
    {/* Add Hospital Modal */}
    {showAddModal && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
        onClick={() => setShowAddModal(false)}
      >
        <div
          className="bg-white rounded-[32px] p-10 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Add Hospital</h3>
            <button 
              onClick={() => setShowAddModal(false)}
              className="w-8 h-8 flex item-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div classname="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital Name</label>
              <input 
                type="text"
                value={newHospital.name}
                onChange={e => setNewHospital(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. โรงพยาบาลกรุงเทพ"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
              />
            </div>

            {/* Province */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Province</label>
              <select
                value={newHospital.province}
                onChange={e => setNewHospital(prev => ({ ... prev, province: e.target.value }))}
                placeholder="e.g. กรุงเทพมหานคร"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all appearance-none"
              >
                <option value="">-- Select Province --</option>
                {["กระบี่","กรุงเทพมหานคร","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท",
                "ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม",
                "นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์",
                "ปราจีนบุรี","ปัตตานี","พระยานครศรีอยุธยา","พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์",
                "แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง",
                "ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
                "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย",
                "หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Type Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital Type</label>
              <div classname="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button
                  onClick={() => setNewHospital(prev => ({ ...prev, hospital_type: 'PUBLIC' }))}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newHospital.hospital_type === 'PUBLIC' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <i className="fa-solid fa-hospital"></i> Public
                </button>
                <button 
                  onClick={() => setNewHospital(prev => ({ ...prev, hospital_type: 'PRIVATE' }))}
                  className={`flex-1 py-2.5 rounded.xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newHospital.hospital_type === 'PRIVATE' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <i className="fa-solid fa-building"></i>Private
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Saving...</> : <><i className="fa-solid fa-plus mr-2"></i>Add Hospital</>}
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default HospitalSettings;
