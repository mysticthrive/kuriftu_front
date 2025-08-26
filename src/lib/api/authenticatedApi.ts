import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create authenticated axios instance
export const createAuthenticatedApi = (): AxiosInstance => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Generic authenticated API call function
export const authenticatedApiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const api = createAuthenticatedApi();
    
    switch (method) {
      case 'GET':
        return (await api.get(endpoint, config)).data;
      case 'POST':
        return (await api.post(endpoint, data, config)).data;
      case 'PUT':
        return (await api.put(endpoint, data, config)).data;
      case 'DELETE':
        return (await api.delete(endpoint, config)).data;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.response?.status === 500) {
      // Server error (like database connection issues)
      console.error('Server error:', error.response?.data);
      throw new Error('Server error. Please try again later.');
    } else if (error.response?.data?.message) {
      // Extract backend error message
      throw new Error(error.response.data.message);
    } else if (error.response?.data?.error) {
      // Alternative error field
      throw new Error(error.response.data.error);
    } else if (error.message) {
      // Use axios error message
      throw new Error(error.message);
    } else {
      // Fallback
      throw new Error('An unexpected error occurred');
    }
  }
};

// Helper functions for common HTTP methods
export const authenticatedGet = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  return authenticatedApiCall<T>('GET', endpoint, undefined, config);
};

export const authenticatedPost = <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return authenticatedApiCall<T>('POST', endpoint, data, config);
};

export const authenticatedPut = <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return authenticatedApiCall<T>('PUT', endpoint, data, config);
};

export const authenticatedDelete = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  return authenticatedApiCall<T>('DELETE', endpoint, undefined, config);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
};

// Get stored token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};
