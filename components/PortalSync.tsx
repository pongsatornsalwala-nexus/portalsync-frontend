
import React, { useState, useEffect } from 'react';
import { PortalStatus, BenefitType, RegistrationType } from '../types';
import { fetchSSFHospitals } from '../services/geminiService';
import { getEmployees, patchEmployeeFields, updateEmployeeStatus, reRegisterEmployee, archiveEmployee, activateEmployee } from '../services/apiService';

interface QueueItem {
  id_key: string;
  prefix: string;
  name: string; 
  firstName: string;
  lastName: string;
  id: string;
  date: string; 
  plan: string; 
  dept: string; 
  salary: number; 
  hospital1?: string;
  hospital2?: string;
  hospital3?: string;
  bank: string;
  account: string;
  hasSsf: boolean;
  hasAia: boolean;
  ssfStatus: PortalStatus; // SSF-specific status
  aiaStatus: PortalStatus; // AIA-specific status
  ssfExitStatus?: PortalStatus;
  aiaExitStatus?: PortalStatus;
  worksite: string;
  regType: RegistrationType;
  resignReason?: string;
  processedBy?: string;
  isExitingSsf?: boolean;
  isExitingAia?: boolean;
  ssfActivated?: boolean;
  aiaActivated?: boolean;
  ssfArchived?: boolean;
  aiaArchived?: boolean;
  nationalIdFile?: string;
  bankBookFile?: string;
  cebFormFile?: string;
}

const EditableField = ({ label, fieldKey, itemId, value, editState, onEdit } : {
  label: string;
  fieldKey: keyof QueueItem;
  itemId: string;
  value: string;
  editState: Record<string, Partial<QueueItem>>;
  onEdit: (id_key: string, field: keyof QueueItem, value:string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight">{label}</span>
    <input
      value={(editState[itemId]?.[fieldKey] as string) ?? value}
      onChange={e => onEdit(itemId, fieldKey, e.target.value)}
      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:border-blue-300 focus:bg-slut-50 focus:outline-none text-[11px] font-bold text-slate-600 transition-all w-full"
    />
  </div>
)

const PortalSync: React.FC = () => {
  const [benefitType, setBenefitType] = useState<BenefitType>(BenefitType.SSF);
  const [regType, setRegType] = useState<RegistrationType>(RegistrationType.REGISTER_IN);
  const [isSyncingMaster, setIsSyncingMaster] = useState(false);
  const [lastMasterSync, setLastMasterSync] = useState<string>('24 Oct 2024');
  const [selectedEmployee, setSelectedEmployee] = useState<QueueItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editState, setEditState] = useState<Record<string, Partial<QueueItem>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const steps = [
    { id: PortalStatus.IMPORTED, label: 'IMPORTED' },
    { id: PortalStatus.PENDING, label: 'PENDING' },
    { id: PortalStatus.REGISTERED, label: 'REGISTERED' },
  ];

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [showReRegisterModal, setShowReRegisterModal] = useState(false);
  const [employeeToReRegister, setEmployeeToReRegister] = useState<QueueItem | null>(null);

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [employeeToArchive, setEmployeeToArchive] = useState<QueueItem | null>(null);

  const [showActivateModal, setShowActivateModal] = useState(false);
  const [employeeToActivate, setEmployeeToActivate] = useState<QueueItem | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState<string>('');

  // Fetch employees from API when component loads
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const employees = await getEmployees();

        console.log('exit statuses:', employees.map((e: any) => ({
          name: e.firstName,
          aiaExitStatus: e.aiaExitStatus,
          ssfExitStatus: e.ssfExitStatus
        })));

        // Transform API data to match QueueItem structure
        const queueItems: QueueItem[] = employees.map((emp: any) => ({
          id_key: emp.id,
          prefix: emp.prefix || '',
          name: `${emp.firstName} ${emp.lastName}`,
          firstName: emp.firstName,
          lastName: emp.lastName,
          id: emp.idCard,
          date: emp.employmentDate,
          plan: emp.plan || '',
          dept: emp.department || '',
          salary: emp.salary || 0,
          hospital1: emp.hospital1,
          hospital2: emp.hospital2,
          hospital3: emp.hospital3,
          bank: emp.bankName || '',
          account: emp.bankAccount || '',
          hasSsf: emp.hasSsf,
          hasAia: emp.hasAia,
          ssfStatus: emp.ssfStatus || PortalStatus.IMPORTED,
          aiaStatus: emp.aiaStatus || PortalStatus.IMPORTED,
          ssfExitStatus: emp.ssfExitStatus || PortalStatus.IMPORTED,
          aiaExitStatus: emp.aiaExitStatus || PortalStatus.IMPORTED,
          worksite: emp.worksiteName || '',
          regType: emp.registrationType || RegistrationType.REGISTER_IN,
          resignReason: emp.resignReason,
          processedBy: 'System',
          isExitingSsf: emp.isExitingSsf || false,
          isExitingAia: emp.isExitingAia || false,
          ssfActivated: emp.ssfActivated || false,
          aiaActivated: emp.aiaActivated || false,
          ssfArchived: emp.ssfArchived || false,
          aiaArchived: emp.aiaArchived || false,
          nationalIdFile: emp.nationalIdFile || '',
          bankBookFile: emp.bankBookFile || '',
          cebFormFile: emp.cebFormFile || '',
        }));

        setQueue(queueItems);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setError('Failed to load employees. Please try again');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleCopy = (val: string | number) => {
    navigator.clipboard.writeText(val.toString());
  };

  const isDirty = (id_key: string) => Object.keys(editState[id_key] ?? {}).length > 0;

  const handleFieldEdit = (id_key: string, field: keyof QueueItem, value: string) => {
    setEditState(prev => ({
      ...prev,
      [id_key]: { ...prev[id_key], [field]: value }
    }));
  };

  const handleSaveEmployee = async (id_key: string) => {
    const changes = editState[id_key];
    if (!changes) return;
    const original = queue.find(i => i.id_key === id_key)!;
    const merged = { ...original, ...changes };
    // Optimistic update
    setQueue(prev => prev.map(i => i.id_key === id_key ? merged : i));
    setEditState(prev => { const next = { ...prev }; delete next[id_key]; return next; });
    try {
      await patchEmployeeFields(id_key, changes);
      console.log('✅ Employee saved');
    } catch {
      // Rollback
      setQueue(prev => prev.map(i => i.id_key === id_key ? original : i));
      setEditState(prev => ({ ...prev, [id_key]: changes }));
      alert('Failed to save. Please try again.');
    }
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

  const updateStatus = async (id_key: string, newStatus: PortalStatus) => {
    // Step 1: OPTIMISTIC UPDATE - update the UI immediately so it feels instant
    const previousQueue = queue; // save a copy in case we need to rollback

    // Find the employee to check if they're exiting
    const employee = queue.find(item => item.id_key === id_key);
    const isExit = benefitType === BenefitType.SSF
      ? employee?.isExitingSsf
      : employee?.isExitingAia;

    setQueue(prev => prev.map(item => {
      if (item.id_key === id_key) {
        const isExit = benefitType === BenefitType.SSF
          ? item.isExitingSsf
          : item.isExitingAia;

        let updatedItem;
        if (isExit) {
          updatedItem = benefitType === BenefitType.SSF
            ? { ...item, ssfExitStatus: newStatus }
            : { ...item, aiaExitStatus: newStatus };
        } else {
          // Inbound employees: update the regular status field
          updatedItem = benefitType === BenefitType.SSF
            ? { ...item, ssfStatus: newStatus }
            : { ...item, aiaStatus: newStatus };
        }
        if (selectedEmployee?.id_key === id_key) {
          setSelectedEmployee(updatedItem);
        }
        return updatedItem;
      }
      return item;
    }));

    // Step 2: PERSIST - tell Django to save the change
    try {
      await updateEmployeeStatus(
        id_key,
        benefitType === BenefitType.SSF ? 'ssf' : 'aia', // convert SSF -> ssf
        newStatus,
        isExit ?? false
      );
      console.log(`✅ Status saved: ${newStatus}`);
    } catch (error) {
      // Step 3: ROLLBACK - if the API fails, undo the UI change
      console.error('❌ Failed to save status, rolling back:', error);
      setQueue(previousQueue);
      if (selectedEmployee?.id_key === id_key) {
        setSelectedEmployee(previousQueue.find(i => i.id_key === id_key) || null);
      }
      alert('Failed to save status change. Please try again.');
    }
  };

  const handleReRegister = async () => {
    if (!employeeToReRegister) return;

    try {
      console.log('🔄 Re-registering employee:', employeeToReRegister.name);

      // Determine which benefit to restore based on current tab
      const benefitToRestore = benefitType === BenefitType.SSF ? 'SSF' : 'AIA';

      // Call the API
      await reRegisterEmployee(employeeToReRegister.id_key, benefitToRestore);

      console.log('✅ Successfully re-registered employee');

      // Close modal
      setShowReRegisterModal(false);
      setEmployeeToReRegister(null);

      // Refresh the employee list to show updated data
      const employees = await getEmployees();
      const queueItems: QueueItem[] = employees.map((emp: any) => ({
        id_key: emp.id,
        prefix: emp.prefix || '',
        name: `${emp.firstName} ${emp.lastName}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        id: emp.idCard,
        date: emp.employmentDate,
        plan: emp.plan || '',
        dept: emp.department || '',
        salary: emp.salary || 0,
        hospital1: emp.hospital1,
        hospital2: emp.hospital2,
        hospital3: emp.hospital3,
        bank: emp.bankName || '',
        account: emp.bankAccount || '',
        hasSsf: emp.hasSsf,
        hasAia: emp.hasAia,
        ssfStatus: emp.ssfStatus || PortalStatus.IMPORTED,
        aiaStatus: emp.aiaStatus || PortalStatus.IMPORTED,
        ssfExitStatus: emp.ssfExitStatus || PortalStatus.IMPORTED,
        aiaExitStatus: emp.aiaExitStatus || PortalStatus.IMPORTED,
        worksite: emp.worksiteName || '',
        regType: emp.registrationType || RegistrationType.REGISTER_IN,
        resignReason: emp.resignReason,
        processedBy: 'System',
        isExitingSsf: emp.isExitingSsf || false,
        isExitingAia: emp.isExitingAia || false,
        ssfActivated: emp.ssfActivated || false,
        aiaActivated: emp.aiaActivated || false,
        ssfArchived: emp.ssfArchived || false,
        aiaArchived: emp.aiaArchived || false,
        nationalIdFile: emp.nationalIdFile || '',
        bankBookFile: emp.bankBookFile || '',
        cebFormFile: emp.cebFormFile || '',
      }));
      setQueue(queueItems);

      alert(`Successfully re-registered ${employeeToReRegister.name}!`);
    } catch (error) {
      console.error('❌ Error re-registering employee:', error);
      alert('Failed to re-register employee. Please try again.');
    }
  };

  const handleArchive = async () => {
    if (!employeeToArchive) return;

    try {
      console.log('📦 Archiving employee:', employeeToArchive.name);

      // Determine which benefit we're archiving
      const benefitToArchive = benefitType === BenefitType.SSF ? 'SSF' : 'AIA';

      // Call the API
      await archiveEmployee(employeeToArchive.id_key, benefitToArchive);

      console.log('✅ Successfully archived employee');

      // Close modal
      setShowArchiveModal(false);
      setEmployeeToArchive(null);

      // Refresh the employee list to show updated data
      const employees = await getEmployees();
      const queueItems: QueueItem[] = employees.map((emp: any) => ({
        id_key: emp.id,
        prefix: emp.prefix || '',
        name: `${emp.firstName} ${emp.lastName}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        id: emp.idCard,
        date: emp.employmentDate,
        plan: emp.plan || '',
        dept: emp.department || '',
        salary: emp.salary || 0,
        hospital1: emp.hospital1,
        hospital2: emp.hospital2,
        hospital3: emp.hospital3,
        bank: emp.bankName || '',
        account: emp.bankAccount || '',
        hasSsf: emp.hasSsf,
        hasAia: emp.hasAia,
        ssfStatus: emp.ssfStatus || PortalStatus.IMPORTED,
        aiaStatus: emp.aiaStatus || PortalStatus.IMPORTED,
        ssfExitStatus: emp.ssfExitStatus || PortalStatus.IMPORTED,
        aiaExitStatus: emp.aiaExitStatus || PortalStatus.IMPORTED,
        worksite: emp.worksiteName || '',
        regType: emp.registrationType || RegistrationType.REGISTER_IN,
        resignReason: emp.resignReason,
        processedBy: 'System',
        isExitingSsf: emp.isExitingSsf || false,
        isExitingAia: emp.isExitingAia || false,
        ssfActivated: emp.ssfActivated || false,
        aiaActivated: emp.aiaActivated || false,
        ssfArchived: emp.ssfArchived || false,
        aiaArchived: emp.aiaArchived || false,
        nationalIdFile: emp.nationalIdFile || '',
        bankBookFile: emp.bankBookFile || '',
        cebFormFile: emp.cebFormFile || '',
      }));
      setQueue(queueItems);

      alert(`Successfully archived ${employeeToArchive.name}!`);
    } catch (error) {
      console.error('❌ Error archiving employee:', error);
      alert('Failed to archive employee. Please try again.');
    }
  }

  const handleActivate = async () => {
    if (!employeeToActivate) return;

    try {
      console.log('✅ Activating employee:', employeeToActivate.name);

      // Determine which benefit we're activating
      const benefitToActivate = benefitType === BenefitType.SSF ? 'SSF' : 'AIA';

      // Call the API
      await activateEmployee(employeeToActivate.id_key, benefitToActivate);

      console.log('✅ Successfully activated employee');

      // Close modal
      setShowActivateModal(false);
      setEmployeeToActivate(null);

      // Refresh the employee list to show updated data
      const employees = await getEmployees();
      const queueItems: QueueItem[] = employees.map((emp: any) => ({
        id_key: emp.id,
        prefix: emp.prefix || '',
        name: `${emp.firstName} ${emp.lastName}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        id: emp.idCard,
        date: emp.employmentDate,
        plan: emp.plan || '',
        dept: emp.department || '',
        salary: emp.salary || 0,
        hospital1: emp.hospital1,
        hospital2: emp.hospital2,
        hospital3: emp.hospital3,
        bank: emp.bankName || '',
        account: emp.bankAccount || '',
        hasSsf: emp.hasSsf,
        hasAia: emp.hasAia,
        ssfStatus: emp.ssfStatus || PortalStatus.IMPORTED,
        aiaStatus: emp.aiaStatus || PortalStatus.IMPORTED,
        ssfExitStatus: emp.ssfExitStatus || PortalStatus.IMPORTED,
        aiaExitStatus: emp.aiaExitStatus || PortalStatus.IMPORTED,
        worksite: emp.worksiteName || '',
        regType: emp.registrationType || RegistrationType.REGISTER_IN,
        resignReason: emp.resignReason,
        processedBy: 'System',
        isExitingSsf: emp.isExitingSsf || false,
        isExitingAia: emp.isExitingAia || false,
        ssfActivated: emp.ssfActivated || false,
        aiaActivated: emp.aiaActivated || false,
        ssfArchived: emp.ssfArchived || false,
        aiaArchived: emp.aiaArchived || false,
        nationalIdFile: emp.nationalIdFile || '',
        bankBookFile: emp.bankBookFile || '',
        cebFormFile: emp.cebFormFile || '',
      }));
      setQueue(queueItems);

      alert(`Successfully activated ${employeeToActivate.name}!`);
    } catch (error) {
      console.error('❌ Error activating employee:', error);
      alert('Failed to activate employee. Please try again.');
    }
  };

  const filteredQueue = queue.filter(item => {
    // Determine if employee is inbound/outbound for THIS specific benefit
    const isExitingFromCurrentBenefit = benefitType === BenefitType.SSF
      ? item.isExitingSsf
      : item.isExitingAia;

    const hasCurrentBenefit = benefitType === BenefitType.SSF
      ? item.hasSsf
      : item.hasAia;

    // Check if this benefit is activated (for INBOUND filtering)
    const isCurrentBenefitActivated = benefitType === BenefitType.SSF
      ? (item.ssfActivated || false)
      : (item.aiaActivated || false);

    // For OUTBOUND: Don't show if this benefit is already archived
    const isCurrentBenefitArchived = benefitType === BenefitType.SSF
      ? (item.ssfArchived || false)
      : (item.aiaArchived || false);

    if (regType === RegistrationType.REGISTER_IN) {
      // INBOUND: Show if they have the benefit AND are NOT exiting from it
      return hasCurrentBenefit && !isExitingFromCurrentBenefit && !isCurrentBenefitActivated;
    } else {
      // OUTBOUND: Show if they ARE exiting from this benefit AND not yet archived
      return isExitingFromCurrentBenefit && !isCurrentBenefitArchived;;
    }
  });

  // Filter employees based on search query
  const searchFilteredEmployees = filteredQueue.filter(employee => {
    if (!searchQuery) return true; // Show all if no searching

    const query = searchQuery.toLowerCase();

    // Safely check if properties exist before calling toLowerCase()
    const nameMatch = employee.name?.toLowerCase().includes(query) || false;
    const idMatch = employee.id?.toLowerCase().includes(query) || false;

    return nameMatch || idMatch;
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

  const prefixDisplayMap: Record<string, string> = {
    mr: 'Mr.',
    mrs: 'Mrs.',
    ms: 'Ms.'
  };
  const formatPrefix = (raw: string) => prefixDisplayMap[raw] ?? raw;

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
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                <i className="fa-solid fa-building mr-2"></i>
                {selectedEmployee.worksite}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Member Identity Column */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Member Identity</h4>
                <CopyableField label="Prefix" value={formatPrefix(selectedEmployee.prefix) || 'N/A'} />
                <CopyableField label="First Name" value={selectedEmployee.firstName} />
                <CopyableField label="Last Name" value={selectedEmployee.lastName} />
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
                    const isExit = benefitType === BenefitType.SSF
                      ? selectedEmployee.isExitingSsf
                      : selectedEmployee.isExitingAia;
                    const currentStatus = benefitType === BenefitType.SSF 
                      ? (isExit ? selectedEmployee.ssfExitStatus : selectedEmployee.ssfStatus)
                      : (isExit ? selectedEmployee.aiaExitStatus : selectedEmployee.aiaStatus);
                    const isPassed = steps.findIndex(s => s.id === currentStatus) >= idx;
                    const isCurrent = currentStatus === step.id;
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
                {/* Set as Active Employee Button - Selected Employee View */}
                {regType === RegistrationType.REGISTER_IN && (() => {
                  const currentStatus = benefitType === BenefitType.SSF
                    ? selectedEmployee.ssfStatus
                    : selectedEmployee.aiaStatus;
                  const isAlreadyActivated = benefitType === BenefitType.SSF
                    ? selectedEmployee.ssfActivated
                    : selectedEmployee.aiaActivated
                  
                  if (currentStatus === PortalStatus.REGISTERED && !isAlreadyActivated) {
                    return (
                      <button
                        onClick={() => {
                          setEmployeeToActivate(selectedEmployee);
                          setShowActivateModal(true);
                        }}
                        className={`mt-4 w-full px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                          benefitType === BenefitType.SSF
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                      >
                        <i className="fa-solid fa-circle-check mr-2"></i>
                        Set as Active Employee
                      </button>
                    );
                  }
                  return null;
                })()}
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
          <div className="overflow-x-auto pb-10">
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                  <p className="text-sm font-bold text-slate-400">Loading employees...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md">
                  <i className="fa-solid fa-triangle-exclamation text-4xl text-rose-500 mb-4"></i>
                  <p className="text-sm font-bold text-rose-600 mb-2">Error Loading Data</p>
                  <p className="text-xs text-slate-600">{error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredQueue.length === 0 && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <i className="fa-solid fa-inbox text-4xl text-slate-300 mb-4"></i>
                  <p className="text-sm font-bold text-slate-400">No employees found</p>
                  <p className="text-xs text-slate-500 mt-2">Try changing the registration type filter</p>
                </div>
              </div>
            )}

            {/* Table - Only show when data is loaded */}
            {!isLoading && !error && filteredQueue.length > 0 && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/10">
                    <th className="px-6 py-6">Member Identity</th>
                    <th className="px-6 py-6">Portal Fields (Copy for Manual Entry)</th>
                    <th className="px-6 py-6">ATS Status Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredQueue.map(item => (
                    <tr key={item.id_key} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-6 py-10 align-top w-[25%]">
                        <div className="space-y-4">
                          <div className="flex gap-2 mb-2 flex-wrap">
                            {/* SSF Status Badge */}
                            <span className={`px-2 py-1 rounded text-[9px] font-black tracking-tight border ${
                              (() => {
                                // INACTIVE: Doesn't have SSF and not exiting from it, OR archived
                                if ((!item.hasSsf && !item.isExitingSsf) || item.ssfArchived) {
                                  return 'bg-slate-50 text-slate-400 border-slate-200';
                                }
                                // EXIT: Currently going through exit process
                                if (item.isExitingSsf) {
                                  return 'bg-orange-50 text-orange-600 border-orange-200';
                                }
                                // ACTIVE: Has SSF, activated (completed registration)
                                if (item.hasSsf && item.ssfActivated) {
                                  return 'bg-blue-50 text-blue-600 border-blue-200';
                                }
                                // ENTRY: Has SSF but not yet activated (registration in progress)
                                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
                              })()
                            }`}>
                              SSF: {
                                (() => {
                                  if ((!item.hasSsf && !item.isExitingSsf) || item.ssfArchived) return 'INACTIVE';
                                  if (item.isExitingSsf) return 'EXIT';
                                  if (item.hasSsf && item.ssfActivated) return 'ACTIVE';
                                  return 'ENTRY';
                                })()
                              }
                            </span>

                            {/* AIA Status Badge */}
                            <span className={`px-2 py-1 rounded text-[9px] font-black tracking-tight border ${
                              (() => {
                                // INACTIVE: Doesn't have AIA and not exiting from it, OR archived
                                if ((!item.hasAia && !item.isExitingAia) || item.aiaArchived) {
                                  return 'bg-slate-50 text-slate-400 border-slate-200';
                                }
                                // EXIT: Currently going through exit process
                                if (item.isExitingAia) {
                                  return 'bg-orange-50 text-orange-600 border-orange-200';
                                }
                                // ACTIVE: Has AIA, activated (completed registration)
                                if (item.hasAia && item.aiaActivated) {
                                  return 'bg-rose-50 text-rose-600 border-rose-200';
                                }
                                // ENTRY: Has AIA but not yet activated (registration in progress)
                                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
                              })()
                            }`}>
                              AIA: {
                                (() => {
                                  if ((!item.hasAia && !item.isExitingAia) || item.aiaArchived) return 'INACTIVE';
                                  if (item.isExitingAia) return 'EXIT';
                                  if (item.hasAia && item.aiaActivated) return 'ACTIVE';
                                  return 'ENTRY';
                                })()
                              }
                            </span>
                          </div>
                          <EditableField 
                            label="Prefix" 
                            fieldKey="prefix" 
                            itemId={item.id_key} 
                            value={formatPrefix(item.prefix) || 'N/A'}
                            editState={editState}
                            onEdit={handleFieldEdit} 
                          />
                          <EditableField 
                            label="First Name" 
                            fieldKey="firstName" 
                            itemId={item.id_key} 
                            value={item.firstName} 
                            editState={editState}
                            onEdit={handleFieldEdit}
                          />
                          <EditableField 
                            label="Last Name" 
                            fieldKey="lastName" 
                            itemId={item.id_key} 
                            value={item.lastName} 
                            editState={editState}
                            onEdit={handleFieldEdit}
                          />
                          <EditableField 
                            label="National ID" 
                            fieldKey="id" 
                            itemId={item.id_key} 
                            value={item.id} 
                            editState={editState}
                            onEdit={handleFieldEdit}
                          />
                          {isDirty(item.id_key) && (
                            <button 
                              onClick={() => handleSaveEmployee(item.id_key)}
                              className="w-full mt-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                            >
                              <i className="fa-solid fa-floppy-disk mr-2"></i>Save Changes
                            </button>
                          )}
                          
                          {/* AIA Specific Document Downloads */}
                          {benefitType === BenefitType.AIA && (
                            <div className="flex flex-wrap gap-2">
                              {item.nationalIdFile ? (
                                <button
                                  onClick={() => { setPreviewUrl(item.nationalIdFile!); setPreviewLabel('National ID'); }}
                                  className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-rose-100 flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                                >
                                  <i className="fa-solid fa-id-card"></i> ID
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-slate-50 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-100 flex items-center gap-2">
                                  <i className="fa-solid fa-id-card"></i> ID
                                </span>
                              )}
                              {item.bankBookFile ? (
                                <button
                                  onClick={() => { setPreviewUrl(item.bankBookFile!); setPreviewLabel('Bank Book'); }}
                                  className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-rose-100 flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                                >
                                  <i className="fa-solid fa-id-card"></i> Bank
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-slate-50 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-100 flex items-center gap-2">
                                  <i className="fa-solid fa-id-card"></i> Bank
                                </span>
                              )}
                              {item.cebFormFile ? (
                                <button
                                  onClick={() => { setPreviewUrl(item.cebFormFile!); setPreviewLabel('CEB Form'); }}
                                  className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-rose-100 flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                                >
                                  <i className="fa-solid fa-id-card"></i> CEB
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-slate-50 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-100 flex items-center gap-2">
                                  <i className="fa-solid fa-id-card"></i> CEB
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-10 align-top w-[30%]">
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
                      <td className="px-6 py-10 align-top w-[45%]">
                        <div className="flex items-center gap-1 mt-8">
                          {steps.map((step, idx) => {
                            const isExit = benefitType === BenefitType.SSF
                              ? item.isExitingSsf
                              : item.isExitingAia;
                            const currentStatus = benefitType === BenefitType.SSF 
                              ? (isExit ? item.ssfExitStatus : item.ssfStatus) 
                              : (isExit ? item.aiaExitStatus : item.aiaStatus);
                            const isPassed = steps.findIndex(s => s.id === currentStatus) >= idx;
                            const isCurrent = currentStatus === step.id;
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
                                {idx < steps.length - 1 && <div className={`h-[2px] w-8 mb-6 transition-all ${steps.findIndex(s => s.id === currentStatus) > idx ? (benefitType === BenefitType.SSF ? 'bg-blue-600' : 'bg-rose-600') : 'bg-slate-100'}`}></div>}
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

                        {/* Activate Button - Only show for INBOUND employees at VERIFIED */}
                        {regType === RegistrationType.REGISTER_IN && (() => {
                          const currentStatus = benefitType === BenefitType.SSF ? item.ssfStatus : item.aiaStatus;
                          const hasCurrentBenefit = benefitType === BenefitType.SSF ? item.hasSsf : item.hasAia;
                          const isAlreadyActivated = benefitType === BenefitType.SSF ? item.ssfActivated : item.aiaActivated;
                          const hasReachedVerified = currentStatus === PortalStatus.REGISTERED;

                          // Show activate button only if has benefit, reached VERIFIED, and not yet activated
                          if (hasCurrentBenefit && hasReachedVerified && !isAlreadyActivated) {
                            return (
                              <div className="mt-4">
                                <button
                                  onClick={() => {
                                    setEmployeeToActivate(item);
                                    setShowActivateModal(true);
                                  }}
                                  className={`w-full px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                    benefitType === BenefitType.SSF
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-rose-600 text-white hover:bg-rose-700'
                                  }`}
                                >
                                  <i className="fa-solid fa-circle-check mr-2"></i>
                                  Activate
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Re-register Button - Only show for OUTBOUND employees before VERIFIED */}
                        {regType === RegistrationType.REGISTER_OUT && (() => {
                          const currentStatus = benefitType === BenefitType.SSF ? item.ssfStatus : item.aiaStatus;
                          const isExitingFromCurrentBenefit = benefitType === BenefitType.SSF ? item.isExitingSsf : item.isExitingAia;
                          const hasReachedVerified = currentStatus === PortalStatus.REGISTERED;
                          
                          // Show re-register button only if exiting from current benefit AND hasn't reached VERIFIED
                          if (isExitingFromCurrentBenefit && !hasReachedVerified) {
                            return (
                              <div className="mt-4">
                                <button
                                  onClick={() => {
                                    setEmployeeToReRegister(item);
                                    setShowReRegisterModal(true);
                                  }}
                                  className={`w-full px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border-2 ${
                                    benefitType === BenefitType.SSF
                                      ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white'
                                      : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white'
                                  }`}
                                >
                                  <i className="fa-solid fa-user-plus mr-2"></i>
                                  Re-register
                                </button>
                              </div>
                            );
                          }

                          // Show archive button only if at VERIFIED status AND not already archived FOR THIS BENEFIT
                          if (isExitingFromCurrentBenefit && hasReachedVerified) {
                            const isAlreadyArchived = benefitType === BenefitType.SSF 
                              ? item.ssfArchived 
                              : item.aiaArchived;
                            
                            if (!isAlreadyArchived) {
                              return (
                                <div className="mt-4">
                                  <button
                                    onClick={() => {
                                      setEmployeeToArchive(item);
                                      setShowArchiveModal(true);
                                    }}
                                    className={`w-full px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                      benefitType === BenefitType.SSF
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                    }`}
                                  >
                                    <i className="fa-solid fa-box-archive mr-2"></i>
                                    Confirm Exit
                                  </button>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </td>

                      {/* Archive Confirmation Modal */}
                      {showArchiveModal && employeeToArchive && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                          <div className="bg-white rounded-[32px] p-12 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="text-center">
                              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                                benefitType === BenefitType.SSF ? 'bg-blue-100' : 'bg-rose-100'
                              }`}>
                                <i className={`fa-solid fa-box-archive text-2xl ${
                                  benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600'
                                }`}></i>
                              </div>
                              
                              <h3 className="text-xl font-black text-slate-800 mb-3">
                                Confirm Employee Exit?
                              </h3>
                              
                              <p className="text-sm text-slate-600 mb-2">
                                You're about to officially archive:
                              </p>
                              <p className="text-base font-black text-slate-800 mb-6">
                                {employeeToArchive.name}
                              </p>
                              
                              <div className={`p-4 rounded-2xl mb-8 ${
                                benefitType === BenefitType.SSF ? 'bg-blue-50' : 'bg-rose-50'
                              }`}>
                                <p className="text-xs font-bold text-slate-600 mb-1">
                                  This will finalize their exit from:
                                </p>
                                <p className={`text-sm font-black ${
                                  benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600'
                                }`}>
                                  {benefitType === BenefitType.SSF ? 'SSF' : 'AIA'} Benefit
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                  Employee will be moved to archived status
                                </p>
                              </div>
                              
                              <div className="flex gap-4">
                                <button
                                  onClick={() => {
                                    setShowArchiveModal(false);
                                    setEmployeeToArchive(null);
                                  }}
                                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleArchive}
                                  className={`flex-1 px-6 py-4 rounded-2xl text-white font-black text-sm transition-all shadow-lg ${
                                    benefitType === BenefitType.SSF 
                                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                  }`}
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      {/* Re-register Confirmation Modal */}
      {showReRegisterModal && employeeToReRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-[32px] p-12 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                benefitType === BenefitType.SSF ? 'bg-blue-100' : 'bg-rose-100'
              }`}>
                <i className={`fa-solid fa-user-plus text-2xl ${
                  benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600'
                }`}></i>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-3">
                Re-register Employee?
              </h3>

              <p className="text-sm text-slate-600 mb-2">
                You're about to re-register:
              </p>

              <p className="text-base font-black text-slate-800 mb-6">
                {employeeToReRegister.name}
              </p>

              <div className={`p-4 rounded-2xl mb-8 ${
                benefitType === BenefitType.SSF ? 'bg-blue-50' : 'bg-rose-50'
              }`}>
                <p className="text-xs font-bold text-slate-600 mb-1">
                  This will restore their:
                </p>
                <p className={`text-sm font-black ${
                  benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600'
                }`}>
                  {benefitType === BenefitType.SSF ? 'SSF' : 'AIA'} Benefit
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowReRegisterModal(false);
                    setEmployeeToReRegister(null);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReRegister}
                  className={`flex-1 px-6 py-4 rounded-2xl text-white font-black text-sm transition-all shadow-lg ${
                    benefitType === BenefitType.SSF
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showActivateModal && employeeToActivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-[32px] p-12 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                benefitType === BenefitType.SSF ? 'bg-blue-100' : 'bg-rose-100'
              }`}>
                <i className={`fa-solid fa-circle-check text-2xl ${
                  benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600'
                }`}></i>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-3">
                Activate Employee Benefit?
              </h3>
              
              <p className="text-sm text-slate-600 mb-2">
                You're about to officially activate:
              </p>
              <p className="text-base font-black text-slate-800 mb-6">
                {employeeToActivate.name}
              </p>

              <div className={`p-4 rounded-2xl mb-8 ${
                benefitType === BenefitType.SSF ? 'bg-blue-50' : 'bg-rose-50'
              }`}>
                <p className="text-xs font-bold text-slate-600 mb-1">
                  This will activate their benefit for:
                </p>
                <p className={`text-sm font-black ${
                  benefitType === BenefitType.SSF ? 'text-blue-600' : 'text-rose-600'
                }`}>
                  {benefitType === BenefitType.SSF ? 'SSF' : 'AIA'} Benefit
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Employee will be moved to active status
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowActivateModal(false);
                    setEmployeeToActivate(null);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivate}
                  className={`flex-1 px-6 py-4 rounded-2xl text-white font-black text-sm transition-all shadow-lg ${
                    benefitType === BenefitType.SSF
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Document Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-file text-rose-500"></i>
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{previewLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all flex items-center gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <i className="fa-solid fa-download"></i> Download
                </a>
                <button 
                  onClick={() => setPreviewUrl(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50 flex items-center justify-center min-h-[400px]">
              {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <img src={previewUrl} alt={previewLabel} className="max-w-full max-h-[70vh] rounded-2xl shadow-lg object-contain" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[65vh] rounded-2xl border-0" title={previewLabel} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSync;