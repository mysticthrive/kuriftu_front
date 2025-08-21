import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomType {
  room_type_id: number;
  type_name: string;
  description?: string;
  max_occupancy: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomTypeData {
  type_name: string;
  description?: string;
  max_occupancy?: number;
}

export interface UpdateRoomTypeData {
  type_name: string;
  description?: string;
  max_occupancy?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all room types
export const getRoomTypes = async (): Promise<ApiResponse<RoomType[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-types`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room types:', error);
    throw error;
  }
};

// Get single room type by ID
export const getRoomType = async (id: number): Promise<ApiResponse<RoomType>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-types/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room type:', error);
    throw error;
  }
};

// Create new room type
export const createRoomType = async (data: CreateRoomTypeData): Promise<ApiResponse<RoomType>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/room-types`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating room type:', error);
    throw error;
  }
};

// Update room type
export const updateRoomType = async (id: number, data: UpdateRoomTypeData): Promise<ApiResponse<RoomType>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/room-types/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating room type:', error);
    throw error;
  }
};

// Delete room type
export const deleteRoomType = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/room-types/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting room type:', error);
    throw error;
  }
};
