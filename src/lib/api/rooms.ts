import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Room {
  room_id: number;
  hotel: 'africanVillage' | 'bishoftu' | 'entoto' | 'laketana' | 'awashfall';
  room_number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'hold' | 'booked';
  created_at: string;
  updated_at: string;
  room_type_id?: number;
  type_name?: string;
  type_description?: string;
  max_occupancy?: number;
  room_group_id?: number;
  group_name?: string;
  group_description?: string;
}

export interface CreateRoomData {
  hotel: 'africanVillage' | 'bishoftu' | 'entoto' | 'laketana' | 'awashfall';
  room_number: string;
  room_type_id?: number;
  room_group_id?: number;
  status: 'available' | 'occupied' | 'maintenance' | 'hold' | 'booked';
}

export interface UpdateRoomData extends CreateRoomData {}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// GET all rooms
export const getRooms = async (): Promise<ApiResponse<Room[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};

// GET room by ID
export const getRoomById = async (id: number): Promise<ApiResponse<Room>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room');
  }
};

// GET rooms by hotel
export const getRoomsByHotel = async (hotel: string): Promise<ApiResponse<Room[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms/hotel/${hotel}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms by hotel');
  }
};

// GET available rooms
export const getAvailableRooms = async (): Promise<ApiResponse<Room[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms/status/available`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch available rooms');
  }
};

// POST create new room
export const createRoom = async (data: CreateRoomData): Promise<ApiResponse<Room>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rooms`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create room');
  }
};

// PUT update room
export const updateRoom = async (id: number, data: UpdateRoomData): Promise<ApiResponse<Room>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/rooms/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update room');
  }
};

// DELETE room
export const deleteRoom = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/rooms/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete room');
  }
};
