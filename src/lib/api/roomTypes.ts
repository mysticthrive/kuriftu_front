import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomType {
  room_type_id: number;
  type_name: string;
  description?: string;
  max_occupancy: number;
  hotel: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomTypeData {
  type_name: string;
  description?: string;
  max_occupancy?: number;
  hotel: string;
}

export interface UpdateRoomTypeData {
  type_name: string;
  description?: string;
  max_occupancy?: number;
  hotel: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all room types
export const getRoomTypes = async (): Promise<ApiResponse<RoomType[]>> => {
  return await authenticatedGet<ApiResponse<RoomType[]>>('/room-types');
};

// Get room types by hotel
export const getRoomTypesByHotel = async (hotel: string): Promise<ApiResponse<RoomType[]>> => {
  return await authenticatedGet<ApiResponse<RoomType[]>>(`/room-types?hotel=${hotel}`);
};

// Get single room type by ID
export const getRoomType = async (id: number): Promise<ApiResponse<RoomType>> => {
  return await authenticatedGet<ApiResponse<RoomType>>(`/room-types/${id}`);
};

// Create new room type
export const createRoomType = async (data: CreateRoomTypeData): Promise<ApiResponse<RoomType>> => {
  return await authenticatedPost<ApiResponse<RoomType>>('/room-types', data);
};

// Update room type
export const updateRoomType = async (id: number, data: UpdateRoomTypeData): Promise<ApiResponse<RoomType>> => {
  return await authenticatedPut<ApiResponse<RoomType>>(`/room-types/${id}`, data);
};

// Delete room type
export const deleteRoomType = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/room-types/${id}`);
};
