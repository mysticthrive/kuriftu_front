import axios from 'axios';

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
  try {
    const response = await axios.get(`${API_BASE_URL}/room-pricing`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room pricing');
  }
};

// GET room pricing by ID
export const getRoomPricingById = async (id: number): Promise<ApiResponse<RoomPricing>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-pricing/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room pricing');
  }
};

// GET pricing by room group room type ID
export const getRoomPricingByRelationship = async (relationshipId: number): Promise<ApiResponse<RoomPricing[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-pricing/relationship/${relationshipId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room pricing by relationship');
  }
};

// GET pricing by hotel
export const getRoomPricingByHotel = async (hotel: string): Promise<ApiResponse<RoomPricing[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-pricing/hotel/${hotel}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room pricing by hotel');
  }
};

// GET pricing by occupancy
export const getRoomPricingByOccupancy = async (occupancy: string): Promise<ApiResponse<RoomPricing[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-pricing/occupancy/${occupancy}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room pricing by occupancy');
  }
};

// POST create new room pricing
export const createRoomPricing = async (data: CreateRoomPricingData): Promise<ApiResponse<RoomPricing>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/room-pricing`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create room pricing');
  }
};

// PUT update room pricing
export const updateRoomPricing = async (id: number, data: UpdateRoomPricingData): Promise<ApiResponse<RoomPricing>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/room-pricing/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update room pricing');
  }
};

// DELETE room pricing
export const deleteRoomPricing = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/room-pricing/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete room pricing');
  }
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
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await axios.get(`${API_BASE_URL}/room-pricing/filter?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room pricing with filters');
  }
};
