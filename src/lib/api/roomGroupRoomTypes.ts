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
  try {
    return await authenticatedGet<ApiResponse<RoomGroupRoomType[]>>('/room-group-room-types');
  } catch (error: any) {
    console.error('Error fetching room group room types:', error);
    throw error;
  }
};

// Get single room group room type relationship by ID
export const getRoomGroupRoomType = async (id: number): Promise<ApiResponse<RoomGroupRoomType>> => {
  try {
    return await authenticatedGet<ApiResponse<RoomGroupRoomType>>(`/room-group-room-types/${id}`);
  } catch (error: any) {
    console.error('Error fetching room group room type:', error);
    throw error;
  }
};

// Get room types for a specific room group
export const getRoomTypesForGroup = async (roomGroupId: number): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  try {
    return await authenticatedGet<ApiResponse<RoomGroupRoomType[]>>(`/room-group-room-types/group/${roomGroupId}`);
  } catch (error: any) {
    console.error('Error fetching room types for group:', error);
    throw error;
  }
};

// Get room groups for a specific room type
export const getRoomGroupsForType = async (roomTypeId: number): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  try {
    return await authenticatedGet<ApiResponse<RoomGroupRoomType[]>>(`/room-group-room-types/type/${roomTypeId}`);
  } catch (error: any) {
    console.error('Error fetching room groups for type:', error);
    throw error;
  }
};

// Create new room group room type relationship
export const createRoomGroupRoomType = async (data: CreateRoomGroupRoomTypeData): Promise<ApiResponse<RoomGroupRoomType>> => {
  try {
    return await authenticatedPost<ApiResponse<RoomGroupRoomType>>('/room-group-room-types', data);
  } catch (error: any) {
    console.error('Error creating room group room type:', error);
    throw error;
  }
};

// Bulk assign room types to room group
export const bulkAssignRoomTypes = async (data: BulkAssignData): Promise<ApiResponse<RoomGroupRoomType[]>> => {
  try {
    return await authenticatedPost<ApiResponse<RoomGroupRoomType[]>>('/room-group-room-types/bulk-assign', data);
  } catch (error: any) {
    console.error('Error bulk assigning room types:', error);
    throw error;
  }
};

// Delete room group room type relationship
export const deleteRoomGroupRoomType = async (id: number): Promise<ApiResponse<void>> => {
  try {
    return await authenticatedDelete<ApiResponse<void>>(`/room-group-room-types/${id}`);
  } catch (error: any) {
    console.error('Error deleting room group room type:', error);
    throw error;
  }
};
