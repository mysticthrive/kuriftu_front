import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Room {
  room_id: number;
  hotel: string;
  room_number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'hold' | 'booked';
  created_at: string;
  updated_at: string;
  room_group_room_type_id?: number;
  group_name?: string;
  type_name?: string;
  max_occupancy?: number;
  weekday_price?: number;
  weekend_price?: number;
}

export interface CreateRoomData {
  hotel: string;
  room_number: string;
  room_group_room_type_id?: number;
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

// GET rooms by room group and room type
export const getRoomsByGroupAndType = async (roomGroupId: number, roomTypeId: number): Promise<ApiResponse<Room[]>> => {
  return await authenticatedGet<ApiResponse<Room[]>>(`/rooms/by-group-type/${roomGroupId}/${roomTypeId}`);
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
