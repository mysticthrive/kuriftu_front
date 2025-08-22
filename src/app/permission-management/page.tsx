'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Menu, 
  Shield, 
  Settings, 
  Eye,
  EyeOff,
  Search,
  LayoutDashboard,
  Calendar,
  Building2,
  User,
  CreditCard,
  Gift,
  Image,
  DollarSign,
  Bed,
  BarChart3,
  Link,
  Home
} from 'lucide-react';
import { 
  MenuItem, 
  UserRole, 
  MenuPermission,
  getMenuItems, 
  getRoles, 
  getPermissions, 
  updatePermission
} from '@/lib/api/menuPermissions';
import { sortMenuItems } from '@/lib/utils/menuSorting';

export default function PermissionManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  // Icon mapping function
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'LayoutDashboard': LayoutDashboard,
      'Calendar': Calendar,
      'Building2': Building2,
      'User': User,
      'CreditCard': CreditCard,
      'Gift': Gift,
      'Settings': Settings,
      'Image': Image,
      'DollarSign': DollarSign,
      'Bed': Bed,
      'BarChart3': BarChart3,
      'Link': Link
    };
    
    const IconComponent = iconMap[iconName] || Settings;
    return <IconComponent size={16} className="text-gray-600" />;
  };
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showOnlyVisible, setShowOnlyVisible] = useState(false);
  const [permissionMatrix, setPermissionMatrix] = useState<{[key: string]: {[key: string]: boolean}}>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchData();
    } else if (user && user.role !== 'Admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [menuItemsRes, rolesRes, permissionsRes] = await Promise.all([
        getMenuItems(),
        getRoles(),
        getPermissions()
      ]);
      
      if (menuItemsRes.success && menuItemsRes.data) {
        setMenuItems(menuItemsRes.data);
      }
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
        // Set the first non-Admin role as default
        const nonAdminRoles = rolesRes.data.filter(role => role.role_name !== 'Admin');
        if (nonAdminRoles.length > 0) {
          setSelectedRole(nonAdminRoles[0].role_name);
        }
      }
      if (permissionsRes.success && permissionsRes.data) {
        setPermissions(permissionsRes.data);
        buildPermissionMatrix(permissionsRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
  };

  const buildPermissionMatrix = (perms: MenuPermission[]) => {
    const matrix: {[key: string]: {[key: string]: boolean}} = {};
    
    perms.forEach(perm => {
      if (!matrix[perm.menu_id]) {
        matrix[perm.menu_id] = {};
      }
      matrix[perm.menu_id][perm.role_name] = perm.can_view;
    });
    
    setPermissionMatrix(matrix);
  };

  const handlePermissionToggle = async (menuId: string, roleName: string, currentValue: boolean) => {
    try {
      const newValue = !currentValue;
      
      // Check if this is a parent item (has children)
      const childItems = menuItems.filter(item => item.parent_id === menuId);
      const isParentItem = childItems.length > 0;
      
      // Check if this is a child item (has parent)
      const currentItem = menuItems.find(item => item.menu_id === menuId);
      const isChildItem = currentItem?.parent_id;
      
      // If this is a parent item, update both parent and children
      let itemsToUpdate = [];
      if (isParentItem) {
        if (newValue) {
          // If showing parent, also show all children
          itemsToUpdate = [
            { menu_id: menuId, can_view: newValue },
            ...childItems.map(child => ({ menu_id: child.menu_id, can_view: true }))
          ];
        } else {
          // If hiding parent, also hide all children
          itemsToUpdate = [
            { menu_id: menuId, can_view: newValue },
            ...childItems.map(child => ({ menu_id: child.menu_id, can_view: false }))
          ];
        }
      } else if (isChildItem) {
        // If this is a child item
        if (newValue) {
          // If showing child, also show the parent
          if (isChildItem) {
            itemsToUpdate = [
              { menu_id: isChildItem, can_view: true }, // Show parent
              { menu_id: menuId, can_view: newValue }   // Show child
            ];
          } else {
            itemsToUpdate = [{ menu_id: menuId, can_view: newValue }];
          }
        } else {
          // If hiding child, check if other siblings are visible
          const siblings = menuItems.filter(item => item.parent_id === isChildItem && item.menu_id !== menuId);
          const visibleSiblings = siblings.filter(sibling => permissionMatrix[sibling.menu_id]?.[roleName]);
          
          if (visibleSiblings.length === 0) {
            // If no other siblings are visible, hide the parent too
            itemsToUpdate = [
              { menu_id: isChildItem, can_view: false }, // Hide parent
              { menu_id: menuId, can_view: newValue }    // Hide child
            ];
          } else {
            // If other siblings are visible, keep parent visible
            itemsToUpdate = [{ menu_id: menuId, can_view: newValue }];
          }
        }
      } else {
        // If this is a standalone item, only update the item
        itemsToUpdate = [{ menu_id: menuId, can_view: newValue }];
      }
      
      // Update all affected items
      const updatePromises = itemsToUpdate.map(item => 
        updatePermission({
          role_name: roleName,
          menu_id: item.menu_id,
          can_view: item.can_view
        })
      );
      
      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(result => result.success);
      
      if (allSuccess) {
        // Update local state for all affected items
        const newMatrix = { ...permissionMatrix };
        
        itemsToUpdate.forEach(item => {
          if (!newMatrix[item.menu_id]) {
            newMatrix[item.menu_id] = {};
          }
          newMatrix[item.menu_id][roleName] = item.can_view;
        });
        
        setPermissionMatrix(newMatrix);
        
        // Show appropriate success message
        const itemLabel = menuItems.find(item => item.menu_id === menuId)?.label;
        if (isParentItem) {
          if (newValue) {
            toast.success(`${roleName} permission for ${itemLabel} and ${childItems.length} sub-item(s) set to visible`);
          } else {
            toast.success(`${roleName} permission for ${itemLabel} and ${childItems.length} sub-item(s) set to hidden`);
          }
        } else if (isChildItem && newValue) {
          const parentLabel = menuItems.find(item => item.menu_id === isChildItem)?.label || 'Parent';
          toast.success(`${roleName} permission for ${itemLabel} and parent ${parentLabel} set to visible`);
        } else {
          toast.success(`${roleName} permission for ${itemLabel} updated`);
        }
      } else {
        const failedResults = results.filter(result => !result.success);
        toast.error(`Failed to update some permissions: ${failedResults.map(r => r.message).join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const filteredMenuItems = sortMenuItems(
    menuItems.filter(item => {
      if (searchTerm && !item.label.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (showOnlyVisible && selectedRole && !permissionMatrix[item.menu_id]?.[selectedRole]) {
        return false;
      }
      return true;
    })
  );

  // Debug: Log the sorted menu items to see the order
  console.log('Sorted menu items:', filteredMenuItems.map(item => ({
    menu_id: item.menu_id,
    label: item.label,
    parent_id: item.parent_id,
    sort_order: item.sort_order
  })));

  // Filter out Admin role from the roles list
  const filteredRoles = roles.filter(role => role.role_name !== 'Admin');

  if (loading || loadingData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Breadcrumb */}
            <div className="mb-4">
              <nav className="flex items-center text-sm text-gray-500">
                <Home className="w-4 h-4 mr-2" />
                <span>Dashboard</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Permission Management</span>
              </nav>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Menu Item
                      </th>
                      {filteredRoles.map(role => (
                        <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {role.role_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMenuItems.map((item) => {
                      const isChild = item.parent_id;
                      const hasChildren = menuItems.some(menuItem => menuItem.parent_id === item.menu_id);
                      const childItems = menuItems.filter(menuItem => menuItem.parent_id === item.menu_id);
                      
                      return (
                        <tr key={item.menu_id} className={`hover:bg-gray-50 ${isChild ? 'bg-gray-25' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                  isChild ? 'bg-blue-50' : hasChildren ? 'bg-purple-50' : 'bg-gray-100'
                                }`}>
                                  {item.icon ? getIconComponent(item.icon) : <Settings size={16} className="text-gray-600" />}
                                </div>
                              </div>
                              <div className={`${isChild ? 'ml-4' : ''}`}>
                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                  {isChild && <span className="text-blue-500 mr-2">└─</span>}
                                  {item.label}
                                  {hasChildren && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                      Parent ({childItems.length})
                                    </span>
                                  )}
                                </div>
                                {item.href && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Link size={12} className="mr-1 text-gray-400" />
                                    {item.href}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        {filteredRoles.map(role => {
                          const canView = permissionMatrix[item.menu_id]?.[role.role_name] || false;
                          return (
                            <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handlePermissionToggle(item.menu_id, role.role_name, canView)}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  canView 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {canView ? (
                                  <>
                                    <Eye size={12} className="mr-1" />
                                    Visible
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={12} className="mr-1" />
                                    Hidden
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
