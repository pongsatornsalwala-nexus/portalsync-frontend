// Think of this file as my "waiter menu" - listing all the different request I can make to Django

import axios from 'axios';

// HARDCODED FOR TESTING
const API_BASE_URL = 'https://portalsync-backend-s6e2.onrender.com/api';

console.log('🎯 API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper functions
// Convert Django snake_case to TypeScript camelCase
const transformWorksiteFromAPI = (data: any) => ({
  id: String(data.id),
  name: data.name,
  icon: data.icon,
  color: data.color,
  hireLimit: data.hire_limit, // snake_case -> camelCase
  resignLimit: data.resign_limit, // snake_case -> camelCase
  syncSSF: data.sync_ssf, // snake_case -> camelCase
  syncAIA: data.sync_aia, // snake_case -> camelCase
});

// Convert TypeScript camelCase to Django snake_case
const transformWorksiteToAPI = (data: any) => ({
  name: data.name,
  icon: data.icon,
  color: data.color,
  hire_limit: data.hireLimit, // camelCase -> snake_case
  resign_limit: data.resignLimit, // camelCase -> snake_case
  sync_ssf: data.syncSSF, // camelCase -> snake_case
  sync_aia: data.syncAIA, // camelCase -> snake_case
});

// Employee transformers

// Convert Django snake_case to TypeScript camelCase
const transformEmployeeFromAPI = (data: any) => {
  // Handle both list serializer (full_nam, worksite_name) and detail serializer (first_name, last_name, worksite)
  const firstName = data.first_name || (data.full_name ? data.full_name.split(' ')[0] : '')
  const lastName = data.last_name || (data.full_name ? data.full_name.split(' '). slice(1).join(' ') : '');
  const worksiteId = String(data.worksite_id || data.worksite || '');
  return {
    id: String(data.id),
    idCard: data.id_card,
    prefix: data.prefix,
    firstName,
    lastName,
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    nationality: data.nationality,
    bankName: data.bank_name,
    bankAccount: data.bank_account,
    employmentDate: data.employment_date,
    plan: data.plan,
    employeeNo: data.employee_no,
    department: data.department,
    salary: data.salary,
    worksiteId: data.worksite_id || data.worksite ? String(data.worksite_id || data.worksite) : null,
    worksiteName: data.worksite_name,
    hasSsf: data.has_ssf,
    hasAia: data.has_aia,
    ssfStatus: data.ssf_status,
    aiaStatus: data.aia_status,
    registrationType: data.registration_type,
    effectiveDate: data.effective_date,
    resignReason: data.resign_reason,
    createdAt: data.created_at,
    hospital1: data.hospital_choice_1,
    hospital2: data.hospital_choice_2,
    hospital3: data.hospital_choice_3,
    maritalStatus: data.marital_status,
    wageType: data.wage_type,
    designation: data.designation,
    nationalIdFile: data.national_id_file,
    bankBookFile: data.bank_book_file,
    cebFormFile: data.ceb_form_file,
    isExitingSsf: data.is_exiting_ssf,
    isExitingAia: data.is_exiting_aia,
    ssfActivated: data.ssf_activated,
    aiaActivated: data.aia_activated,
    ssfArchived: data.ssf_archived,
    aiaArchived: data.aia_archived,
  };
};

const transformEmployeeToAPI = (data: any) => ({
  id_card: data.idCard,
  prefix: data.prefix,
  first_name: data.firstName,
  last_name: data.lastName,
  date_of_birth: data.dateOfBirth,
  gender: data.gender,
  nationality: data.nationality,
  bank_name: data.bankName,
  bank_account: data.bankAccount,
  employment_date: data.employmentDate,
  plan: data.plan,
  employee_no: data.employeeNo,
  department: data.department,
  salary: data.salary,
  worksite: data.worksiteId ? parseInt(data.worksiteId) : null,
  has_ssf: data.hasSsf,
  has_aia: data.hasAia,
  ssf_status: data.ssfStatus,
  aia_status: data.aiaStatus,
  registration_type: data.registrationType,
  effective_date: data.effectiveDate,
  resign_reason: data.resignReason,
  hospital_choice_1: data.hospital1,
  hospital_choice_2: data.hospital2,
  hospital_choice_3: data.hospital3,
  marital_status: data.maritalStatus,
  wage_type: data.wageType,
  designation: data.designation,
  is_exiting_ssf: data.isExitingSsf,
  is_exiting_aia: data.isExitingAia,
  ssf_activated: data.ssfActivated,
  aia_activated: data.aiaActivated,
  ssf_archived: data.ssfArchived,
  aia_archived: data.aiaArchived,
});

// Convert TypeScript camelCase to Django snake_case

// ============================================
// EMPLOYEE ENDPOINTS
// ============================================

/**
 * Get dashboard statistics
 * Returns: { total_employees, new_joiners, resignations, pending_actions, ssf_queue, aia_queue }
 */
// "Hey Django, give me dashboard statistics"
// My dashboard page calls this to get employee counts
export const getEmployeeStats = async () => {
  try {
    const response = await api.get('/employees/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    throw error;
  }
};

/**
 * Get total employee count
 * Returns: { count: number }
 */
export const getEmployeeCount = async () => {
  try {
    const response = await api.get('/employees/count/');
    return response.data;
  } catch (error) {
    console.error('Error fetching employee count:', error);
    throw error;
  }
};

/**
 * Get all employees
 * Returns: Array of employee objects
 */
export const getEmployees = async () => {
  try {
    const response = await api.get('/employees/');
    const employees = response.data.results || response.data;
    return employees.map(transformEmployeeFromAPI);
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const getSummaryReport = async (filters: {
  registrationType: string;
  month?: string; // optional - "2026-02"
  worksite?: string; // optional - worksite ID
  benefit?: string; // optional - "SSF" or "AIA"
}) => {
  try {
    const params = new URLSearchParams();
    params.append('registration_type', filters.registrationType);
    if (filters.month) params.append('month', filters.month);
    if (filters.worksite) params.append('worksite', filters.worksite);
    if (filters.benefit) params.append('benefit', filters.benefit);

    const response = await api.get(`/employees/?${params.toString()}`);
    const employees = response.data.results || response.data;
    return employees.map(transformEmployeeFromAPI);
  } catch (error) {
    console.error('Error fetching summary report:', error);
    throw error;
  }
};

/**
 * Get employees by worksite
 * @param worksiteId - ID of the worksite
 */
export const getEmployeesByWorksite = async (worksiteId: string) => {
  try {
    const response = await api.get(`/employees/by_worksite/?worksite_id=${worksiteId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employees by worksite:', error);
    throw error;
  }
};

/**
 * Get single employee by ID
 */
export const getEmployee = async (id: string) => {
  try {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
};

/**
 * Create new employee
 */
// "Hey Django, save this new employee to the database"
export const createEmployee = async (employeeData: any) => {
  try {
    const apiData = transformEmployeeToAPI(employeeData);
    const response = await api.post('/employees/', apiData);
    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

/**
 * Update employee
 */
export const updateEmployee = async (id: string, employeeData: any) => {
  try {
    const apiData = transformEmployeeToAPI(employeeData)
    const response = await api.patch(`/employees/${id}/`, apiData);
    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

/**
 * Delete employee
 */
export const deleteEmployee = async (id: string) => {
  try {
    const response = await api.delete(`/employees/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

export const updateEmployeeStatus = async (
  id: string,
  benefitType: 'ssf' | 'aia',
  status: string
) => {
  try {
    // Create update object with just the status field we want to change
    const updateData = benefitType === 'ssf'
      ? { ssf_status: status }
      : { aia_status: status };

    const response = await api.patch(`/employees/${id}/`, updateData);
    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error updating employee status:', error);
    throw error;
  }
};

/**
 * Re-register an employee (restore from REGISTER_OUT to REGISTER_IN)
 * This is page-dependent: restores the benefit based on which tab (SSF/AIA) HR is viewing
 */ 

export const reRegisterEmployee = async (
  id: string,
  benefitType: 'SSF' | 'AIA'
) => {
  try {
    // Prepare the update data based on which benefit we're restoring
    const updateData: any = {
      registration_type: 'REGISTER_IN', // Change back to inbound
    };

    // Restore the appropriate benefit
    if (benefitType === 'SSF') {
      updateData.has_ssf = true; // Restore SSF benefit
      updateData.ssf_status = 'IMPORTED'; // Reset status to IMPORTED
      updateData.is_exiting_ssf = false; // Clear exit flag
    } else {
      updateData.has_aia = true; // Restore AIA benefit
      updateData.aia_status = 'IMPORTED'; // Reset status to IMPORTED
      updateData.is_exiting_aia = false; // Clear exit flag
    }

    console.log(`🔄 Re-registering employee ${id} for ${benefitType}:`, updateData);

    const response = await api.patch(`/employees/${id}/`, updateData);
    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error re-registering employee:', error);
    throw error;
  }
};

/**
 * Archive and employee (mark their exit as officially confirmed)
 * Sets is_archived = true for employees who have reached VERIFIED status
 */
export const archiveEmployee = async (
  id: string,
  benefitType: 'SSF' | 'AIA'
) => {
  try {
    // Mark as archived
    const updateData: any = benefitType === 'SSF'
      ? { ssf_archived: true }
      : { aia_archived: true };

    console.log(`📦 Archiving employee ${id} for ${benefitType}:`, updateData);

    const response = await api.patch(`/employees/${id}/`, updateData);
    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error archiving employee:', error);
    throw error;
  }
};

/**
 * Activate an employee (mark their registration as officially confirmed)
 * Sets ssf_activated or aia_activated = true for employees who have reached VERIFIED status
 */
export const activateEmployee = async (
  id: string,
  benefitType: 'SSF' | 'AIA'
) => {
  try {
    // Mark the SPECIFIC benefit as activated
    const updateData: any = benefitType === 'SSF'
      ? { ssf_activated: true }
      : { aia_activated: true };

    console.log(`✅ Activating employee ${id} for ${benefitType}:`, updateData);

    const response = await api.patch(`/employees/${id}/`, updateData);
    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error activating employee:', error);
    throw error;
  }
}

/**
 * Upload a document file for an employee
 * @param employeeId - ID of the employee
 * @param fileType - Type of file ('national_id', 'bank_book', 'ceb_form')
 * @param file - The file to upload
 */
export const uploadEmployeeDocument = async (
  employeeId: string,
  fileType: 'national_id' | 'bank_book' | 'ceb_form',
  file: File
) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const response = await api.patch(
      `employees/${employeeId}/upload_document/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      }
    );

    return transformEmployeeFromAPI(response.data);
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// ============================================
// WORKSITE ENDPOINTS
// ============================================

/**
 * Get all worksites
 */
export const getWorksites = async () => {
  try {
    const response = await api.get('/worksites/');
    // Django returns paginated response with "results" array
    const worksites = response.data.results || response.data;
    // Transform each worksite from snake_case to camelCase
    return worksites.map(transformWorksiteFromAPI);
  } catch (error) {
    console.error('Error fetching worksites:', error);
    throw error;
  }
};

/**
 * Get single worksite by ID
 */
export const getWorksite = async (id: string) => {
  try {
    const response = await api.get(`/worksites/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching worksite:', error);
    throw error;
  }
};

/**
 * Create new worksite
 */
export const createWorksite = async (worksiteData: any) => {
  try {
    // Transform to snake_case before sending
    const apiData = transformWorksiteToAPI(worksiteData)
    const response = await api.post('/worksites/', apiData);
    // Transform response back to camelCase
    return transformWorksiteFromAPI(response.data);
  } catch (error) {
    console.error('Error creating worksite:', error);
    throw error;
  }
};

/**
 * Update worksite
 */
export const updateWorksite = async (id: string, worksiteData: any) => {
  try {
    const apiData = transformWorksiteToAPI(worksiteData);
    const response = await api.put(`/worksites/${id}/`, apiData);
    return transformWorksiteFromAPI(response.data);
  } catch (error) {
    console.error('Error updating worksite:', error);
    throw error;
  }
};

/**
 * Delete worksite
 */
export const deleteWorksite = async (id: string) => {
  try {
    const response = await api.delete(`/worksites/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting worksite:', error);
    throw error;
  }
};

// ===
// BENEFITS ENDPOINTS
// ===

/**
 * Get all hospitals
 * Returns: Array of hospital objects with id, name, province, hospital_type
 */
export const getHospitals = async () => {
  try {
    const response = await api.get('/hospitals/');
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    throw error;
  }
};

export default api;