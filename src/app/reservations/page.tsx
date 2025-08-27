'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Menu, 
  Home, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  User,
  Building2,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  Reservation, 
  getReservations, 
  createReservation, 
  updateReservation, 
  deleteReservation,
  getRoomsList,
  CreateReservationData,
  UpdateReservationData,
  Room
} from '@/lib/api/reservations';
import { Guest, getGuests } from '@/lib/api/guests';
import Pagination from '@/components/Pagination';

export default function ReservationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingReservation, setDeletingReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState<CreateReservationData>({
    guest_id: 0,
    room_id: 0,
    check_in_date: '',
    check_out_date: '',
    check_in_time: '14:00',
    check_out_time: '11:00',
    num_adults: 1,
    num_children: 0,
    children_ages: '',
    special_requests: '',
    status: 'confirmed',
    payment_status: 'pending',
    source: 'website',
    currency: 'ETB'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [selectedGuestIndex, setSelectedGuestIndex] = useState(-1);
  const guestDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setShowGuestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [reservationsRes, guestsRes, roomsRes] = await Promise.all([
        getReservations(),
        getGuests(),
        getRoomsList()
      ]);
      
      if (reservationsRes.success && reservationsRes.data) {
        setReservations(reservationsRes.data);
      }
      if (guestsRes.success && guestsRes.data) {
        setGuests(guestsRes.data);
      }
      if (roomsRes.success && roomsRes.data) {
        setRooms(roomsRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For children_ages, remove all spaces and decimal points
    let processedValue = value;
    if (name === 'children_ages') {
      processedValue = value.replace(/\s/g, '').replace(/\./g, ''); // Remove all spaces and decimal points
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guest_id' || name === 'room_id' || name === 'num_adults' || name === 'num_children' 
        ? parseInt(processedValue) || 0 
        : processedValue
    }));
    
    // Clear error when user starts typing (but not for children_ages as it has real-time validation)
    if (formErrors[name] && name !== 'children_ages') {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Real-time validation for children ages
    if (name === 'children_ages') {
      const validationError = validateChildrenAgesFormat(processedValue);
      if (validationError) {
        setFormErrors(prev => ({
          ...prev,
          [name]: validationError
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.guest_id) {
      errors.guest_id = 'Guest is required';
    }
    if (!formData.room_id) {
      errors.room_id = 'Room is required';
    }
    if (!formData.check_in_date) {
      errors.check_in_date = 'Check-in date is required';
    }
    if (!formData.check_out_date) {
      errors.check_out_date = 'Check-out date is required';
    }
    if (formData.check_in_date && formData.check_out_date && 
        new Date(formData.check_in_date) >= new Date(formData.check_out_date)) {
      errors.check_out_date = 'Check-out date must be after check-in date';
    }
    if (formData.num_adults < 1) {
      errors.num_adults = 'At least one adult is required';
    }
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    if (!formData.payment_status) {
      errors.payment_status = 'Payment status is required';
    }

        // Validate children ages format
    if (formData.children_ages && formData.children_ages.trim()) {
      // Check if there are any spaces in the input
      if (formData.children_ages.includes(' ')) {
        errors.children_ages = 'Spaces are not allowed. Use comma-separated format (e.g., 5,8,12)';
      } else if (formData.children_ages.includes('.')) {
        errors.children_ages = 'Decimal numbers are not allowed. Use whole numbers only (e.g., 5,8,12)';
      } else {
        const ages = formData.children_ages.split(',').map(age => age.trim()).filter(age => age !== '');
        
        // Check if there are any empty entries after splitting
        if (ages.length === 0) {
          errors.children_ages = 'Please enter valid ages separated by commas (no spaces)';
        } else {
          const invalidAges = ages.filter(age => {
            // Check if age is a valid whole number between 0 and 18
            const numAge = parseInt(age);
            const floatAge = parseFloat(age);
            return isNaN(numAge) || numAge < 0 || numAge > 18 || numAge !== floatAge; // Ensures it's a whole number
          });
          
          if (invalidAges.length > 0) {
            errors.children_ages = 'Children ages must be comma-separated whole numbers between 0-18 (no decimals, no spaces)';
          }
          
          // Check if number of ages matches number of children
          if ((formData.num_children || 0) > 0 && ages.length !== (formData.num_children || 0)) {
            errors.children_ages = `Number of ages (${ages.length}) must match number of children (${formData.num_children || 0})`;
          }
        }
      }
    } else if ((formData.num_children || 0) > 0) {
      // If there are children but no ages provided, show a warning
      errors.children_ages = 'Please provide ages for all children (comma-separated, no spaces)';
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
      
      if (editingReservation) {
        // Update existing reservation
        const response = await updateReservation(editingReservation.reservation_id, formData);
        if (response.success) {
          setReservations(prev => 
            prev.map(reservation => 
              reservation.reservation_id === editingReservation.reservation_id 
                ? response.data! 
                : reservation
            )
          );
          toast.success(response.message || 'Reservation updated successfully');
        }
      } else {
        // Create new reservation
        const response = await createReservation(formData);
        if (response.success && response.data) {
          setReservations(prev => [response.data!, ...prev]);
          toast.success(response.message || 'Reservation created successfully');
        }
      }
      
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving reservation:', error);
      if (error.response?.data?.errors) {
        const errors: {[key: string]: string} = {};
        error.response.data.errors.forEach((err: any) => {
          errors[err.path] = err.msg;
        });
        setFormErrors(errors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save reservation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    
    // Format dates for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      guest_id: reservation.guest_id,
      room_id: reservation.room_id,
      check_in_date: formatDateForInput(reservation.check_in_date),
      check_out_date: formatDateForInput(reservation.check_out_date),
      check_in_time: reservation.check_in_time,
      check_out_time: reservation.check_out_time,
      num_adults: reservation.num_adults,
      num_children: reservation.num_children || 0,
      children_ages: reservation.children_ages || '',
      special_requests: reservation.special_requests || '',
      status: reservation.status,
      payment_status: reservation.payment_status,
      source: reservation.source,
      currency: reservation.currency
    });
    setShowModal(true);
  };

  const handleDeleteClick = (reservation: Reservation) => {
    setDeletingReservation(reservation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReservation) return;

    try {
      setDeleting(true);
      const response = await deleteReservation(deletingReservation.reservation_id);
      if (response.success) {
        setReservations(prev => prev.filter(reservation => reservation.reservation_id !== deletingReservation.reservation_id));
        toast.success(response.message || 'Reservation deleted successfully');
        handleCloseDeleteModal();
      }
    } catch (error: any) {
      console.error('Error deleting reservation:', error);
      toast.error(error.response?.data?.message || 'Failed to delete reservation');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingReservation(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReservation(null);
    setFormData({
      guest_id: 0,
      room_id: 0,
      check_in_date: '',
      check_out_date: '',
      check_in_time: '14:00',
      check_out_time: '11:00',
      num_adults: 1,
      num_children: 0,
      children_ages: '',
      special_requests: '',
      status: 'confirmed',
      payment_status: 'pending',
      source: 'website',
      currency: 'ETB'
    });
    setFormErrors({});
    setGuestSearchTerm('');
    setShowGuestDropdown(false);
  };

  const filteredGuests = guests.filter(guest =>
    guest.first_name.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
    guest.last_name.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
    (guest.phone && guest.phone.toLowerCase().includes(guestSearchTerm.toLowerCase()))
  );

  const getSelectedGuestName = () => {
    if (!formData.guest_id) return '';
    const guest = guests.find(g => g.guest_id === formData.guest_id);
    return guest ? `${guest.first_name} ${guest.last_name} - ${guest.email}` : '';
  };

  const validateChildrenAgesFormat = (value: string): string => {
    if (!value || !value.trim()) return '';
    
    // Check if there are any spaces in the input
    if (value.includes(' ')) {
      return 'Spaces are not allowed. Use comma-separated format (e.g., 5,8,12)';
    }
    
    // Check if there are any decimal points in the input
    if (value.includes('.')) {
      return 'Decimal numbers are not allowed. Use whole numbers only (e.g., 5,8,12)';
    }
    
    const ages = value.split(',').map(age => age.trim()).filter(age => age !== '');
    
    if (ages.length === 0) {
      return 'Please enter valid ages separated by commas (no spaces)';
    }
    
    const invalidAges = ages.filter(age => {
      const numAge = parseInt(age);
      const floatAge = parseFloat(age);
      return isNaN(numAge) || numAge < 0 || numAge > 18 || numAge !== floatAge; // Ensures it's a whole number
    });
    
    if (invalidAges.length > 0) {
      return 'Ages must be whole numbers between 0-18 (no decimals)';
    }
    
    if ((formData.num_children || 0) > 0 && ages.length !== (formData.num_children || 0)) {
      return `Expected ${formData.num_children || 0} ages for ${formData.num_children || 0} children`;
    }
    
    return '';
  };

  const filteredReservations = reservations.filter(reservation =>
    reservation.reservation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${reservation.first_name} ${reservation.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.hotel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredReservations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const IconComponent = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800' },
      paid: { color: 'bg-green-100 text-green-800' },
      failed: { color: 'bg-red-100 text-red-800' },
      refunded: { color: 'bg-blue-100 text-blue-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
                <span className="text-gray-900 font-medium">Reservations</span>
              </nav>
            </div>

            {/* Page Title */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Reservation
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
                    placeholder="Search reservations by code, guest name, room number, or hotel..."
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

            {/* Reservations Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loadingData ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading reservations...</p>
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first reservation.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Reservation
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reservation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedReservations.map((reservation) => (
                        <tr key={reservation.reservation_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.reservation_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(reservation.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {reservation.first_name} {reservation.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{reservation.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {reservation.room_number}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">{reservation.hotel}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(reservation.check_in_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(reservation.check_out_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(reservation.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentStatusBadge(reservation.payment_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(reservation)}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(reservation)}
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

      {/* Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingReservation ? 'Edit Reservation' : 'Create New Reservation'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={guestDropdownRef}>
                  <label htmlFor="guest_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Guest *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search guests by name, email, or phone..."
                      value={showGuestDropdown ? guestSearchTerm : getSelectedGuestName()}
                      onChange={(e) => {
                        setGuestSearchTerm(e.target.value);
                        setShowGuestDropdown(true);
                        setSelectedGuestIndex(-1);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, guest_id: 0 }));
                        }
                      }}
                      onFocus={() => setShowGuestDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setSelectedGuestIndex(prev => 
                            prev < filteredGuests.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSelectedGuestIndex(prev => prev > 0 ? prev - 1 : prev);
                        } else if (e.key === 'Enter' && selectedGuestIndex >= 0 && filteredGuests[selectedGuestIndex]) {
                          e.preventDefault();
                          const guest = filteredGuests[selectedGuestIndex];
                          setFormData(prev => ({ ...prev, guest_id: guest.guest_id }));
                          setGuestSearchTerm('');
                          setShowGuestDropdown(false);
                          setSelectedGuestIndex(-1);
                        } else if (e.key === 'Escape') {
                          setShowGuestDropdown(false);
                          setSelectedGuestIndex(-1);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formErrors.guest_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formData.guest_id && !showGuestDropdown && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, guest_id: 0 }));
                          setGuestSearchTerm('');
                          setSelectedGuestIndex(-1);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {showGuestDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredGuests.length > 0 ? (
                          filteredGuests.map((guest, index) => (
                            <div
                              key={guest.guest_id}
                              className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                index === selectedGuestIndex 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, guest_id: guest.guest_id }));
                                setGuestSearchTerm('');
                                setShowGuestDropdown(false);
                                setSelectedGuestIndex(-1);
                              }}
                            >
                              <div className="font-medium text-gray-900">
                                {guest.first_name} {guest.last_name}
                              </div>
                              <div className="text-sm text-gray-600">{guest.email}</div>
                              {guest.phone && (
                                <div className="text-xs text-gray-500">{guest.phone}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No guests found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.guest_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.guest_id}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="room_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Room *
                  </label>
                  <select
                    id="room_id"
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.room_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.room_id} value={room.room_id}>
                        {room.room_number} - {room.hotel} ({room.status})
                      </option>
                    ))}
                  </select>
                  {formErrors.room_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.room_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    id="check_in_date"
                    name="check_in_date"
                    value={formData.check_in_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.check_in_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.check_in_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.check_in_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    id="check_out_date"
                    name="check_out_date"
                    value={formData.check_out_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.check_out_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.check_out_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.check_out_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="check_in_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    id="check_in_time"
                    name="check_in_time"
                    value={formData.check_in_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="check_out_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    id="check_out_time"
                    name="check_out_time"
                    value={formData.check_out_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="num_adults" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Adults *
                  </label>
                  <input
                    type="number"
                    id="num_adults"
                    name="num_adults"
                    min="1"
                    max="10"
                    value={formData.num_adults}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.num_adults ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.num_adults && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.num_adults}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="num_children" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    id="num_children"
                    name="num_children"
                    min="0"
                    max="10"
                    value={formData.num_children}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="website">Website</option>
                    <option value="mobile_app">Mobile App</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="agent">Agent</option>
                    <option value="call_center">Call Center</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.status}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status *
                  </label>
                  <select
                    id="payment_status"
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.payment_status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  {formErrors.payment_status && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.payment_status}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="children_ages" className="block text-sm font-medium text-gray-700 mb-1">
                    Children Ages (comma-separated whole numbers, no spaces or decimals)
                  </label>
                  <input
                    type="text"
                    id="children_ages"
                    name="children_ages"
                    value={formData.children_ages}
                    onChange={handleInputChange}
                    placeholder="e.g., 5,8,12"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.children_ages ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.children_ages && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.children_ages}</p>
                  )}
                  {!formErrors.children_ages && formData.children_ages && (
                    <p className="mt-1 text-sm text-gray-500">
                      Format: Enter whole numbers separated by commas, no spaces or decimals (e.g., 5,8,12)
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests
                  </label>
                  <textarea
                    id="special_requests"
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any special requests or notes..."
                  />
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
                  {submitting ? 'Saving...' : editingReservation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Reservation</h2>
                <p className="text-gray-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the reservation:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-medium text-gray-900">{deletingReservation.reservation_code}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {deletingReservation.first_name} {deletingReservation.last_name} - {deletingReservation.room_number}
                </p>
                <div className="flex items-center mt-2">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {new Date(deletingReservation.check_in_date).toLocaleDateString()} - {new Date(deletingReservation.check_out_date).toLocaleDateString()}
                  </span>
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
                  'Delete Reservation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
