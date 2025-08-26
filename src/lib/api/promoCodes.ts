import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface PromoCode {
  promo_code_id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_amount: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  max_usage?: number;
  current_usage: number;
  status: 'active' | 'inactive' | 'expired';
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePromoCodeData {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_amount?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  max_usage?: number;
  status?: 'active' | 'inactive' | 'expired';
}

export interface UpdatePromoCodeData {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_amount?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  max_usage?: number;
  status?: 'active' | 'inactive' | 'expired';
}

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

// Get all promo codes with optional filtering
export const getPromoCodes = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ApiResponse<PromoCode[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const url = queryString ? `/promo-codes?${queryString}` : '/promo-codes';
  
  return await authenticatedGet<ApiResponse<PromoCode[]>>(url);
};

// Get promo code by ID
export const getPromoCodeById = async (id: number): Promise<ApiResponse<PromoCode>> => {
  return await authenticatedGet<ApiResponse<PromoCode>>(`/promo-codes/${id}`);
};

// Create new promo code
export const createPromoCode = async (data: CreatePromoCodeData): Promise<ApiResponse<PromoCode>> => {
  return await authenticatedPost<ApiResponse<PromoCode>>('/promo-codes', data);
};

// Update promo code
export const updatePromoCode = async (id: number, data: UpdatePromoCodeData): Promise<ApiResponse<PromoCode>> => {
  return await authenticatedPut<ApiResponse<PromoCode>>(`/promo-codes/${id}`, data);
};

// Delete promo code
export const deletePromoCode = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/promo-codes/${id}`);
};
