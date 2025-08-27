import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

// Types
export interface MenuPermission {
  menu_item: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface RolePermissions {
  role: string;
  permissions: MenuPermission[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Available roles
export const AVAILABLE_ROLES = [
  'Reservation Officer',
  'Sales Manager', 
  'Front Office Manager',
  'Admin'
] as const;

// Available menu items
export const AVAILABLE_MENU_ITEMS = [
  'dashboard',
  'reservations',
  'room-group',
  'room-type',
  'room-management',
  'room-images',
  'room-pricing',
  'rooms',
  'guests',
  'promo-code',
  'gift-card',
  'employee-management',
  'permission-management',
  'reports'
] as const;

// Get permissions for a specific role
export const getRolePermissions = async (role: string): Promise<ApiResponse<MenuPermission[]>> => {
  return authenticatedGet<ApiResponse<MenuPermission[]>>(`/permissions/${role}`);
};

// Update permissions for a specific role
export const updateRolePermissions = async (role: string, permissions: MenuPermission[]): Promise<ApiResponse<any>> => {
  return authenticatedPut<ApiResponse<any>>(`/permissions/${role}`, { permissions });
};

// Get all available roles
export const getAvailableRoles = async (): Promise<ApiResponse<string[]>> => {
  return authenticatedGet<ApiResponse<string[]>>('/permissions/roles/available');
};

// Get all available menu items
export const getAvailableMenuItems = async (): Promise<ApiResponse<string[]>> => {
  return authenticatedGet<ApiResponse<string[]>>('/permissions/menu-items/available');
};

// Get current user's permissions
export const getMyPermissions = async (): Promise<ApiResponse<RolePermissions>> => {
  return authenticatedGet<ApiResponse<RolePermissions>>('/permissions/my-permissions');
};
