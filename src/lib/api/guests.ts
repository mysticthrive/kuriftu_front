import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

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
    return await authenticatedGet<ApiResponse<Guest[]>>('/guests');
  } catch (error: any) {
    console.error('Error fetching guests:', error);
    throw error;
  }
};

// Get single guest by ID
export const getGuest = async (id: number): Promise<ApiResponse<Guest>> => {
  try {
    return await authenticatedGet<ApiResponse<Guest>>(`/guests/${id}`);
  } catch (error: any) {
    console.error('Error fetching guest:', error);
    throw error;
  }
};

// Create new guest
export const createGuest = async (data: CreateGuestData): Promise<ApiResponse<Guest>> => {
  try {
    return await authenticatedPost<ApiResponse<Guest>>('/guests', data);
  } catch (error: any) {
    console.error('Error creating guest:', error);
    throw error;
  }
};

// Update guest
export const updateGuest = async (id: number, data: UpdateGuestData): Promise<ApiResponse<Guest>> => {
  try {
    return await authenticatedPut<ApiResponse<Guest>>(`/guests/${id}`, data);
  } catch (error: any) {
    console.error('Error updating guest:', error);
    throw error;
  }
};

// Delete guest
export const deleteGuest = async (id: number): Promise<ApiResponse<void>> => {
  try {
    return await authenticatedDelete<ApiResponse<void>>(`/guests/${id}`);
  } catch (error: any) {
    console.error('Error deleting guest:', error);
    throw error;
  }
};
