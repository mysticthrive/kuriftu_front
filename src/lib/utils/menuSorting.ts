import { MenuItem as ApiMenuItem } from '@/lib/api/menuPermissions';

/**
 * Shared sorting function for menu items to ensure consistent ordering
 * across Sidebar and Permission Management page
 * This ensures that Room Operation's sub-items are listed immediately after Room Operation
 */
export const sortMenuItems = (menuItems: ApiMenuItem[]): ApiMenuItem[] => {
  return [...menuItems].sort((a, b) => {
    // If both are parents (no parent_id), sort by sort_order
    if (a.parent_id === null && b.parent_id === null) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    
    // If a is a parent and b is a child, check if b belongs to a
    if (a.parent_id === null && b.parent_id !== null) {
      if (b.parent_id === a.menu_id) {
        return -1; // Parent comes before its child
      } else {
        // Different parent, sort by parent's sort_order
        const parentB = menuItems.find(item => item.menu_id === b.parent_id);
        if (parentB) {
          const parentOrderDiff = (a.sort_order || 0) - (parentB.sort_order || 0);
          if (parentOrderDiff !== 0) {
            return parentOrderDiff;
          }
        }
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
    }
    
    // If b is a parent and a is a child, check if a belongs to b
    if (b.parent_id === null && a.parent_id !== null) {
      if (a.parent_id === b.menu_id) {
        return 1; // Parent comes before its child
      } else {
        // Different parent, sort by parent's sort_order
        const parentA = menuItems.find(item => item.menu_id === a.parent_id);
        if (parentA) {
          const parentOrderDiff = (parentA.sort_order || 0) - (b.sort_order || 0);
          if (parentOrderDiff !== 0) {
            return parentOrderDiff;
          }
        }
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
    }
    
    // If both are children, check if they have the same parent
    if (a.parent_id === b.parent_id) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    } else {
      // Different parents, sort by parent's sort_order first, then by child's sort_order
      const parentA = menuItems.find(item => item.menu_id === a.parent_id);
      const parentB = menuItems.find(item => item.menu_id === b.parent_id);
      
      if (parentA && parentB) {
        const parentOrderDiff = (parentA.sort_order || 0) - (parentB.sort_order || 0);
        if (parentOrderDiff !== 0) {
          return parentOrderDiff;
        }
      }
      
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
  });
};

/**
 * Sort children of a specific parent by sort_order
 */
export const sortChildrenByOrder = (children: ApiMenuItem[]): ApiMenuItem[] => {
  return children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
};
