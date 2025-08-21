import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Guest {
  guest_id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  country?: string;
  city?: string;
  zip_code?: string;
  address?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestData {
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  country?: string;
  city?: string;
  zip_code?: string;
  address?: string;
  date_of_birth?: string;
}

export interface UpdateGuestData {
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  country?: string;
  city?: string;
  zip_code?: string;
  address?: string;
  date_of_birth?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all guests
export const getGuests = async (): Promise<ApiResponse<Guest[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/guests`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching guests:', error);
    throw error;
  }
};

// Get single guest by ID
export const getGuest = async (id: number): Promise<ApiResponse<Guest>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/guests/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching guest:', error);
    throw error;
  }
};

// Create new guest
export const createGuest = async (data: CreateGuestData): Promise<ApiResponse<Guest>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/guests`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating guest:', error);
    throw error;
  }
};

// Update guest
export const updateGuest = async (id: number, data: UpdateGuestData): Promise<ApiResponse<Guest>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/guests/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating guest:', error);
    throw error;
  }
};

// Delete guest
export const deleteGuest = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/guests/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting guest:', error);
    throw error;
  }
};
