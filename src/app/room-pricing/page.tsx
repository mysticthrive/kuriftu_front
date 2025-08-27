'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Menu, 
  Home, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  Building,
  Users,
  Star,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getRoomPricing, 
  getRoomPricingByHotel,
  createRoomPricing, 
  updateRoomPricing, 
  deleteRoomPricing, 
  getRoomPricingWithFilters,
  RoomPricing, 
  CreateRoomPricingData 
} from '@/lib/api/roomPricing';
import { getRoomGroupRoomTypes } from '@/lib/api/roomGroupRoomTypes';
import { useHotel } from '@/contexts/HotelContext';
import { useHotelData } from '@/hooks/useHotelData';
import Pagination from '@/components/Pagination';

export default function RoomPricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { hotels, selectedHotel, getCurrentHotel } = useHotel();

  // Use the hotel data hook to fetch pricing based on selected hotel
  const { 
    data: pricingResponse, 
    loading: pricingLoading, 
    error: pricingError, 
    refetch: refetchPricing 
  } = useHotelData({
    fetchData: (hotelId) => getRoomPricingByHotel(hotelId),
    enabled: !!user
  });
  
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<RoomPricing | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPricing, setDeletingPricing] = useState<RoomPricing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<CreateRoomPricingData>({
    room_group_room_type_id: 0,
    hotel: selectedHotel,
    occupancy: 'single',
    day_of_week: undefined,
    month: undefined,
    holiday_flag: false,
    start_date: '',
    end_date: '',
    price: 0
  });

  const occupancies = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'triple', label: 'Triple' },
    { value: 'child', label: 'Child' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Update formData hotel when selectedHotel changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      hotel: selectedHotel
    }));
  }, [selectedHotel]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const relationshipsRes = await getRoomGroupRoomTypes();
      
      if (relationshipsRes.success && relationshipsRes.data) {
        setRelationships(relationshipsRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.room_group_room_type_id) {
      toast.error('Please select a room group and type relationship');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data for API - convert empty strings to undefined for optional fields
      const apiData = {
        ...formData,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        day_of_week: formData.day_of_week || undefined,
        month: formData.month || undefined
      };
      
      if (editingPricing) {
        const response = await updateRoomPricing(editingPricing.pricing_id, apiData);
        if (response.success) {
          toast.success('Pricing updated successfully');
          setShowModal(false);
          setEditingPricing(null);
          resetForm();
          refetchPricing();
        }
      } else {
        const response = await createRoomPricing(apiData);
        if (response.success) {
          toast.success('Pricing added successfully');
          setShowModal(false);
          resetForm();
          refetchPricing();
        }
      }
    } catch (error: any) {
      console.error('Error saving pricing:', error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pricing: RoomPricing) => {
    setEditingPricing(pricing);
    // Format the dates for HTML date input (YYYY-MM-DD)
    const formattedStartDate = pricing.start_date 
      ? new Date(pricing.start_date).toISOString().split('T')[0]
      : '';
    const formattedEndDate = pricing.end_date 
      ? new Date(pricing.end_date).toISOString().split('T')[0]
      : '';
    
    setFormData({
      room_group_room_type_id: pricing.room_group_room_type_id,
      hotel: pricing.hotel,
      occupancy: pricing.occupancy,
      day_of_week: pricing.day_of_week,
      month: pricing.month,
      holiday_flag: pricing.holiday_flag,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      price: Number(pricing.price)
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingPricing) return;

    try {
      const response = await deleteRoomPricing(deletingPricing.pricing_id);
      if (response.success) {
        toast.success('Pricing deleted successfully');
        setShowDeleteModal(false);
        setDeletingPricing(null);
        refetchPricing();
      }
    } catch (error: any) {
      console.error('Error deleting pricing:', error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      room_group_room_type_id: 0,
      hotel: selectedHotel,
      occupancy: 'single',
      day_of_week: undefined,
      month: undefined,
      holiday_flag: false,
      start_date: '',
      end_date: '',
      price: 0
    });
  };

  const openAddModal = () => {
    setEditingPricing(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPricing(null);
    resetForm();
  };

  const filteredPricing = (pricingResponse?.data || []).filter(item => {
    const matchesSearch = item.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.hotel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.occupancy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOccupancy = !selectedOccupancy || item.occupancy === selectedOccupancy;
    const matchesRelationship = !selectedRelationship || item.room_group_room_type_id.toString() === selectedRelationship;
    
    return matchesSearch && matchesOccupancy && matchesRelationship;
  });

  // Pagination logic
  const totalItems = filteredPricing.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPricing = filteredPricing.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getRelationshipDisplayName = (relationshipId: number) => {
    const relationship = relationships.find(rel => rel.id === relationshipId);
    if (relationship) {
      return `${relationship.group_name} - ${relationship.type_name}`;
    }
    return `Relationship ${relationshipId}`;
  };

  const getHotelDisplayName = (hotel: string) => {
    const hotelObj = hotels.find(h => h.value === hotel);
    return hotelObj ? hotelObj.label : hotel;
  };

  const getOccupancyDisplayName = (occupancy: string) => {
    const occupancyObj = occupancies.find(o => o.value === occupancy);
    return occupancyObj ? occupancyObj.label : occupancy;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                          <span className="text-gray-900 font-medium">Room Pricing</span>
                        </nav>
                      </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Pricing</h1>
                  </div>
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pricing
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search pricing..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  {getCurrentHotel()?.label || 'Select Resort'}
                </div>
                <select
                  value={selectedOccupancy}
                  onChange={(e) => setSelectedOccupancy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Occupancies</option>
                  {occupancies.map(occupancy => (
                    <option key={occupancy.value} value={occupancy.value}>
                      {occupancy.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Relationships</option>
                  {relationships.map(rel => (
                    <option key={rel.id} value={rel.id}>
                      {rel.group_name} - {rel.type_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedOccupancy('');
                    setSelectedRelationship('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {pricingLoading || loadingData ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading pricing data...</p>
                </div>
              ) : filteredPricing.length === 0 ? (
                <div className="p-8 text-center">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pricing found</h3>
                  <p className="text-gray-500">Add your first pricing rule to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resort
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Occupancy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Conditions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPricing.map((item) => (
                        <tr key={item.pricing_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getRelationshipDisplayName(item.room_group_room_type_id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {getHotelDisplayName(item.hotel)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {getOccupancyDisplayName(item.occupancy)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                                                         <div className="text-sm font-semibold text-green-600">
                               ${Number(item.price).toFixed(2)}
                             </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.holiday_flag && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                                  Holiday
                                </span>
                              )}
                              {item.day_of_week && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  {item.day_of_week.charAt(0).toUpperCase() + item.day_of_week.slice(1)}
                                </span>
                              )}
                              {item.month && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {months.find(m => m.value === item.month)?.label}
                                </span>
                              )}
                              {item.start_date && item.end_date && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit pricing"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingPricing(item);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete pricing"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Pricing Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPricing ? 'Edit Pricing' : 'Add New Pricing'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Group - Room Type Relationship *
                  </label>
                  <select
                    value={formData.room_group_room_type_id || ''}
                    onChange={(e) => setFormData({ ...formData, room_group_room_type_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(rel => (
                      <option key={rel.id} value={rel.id}>
                        {rel.group_name} - {rel.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resort *
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                    {getCurrentHotel()?.label || 'Select Resort'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupancy *
                  </label>
                  <select
                    value={formData.occupancy}
                    onChange={(e) => setFormData({ ...formData, occupancy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {occupancies.map(occupancy => (
                      <option key={occupancy.value} value={occupancy.value}>
                        {occupancy.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={formData.day_of_week || ''}
                                         onChange={(e) => setFormData({ ...formData, day_of_week: (e.target.value as any) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Any day</option>
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={formData.month || ''}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Any month</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="holiday_flag"
                  checked={formData.holiday_flag}
                  onChange={(e) => setFormData({ ...formData, holiday_flag: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="holiday_flag" className="ml-2 block text-sm text-gray-900">
                  Holiday pricing
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingPricing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingPricing ? 'Update Pricing' : 'Add Pricing'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Pricing</h2>
                <p className="text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this pricing rule for{' '}
                <span className="font-semibold">
                  {getRelationshipDisplayName(deletingPricing.room_group_room_type_id)}
                </span>?
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPricing(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Pricing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
