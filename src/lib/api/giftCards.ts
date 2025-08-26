import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';
import { GiftCard, CreateGiftCardRequest, UpdateGiftCardRequest } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all gift cards with optional filtering
export const getGiftCards = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  card_type?: string;
}): Promise<ApiResponse<GiftCard[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.card_type) queryParams.append('card_type', params.card_type);

  const queryString = queryParams.toString();
  const url = queryString ? `/gift-cards?${queryString}` : '/gift-cards';
  
  return await authenticatedGet<ApiResponse<GiftCard[]>>(url);
};

// Get gift card by ID
export const getGiftCardById = async (id: number): Promise<ApiResponse<GiftCard>> => {
  return await authenticatedGet<ApiResponse<GiftCard>>(`/gift-cards/${id}`);
};

// Get gift card by card code
export const getGiftCardByCode = async (cardCode: string): Promise<ApiResponse<GiftCard>> => {
  return await authenticatedGet<ApiResponse<GiftCard>>(`/gift-cards/code/${cardCode}`);
};

// Create new gift card
export const createGiftCard = async (data: CreateGiftCardRequest): Promise<ApiResponse<GiftCard>> => {
  return await authenticatedPost<ApiResponse<GiftCard>>('/gift-cards', data);
};

// Update gift card
export const updateGiftCard = async (id: number, data: UpdateGiftCardRequest): Promise<ApiResponse<GiftCard>> => {
  return await authenticatedPut<ApiResponse<GiftCard>>(`/gift-cards/${id}`, data);
};

// Delete gift card
export const deleteGiftCard = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/gift-cards/${id}`);
};
