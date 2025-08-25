'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import toast from 'react-hot-toast';
import { getMenuItemsByRole, MenuItem as ApiMenuItem } from '@/lib/api/menuPermissions';
import { sortMenuItems, sortChildrenByOrder } from '@/lib/utils/menuSorting';
import { 
  LayoutDashboard, 
  Calendar, 
  Building2, 
  Users, 
  User, 
  Rocket, 
  BarChart3, 
  Wrench, 
  Settings, 
  Bell, 
  HelpCircle, 
  ChevronDown,
  ChevronRight,
  Menu,
  Home,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  DollarSign,
  Power,
  Bed,
  Image,
  Gift,
  CreditCard,
  Shield,
  TrendingUp,
  Activity,
  XCircle,
  FileText
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: MenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  collapsible?: boolean;
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('africanVillage');
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const { user, signOut } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const hotelDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const hotels = [
    { value: 'africanVillage', label: 'African Village', shortLabel: 'African Village' },
    { value: 'bishoftu', label: 'Bishoftu', shortLabel: 'Bishoftu' },
    { value: 'entoto', label: 'Entoto', shortLabel: 'Entoto' },
    { value: 'laketana', label: 'Lake Tana', shortLabel: 'Lake Tana' },
    { value: 'awashfall', label: 'Awash Fall', shortLabel: 'Awash Fall' }
  ];

  // Fetch menu items from database based on user role
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (user?.role) {
        try {
          setLoadingMenu(true);
          const response = await getMenuItemsByRole(user.role);
          if (response.success && response.data) {
            setMenuItems(response.data);
          }
        } catch (error) {
          console.error('Error fetching menu items:', error);
          // Fallback to default menu items
          setMenuItems([]);
        } finally {
          setLoadingMenu(false);
        }
      }
    };

    fetchMenuItems();
  }, [user?.role]);

  // Function to convert database menu items to sidebar format
  const convertToMenuSections = (): MenuSection[] => {
    if (loadingMenu || menuItems.length === 0) {
      // Fallback to hardcoded menu items
      return getFallbackMenuItems();
    }

    // Sort menu items using shared utility (same as Permission Management page)
    const sortedMenuItems = sortMenuItems(menuItems);

    // Group menu items by parent_id
    const menuMap = new Map<string, ApiMenuItem[]>();
    const rootItems: ApiMenuItem[] = [];

    sortedMenuItems.forEach(item => {
      if (item.parent_id) {
        if (!menuMap.has(item.parent_id)) {
          menuMap.set(item.parent_id, []);
        }
        menuMap.get(item.parent_id)!.push(item);
      } else {
        rootItems.push(item);
      }
    });

    // Convert to MenuSection format
    const sections: MenuSection[] = [];
    
    // Daily Operation section
    const dailyOperationItems: MenuItem[] = [];
    
    rootItems.forEach(item => {
      const menuItem: MenuItem = {
        id: item.menu_id,
        label: item.label,
        icon: item.icon || 'Circle',
        href: item.href
      };

      // Add children if they exist
      const children = menuMap.get(item.menu_id);
      if (children && children.length > 0) {
        // Sort children using shared utility (same as Permission Management page)
        const sortedChildren = sortChildrenByOrder(children);
        menuItem.children = sortedChildren.map(child => ({
          id: child.menu_id,
          label: child.label,
          icon: child.icon || 'Circle',
          href: child.href
        }));
      }

      dailyOperationItems.push(menuItem);
    });

    sections.push({
      title: 'DAILY OPERATION',
      items: dailyOperationItems,
      collapsible: true
    });

    return sections;
  };

  // Fallback menu items (original hardcoded logic)
  const getFallbackMenuItems = (): MenuSection[] => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
      { id: 'reservation', label: 'Reservation', icon: 'Calendar', href: '/reservations' },
      { 
        id: 'room-operation', 
        label: 'Room Operation', 
        icon: 'Building2', 
        children: [
          { id: 'room-group', label: 'Room Group', icon: 'Building2', href: '/room-group' },
          { id: 'room-type', label: 'Room Type', icon: 'Building2', href: '/room-type' },
          { id: 'room-management', label: 'Room Group Room Types', icon: 'Settings', href: '/room-management' },
          { id: 'room-type-images', label: 'Room Type Image', icon: 'Image', href: '/room-type-images' },
          { id: 'room-pricing', label: 'Room Pricing', icon: 'DollarSign', href: '/room-pricing' },
          { id: 'rooms', label: 'Rooms', icon: 'Bed', href: '/rooms' },
        ] 
      },
      { id: 'manage-guests', label: 'Manage Guests', icon: 'User', href: '/guests' },
    ];

    const adminOnlyItems = [
      { id: 'promo-code', label: 'Promo Code Management', icon: 'CreditCard', href: '/promo-code' },
      { id: 'gift-card', label: 'Gift Card Management', icon: 'Gift', href: '/gift-card-management' },
      { id: 'employee-management', label: 'Employee Management', icon: 'Users', href: '/employee-management' },
      { id: 'permission-management', label: 'Permission Management', icon: 'Shield', href: '/permission-management' }
    ];

    // Role-based menu visibility
    const userRole = user?.role;
    let dailyOperationItems = [...baseItems];

    if (userRole === 'Admin') {
      dailyOperationItems = [...baseItems, ...adminOnlyItems];
    } else if (userRole === 'Sales Manager') {
      // Sales Manager can see promo codes and gift cards
      dailyOperationItems = [...baseItems, 
        { id: 'promo-code', label: 'Promo Code Management', icon: 'CreditCard', href: '/promo-code' },
        { id: 'gift-card', label: 'Gift Card Management', icon: 'Gift', href: '/gift-card-management' }
      ];
    } else if (userRole === 'Front Office Manager') {
      // Front Office Manager can see employee management
      dailyOperationItems = [...baseItems, 
        { id: 'employee-management', label: 'Employee Management', icon: 'Users', href: '/employee-management' }
      ];
    }
    // Reservation Officer only sees base items

    return [
      {
        title: 'DAILY OPERATION',
        items: dailyOperationItems,
        collapsible: true
      },
      {
        title: 'ACCOUNTING',
        items: [
          { 
            id: 'report', 
            label: 'Reports & Logs', 
            icon: 'BarChart3', 
            children: [
              { id: 'daily-arrivals-departures', label: 'Daily Arrivals/Departures', icon: 'Calendar', href: '/reports/daily-arrivals-departures' },
              { id: 'occupancy-revenue', label: 'Occupancy & Revenue Report', icon: 'TrendingUp', href: '/reports/occupancy-revenue' },
              { id: 'staff-activity-log', label: 'Staff Activity Log', icon: 'Activity', href: '/reports/staff-activity-log' },
              { id: 'no-show-cancellation', label: 'No-Show & Cancellation Tracking', icon: 'XCircle', href: '/reports/no-show-cancellation' },
            ] 
          }
        ]
      }
    ];
  };

  const menuSections = convertToMenuSections();

  const toggleItem = (itemId: string) => {
    // Manual toggle should always work - this takes priority
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Ensure parent menu stays expanded when submenu item is clicked
  const handleSubmenuClick = (parentId: string) => {
    // Only expand if not already expanded - don't interfere with manual toggle
    if (!expandedItems.includes(parentId)) {
      setExpandedItems(prev => [...prev, parentId]);
    }
  };

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const toggleSidebarCollapse = () => {
    toggleSidebar();
  };

  const handleHotelDropdownToggle = () => {
    setHotelDropdownOpen(!hotelDropdownOpen);
  };

  const handleHotelSelect = (hotelValue: string) => {
    setSelectedHotel(hotelValue);
    setHotelDropdownOpen(false);
    toast.success(`Switched to ${hotels.find(h => h.value === hotelValue)?.label}`);
  };

  const getCurrentHotel = () => {
    return hotels.find(h => h.value === selectedHotel);
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      LayoutDashboard,
      Calendar,
      Building2,
      Users,
      User,
      Rocket,
      BarChart3,
      Wrench,
      Settings,
      Bell,
      HelpCircle,
      ChevronDown,
      ChevronRight,
      Menu,
      Home,
      LogOut,
      UserIcon,
      SettingsIcon,
      DollarSign,
      Bed,
      Image,
      Gift,
      CreditCard,
      Shield,
      TrendingUp,
      Activity,
      XCircle,
      FileText
    };
    return iconMap[iconName] || LayoutDashboard;
  };

  const handleUserDropdownToggle = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = () => {
    signOut();
    setUserDropdownOpen(false);
    toast.success('Successfully logged out!');
  };

  // Auto-expand parent menu when on submenu page
  useEffect(() => {
    const currentPath = pathname;
    
    // Check if current path matches any submenu item
    menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some(child => child.href === currentPath);
          if (hasActiveChild && !expandedItems.includes(item.id)) {
            setExpandedItems(prev => [...prev, item.id]);
          }
        }
      });
    });
  }, [pathname]); // Removed expandedItems dependency to prevent interference

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (hotelDropdownRef.current && !hotelDropdownRef.current.contains(event.target as Node)) {
        setHotelDropdownOpen(false);
      }
    };

    if (userDropdownOpen || hotelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, hotelDropdownOpen]);

  const renderMenuItem = (item: MenuItem) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const IconComponent = getIconComponent(item.icon);
    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));

    return (
      <div key={item.id} className="relative group">
        {item.href ? (
          <Link href={item.href}>
            <div className={`flex items-center ${collapsed ? 'px-2 py-2' : 'px-4 py-2'} rounded-lg cursor-pointer transition-colors relative group ${
              isActive 
                ? 'bg-white text-green-700 shadow-sm border border-gray-200' 
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}>
              <IconComponent className={`w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'}`} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full top-0 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div>
            <div 
              className={`flex items-center justify-between ${collapsed ? 'px-2 py-2' : 'px-4 py-2'} rounded-lg cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-white text-green-700 shadow-sm border border-gray-200' 
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center">
                <IconComponent className={`w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {!collapsed && hasChildren && (
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
              {collapsed && hasChildren && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            {!collapsed && isExpanded && hasChildren && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children?.map(child => {
                  const ChildIconComponent = getIconComponent(child.icon);
                  const isChildActive = pathname === child.href;
                  return (
                    <Link key={child.id} href={child.href || '#'} onClick={() => handleSubmenuClick(item.id)}>
                      <div className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                        isChildActive 
                          ? 'bg-white text-green-700 shadow-sm border border-gray-200' 
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                      }`}>
                        <ChildIconComponent className="w-4 h-4 mr-3" />
                        <span className="text-xs">{child.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsed Submenu Popup */}
        {collapsed && hasChildren && (
          <div className="absolute left-full top-0 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] hover:opacity-100 hover:visible">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48">
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <IconComponent className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </div>
              </div>
              <div className="space-y-1">
                {item.children?.map(child => {
                  const ChildIconComponent = getIconComponent(child.icon);
                  const isChildActive = pathname === child.href;
                  return (
                    <Link key={child.id} href={child.href || '#'} onClick={() => handleSubmenuClick(item.id)}>
                      <div className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                        isChildActive 
                          ? 'bg-green-50 text-green-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                        <ChildIconComponent className="w-4 h-4 mr-3" />
                        <span className="text-sm">{child.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gray-50 shadow-lg transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} ${collapsed ? 'overflow-visible' : 'overflow-hidden'} flex-shrink-0`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className={`${collapsed ? 'p-2' : 'p-4'} border-b border-gray-200`}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <div className="ml-3">
                  <div className="text-lg font-bold text-gray-900">Kuriftu</div>
                </div>
              </div>
              <button
                onClick={toggleSidebarCollapse}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  !collapsed ? 'bg-green-600' : 'bg-gray-200'
                }`}
                title={!collapsed ? 'Collapse Sidebar' : 'Expand Sidebar'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    !collapsed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                onClick={toggleSidebarCollapse}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  !collapsed ? 'bg-green-600' : 'bg-gray-200'
                }`}
                title={!collapsed ? 'Collapse Sidebar' : 'Expand Sidebar'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    !collapsed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Hotel Section */}
        {!collapsed ? (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="relative flex-1" ref={hotelDropdownRef}>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors bg-white border border-gray-200"
                  onClick={handleHotelDropdownToggle}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {getCurrentHotel()?.label.charAt(0) || 'H'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{getCurrentHotel()?.shortLabel}</div>
                      <div className="text-xs text-gray-500">Select Hotel</div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${hotelDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Hotel Dropdown Menu */}
                {hotelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {hotels.map((hotel) => (
                        <button
                          key={hotel.value}
                          onClick={() => handleHotelSelect(hotel.value)}
                          className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                            selectedHotel === hotel.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-bold">
                              {hotel.label.charAt(0)}
                            </span>
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{hotel.shortLabel}</div>
                            <div className="text-xs text-gray-500">{hotel.label}</div>
                          </div>
                          {selectedHotel === hotel.value && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center justify-center relative group">
              <div 
                className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
                onMouseEnter={() => setHotelDropdownOpen(true)}
                onMouseLeave={() => setHotelDropdownOpen(false)}
              >
                <span className="text-white font-bold text-sm">
                  {getCurrentHotel()?.label.charAt(0) || 'H'}
                </span>
              </div>
              {/* Hotel Tooltip */}
              <div className="absolute left-full top-0 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {getCurrentHotel()?.label}
                </div>
              </div>

              {/* Hotel Dropdown Menu for Collapsed State */}
              <div className="absolute left-full top-0 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] hover:opacity-100 hover:visible">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-48">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">
                          {getCurrentHotel()?.label.charAt(0) || 'H'}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Select Hotel</span>
                    </div>
                  </div>
                  <div className="py-2">
                    {hotels.map((hotel) => (
                      <button
                        key={hotel.value}
                        onClick={() => handleHotelSelect(hotel.value)}
                        className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                          selectedHotel === hotel.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-bold">
                            {hotel.label.charAt(0)}
                          </span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{hotel.shortLabel}</div>
                          <div className="text-xs text-gray-500">{hotel.label}</div>
                        </div>
                        {selectedHotel === hotel.value && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className={`flex-1 ${collapsed ? 'overflow-visible' : 'overflow-y-auto'} py-4`}>
          <div className={`${collapsed ? 'space-y-2' : 'space-y-6'}`}>
            {menuSections.map((section, index) => {
              const isSectionCollapsed = collapsedSections.includes(section.title);
              const hasItems = section.items.length > 0;
              
              return (
                <div key={index}>
                  {!collapsed && (
                    <div className="px-4 mb-2">
                      {section.collapsible ? (
                        <div 
                          className="flex items-center justify-between cursor-pointer hover:text-gray-700 transition-colors"
                          onClick={() => toggleSection(section.title)}
                        >
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {section.title}
                          </h3>
                          {hasItems && (
                            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isSectionCollapsed ? 'rotate-180' : ''}`} />
                          )}
                        </div>
                      ) : (
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {section.title}
                        </h3>
                      )}
                    </div>
                  )}
                  {(!section.collapsible || !isSectionCollapsed) && (
                    <div className={`${collapsed ? 'space-y-1' : 'space-y-1'}`}>
                      {section.items.map(renderMenuItem)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`border-t border-gray-200 ${collapsed ? 'p-2' : 'p-4'} space-y-4`}>
          {/* User Profile */}
          <div className="relative" ref={userDropdownRef}>
            <div 
              className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors relative group"
              onClick={handleUserDropdownToggle}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              {!collapsed && (
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-500">Super Admin</div>
                </div>
              )}
              {!collapsed && (
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              )}
              {/* User Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full top-0 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {user?.name || 'User'}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown Menu */}
            {userDropdownOpen && !collapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                  </div>
                  
                  <Link href="/profile" className="block">
                    <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <UserIcon className="w-4 h-4 mr-3" />
                      Profile
                    </div>
                  </Link>
                  
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Dropdown Menu for Collapsed State */}
            {userDropdownOpen && collapsed && (
              <div className="fixed left-16 bottom-4 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-48">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                  </div>
                  
                  <Link href="/profile" className="block">
                    <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <UserIcon className="w-4 h-4 mr-3" />
                      Profile
                    </div>
                  </Link>
                  
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
