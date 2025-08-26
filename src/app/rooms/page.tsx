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
  Filter,
  Bed,
  MapPin,
  Hotel,
  X,
  Check,
  AlertCircle,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { getRooms, createRoom, updateRoom, deleteRoom, Room, CreateRoomData, getRoomsByHotel } from '@/lib/api/rooms';
import { getRoomGroups } from '@/lib/api/roomGroups';
import { getRoomTypes } from '@/lib/api/roomTypes';
import { getRoomTypeImages, RoomTypeImage } from '@/lib/api/roomTypeImages';
import { getRoomPricing, RoomPricing } from '@/lib/api/roomPricing';
import { RoomGroup } from '@/lib/api/roomGroups';
import { RoomType } from '@/lib/api/roomTypes';
import Pagination from '@/components/Pagination';

const statusOptions = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'occupied', label: 'Occupied', color: 'bg-red-100 text-red-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hold', label: 'Hold', color: 'bg-gray-100 text-gray-800' },
  { value: 'booked', label: 'Booked', color: 'bg-blue-100 text-blue-800' }
];

export default function RoomsPage() {
  const { user, loading } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { selectedHotel, getCurrentHotel, hotels } = useHotel();
  const router = useRouter();

  // Use the hotel data hook to fetch rooms based on selected hotel
  const { 
    data: rooms, 
    loading: roomsLoading, 
    error: roomsError, 
    refetch: refetchRooms 
  } = useHotelData({
    fetchData: (hotelId) => getRoomsByHotel(hotelId),
    enabled: !!user
  });

  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomImages, setRoomImages] = useState<RoomTypeImage[]>([]);
  const [roomPricing, setRoomPricing] = useState<RoomPricing[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<CreateRoomData>({
    hotel: selectedHotel,
    room_number: '',
    room_type_id: undefined,
    room_group_id: undefined,
    status: 'available'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAdditionalData();
    }
  }, [user]);

  // Update formData hotel when selectedHotel changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      hotel: selectedHotel
    }));
  }, [selectedHotel]);

  const fetchAdditionalData = async () => {
    try {
      setLoadingData(true);
      const [roomGroupsRes, roomTypesRes, imagesRes, pricingRes] = await Promise.all([
        getRoomGroups(),
        getRoomTypes(),
        getRoomTypeImages(),
        getRoomPricing()
      ]);
      
      if (pricingRes.success && pricingRes.data) {
        setRoomPricing(pricingRes.data);
      }
      if (roomGroupsRes.success && roomGroupsRes.data) {
        setRoomGroups(roomGroupsRes.data);
      }
      if (roomTypesRes.success && roomTypesRes.data) {
        setRoomTypes(roomTypesRes.data);
      }
      if (imagesRes.success && imagesRes.data) {
        setRoomImages(imagesRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching additional data:', error);
      toast.error(error.message || 'Failed to fetch additional data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.room_number.trim()) {
      toast.error('Room number is required');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingRoom) {
        const response = await updateRoom(editingRoom.room_id, formData);
        if (response.success) {
          toast.success('Room updated successfully');
          setShowModal(false);
          setEditingRoom(null);
          resetForm();
          refetchRooms();
        }
      } else {
        const response = await createRoom(formData);
        if (response.success) {
                  toast.success('Room created successfully');
        setShowModal(false);
        resetForm();
        refetchRooms();
        }
      }
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      hotel: room.hotel,
      room_number: room.room_number,
      room_type_id: room.room_type_id || undefined,
      room_group_id: room.room_group_id || undefined,
      status: room.status
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;

    try {
      const response = await deleteRoom(deletingRoom.room_id);
      if (response.success) {
        toast.success('Room deleted successfully');
        setShowDeleteModal(false);
        setDeletingRoom(null);
        refetchRooms();
      }
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      hotel: selectedHotel,
      room_number: '',
      room_type_id: undefined,
      room_group_id: undefined,
      status: 'available'
    });
  };

  const openAddModal = () => {
    setEditingRoom(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    resetForm();
  };

  const filteredRooms = rooms?.data?.filter((room: Room) => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.group_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || room.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination logic
  const totalItems = filteredRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption?.color}`}>
        {statusOption?.label}
      </span>
    );
  };

  const getHotelDisplayName = (hotel: string) => {
    const hotelObj = hotels?.find(h => h.value === hotel);
    return hotelObj ? hotelObj.label : hotel;
  };

  const getRoomImage = (room: Room) => {
    // Find the image that matches the room's group and type combination
    if (room.room_group_id && room.room_type_id) {
      const image = roomImages.find(img => 
        img.group_name === room.group_name && 
        img.type_name === room.type_name
      );
      return image?.image_url;
    }
    return null;
  };

  const getRoomPrice = (room: Room) => {
    if (!room.room_type_id || !room.room_group_id) return null;
    
    // Find pricing for this room's hotel and type
    // We'll look for single occupancy pricing as default
    const pricing = roomPricing.find(p => 
      p.hotel === room.hotel && 
      p.occupancy === 'single' &&
      // Try to match by room type first, then by group if available
      (p.group_name === room.group_name || p.type_name === room.type_name)
    );
    
    return pricing?.price || null;
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
                          <span className="text-gray-900 font-medium">Rooms</span>
                        </nav>
                      </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Bed className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
                  </div>
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  {getCurrentHotel()?.label || 'Select Hotel'}
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Rooms Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loadingData ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading rooms...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-8 text-center">
                  <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                  <p className="text-gray-500">Create your first room to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hotel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
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
                      {paginatedRooms.map((room) => (
                        <tr key={room.room_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              {getRoomImage(room) ? (
                                <img
                                  src={getRoomImage(room)!}
                                  alt={`${room.room_number} - ${room.type_name || 'Room'}`}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setPreviewImage(getRoomImage(room)!)}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                  <Bed className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Bed className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {room.room_number}
                                </div>
                                {room.max_occupancy && (
                                  <div className="text-xs text-gray-500">
                                    Max: {room.max_occupancy} guests
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Hotel className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {getHotelDisplayName(room.hotel)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {room.type_name || 'Not assigned'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {room.group_name || 'Not assigned'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-semibold text-green-600">
                                {getRoomPrice(room) ? `$${Number(getRoomPrice(room)).toFixed(2)}` : 'Not set'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(room.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(room.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(room)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Edit room"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingRoom(room);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Delete room"
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

      {/* Add/Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel *
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  {getCurrentHotel()?.label || 'Select Hotel'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 101, A1, Suite 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  value={formData.room_type_id || ''}
                  onChange={(e) => setFormData({ ...formData, room_type_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select room type</option>
                  {roomTypes.map(type => (
                    <option key={type.room_type_id} value={type.room_type_id}>
                      {type.type_name} (Max: {type.max_occupancy})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Group
                </label>
                <select
                  value={formData.room_group_id || ''}
                  onChange={(e) => setFormData({ ...formData, room_group_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select room group</option>
                  {roomGroups.map(group => (
                    <option key={group.room_group_id} value={group.room_group_id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingRoom ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingRoom ? 'Update Room' : 'Create Room'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Room</h2>
                <p className="text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete room <span className="font-semibold">{deletingRoom.room_number}</span> 
                from <span className="font-semibold">{getHotelDisplayName(deletingRoom.hotel)}</span>?
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRoom(null);
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
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewImage}
              alt="Room Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
