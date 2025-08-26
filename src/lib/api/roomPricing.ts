import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomPricing {
  pricing_id: number;
  room_group_room_type_id: number;
  hotel: 'africanVillage' | 'bishoftu' | 'entoto' | 'laketana' | 'awashfall';
  occupancy: 'single' | 'double' | 'triple' | 'child';
  day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  month?: number; // 1-12
  holiday_flag: boolean;
  start_date?: string; // DATE format
  end_date?: string; // DATE format
  price: number | string; // Can be number or string from database
  created_at: string;
  // Additional fields for display
  group_name?: string;
  type_name?: string;
}

export interface CreateRoomPricingData {
  room_group_room_type_id: number;
  hotel: 'africanVillage' | 'bishoftu' | 'entoto' | 'laketana' | 'awashfall';
  occupancy: 'single' | 'double' | 'triple' | 'child';
  day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  month?: number;
  holiday_flag?: boolean;
  start_date?: string;
  end_date?: string;
  price: number;
}

export interface UpdateRoomPricingData extends CreateRoomPricingData {}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// GET all room pricing
export const getRoomPricing = async (): Promise<ApiResponse<RoomPricing[]>> => {
  return await authenticatedGet<ApiResponse<RoomPricing[]>>('/room-pricing');
};

// GET room pricing by ID
export const getRoomPricingById = async (id: number): Promise<ApiResponse<RoomPricing>> => {
  return await authenticatedGet<ApiResponse<RoomPricing>>(`/room-pricing/${id}`);
};

// GET pricing by room group room type ID
export const getRoomPricingByRelationship = async (relationshipId: number): Promise<ApiResponse<RoomPricing[]>> => {
  return await authenticatedGet<ApiResponse<RoomPricing[]>>(`/room-pricing/relationship/${relationshipId}`);
};

// GET pricing by hotel
export const getRoomPricingByHotel = async (hotel: string): Promise<ApiResponse<RoomPricing[]>> => {
  return await authenticatedGet<ApiResponse<RoomPricing[]>>(`/room-pricing/hotel/${hotel}`);
};

// GET pricing by occupancy
export const getRoomPricingByOccupancy = async (occupancy: string): Promise<ApiResponse<RoomPricing[]>> => {
  return await authenticatedGet<ApiResponse<RoomPricing[]>>(`/room-pricing/occupancy/${occupancy}`);
};

// POST create new room pricing
export const createRoomPricing = async (data: CreateRoomPricingData): Promise<ApiResponse<RoomPricing>> => {
  return await authenticatedPost<ApiResponse<RoomPricing>>('/room-pricing', data);
};

// PUT update room pricing
export const updateRoomPricing = async (id: number, data: UpdateRoomPricingData): Promise<ApiResponse<RoomPricing>> => {
  return await authenticatedPut<ApiResponse<RoomPricing>>(`/room-pricing/${id}`, data);
};

// DELETE room pricing
export const deleteRoomPricing = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/room-pricing/${id}`);
};

// GET pricing with filters
export const getRoomPricingWithFilters = async (filters: {
  hotel?: string;
  occupancy?: string;
  day_of_week?: string;
  month?: number;
  holiday_flag?: boolean;
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<RoomPricing[]>> => {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  return await authenticatedGet<ApiResponse<RoomPricing[]>>(`/room-pricing/filter?${queryParams.toString()}`);
};
