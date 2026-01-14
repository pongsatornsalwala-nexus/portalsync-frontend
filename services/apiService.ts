// Think of this file as my "waiter menu" - listing all the different request I can make to Django

import axios from 'axios';

// Base URL for your Django API
// Smart configuration: uses environment variable in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`  // Production: use Vercel env variable
  : 'http://127.0.0.1:8000/api';           // Development: use localhost

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials for CORS
});

// ... rest of your code stays the same

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
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
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
    const response = await api.post('/employees/', employeeData);
    return response.data;
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
    const response = await api.put(`/employees/${id}/`, employeeData);
    return response.data;
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

// ============================================
// WORKSITE ENDPOINTS
// ============================================

/**
 * Get all worksites
 */
export const getWorksites = async () => {
  try {
    const response = await api.get('/worksites/');
    return response.data;
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
    const response = await api.post('/worksites/', worksiteData);
    return response.data;
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
    const response = await api.put(`/worksites/${id}/`, worksiteData);
    return response.data;
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
    const response = await api.get('/benefits/hospitals/');
    return response.data;
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    throw error;
  }
};

export default api;