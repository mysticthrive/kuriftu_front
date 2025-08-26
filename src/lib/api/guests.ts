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
  return await authenticatedGet<ApiResponse<Guest[]>>('/guests');
};

// Get single guest by ID
export const getGuest = async (id: number): Promise<ApiResponse<Guest>> => {
  return await authenticatedGet<ApiResponse<Guest>>(`/guests/${id}`);
};

// Create new guest
export const createGuest = async (data: CreateGuestData): Promise<ApiResponse<Guest>> => {
  return await authenticatedPost<ApiResponse<Guest>>('/guests', data);
};

// Update guest
export const updateGuest = async (id: number, data: UpdateGuestData): Promise<ApiResponse<Guest>> => {
  return await authenticatedPut<ApiResponse<Guest>>(`/guests/${id}`, data);
};

// Delete guest
export const deleteGuest = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/guests/${id}`);
};
