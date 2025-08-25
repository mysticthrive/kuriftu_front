// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}



// Available roles
export const AVAILABLE_ROLES = ['Admin', 'Reservation Officer', 'Sales Manager', 'Front Office Manager'] as const;
export type UserRole = typeof AVAILABLE_ROLES[number];

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  message?: string;
  validationErrors?: ValidationError[];
}

// Gift Card types
export interface GiftCard {
  gift_card_id: number;
  card_code: string;
  card_type: 'eCard' | 'physical';
  initial_amount: number;
  current_balance: number;
  issued_to_guest_id?: number;
  issued_at: string;
  expiry_date?: string;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  guest_name?: string;
  guest_email?: string;
}

export interface CreateGiftCardRequest {
  card_type: 'eCard' | 'physical';
  initial_amount: number;
  issued_to_guest_id?: number;
  expiry_date?: string;
  status?: 'active' | 'redeemed' | 'expired' | 'cancelled';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  notes?: string;
}

export interface UpdateGiftCardRequest {
  card_type?: 'eCard' | 'physical';
  initial_amount?: number;
  current_balance?: number;
  issued_to_guest_id?: number;
  expiry_date?: string;
  status?: 'active' | 'redeemed' | 'expired' | 'cancelled';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  notes?: string;
}
