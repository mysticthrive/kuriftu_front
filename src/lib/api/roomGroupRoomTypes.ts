import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomGroupRoomType {
  id: number;
  room_group_id: number;
  room_type_id: number;
  created_at: string;
  updated_at: string;
  group_name: string;
  group_description?: string;
  type_name: string;
  type_description?: string;
  max_occupancy: number;
}

export interface CreateRoomGroupRoomTypeData {
  room_group_id: number;
  room_type_id: number;
}

export interface BulkAssignData {
  room_group_id: number;
  room_type_ids: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all room group room type relationships
export const getRoomGroupRoomTypes = async (): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  return await authenticatedGet<ApiResponse<RoomGroupRoomType[]>>('/room-group-room-types');
};

// Get single room group room type relationship by ID
export const getRoomGroupRoomType = async (id: number): Promise<ApiResponse<RoomGroupRoomType>> => {
  return await authenticatedGet<ApiResponse<RoomGroupRoomType>>(`/room-group-room-types/${id}`);
};

// Get room types for a specific room group
export const getRoomTypesForGroup = async (roomGroupId: number): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  return await authenticatedGet<ApiResponse<RoomGroupRoomType[]>>(`/room-group-room-types/group/${roomGroupId}`);
};

// Get room groups for a specific room type
export const getRoomGroupsForType = async (roomTypeId: number): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  return await authenticatedGet<ApiResponse<RoomGroupRoomType[]>>(`/room-group-room-types/type/${roomTypeId}`);
};

// Create new room group room type relationship
export const createRoomGroupRoomType = async (data: CreateRoomGroupRoomTypeData): Promise<ApiResponse<RoomGroupRoomType>> => {
  return await authenticatedPost<ApiResponse<RoomGroupRoomType>>('/room-group-room-types', data);
};

// Bulk assign room types to room group
export const bulkAssignRoomTypes = async (data: BulkAssignData): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  return await authenticatedPost<ApiResponse<RoomGroupRoomType[]>>('/room-group-room-types/bulk-assign', data);
};

// Delete room group room type relationship
export const deleteRoomGroupRoomType = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/room-group-room-types/${id}`);
};
