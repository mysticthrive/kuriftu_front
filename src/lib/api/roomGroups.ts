import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomGroup {
  room_group_id: number;
  group_name: string;
  description?: string;
  hotel: string;
  created_at: string;
}

export interface CreateRoomGroupData {
  group_name: string;
  description?: string;
  hotel: string;
}

export interface UpdateRoomGroupData {
  group_name: string;
  description?: string;
  hotel: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all room groups
export const getRoomGroups = async (): Promise<ApiResponse<RoomGroup[]>> => {
  return await authenticatedGet<ApiResponse<RoomGroup[]>>('/room-groups');
};

// Get room groups by hotel
export const getRoomGroupsByHotel = async (hotel: string): Promise<ApiResponse<RoomGroup[]>> => {
  return await authenticatedGet<ApiResponse<RoomGroup[]>>(`/room-groups?hotel=${hotel}`);
};

// Get single room group by ID
export const getRoomGroup = async (id: number): Promise<ApiResponse<RoomGroup>> => {
  return await authenticatedGet<ApiResponse<RoomGroup>>(`/room-groups/${id}`);
};

// Create new room group
export const createRoomGroup = async (data: CreateRoomGroupData): Promise<ApiResponse<RoomGroup>> => {
  return await authenticatedPost<ApiResponse<RoomGroup>>('/room-groups', data);
};

// Update room group
export const updateRoomGroup = async (id: number, data: UpdateRoomGroupData): Promise<ApiResponse<RoomGroup>> => {
  return await authenticatedPut<ApiResponse<RoomGroup>>(`/room-groups/${id}`, data);
};

// Delete room group
export const deleteRoomGroup = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/room-groups/${id}`);
};
