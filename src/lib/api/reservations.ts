import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Reservation {
  reservation_id: number;
  reservation_code: string;
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  num_adults: number;
  num_children: number;
  children_ages?: string;
  special_requests?: string;
  total_price: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  source: 'website' | 'mobile_app' | 'walk_in' | 'agent' | 'call_center';
  created_at: string;
  updated_at: string;
  // Guest details
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  // Room details
  room_number: string;
  hotel: 'africanVillage' | 'bishoftu' | 'entoto' | 'laketana' | 'awashfall';
  room_type?: string;
  room_group?: string;
}

export interface CreateReservationData {
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  num_adults: number;
  num_children?: number;
  children_ages?: string;
  special_requests?: string;
  status?: 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  source?: 'website' | 'mobile_app' | 'walk_in' | 'agent' | 'call_center';
  currency?: string;
}

export interface UpdateReservationData {
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  num_adults: number;
  num_children?: number;
  children_ages?: string;
  special_requests?: string;
  status?: 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  source?: 'website' | 'mobile_app' | 'walk_in' | 'agent' | 'call_center';
  currency?: string;
}

export interface Room {
  room_id: number;
  room_number: string;
  hotel: 'africanVillage' | 'bishoftu' | 'entoto' | 'laketana' | 'awashfall';
  status: 'available' | 'occupied' | 'maintenance' | 'hold' | 'booked';
  room_type?: string;
  room_group?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all reservations
export const getReservations = async (): Promise<ApiResponse<Reservation[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reservations`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

// Get single reservation by ID
export const getReservation = async (id: number): Promise<ApiResponse<Reservation>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reservations/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching reservation:', error);
    throw error;
  }
};

// Create new reservation
export const createReservation = async (data: CreateReservationData): Promise<ApiResponse<Reservation>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reservations`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

// Update reservation
export const updateReservation = async (id: number, data: UpdateReservationData): Promise<ApiResponse<Reservation>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/reservations/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

// Delete reservation (soft delete)
export const deleteReservation = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/reservations/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

// Get rooms list for dropdown
export const getRoomsList = async (): Promise<ApiResponse<Room[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reservations/rooms/list`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching rooms list:', error);
    throw error;
  }
};
