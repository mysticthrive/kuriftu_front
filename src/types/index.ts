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
