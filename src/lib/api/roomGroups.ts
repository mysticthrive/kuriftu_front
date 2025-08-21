import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomGroup {
  room_group_id: number;
  group_name: string;
  description?: string;
  created_at: string;
}

export interface CreateRoomGroupData {
  group_name: string;
  description?: string;
}

export interface UpdateRoomGroupData {
  group_name: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get all room groups
export const getRoomGroups = async (): Promise<ApiResponse<RoomGroup[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-groups`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room groups:', error);
    throw error;
  }
};

// Get single room group by ID
export const getRoomGroup = async (id: number): Promise<ApiResponse<RoomGroup>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-groups/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room group:', error);
    throw error;
  }
};

// Create new room group
export const createRoomGroup = async (data: CreateRoomGroupData): Promise<ApiResponse<RoomGroup>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/room-groups`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating room group:', error);
    throw error;
  }
};

// Update room group
export const updateRoomGroup = async (id: number, data: UpdateRoomGroupData): Promise<ApiResponse<RoomGroup>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/room-groups/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating room group:', error);
    throw error;
  }
};

// Delete room group
export const deleteRoomGroup = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/room-groups/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting room group:', error);
    throw error;
  }
};
