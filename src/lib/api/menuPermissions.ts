import { authenticatedGet, authenticatedPost, authenticatedPut } from './authenticatedApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface MenuItem {
  menu_id: string;
  label: string;
  icon?: string;
  href?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  permissions?: {
    [roleName: string]: boolean;
  };
}

export interface UserRole {
  id: number;
  role_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuPermission {
  role_name: string;
  menu_id: string;
  label: string;
  can_view: boolean;
  updated_at: string;
}

export interface UpdatePermissionData {
  role_name: string;
  menu_id: string;
  can_view: boolean;
}



export interface CreateMenuItemData {
  menu_id: string;
  label: string;
  icon?: string;
  href?: string;
  parent_id?: string;
  sort_order?: number;
}

export interface UpdateMenuItemData {
  label?: string;
  icon?: string;
  href?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

// API Functions
export const getMenuItems = async (): Promise<{ success: boolean; data?: MenuItem[]; message?: string }> => {
  try {
    const response = await authenticatedGet(`${API_BASE_URL}/menu-permissions/menu-items`);
    return response as { success: boolean; data?: MenuItem[]; message?: string };
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch menu items'
    };
  }
};

export const getMenuItemsByRole = async (roleName: string): Promise<{ success: boolean; data?: MenuItem[]; message?: string }> => {
  try {
    const response = await authenticatedGet(`${API_BASE_URL}/menu-permissions/menu-items/${roleName}`);
    return response as { success: boolean; data?: MenuItem[]; message?: string };
  } catch (error: any) {
    console.error('Error fetching menu items for role:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch menu items for role'
    };
  }
};

export const getRoles = async (): Promise<{ success: boolean; data?: UserRole[]; message?: string }> => {
  try {
    const response = await authenticatedGet(`${API_BASE_URL}/menu-permissions/roles`);
    return response as { success: boolean; data?: UserRole[]; message?: string };
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch roles'
    };
  }
};

export const getPermissions = async (): Promise<{ success: boolean; data?: MenuPermission[]; message?: string }> => {
  try {
    const response = await authenticatedGet(`${API_BASE_URL}/menu-permissions/permissions`);
    return response as { success: boolean; data?: MenuPermission[]; message?: string };
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch permissions'
    };
  }
};

export const updatePermission = async (data: UpdatePermissionData): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await authenticatedPut(`${API_BASE_URL}/menu-permissions/permissions`, data);
    return response as { success: boolean; message?: string };
  } catch (error: any) {
    console.error('Error updating permission:', error);
    return {
      success: false,
      message: error.message || 'Failed to update permission'
    };
  }
};



export const createMenuItem = async (data: CreateMenuItemData): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await authenticatedPost(`${API_BASE_URL}/menu-permissions/menu-items`, data);
    return response as { success: boolean; data?: any; message?: string };
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return {
      success: false,
      message: error.message || 'Failed to create menu item'
    };
  }
};

export const updateMenuItem = async (menuId: string, data: UpdateMenuItemData): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await authenticatedPut(`${API_BASE_URL}/menu-permissions/menu-items/${menuId}`, data);
    return response as { success: boolean; message?: string };
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return {
      success: false,
      message: error.message || 'Failed to update menu item'
    };
  }
};
