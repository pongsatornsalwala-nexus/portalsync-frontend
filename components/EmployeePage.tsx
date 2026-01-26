
import React, { useState, useEffect, useMemo } from 'react';
import { BenefitType, RegistrationType, Worksite } from '../types';
import { performIDCardOCR, fetchSSFHospitals } from '../services/geminiService';
import { createEmployee, getEmployees, getHospitals, getWorksites, updateEmployee } from '../services/apiService';

const WORKSITES: Worksite[] = [];

const FormLabel = ({ text, required, subtext }: { text: string; required?: boolean; subtext?: string }) => (
  <div className="mb-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] block">
      {text} {required && <span className="text-rose-500 font-bold ml-1">*</span>}
    </label>
    {subtext && <span className="text-[9px] text-slate-300 font-medium block">{subtext}</span>}
  </div>
);

const InputWrapper = ({ children, icon }: { children?: React.ReactNode, icon?: string }) => (
  <div className="relative group">
    {children}
    {icon && <i className={`fa-solid ${icon} absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-blue-500 transition-colors pointer-events-none`}></i>}
  </div>
);

const EmployeePage: React.FC = () => {
  const [importMode, setImportMode] = useState<'individual' | 'bulk'>('individual');
  const [formType, setFormType] = useState<RegistrationType>(RegistrationType.REGISTER_IN);
  const [benefitType, setBenefitType] = useState<BenefitType>(BenefitType.SSF);
  // State for worksites from database
  const [worksites, setWorksites] = useState<any[]>([]);
  const [loadingWorksites, setLoadingWorksites] = useState(false);
  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string>('');
  useEffect(() => {
    if (worksites.length > 0 && !selectedWorksiteId) {
      setSelectedWorksiteId(worksites[0].id);
    }
  }, [worksites]);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [hospitals, setHospitals] = useState<{id: string, name: string, province: string}[]>([]);
  const [syncingHospitals, setSyncingHospitals] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  
  const worksiteMap = {
    'Main Office': { icon: 'fa-building', color: 'blue' },
    'Factory Site A': { icon: 'fa-industry', color: 'emerald' },
    'Branch East': { icon: 'fa-shop', color: 'orange' },
  };

  // Fetch worksites from database
  const fetchWorksitesFromDB = async () => {
    setLoadingWorksites(true);
    try {
      const worksiteList = await getWorksites();
      console.log('Fetched worksites:', worksiteList);
      setWorksites(worksiteList);
    } catch (error) {
      console.error('Failed to fetch worksites:', error);
    }
    setLoadingWorksites(false);
  };

  // Load worksites when component mounts
  useEffect(() => {
    fetchWorksitesFromDB();
  }, []);

  const selectedWorksite = worksites.find(s => s.id === selectedWorksiteId) || WORKSITES[0] || {
    id: '1',
    name: 'Loading ...',
    icon: 'fa-building',
    color: 'blue',
    hireLimit: 30,
    resignLimit: 15,
    syncSSF: true,
    syncAIA: true
  };

  const formatThaiID = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 13 digits
    const limited = digits.slice(0, 13);

    // Add dashes
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i === 1 || i === 5 || i === 10 || i === 12) {
        formatted += '-';
      }
      formatted += limited[i];
    }

    return formatted;
  }

  useEffect(() => {
    if (benefitType === BenefitType.SSF && !selectedWorksite.syncSSF) {
      setBenefitType(BenefitType.AIA);
    } else if (benefitType === BenefitType.AIA && !selectedWorksite.syncAIA) {
      setBenefitType(BenefitType.SSF);
    }
  }, [selectedWorksiteId]);

  // Sync hospitals with SSO API on load or when switching to SSF
  const syncHospitals = async () => {
    setSyncingHospitals(true);
    try {
      const list = await getHospitals(); // Using Django API
      setHospitals(list);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
    setSyncingHospitals(false);
  };

  const fetchEmployees = async () => {
    try {
      const employeeList = await getEmployees();
      console.log('Fetched employees:', employeeList);
      setActiveEmployees(employeeList);
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  // Load employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (benefitType === BenefitType.SSF) {
      syncHospitals();
    }
  }, [benefitType]);

  // Group hospitals by province for better UI
  // Fixed: explicitly type the accumulator in reduce to avoid 'unknown' type inference in Object.entries later
  const groupedHospitals = useMemo(() => {
    return hospitals.reduce((acc: Record<string, {id: string, name: string, province: string}[]>, h) => {
      if (!acc[h.province]) acc[h.province] = [];
      acc[h.province].push(h);
      return acc;
    }, {});
  }, [hospitals]);

  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);

  const initialFormState = {
    prefix: '',
    firstName: '',
    lastName: '',
    idCard: '',
    dob: '',
    nationality: 'thai',
    gender: 'male',
    maritalStatus: 'single',
    employmentType: 'monthly',
    employmentDate: '',
    effectiveDate: '',
    plan: '100 - Junior',
    employeeNo: '',
    department: '',
    jobPosition: '',
    salary: '',
    bankName: '',
    accountNo: '',
    hospital1: '',
    hospital2: '',
    hospital3: '',
    selectedEmployeeId: '',
    exitDate: '',
    resignationReason: '',
    // AIA-specific fields
    passport: '',
    designation: '',
  };

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [formData, setFormData] = useState(initialFormState);

  const handleJoiner = async () => {
  try {
    // Validate required fields
    if (!formData.idCard || !formData.firstName || !formData.lastName || !formData.employmentDate) {
      alert('Please fill in all required fields (ID Card, Name, Employment Date)');
      return;
    }

    // Prepare employee data
    const employeeData = {
      idCard: formData.idCard,
      firstName: formData.firstName,
      lastName: formData.lastName,
      employmentDate: formData.employmentDate,
      benefitType: 'SSF',
      registrationType: 'REGISTER_IN', // JOINER = Register In
      status: 'ENTRY', // Initial status
      // Optional fields (only include if filled)
      ...(formData.dob && { dateOfBirth: formData.dob }),
      ...(formData.gender && { gender: formData.gender }),
      ...(formData.nationality && { nationality: formData.nationality }),
      ...(formData.plan && { plan: formData.plan }),
      ...(formData.employeeNo && { employeeNo: formData.employeeNo }),
      ...(formData.department && { department: formData.department }),
      ...(formData.salary && { salary: formData.salary }),
      ...(formData.bankName && { bankName: formData.bankName }),
      ...(formData.accountNo && { bankAccount: formData.accountNo }),
    };

    console.log('Saving new joiner:', employeeData);

    // Call API to create employee
    const savedEmployee = await createEmployee(employeeData);

    console.log('Employee saved: ', savedEmployee);
    alert(`Successfully registered ${formData.firstName} ${formData.lastName}!`);

    // Clear form after success
    setFormData({
      idCard: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: 'thai',
      employmentDate: '',
      plan: '',
      worksiteId: '',
      benefitType: 'SSF',
    });
  } catch (error) {
    console.error('Error saving employee:', error);
    console.error('Error details', error.response?.data);
    alert('Failed to save employee. Please try again.');
  }
};

  const handleExit = async () => {
    try {
      if (!formData.selectedEmployeeId) {
        alert('Please select an employee to process resignation');
        return;
      }

      if (!formData.exitDate) {
        alert('Please provide the effective exit date');
        return;
      }

      if (!formData.resignationReason) {
        alert('Please select a termination reason');
        return;
      }

      // Prepare employee data
      const resignationData = {
        idCard: formData.idCard,
        firstName: formData.firstName,
        lastName: formData.lastName,
        worksiteId: selectedWorksiteId || formData.worksiteId,  // ✅ Fallback to employee's original worksite
        benefitType: benefitType,  // ✅ Use current benefit type from state
        registrationType: 'REGISTER_OUT',
        status: 'PENDING',
        effectiveDate: formData.exitDate,
        resignReason: formData.resignationReason,
      };

      console.log('💼 Processing resignation: ', resignationData);

      // Call API to update employee
      const result = await updateEmployee(formData.selectedEmployeeId, resignationData);

      console.log('✅ Resignation processed:', result);
      alert(`Successfully processed resignation for ${formData.firstName} ${formData.lastName}!`);

      // Refresh employee list
      await fetchEmployees();
      
      // Clear form
      setFormData(initialFormState);

    } catch (error: any) {
      console.error('❌ Error processing resignation', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to process resignation. Please try again.');
    }
  };

  const onScanID = async () => {
    setLoadingOCR(true);
    const result = await performIDCardOCR("base64_placeholder");
    if (result) {
      setFormData(prev => ({
        ...prev,
        firstName: result.firstName || '',
        lastName: result.lastName || '',
        idCard: result.idNumber || '',
        dob: result.dob || '',
        nationality: result.nationality || 'thai',
        gender: result.gender?.toLowerCase() || 'male'
      }));
    }
    setLoadingOCR(false);
  };

  const handleDownload = (docTitle: string) => {
    const content = `PortalSync Document: ${docTitle}\nGenerated for: ${formData.firstName || 'New'} ${formData.lastName || 'Employee'}\nDate: ${new Date().toLocaleDateString()}\nSite: ${selectedWorksite.name}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/\s+/g, '_')}_PortalSync.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => { // async keyword makes the function able to wait Django's response
    console.log('📍 Selected worksite ID:', selectedWorksiteId);
    console.log('🔍 DEBUG: Form data is:', formData);
    // Validation: Make sure required fields are filled
    if (!formData.firstName || !formData.lastName || !formData.idCard || !formData.employmentDate) {
      alert('Please fill in all required fields: First Name, Last Name, ID Card, and Employment Date');
      return;
    }
    // Check if required fields are filled (validation)
    try { // try block - we try to save the employee
      // Prepare the data in the format Django expects
      const employeeData = { // Collecting all the form data and format it how Django likes it
        idCard: formData.idCard,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dob || null,
        gender: formData.gender,
        nationality: formData.nationality,
        bankName: formData.bankName,
        bankAccount: formData.accountNo,
        employeeNo: formData.employeeNo,
        department: formData.department,
        employmentDate: formData.employmentDate,
        plan: formData.plan,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        worksiteId: selectedWorksiteId, // Keep as string!
        benefitType: benefitType,
        registrationType: formType,
        status: 'ENTRY', // New employees start with ENTRY status
        effectiveDate: formData.effectiveDate || null,
        hospital1: formData.hospital1 || null,
        hospital2: formData.hospital2 || null,
        hospital3: formData.hospital3 || null,
        maritalStatus: formData.maritalStatus || null,
        wageType: formData.employmentType || null,
        // AIA-specific fields
        prefix: formData.prefix || null,
        passport: formData.passport || null,
        designation: formData.designation || null,
      };

      // Send data to Django!
      console.log('Sending employee data to Django:', employeeData);
      const result = await createEmployee(employeeData); // Calling createEmployee() which sends data to Django
      console.log('Success! Django returned:', result); // Show success message

      // Show success message
      alert(`✅ Employee ${formData.firstName} ${formData.lastName} successfully registered at ${selectedWorksite.name}!`);

      // Refresh the employee list to show the new employee
      await fetchEmployees();

      // Reset the form
      setFormData(initialFormState); // Reset form
    }
    catch (error: any) { // catch block - if anything goes wrong, show error message
      // Something went wrong
      console.error('Error saving employee:', error);
      console.error('Full error response:', error.response?.data)
      alert('❌ Error saving employee. Check the console for details.');
    }
  };

  const HospitalSelect = ({ value, onChange, label, required }: { value: string, onChange: (val: string) => void, label: string, required?: boolean }) => (
    <div className="space-y-2">
      <FormLabel text={label} required={required} />
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={syncingHospitals}
          className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
        >
          <option value="">{syncingHospitals ? 'Updating SSO API...' : '-- Select Hospital --'}</option>
          {Object.entries(groupedHospitals).map(([province, list]) => (
            <optgroup key={province} label={province.toUpperCase()}>
              {/* Fixed: ensuring list is treated as an array to resolve the map error on line 159 (approx) */}
              {(list as {id: string, name: string, province: string}[]).map(h => (
                <option key={`${label}-${h.id}`} value={h.name}>{h.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Header Toolbar */}
      <div className="bg-white p-4 rounded-[40px] shadow-sm border border-slate-100 flex flex-col xl:flex-row items-center gap-6">
        <div className="flex-1 w-full xl:w-auto">
          <div className="relative">
            <select 
              value={selectedWorksiteId}
              onChange={(e) => setSelectedWorksiteId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-8 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
            >
              {worksites.map(site => (
                <option key={site.id} value={site.id}>{site.name} Configuration</option>
              ))}
            </select>
            <i className={`fa-solid ${selectedWorksite.icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-300`}></i>
            <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none"></i>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[24px] min-w-[280px]">
          <button onClick={() => setImportMode('individual')} className={`flex-1 py-3 rounded-[20px] text-[10px] font-black tracking-widest uppercase transition-all ${importMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Individual</button>
          <button onClick={() => setImportMode('bulk')} className={`flex-1 py-3 rounded-[20px] text-[10px] font-black tracking-widest uppercase transition-all ${importMode === 'bulk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Bulk CSV</button>
        </div>

        <div className="h-10 w-[1px] bg-slate-100 hidden xl:block"></div>

        <div className="flex gap-4">
           <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
             <button onClick={() => setFormType(RegistrationType.REGISTER_IN)} className={`px-8 py-3 rounded-[20px] text-[10px] font-black tracking-widest uppercase transition-all ${formType === RegistrationType.REGISTER_IN ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Joiner</button>
             <button onClick={() => setFormType(RegistrationType.REGISTER_OUT)} className={`px-8 py-3 rounded-[20px] text-[10px] font-black tracking-widest uppercase transition-all ${formType === RegistrationType.REGISTER_OUT ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400'}`}>Exit</button>
           </div>
           
           <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
             {selectedWorksite.syncSSF && (
               <button 
                 onClick={() => setBenefitType(BenefitType.SSF)} 
                 className={`px-8 py-3 rounded-[20px] text-[10px] font-black tracking-widest uppercase transition-all ${benefitType === BenefitType.SSF ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 SSF
               </button>
             )}
             {selectedWorksite.syncAIA && (
               <button 
                 onClick={() => setBenefitType(BenefitType.AIA)} 
                 className={`px-8 py-3 rounded-[20px] text-[10px] font-black tracking-widest uppercase transition-all ${benefitType === BenefitType.AIA ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 AIA
               </button>
             )}
           </div>
        </div>
      </div>

      {importMode === 'bulk' ? (
        <div className="bg-white rounded-[56px] shadow-sm border border-slate-100 p-24 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto shadow-sm"><i className="fa-solid fa-file-excel"></i></div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-widest">Global Batch Upload</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Sync large volumes of employee movements for <span className="text-slate-900 font-bold underline decoration-blue-500 underline-offset-4">{selectedWorksite.name}</span> using the official Excel template.</p>
          </div>
          <div className="flex justify-center gap-6 pt-6">
            <button className="bg-slate-50 text-slate-500 px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-100 transition-all border border-slate-100"><i className="fa-solid fa-download"></i> Get Template</button>
            <button className="bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 flex items-center gap-3 hover:bg-emerald-700 transition-all"><i className="fa-solid fa-cloud-arrow-up"></i> Start Processing</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[56px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-16">
            {formType === RegistrationType.REGISTER_IN ? (
              benefitType === BenefitType.SSF ? (
                /* SSF REGISTER IN - High Polish */
                <div className="space-y-16">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-10">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 bg-${selectedWorksite.color}-50 rounded-3xl flex items-center justify-center text-${selectedWorksite.color}-600 text-2xl shadow-inner`}><i className={`fa-solid ${selectedWorksite.icon}`}></i></div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest">SSF Member Registry - {selectedWorksite.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">Hiring policy: Within {selectedWorksite.hireLimit} days of employment</p>
                      </div>
                    </div>
                    <button onClick={onScanID} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                      {loadingOCR ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-camera"></i>} Gemini OCR Scan
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><FormLabel text="Employment Date" required /><InputWrapper><input type="date" value = {formData.employmentDate} onChange = {e => setFormData({...formData, employmentDate: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" /></InputWrapper></div>
                        <div className="space-y-2">
                          <FormLabel text="Wage Type" required />
                          <div className="flex bg-slate-100 p-1 rounded-2xl h-[54px]">
                            <button onClick={() => setFormData({...formData, employmentType: 'daily'})} className={`flex-1 text-[10px] font-black uppercase rounded-xl transition-all ${formData.employmentType === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Daily</button>
                            <button onClick={() => setFormData({...formData, employmentType: 'monthly'})} className={`flex-1 text-[10px] font-black uppercase rounded-xl transition-all ${formData.employmentType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Monthly</button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2"><FormLabel text="National ID (13 Digits)" required /><InputWrapper><input type="text" value={formData.idCard} onChange={e => setFormData({...formData, idCard: formatThaiID(e.target.value)})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold tracking-[0.2em] focus:ring-4 focus:ring-blue-50 transition-all outline-none" placeholder="X-XXXX-XXXXX-XX-X" maxLength = {17} /></InputWrapper></div>
                      <div className="space-y-2">
                        <FormLabel text="Prefix Title" required />
                        <select value = {formData.prefix} onChange = {e => setFormData({...formData, prefix: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none">
                          <option>Select Title</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><FormLabel text="First Name" required /><input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all" /></div>
                        <div className="space-y-2"><FormLabel text="Last Name" required /><input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all" /></div>
                      </div>
                    </div>
                    
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <FormLabel text="Family Status" />
                        <div className="grid grid-cols-3 gap-6">
                          {['Single', 'Married', 'Widowed', 'Divorced', 'Separated', 'Other'].map(s => (
                            <label key={s} className="flex items-center gap-3 cursor-pointer group">
                              <input type="radio" name="marital" checked={formData.maritalStatus === s.toLowerCase()} onChange={() => setFormData({...formData, maritalStatus: s.toLowerCase()})} className="w-5 h-5 text-blue-600 border-slate-200 focus:ring-blue-50" />
                              <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">{s}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 space-y-8 shadow-inner">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> SSO Hospital Selection (Live API)
                          </h4>
                          <button 
                            onClick={syncHospitals} 
                            disabled={syncingHospitals}
                            className="flex items-center gap-2 group cursor-pointer"
                          >
                            <div className={`w-2 h-2 rounded-full ${syncingHospitals ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                              {syncingHospitals ? 'Syncing...' : (lastSyncTime ? `Synced at ${lastSyncTime}` : 'Sync Registry')}
                            </span>
                          </button>
                        </div>
                        <div className="space-y-6">
                          <HospitalSelect 
                            label="Choice 1: Main Provider" 
                            required 
                            value={formData.hospital1} 
                            onChange={(val) => setFormData({...formData, hospital1: val})} 
                          />
                          <HospitalSelect 
                            label="Choice 2: Alternative" 
                            value={formData.hospital2} 
                            onChange={(val) => setFormData({...formData, hospital2: val})} 
                          />
                          <HospitalSelect 
                            label="Choice 3: Regional Backup" 
                            value={formData.hospital3} 
                            onChange={(val) => setFormData({...formData, hospital3: val})} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* AIA REGISTER IN - Professional Layout */
                <div className="space-y-20 animate-in fade-in duration-700">
                  <div className="flex gap-12 items-start">
                    <div className={`w-20 h-20 rounded-[32px] bg-${selectedWorksite.color}-50 flex items-center justify-center text-${selectedWorksite.color}-600 text-3xl shadow-sm border border-${selectedWorksite.color}-100 flex-shrink-0`}><i className={`fa-solid ${selectedWorksite.icon}`}></i></div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
                        {/* Employee Selector - Show for SSF and AIA */}
                        {benefitType && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-100 mb-8">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                  <i className="fa-solid fa-user-check text-blue-600"></i>
                                  Select Employee
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Choose existing employee or create new</p>
                              </div>
                              {!isCreatingNew && (
                                <button
                                  onClick={() => {
                                    setIsCreatingNew(true);
                                    setSelectedEmployeeId(null);
                                    setFormData(initialFormState);
                                  }}
                                  className="px-6 py-3 bg-white border-2 border-blue-200 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
                                >
                                  <i className="fa-solid fa-plus"></i>
                                  Create New Employee
                                </button>
                              )}
                            </div>

                            {isCreatingNew ? (
                              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                                <div className="text-center py-8">
                                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-user-plus text-2xl text-blue-600"></i>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600 mb-4">Creating New Employee</p>
                                  <p className="text-xs text-slate-400 mb-6">Fill in the form below to register a new employee</p>
                                  <button
                                    onClick={() => setIsCreatingNew(false)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                                  >
                                    Or Select Existing Employee
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="relative">
                                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                    Search Employee
                                  </label>
                                  <select
                                    value={selectedEmployeeId || ''}
                                    onChange={(e) => {
                                      const employeeId = e.target.value;
                                      setSelectedEmployeeId(employeeId);
                                      
                                      // Find and pre-fill employee data
                                      const employee = activeEmployees.find(emp => emp.id === employeeId);
                                      if (employee) {
                                        setFormData({
                                          ...formData,
                                          firstName: employee.firstName || '',
                                          lastName: employee.lastName || '',
                                          idCard: employee.idCard || '',
                                          dateOfBirth: employee.dateOfBirth || '',
                                          gender: employee.gender || '',
                                          nationality: employee.nationality || '',
                                          maritalStatus: employee.maritalStatus || '',
                                          prefix: employee.prefix || '',
                                          passport: employee.passport || '',
                                          bankName: employee.preferredBank || '',
                                          accountNo: employee.accountNumber || '',
                                        });
                                      }
                                    }}
                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                                  >
                                    <option value="">-- Select Employee --</option>
                                    {activeEmployees.map((emp) => (
                                      <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.idCard})
                                      </option>
                                    ))}
                                  </select>
                                  <i className="fa-solid fa-chevron-down absolute right-5 top-11 text-slate-400 pointer-events-none"></i>
                                </div>

                                {selectedEmployeeId && (
                                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                      <i className="fa-solid fa-check text-white"></i>
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-emerald-800">Employee Selected</p>
                                      <p className="text-xs text-emerald-600">Basic information is pre-filled below</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Row 1: Prefix, First Name, Last Name */}
                        <div className="space-y-2">
                          <FormLabel text="Prefix" />
                          <select
                            value={formData.prefix}
                            onChange={(e) => setFormData({...formData, prefix: e.target.value})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc]'
                            }`}
                          >
                            <option value="">Select</option>
                            <option value="mr">Mr.</option>
                            <option value="ms">Ms.</option>
                            <option value="mrs">Mrs.</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <FormLabel text="First Name" required />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-blod outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc] focus:ring-4 focus:ring-rose-500'
                            }`}
                            placeholder="Official card name"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <FormLabel text="Last Name" required />
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc] focus:ring-4 focus:ring-rose-500'
                            }`}
                            placeholder="Official card name"
                            required
                          />
                        </div>

                        {/* Row 2: Date of Birth, Gender, Nationality */}
                        <div className="space-y-2">
                          <FormLabel text="Date of Birth" required />
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc]'
                            }`}
                            placeholder="dd/mm/yyyy"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <FormLabel text="Gender" required />
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc]'
                            }`}
                            required
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <FormLabel text="Nationality" required />
                          <select
                            value={formData.nationality}
                            onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc]'
                            }`}
                            required
                          >
                            <option value="thai">Thai</option>
                            <option value="foreigner">Foreigner</option>
                          </select>
                        </div>

                        {/* Row 3: Marital Status - Full Width Spanning 3 Columns */}
                        <div className="md:col-span-3 space-y-2">
                          <FormLabel text="Marital Status" required />
                          <div className="grid grid-cols-6 gap-3">
                            {/* Single */}
                            <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.maritalStatus === 'single'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!isCreatingNew && selectedEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                              <input
                                type="radio"
                                name="maritalStatus"
                                value="single"
                                checked={formData.maritalStatus === 'single'}
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                disabled={!isCreatingNew && selectedEmployeeId !== null}
                                className="w-5 h-5 text-blue-500"
                              />
                              <span className="text-sm font-medium">Single</span>
                            </label>

                            {/* Married */}
                            <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.maritalStatus === 'married'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!isCreatingNew && selectedEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              <input
                                type="radio"
                                name="maritalStatus"
                                value="married"
                                checked={formData.maritalStatus === 'married'}
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                disabled={!isCreatingNew && selectedEmployeeId !== null}
                                className="w-5 h-5 text-blue-500"
                              />
                              <span className="text-sm font-medium">Married</span>
                            </label>

                            {/* Widowed */}
                            <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.maritalStatus === 'widowed'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!isCreatingNew && selectedEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              <input
                                type="radio"
                                name="maritalStatus"
                                value="widowed"
                                checked={formData.maritalStatus === 'widowed'}
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                disabled={!isCreatingNew && selectedEmployeeId !== null}
                                className="w-5 h-5 text-blue-500"
                              />
                              <span className="text-sm font-medium">Widowed</span>
                            </label>

                            {/* Divorced */}
                            <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.maritalStatus === 'divorced'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!isCreatingNew && selectedEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              <input
                                type="radio"
                                name="maritalStatus"
                                value="divorced"
                                checked={formData.maritalStatus === 'divorced'}
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                disabled={!isCreatingNew && selectedEmployeeId !== null}
                                className="w-5 h-5 text-blue-500"
                              />
                              <span className="text-sm font-medium">Divorced</span>
                            </label>

                            {/* Separated */}
                            <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.maritalStatus === 'separated'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!isCreatingNew && selectedEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              <input
                                type="radio"
                                name="maritalStatus"
                                value="separated"
                                checked={formData.maritalStatus === 'separated'}
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                disabled={!isCreatingNew && selectedEmployeeId !== null}
                                className="w-5 h-5 text-blue-500"
                              />
                              <span className="text-sm font-medium">Separated</span>
                            </label>

                            {/* Other */}
                            <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.maritalStatus === 'other'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!isCreatingNew && selectedEmployeeId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              <input
                                type="radio"
                                name="maritalStatus"
                                value="other"
                                checked={formData.maritalStatus === 'other'}
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                disabled={!isCreatingNew && selectedEmployeeId !== null}
                                className="w-5 h-5 text-blue-500"
                              />
                              <span className="text-sm font-medium">Other</span>
                            </label>
                          </div>
                        </div>

                        {/* Row 4: National ID Card, Passport */}
                        <div className="space-y-2">
                          <FormLabel text="National ID Card" subtext="13-digit Thai ID" />
                          <input
                            type="text"
                            value={formData.idCard}
                            onChange={(e) => setFormData({...formData, idCard: formatThaiID(e.target.value)})}
                            disabled={!isCreatingNew && selectedEmployeeId !== null}
                            className={`w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold tracking-[0.2em] ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc] focus:ring-4 focus:ring-rose-500'
                            }`}
                            placeholder="X-XXXX-XXXXX-XX-X"
                            maxLength={17}
                          />
                        </div>

                        <div className="space-y-2">
                          <FormLabel text="Passport / ID" subtext = "For non-Thai nationals (optional)" />
                          <input type="text"
                            value={formData.passport}
                            onChange={(e) => setFormData({...formData, passport: e.target.value})}
                            className={`w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold outline-none ${
                              !isCreatingNew && selectedEmployeeId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[#f8fafc]'
                            }`}
                            placeholder="e.g., A12345678"
                          />
                        </div>

                        <div className="hidden md:block"></div>

                        {/* Row 5: Preferred Bank, Account Number */}
                        <div className="space-y-2">
                          <FormLabel text="Preferred Bank" />
                          <select className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                            value={formData.preferredBank}
                            onChange={(e) => setFormData({...formData, preferredBank: e.target.value})}
                          >
                            <option value="">Select Bank</option>
                            <option value="kbank">Kasikorn Bank</option>
                            <option value="scb">Siam Commercial Bank</option>
                            <option value="bbl">Bangkok Bank</option>
                            <option value="ktb">Krung Thai Bank</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <FormLabel text="Account Number" />
                          <input type="text" className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold outline-none"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                            placeholder="XXX-X-XXXXX-X"
                          />
                        </div>
                      </div>
                    </div>

                  <div className="pt-16 border-t border-slate-50">
                    <div className="flex gap-12 items-start">
                      <div className="w-20 h-20 rounded-[32px] bg-rose-50 flex items-center justify-center text-rose-600 text-3xl shadow-sm border border-rose-100 flex-shrink-0"><i className="fa-solid fa-briefcase"></i></div>
                      <div className="flex-1 space-y-12">
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><div className="w-1.5 h-3 bg-rose-500 rounded-full"></div> AIA Enrollment - {selectedWorksite.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                          <div className="space-y-2"><FormLabel text="Hiring Date" required /><InputWrapper><input type="date" value={formData.employmentDate} onChange={(e) => setFormData({...formData,employmentDate: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" /></InputWrapper></div>
                          <div className="space-y-2"><FormLabel text="AIA Plan" required /><select className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none"><option>100 - Junior</option><option>200 - Senior</option></select></div>
                          <div className="space-y-2"><FormLabel text="Staff Number" /><input type="text" className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="EMP-XXX" /></div>
                          <div className="space-y-2"><FormLabel text="Department" /><select className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"><option>IT</option><option>HR</option></select></div>
                          <div className="space-y-2"><FormLabel text="Designation" /><input type="text" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="Job Title" /></div>
                          <div className="space-y-2"><FormLabel text="Gross Salary" /><input type="text" className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="Amount (THB)" /></div>
                          <div className="md:col-span-2 space-y-2"><FormLabel text="Policy Effective Date" required /><InputWrapper><input type="date" className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" /></InputWrapper></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fffcf5] rounded-[56px] p-16 mt-16 border border-orange-100/50 shadow-inner">
                    <div className="flex items-center gap-4 mb-12">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shadow-sm"><i className="fa-solid fa-file-shield"></i></div>
                      <h4 className="text-[12px] font-black text-orange-900 uppercase tracking-widest">Supporting Documents Audit</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {[
                        { title: "National ID Card", sub: "FRONT SCAN OR PHOTO", icon: "fa-id-card", hasTemplate: false },
                        { title: "Bank Book Cover", sub: "MAIN SAVINGS ACCOUNT", icon: "fa-book-open", hasTemplate: false },
                        { title: "CEB Form", sub: "MANDATORY AIA FORM", icon: "fa-file-signature", hasTemplate: true }
                      ].map(doc => (
                        <div key={doc.title} className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] p-12 flex flex-col items-center text-center shadow-sm group hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-100/30 transition-all">
                          <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 text-3xl mb-8 group-hover:bg-rose-50 group-hover:text-rose-400 transition-all">
                            <i className={`fa-solid ${doc.icon}`}></i>
                          </div>
                          <h5 className="text-[15px] font-black text-slate-800 mb-2">{doc.title}</h5>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-12 leading-relaxed">{doc.sub}</p>
                          
                          <div className="w-full space-y-3">
                            <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all flex items-center justify-center gap-2">
                              <i className="fa-solid fa-cloud-arrow-up"></i> Upload File
                            </button>
                            <button 
                              onClick={() => handleDownload(doc.title)}
                              className="w-full py-3.5 bg-white text-slate-300 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-50 hover:bg-slate-50 hover:text-slate-500 transition-all flex items-center justify-center gap-2"
                            >
                              <i className="fa-solid fa-download"></i> {doc.hasTemplate ? 'Download Template' : 'Download File'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* EXIT FLOW - DATABASE DRIVEN */
              <div className="max-w-4xl mx-auto py-16 space-y-16">
                <div className="text-center space-y-4">
                  <div className={`w-20 h-20 bg-${selectedWorksite.color}-50 text-${selectedWorksite.color}-600 rounded-[32px] flex items-center justify-center text-3xl mx-auto shadow-sm border border-${selectedWorksite.color}-100`}><i className={`fa-solid ${selectedWorksite.icon}`}></i></div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-widest">{selectedWorksite.name} Exit Processor</h3>
                  <p className="text-slate-400 text-sm max-w-lg mx-auto">Processing resignation for {benefitType} provider at this location.</p>
                </div>
                
                <div className="bg-slate-50/50 p-16 rounded-[56px] border border-slate-100 space-y-12">
                  <div className="space-y-4">
                    <FormLabel text="Select Active Employee" required />
                    <div className="relative">
                      <select 
                        value={formData.selectedEmployeeId} 
                        onChange={(e) => {
                          const emp = activeEmployees.find(x => x.id === e.target.value);
                          if (emp) setFormData({...formData, selectedEmployeeId: emp.id, firstName: emp.firstName, lastName: emp.lastName, idCard: emp.idCard, worksiteId: emp.worksiteId, employmentDate: emp.employmentDate, benefitType: emp.benefitType,});
                          else setFormData({...formData, selectedEmployeeId: ''});
                        }}
                        className="w-full bg-white border border-slate-200 rounded-3xl px-8 py-6 text-base font-black outline-none focus:ring-4 focus:ring-rose-50 appearance-none transition-all shadow-sm"
                      >
                        <option value="">-- Find Member at {selectedWorksite.name} --</option>
                        {activeEmployees
                          .filter(e => 
                            String(e.worksiteId) === selectedWorksiteId &&
                            e.status === 'ENTRY' // Can only resign active employees
                          )
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} [{emp.idCard}]
                              </option>
                            ))
                          }
                      </select>
                      <i className="fa-solid fa-magnifying-glass absolute right-8 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    </div>
                  </div>
                  
                  {formData.selectedEmployeeId && (
                    <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm"><FormLabel text="Full Name" /><p className="text-xl font-black text-slate-800 mt-2">{formData.firstName} {formData.lastName}</p></div>
                      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm"><FormLabel text="National ID" /><p className="text-xl font-mono font-black text-slate-400 mt-2">{formData.idCard}</p></div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2"><FormLabel text="Effective Exit Date" required /><InputWrapper><input type="date" value={formData.exitDate} onChange={(e) => setFormData({...formData, exitDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-3xl px-8 py-6 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-50 transition-all shadow-sm" /></InputWrapper></div>
                    <div className="space-y-2">
                      <FormLabel text="Termination Reason" required />
                      <div className="relative">
                        <select 
                          value={formData.resignationReason}
                          onChange={(e) => setFormData({...formData, resignationReason: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-3xl px-8 py-6 text-sm font-black outline-none appearance-none shadow-sm focus:ring-4 focus:ring-rose-50 transition-all"
                        >
                          <option>Select Reason</option>
                          {benefitType === BenefitType.SSF ? (
                            <>
                              <option value="Resign / Left Employer Within 6 Days">Resign / Left Employer Within 6 Days</option>
                              <option value="End of Contract Period">End of Contract Period</option>
                              <option value="Resign Before Retirement Plan">Resign Before Retirement Plan</option>
                              <option value="Mandatory Retirement">Mandatory Retirement</option>
                              <option value="Dismissal for Serious Misconduct">Dismissal for Serious Misconduct</option>
                              <option value="Death of Member">Death of Member</option>
                            </>
                          ) : (
                            <>
                              <option value="Resign / Left Employer Within 6 Days">Resign / Left Employer Within 6 Days</option>
                              <option value="End of Contract Period">End of Contract Period</option>
                              <option value="Resign Before Retirement Plan">Resign Before Retirement Plan</option>
                              <option value="Mandatory Retirement">Mandatory Retirement</option>
                              <option value="Dismissal for Serious Misconduct">Dismissal for Serious Misconduct</option>
                              <option value="Death of Member">Death of Member</option>
                            </>
                          )}
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-6 pt-16 border-t border-slate-50 mt-16">
              <button onClick={() => setFormData(initialFormState)} className="px-12 py-5 rounded-[24px] font-black text-[10px] tracking-[0.2em] bg-slate-100 text-slate-400 uppercase hover:bg-slate-200 transition-all">Reset Form</button>
              <button onClick={formType === RegistrationType.REGISTER_IN ? handleSave : handleExit} className={`px-20 py-5 rounded-[24px] font-black text-[10px] tracking-[0.2em] text-white shadow-2xl transition-all uppercase ${benefitType === BenefitType.SSF ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' : 'bg-rose-600 shadow-rose-200 hover:bg-rose-700'}`}>
                {formType === RegistrationType.REGISTER_IN ? 'Process Registration' : 'Process Resignation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Visibility Panel */}
      <div className="bg-white rounded-[56px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-12 border-b bg-slate-50/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Workforce Monitor</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time status of all active members for {selectedWorksite.name}.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm"><span className="text-[10px] font-black text-slate-300 uppercase block tracking-widest">Site Headcount</span>
             <span className="text-xl font-black text-slate-800">
                {activeEmployees.filter(e => 
                  String(e.worksiteId) === selectedWorksiteId &&
                  e.status === 'ENTRY'
                ).length}
              </span>
              </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] border-b border-slate-100">
                <th className="px-12 py-8">Identity</th>
                <th className="px-12 py-8">National ID</th>
                <th className="px-12 py-8">Worksite Location</th>
                <th className="px-12 py-8">Provider</th>
                <th className="px-12 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeEmployees
                .filter(emp => emp.status === 'ENTRY') // Only show active employees
                .map(emp => {
                console.log('Employee data:', emp);
                console.log('Available worksites:', worksites);
                // Look up the worksite name from the worksite ID
                const worksite = worksites.find(w => w.id === String(emp.worksiteId));
                console.log(`Looking for worksite ID ${emp.worksiteId}, found:`, worksite);

                const worksiteName = worksite?.name || 'Unknown Site';
                const siteInfo = {
                  icon: worksite?.icon || 'fa-location-dot',
                  color: worksite?.color || 'slate'
                };
                const isSelectedSite = String(emp.worksiteId) === selectedWorksiteId;
                return (
                  <tr key={emp.id} className={`transition-all group cursor-default ${isSelectedSite ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}`}>
                    {/* NAME COLUMN - Fixed to used firstName + lastName */}
                    <td className="px-12 py-8 font-black text-slate-700 text-sm group-hover:text-blue-600 transition-colors">
                      {emp.firstName} {emp.lastName}
                    </td>

                    {/* ID CARD COLUMN */}
                    <td className="px-12 py-8 font-mono text-slate-400 text-xs font-bold tracking-widest">
                      {emp.idCard}
                    </td>

                    {/* WORKSITE COLUMN - Fixed to show actual worksite name */}
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-${siteInfo.color}-50 text-${siteInfo.color}-600 flex items-center justify-center text-xs shadow-inner`}>
                          <i className={`fa-solid ${siteInfo.icon}`}></i>
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-500">{worksiteName}</div>
                          <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                            {emp.department || 'N/A'} Unit
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ACTIONS COLUMN */}
                    <td className="px-12 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest shadow-sm ${
                        emp.benefitType === 'SSF' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {emp.benefitType}
                      </span>
                    </td>
                    <td className="px-12 py-8 text-right">
                      <button onClick={() => { 
                        setFormType(RegistrationType.REGISTER_OUT); 
                        setBenefitType(emp.benefitType); 
                        setFormData({
                          ...formData, 
                          selectedEmployeeId: emp.id, 
                          firstName: emp.firstName, 
                          lastName: emp.lastName, 
                          idCard: emp.idCard
                        }); 
                        window.scrollTo({top: 0, behavior: 'smooth'}); 
                      }} 
                      className="w-12 h-12 rounded-[20px] bg-slate-50 hover:bg-rose-600 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm border border-slate-100"
                    >
                      <i className="fa-solid fa-user-minus text-sm"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;
