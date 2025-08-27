'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useHotel } from '@/contexts/HotelContext';
import { useHotelData } from '@/hooks/useHotelData';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Menu, 
  Home, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users
} from 'lucide-react';
import { 
  RoomType, 
  getRoomTypes, 
  getRoomTypesByHotel,
  createRoomType, 
  updateRoomType, 
  deleteRoomType,
  CreateRoomTypeData,
  UpdateRoomTypeData 
} from '@/lib/api/roomTypes';
import Pagination from '@/components/Pagination';

export default function RoomTypePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { selectedHotel, getCurrentHotel } = useHotel();

  // Use the hotel data hook to fetch room types based on selected hotel
  const { 
    data: roomTypesResponse, 
    loading: roomTypesLoading, 
    error: roomTypesError, 
    refetch: refetchRoomTypes 
  } = useHotelData({
    fetchData: (hotelId) => getRoomTypesByHotel(hotelId),
    enabled: !!user
  });

  // Extract room types from the API response
  const roomTypes = roomTypesResponse?.data || [];
  
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingType, setDeletingType] = useState<RoomType | null>(null);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState<CreateRoomTypeData>({
    type_name: '',
    description: '',
    max_occupancy: 2,
    hotel: selectedHotel
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Data is now fetched by useHotelData hook
      setLoadingData(false);
    }
  }, [user]);

  // Update formData hotel when selectedHotel changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      hotel: selectedHotel
    }));
  }, [selectedHotel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_occupancy' ? parseInt(value) || 2 : value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.type_name.trim()) {
      errors.type_name = 'Type name is required';
    } else if (formData.type_name.length > 100) {
      errors.type_name = 'Type name must be less than 100 characters';
    }

    if (formData.max_occupancy && (formData.max_occupancy < 1 || formData.max_occupancy > 10)) {
      errors.max_occupancy = 'Max occupancy must be between 1 and 10';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingType) {
        // Update existing room type
        const response = await updateRoomType(editingType.room_type_id, formData);
        if (response.success) {
          toast.success(response.message || 'Room type updated successfully');
          refetchRoomTypes();
        }
      } else {
        // Create new room type
        const response = await createRoomType(formData);
        if (response.success && response.data) {
          toast.success(response.message || 'Room type created successfully');
          refetchRoomTypes();
        }
      }
      
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving room type:', error);
      if (error.response?.data?.errors) {
        const errors: {[key: string]: string} = {};
        error.response.data.errors.forEach((err: any) => {
          errors[err.path] = err.msg;
        });
        setFormErrors(errors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save room type');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (type: RoomType) => {
    setEditingType(type);
    setFormData({
      type_name: type.type_name,
      description: type.description || '',
      max_occupancy: type.max_occupancy,
      hotel: type.hotel
    });
    setShowModal(true);
  };

  const handleDeleteClick = (type: RoomType) => {
    setDeletingType(type);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingType) return;

    try {
      setDeleting(true);
      const response = await deleteRoomType(deletingType.room_type_id);
      if (response.success) {
        toast.success(response.message || 'Room type deleted successfully');
        refetchRoomTypes();
        handleCloseDeleteModal();
      }
    } catch (error: any) {
      console.error('Error deleting room type:', error);
      toast.error(error.response?.data?.message || 'Failed to delete room type');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingType(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({ type_name: '', description: '', max_occupancy: 2, hotel: selectedHotel });
    setFormErrors({});
  };

  const filteredRoomTypes = (Array.isArray(roomTypes) ? roomTypes : []).filter(type =>
    type.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalItems = filteredRoomTypes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoomTypes = filteredRoomTypes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Page Content */}
              <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Breadcrumb */}
            <div className="mb-4">
              <nav className="flex items-center text-sm text-gray-500">
                <Home className="w-4 h-4 mr-2" />
                <span>Dashboard</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Room Types</span>
              </nav>
            </div>
            
            {/* Page Title */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Types</h1>
                    <div className="text-sm text-gray-500 mt-1">
                      Resort: {getCurrentHotel()?.label || 'Select Resort'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room Type
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search room types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-gray-600 hover:text-gray-800 underline px-3 py-2"
                >
                  Clear Search
                </button>
              </div>
            </div>

            {/* Room Types Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {roomTypesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading room types...</p>
                </div>
              ) : filteredRoomTypes.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No room types found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first room type.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Room Type
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Max Occupancy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRoomTypes.map((type) => (
                        <tr key={type.room_type_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {type.type_name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {type.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{type.max_occupancy}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(type.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(type)}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(type)}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Delete"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingType ? 'Edit Room Type' : 'Create Room Type'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="type_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Type Name *
                  </label>
                  <input
                    type="text"
                    id="type_name"
                    name="type_name"
                    value={formData.type_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.type_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter type name"
                  />
                  {formErrors.type_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.type_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="max_occupancy" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Occupancy
                  </label>
                  <input
                    type="number"
                    id="max_occupancy"
                    name="max_occupancy"
                    min="1"
                    max="10"
                    value={formData.max_occupancy}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.max_occupancy ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter max occupancy (1-10)"
                  />
                  {formErrors.max_occupancy && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.max_occupancy}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="hotel" className="block text-sm font-medium text-gray-700 mb-1">
                    Resort
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {getCurrentHotel()?.label || 'Select Resort'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Room Type</h2>
                <p className="text-gray-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the room type:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-medium text-gray-900">{deletingType.type_name}</p>
                {deletingType.description && (
                  <p className="text-sm text-gray-600 mt-1">{deletingType.description}</p>
                )}
                <div className="flex items-center mt-2">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Max occupancy: {deletingType.max_occupancy}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Room Type'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}