import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

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
  return await authenticatedGet<ApiResponse<Room[]>>('/rooms');
};

// GET room by ID
export const getRoomById = async (id: number): Promise<ApiResponse<Room>> => {
  return await authenticatedGet<ApiResponse<Room>>(`/rooms/${id}`);
};

// GET rooms by hotel
export const getRoomsByHotel = async (hotel: string): Promise<ApiResponse<Room[]>> => {
  return await authenticatedGet<ApiResponse<Room[]>>(`/rooms/hotel/${hotel}`);
};

// GET available rooms
export const getAvailableRooms = async (): Promise<ApiResponse<Room[]>> => {
  return await authenticatedGet<ApiResponse<Room[]>>('/rooms/status/available');
};

// POST create new room
export const createRoom = async (data: CreateRoomData): Promise<ApiResponse<Room>> => {
  return await authenticatedPost<ApiResponse<Room>>('/rooms', data);
};

// PUT update room
export const updateRoom = async (id: number, data: UpdateRoomData): Promise<ApiResponse<Room>> => {
  return await authenticatedPut<ApiResponse<Room>>(`/rooms/${id}`, data);
};

// DELETE room
export const deleteRoom = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/rooms/${id}`);
};
