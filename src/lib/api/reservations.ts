import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

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
  hotel: string;
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
}

export interface Room {
  room_id: number;
  room_number: string;
  hotel: string;
  status: 'available' | 'occupied' | 'maintenance' | 'hold' | 'booked';
  room_type?: string;
  room_group?: string;
  max_occupancy?: number;
  weekday_price?: number;
  weekend_price?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all reservations
export const getReservations = async (): Promise<ApiResponse<Reservation[]>> => {
  return await authenticatedGet<ApiResponse<Reservation[]>>('/reservations');
};

// Get single reservation by ID
export const getReservation = async (id: number): Promise<ApiResponse<Reservation>> => {
  return await authenticatedGet<ApiResponse<Reservation>>(`/reservations/${id}`);
};

// Create new reservation
export const createReservation = async (data: CreateReservationData): Promise<ApiResponse<Reservation>> => {
  return await authenticatedPost<ApiResponse<Reservation>>('/reservations', data);
};

// Update reservation
export const updateReservation = async (id: number, data: UpdateReservationData): Promise<ApiResponse<Reservation>> => {
  return await authenticatedPut<ApiResponse<Reservation>>(`/reservations/${id}`, data);
};

// Delete reservation (soft delete)
export const deleteReservation = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/reservations/${id}`);
};

// Get rooms list for dropdown
export const getRoomsList = async (): Promise<ApiResponse<Room[]>> => {
  return await authenticatedGet<ApiResponse<Room[]>>('/reservations/rooms/list');
};
