
import React, { useState } from 'react';
import { PortalStatus, BenefitType, RegistrationType } from '../types';
import { fetchSSFHospitals } from '../services/geminiService';

interface QueueItem {
  id_key: string;
  name: string; 
  id: string; 
  mobile: string; 
  email: string; 
  date: string; 
  plan: string; 
  dept: string; 
  salary: number; 
  hospital1?: string;
  hospital2?: string;
  hospital3?: string;
  bank: string;
  account: string;
  status: PortalStatus;
  worksite: string;
  regType: RegistrationType;
  resignReason?: string;
  processedBy?: string;
}

const PortalSync: React.FC = () => {
  const [benefitType, setBenefitType] = useState<BenefitType>(BenefitType.SSF);
  const [regType, setRegType] = useState<RegistrationType>(RegistrationType.REGISTER_IN);
  const [isSyncingMaster, setIsSyncingMaster] = useState(false);
  const [lastMasterSync, setLastMasterSync] = useState<string>('24 Oct 2024');
  const [selectedEmployee, setSelectedEmployee] = useState<QueueItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const steps = [
    { id: PortalStatus.ENTRY, label: 'ENTRY' },
    { id: PortalStatus.PENDING, label: 'PENDING' },
    { id: PortalStatus.REVIEWING, label: 'REVIEWING' },
    { id: PortalStatus.REPORTED, label: 'REPORTED' },
    { id: PortalStatus.VERIFIED, label: 'VERIFIED' },
  ];

  const [queue, setQueue] = useState<QueueItem[]>([
    { 
      id_key: '1',
      name: 'Somchai Saetang', 
      id: '1-2345-06789-01-2', 
      mobile: '0812345678', 
      email: 'somchai@co.com', 
      date: '2025-01-01', 
      plan: '100-Junior', 
      dept: 'IT', 
      salary: 35000, 
      hospital1: 'Siriraj Hospital',
      hospital2: 'Chulalongkorn Hospital',
      hospital3: 'Ramathibodi Hospital',
      bank: 'KBank',
      account: '123-4-56789-0',
      status: PortalStatus.REPORTED,
      worksite: 'Main Office',
      regType: RegistrationType.REGISTER_IN,
      processedBy: 'Admin A'
    },
    { 
      id_key: '2',
      name: 'Wichai Ubol', 
      id: '1-2345-26789-01-2', 
      mobile: '0812345678', 
      email: 'wichai@co.com', 
      date: '2025-01-15', 
      plan: '200-Senior', 
      dept: 'HR', 
      salary: 45000, 
      bank: 'SCB',
      account: '987-6-54321-0',
      status: PortalStatus.PENDING,
      worksite: 'Factory Site A',
      regType: RegistrationType.REGISTER_OUT,
      resignReason: 'Resigned',
      processedBy: 'Admin B'
    },
  ]);

  const handleCopy = (val: string | number) => {
    navigator.clipboard.writeText(val.toString());
  };

  const syncMasterData = async () => {
    setIsSyncingMaster(true);
    await fetchSSFHospitals();
    setLastMasterSync(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    setIsSyncingMaster(false);
  };

  const handleDocumentDownload = (docName: string, memberName: string) => {
    const content = `PortalSync Audit Document\nDocument Type: ${docName}\nMember: ${memberName}\nProvider: AIA Group Insurance\nTimestamp: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIA_${docName.replace(/\s+/g, '_')}_${memberName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateStatus = (id_key: string, newStatus: PortalStatus) => {
    setQueue(prev => prev.map(item => item.id_key === id_key ? { ...item, status: newStatus } : item));
  };

  const filteredQueue = queue.filter(item => item.regType === regType);

  // Filter employees based on search query
  const searchFilteredEmployees = filteredQueue.filter(employee => {
    if (!searchQuery) return true; // Show all if no search

    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) || employee.id.toLowerCase().includes(query)
    );
  });

  // Show dropdown only when there's a search query
  const showDropdown = searchQuery.length > 0;

  const CopyableField = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col gap-1 group">
      <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight">{label}</span>
      <button 
        onClick={() => handleCopy(value)}
        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group/btn"
      >
        <span className="text-[11px] font-bold truncate text-slate-600">{value}</span>
        <i className="fa-regular fa-copy text-[10px] text-slate-200 group-hover/btn:text-blue-500"></i>
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Action Center - Portal Direct Links & Registry Sync */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-200 transition-all group">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl transition-transform group-hover:scale-110"><i className="fa-solid fa-shield"></i></div>
            <div><h4 className="text-xl font-black text-slate-800">SSF Portal</h4><p className="text-xs text-slate-400">Employer e-Services Link</p></div>
          </div>
          <a href="https://www.sso.go.th/eservices" target="_blank" className="bg-blue-600 text-white px-10 py-4 rounded-3xl text-[10px] font-black tracking-widest uppercase shadow-xl shadow-blue-50">Open Portal</a>
        </div>
        
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-rose-200 transition-all group">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 text-3xl transition-transform group-hover:scale-110"><i className="fa-solid fa-heart-pulse"></i></div>
            <div><h4 className="text-xl font-black text-slate-800">AIA eBenefit</h4><p className="text-xs text-slate-400">Group Insurance Portal Link</p></div>
          </div>
          <a href="https://iservice.aia.co.th/eben-en/my-aia/login.html" target="_blank" className="bg-rose-600 text-white px-10 py-4 rounded-3xl text-[10px] font-black tracking-widest uppercase shadow-xl shadow-rose-50">Open Portal</a>
        </div>
      </div>

      <div className="flex bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setBenefitType(BenefitType.SSF)} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${benefitType === BenefitType.SSF ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500'}`}>SSF</button>
          <button onClick={() => setBenefitType(BenefitType.AIA)} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${benefitType === BenefitType.AIA ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'text-slate-500'}`}>AIA</button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setRegType(RegistrationType.REGISTER_IN)} className={`px-10 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${regType === RegistrationType.REGISTER_IN ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Inbound</button>
          <button onClick={() => setRegType(RegistrationType.REGISTER_OUT)} className={`px-10 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${regType === RegistrationType.REGISTER_OUT ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Outbound</button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-[10px] tracking-widest uppercase">{benefitType} Pipeline Tracking</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sync Active</span>
          </div>
        </div>

        {/* Employee Search Section */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} /* Controlled Input: Makes this a controlled component */
                  placeholder="Search employee by name or ID ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i> {/* Absolute Positioning: The icons are position absolute inside the relative parent (the input wrapper) */}
                {searchQuery && ( /* Conditional Rendering: Only shows the clear button when there's text */
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedEmployee(null);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-10">
                {searchFilteredEmployees.length >0 ? (
                  <div className="p-2">
                    {searchFilteredEmployees.map(employee => (
                      <button 
                        key={employee.id_key}
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">{employee.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{employee.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${
                            employee.regType === RegistrationType.REGISTER_IN
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-rose-50 text-rose-600'
                          }`}>
                            {employee.regType}
                          </span>
                          <span className="text-xs text-slate-300">{employee.worksite}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <i className="fa-solid fa-user-slash text-3xl text-slate-200 mb-3"></i>
                    <p className="text-sm font-bold text-slate-400">No employees found</p>
                    <p className="text-xs test-slate-300 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Seleted Employee Display */}
        {selectedEmployee && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-blue-100 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl ${
                    benefitType === BenefitType.SSF ? 'bg-blue-600' : 'bg-rose-600'
                  }`}>
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{selectedEmployee.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedEmployee.id}</p>                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-xmark"></i>
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className={`px-3 py-1.5 rounded-xl text-sx font-black ${
                selectedEmployee.regType === RegistrationType.REGISTER_IN
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
                {selectedEmployee.regType}
              </span>
              <span className="px-3 py-1.5 bg-slate-180 text-slate-600 rounded-xl text-xs font-bold">
                <i className="fa-solid fa-building mr-2"></i>
                {selectedEmployee.worksite}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Member Identity Column */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Member Identity</h4>
                <CopyableField label="Full Name" value={selectedEmployee.name} />
                <CopyableField label="National ID" value={selectedEmployee.id} />
                {/* Only show salary for AIA, not for SSF */}
                {regType === RegistrationType.REGISTER_IN && benefitType === BenefitType.AIA && (
                  <CopyableField label="Base Salary" value={selectedEmployee.salary} />
                )}
              </div>

              {/* Portal Fields Column */}
              <div className = "space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Portal Fields</h4>
                {regType === RegistrationType.REGISTER_IN ? (
                  benefitType === BenefitType.SSF ? (
                    <>
                      <CopyableField label="Hospital Priority 1" value={selectedEmployee.hospital1 || 'N/A'} />
                      <CopyableField label="Hospital Priority 2" value={selectedEmployee.hospital2 || 'N/A'} />
                      <CopyableField label="Hospital Priority 3" value={selectedEmployee.hospital3 || 'N/A'} />
                    </>
                  ) : (
                    <>
                      <CopyableField label="Insurance Plan" value={selectedEmployee.plan} />
                      <CopyableField label="Bank Account" value = {selectedEmployee.account} />
                    </>
                  )
                ) : (
                  <>
                    <CopyableField label="Exit Effective Date" value={selectedEmployee.date} />
                    <CopyableField label="Termination Reason" value={selectedEmployee.resignReason || 'N/A'} />
                  </>
                )}
                {regType === RegistrationType.REGISTER_IN && (
                  <CopyableField label="Employment Date" value={selectedEmployee.date} />
                )}
              </div>

              {/* Status Pipeline Column */}
              <div className="space-y-4">
                <h4 className="test-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status Pipeline</h4>
                <div className="flex flex-col gap-3">
                  {steps.map((step, idx) => {
                    const isPassed = steps.findIndex(s => s.id === selectedEmployee.status) >= idx;
                    const isCurrent = selectedEmployee.status === step.id;
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <button
                          onClick={() => updateStatus(selectedEmployee.id_key, step.id)}
                          className={`w-10 h-10 rounded-full border-4 transition-all flex items-center justify-center text-xs font-black ${
                            isPassed
                              ? (benefitType === BenefitType.SSF ? 'bg-blue-600 border-blue-100 text-white shadow-lg' : 'bg-rose-600 border-rose-100 text-white shadow-lg')
                              : 'bg-white border-slate-100 text-slate-200'
                          }`}
                        >
                          {isPassed && !isCurrent ? <i className="fa-solid fa-check"></i> : (idx+1)}
                        </button>
                        <span className={`text-xs font-black ${
                          isCurrent
                            ? (benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600')
                            : isPassed ? 'text-slate-600' : 'text-slate-300'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-100 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Admin Audit</p>
                <p className="text-xs font-bold text-slate-600">Owner: {selectedEmployee.processedBy || 'System'}</p>
              </div>
            </div>
          </div>
        )}
        </div>

        {!selectedEmployee && (
          <div className="overflow-x-auto pb-10 -mx-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/10">
                  <th className="px-10 py-6">Member Identity</th>
                  <th className="px-10 py-6">Portal Fields (Copy for Manual Entry)</th>
                  <th className="px-10 py-6">ATS Status Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredQueue.map(item => (
                  <tr key={item.id_key} className="hover:bg-slate-50/30 transition-all">
                    <td className="px-10 py-10 align-top min-w-[300px]">
                      <div className="space-y-4">
                        <div className="flex gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${item.regType === RegistrationType.REGISTER_IN ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{item.regType}</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase">{item.worksite}</span>
                        </div>
                        <CopyableField label="Full Name" value={item.name} />
                        <CopyableField label="National ID" value={item.id} />
                        {regType === RegistrationType.REGISTER_IN && benefitType === BenefitType.SSF && (
                          <CopyableField label="Base Salary" value={item.salary} />
                        )}
                        
                        {/* AIA Specific Document Downloads */}
                        {benefitType === BenefitType.AIA && (
                          <div className="pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Audit Documents</p>
                            <div className="flex flex-wrap gap-2">
                              <button 
                                onClick={() => handleDocumentDownload('National ID', item.name)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-rose-100 flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                              >
                                <i className="fa-solid fa-id-card"></i> ID
                              </button>
                              <button 
                                onClick={() => handleDocumentDownload('Bank Book', item.name)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-rose-100 flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                              >
                                <i className="fa-solid fa-book-open"></i> Bank
                              </button>
                              <button 
                                onClick={() => handleDocumentDownload('CEB Form', item.name)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tight shadow-sm flex items-center gap-2 hover:bg-rose-700 transition-all"
                              >
                                <i className="fa-solid fa-file-signature"></i> CEB
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-10 align-top min-w-[320px]">
                      <div className="space-y-4">
                        {regType === RegistrationType.REGISTER_IN ? (
                          benefitType === BenefitType.SSF ? (
                            <>
                              <CopyableField label="Hospital Priority 1" value={item.hospital1 || 'N/A'} />
                              <CopyableField label="Hospital Priority 2" value={item.hospital2 || 'N/A'} />
                              <CopyableField label="Hospital Priority 3" value={item.hospital3 || 'N/A'} />
                            </>
                          ) : (
                            <>
                              <CopyableField label="Insurance Plan" value={item.plan} />
                              <CopyableField label="Bank Account" value={item.account} />
                            </>
                          )
                        ) : (
                          <>
                            <CopyableField label="Exit Effective Date" value={item.date} />
                            <CopyableField label="Termination Reason" value={item.resignReason || 'N/A'} />
                          </>
                        )}
                        {regType === RegistrationType.REGISTER_IN && <CopyableField label="Employment Date" value={item.date} />}
                      </div>
                    </td>
                    <td className="px-10 py-10 align-top min-w-[400px]">
                      <div className="flex items-center gap-1 mt-8">
                        {steps.map((step, idx) => {
                          const isPassed = steps.findIndex(s => s.id === item.status) >= idx;
                          const isCurrent = item.status === step.id;
                          return (
                            <React.Fragment key={step.id}>
                              <div className="flex flex-col items-center gap-3">
                                <button 
                                  onClick={() => updateStatus(item.id_key, step.id)}
                                  className={`w-12 h-12 rounded-full border-4 transition-all flex items-center justify-center text-[10px] font-black ${isPassed ? (benefitType === BenefitType.SSF ? 'bg-blue-600 border-blue-100 text-white shadow-lg' : 'bg-rose-600 border-rose-100 text-white shadow-lg') : 'bg-white border-slate-100 text-slate-200'}`}
                                >
                                  {isPassed && !isCurrent ? <i className="fa-solid fa-check"></i> : (idx+1)}
                                </button>
                                <span className={`text-[8px] font-black uppercase text-center w-16 ${isCurrent ? (benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600') : 'text-slate-300'}`}>{step.label}</span>
                              </div>
                              {idx < steps.length - 1 && <div className={`h-[2px] w-8 mb-6 transition-all ${steps.findIndex(s => s.id === item.status) > idx ? (benefitType === BenefitType.SSF ? 'bg-blue-600' : 'bg-rose-600') : 'bg-slate-100'}`}></div>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="mt-12 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Administrative Audit</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Owner: {item.processedBy || 'System'}</span>
                          <span className="text-[10px] font-bold text-slate-300 italic">ID: {item.id_key}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalSync;
