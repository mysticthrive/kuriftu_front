import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

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
    return await authenticatedGet<ApiResponse<RoomType[]>>('/room-types');
  } catch (error: any) {
    console.error('Error fetching room types:', error);
    throw error;
  }
};

// Get single room type by ID
export const getRoomType = async (id: number): Promise<ApiResponse<RoomType>> => {
  try {
    return await authenticatedGet<ApiResponse<RoomType>>(`/room-types/${id}`);
  } catch (error: any) {
    console.error('Error fetching room type:', error);
    throw error;
  }
};

// Create new room type
export const createRoomType = async (data: CreateRoomTypeData): Promise<ApiResponse<RoomType>> => {
  try {
    return await authenticatedPost<ApiResponse<RoomType>>('/room-types', data);
  } catch (error: any) {
    console.error('Error creating room type:', error);
    throw error;
  }
};

// Update room type
export const updateRoomType = async (id: number, data: UpdateRoomTypeData): Promise<ApiResponse<RoomType>> => {
  try {
    return await authenticatedPut<ApiResponse<RoomType>>(`/room-types/${id}`, data);
  } catch (error: any) {
    console.error('Error updating room type:', error);
    throw error;
  }
};

// Delete room type
export const deleteRoomType = async (id: number): Promise<ApiResponse<void>> => {
  try {
    return await authenticatedDelete<ApiResponse<void>>(`/room-types/${id}`);
  } catch (error: any) {
    console.error('Error deleting room type:', error);
    throw error;
  }
};
