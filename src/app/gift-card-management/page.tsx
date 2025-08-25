'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Home,
  Eye,
  X
} from 'lucide-react';
import { 
  GiftCard, 
  CreateGiftCardRequest,
  UpdateGiftCardRequest
} from '@/types';
import Pagination from '@/components/Pagination';
import { 
  getGiftCards, 
  createGiftCard, 
  updateGiftCard, 
  deleteGiftCard 
} from '@/lib/api/giftCards';
import { getGuests, Guest } from '@/lib/api/guests';

export default function GiftCardManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState<GiftCard | null>(null);
  const [viewingGiftCard, setViewingGiftCard] = useState<GiftCard | null>(null);
  const [formData, setFormData] = useState<CreateGiftCardRequest>({
    card_type: 'eCard',
    initial_amount: 0,
    status: 'active',
    payment_status: 'pending'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchGiftCards();
      fetchGuests();
    }
  }, [user]);

  const fetchGiftCards = async () => {
    try {
      setLoadingData(true);
      const response = await getGiftCards();
      
      if (response.success && response.data) {
        setGiftCards(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch gift cards');
      }
    } catch (error: any) {
      console.error('Error fetching gift cards:', error);
      toast.error('Failed to fetch gift cards');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await getGuests();
      if (response.success && response.data) {
        setGuests(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching guests:', error);
      toast.error('Failed to fetch guests');
    }
  };

  const handleOpenModal = (giftCard?: GiftCard) => {
    if (giftCard) {
      setEditingGiftCard(giftCard);
      // Format the expiry date for HTML date input (YYYY-MM-DD)
      const formattedExpiryDate = giftCard.expiry_date 
        ? new Date(giftCard.expiry_date).toISOString().split('T')[0]
        : '';
      
      setFormData({
        card_type: giftCard.card_type,
        initial_amount: Number(giftCard.initial_amount),
        issued_to_guest_id: giftCard.issued_to_guest_id,
        expiry_date: formattedExpiryDate,
        status: giftCard.status,
        payment_status: giftCard.payment_status,
        notes: giftCard.notes
      });
    } else {
      setEditingGiftCard(null);
      setFormData({
        card_type: 'eCard',
        initial_amount: 0,
        status: 'active',
        payment_status: 'pending'
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGiftCard(null);
    setFormData({
      card_type: 'eCard',
      initial_amount: 0,
      status: 'active',
      payment_status: 'pending'
    });
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initial_amount' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.card_type) {
      errors.card_type = 'Card type is required';
    }
    
    if (formData.initial_amount <= 0) {
      errors.initial_amount = 'Initial amount must be greater than 0';
    }
    
    if (!formData.issued_to_guest_id) {
      errors.issued_to_guest_id = 'Guest ID is required';
    }
    
    if (!formData.expiry_date) {
      errors.expiry_date = 'Expiry date is required';
    } else if (new Date(formData.expiry_date) <= new Date()) {
      errors.expiry_date = 'Expiry date must be in the future';
    }
    
    if (!formData.notes || formData.notes.trim() === '') {
      errors.notes = 'Notes are required';
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
      
      if (editingGiftCard) {
        const response = await updateGiftCard(editingGiftCard.gift_card_id, formData);
        if (response.success) {
          toast.success('Gift card updated successfully');
          handleCloseModal();
          fetchGiftCards();
        } else {
          toast.error(response.message || 'Failed to update gift card');
        }
      } else {
        const response = await createGiftCard(formData);
        if (response.success) {
          toast.success('Gift card created successfully');
          handleCloseModal();
          fetchGiftCards();
        } else {
          toast.error(response.message || 'Failed to create gift card');
        }
      }
    } catch (error: any) {
      console.error('Error submitting gift card:', error);
      toast.error('An error occurred while saving the gift card');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewGiftCard = (giftCard: GiftCard) => {
    setViewingGiftCard(giftCard);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingGiftCard(null);
  };

  const handleDeleteGiftCard = async (giftCard: GiftCard) => {
    if (!confirm('Are you sure you want to delete this gift card?')) {
      return;
    }
    
    try {
      const response = await deleteGiftCard(giftCard.gift_card_id);
      if (response.success) {
        toast.success('Gift card deleted successfully');
        fetchGiftCards();
      } else {
        toast.error(response.message || 'Failed to delete gift card');
      }
    } catch (error: any) {
      console.error('Error deleting gift card:', error);
      toast.error('An error occurred while deleting the gift card');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'redeemed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGuestNameById = (guestId?: number) => {
    if (!guestId) return 'Not assigned';
    const guest = guests.find(g => g.guest_id === guestId);
    return guest ? `${guest.first_name} ${guest.last_name}` : 'Guest not found';
  };

  // Frontend filtering logic
  const filteredGiftCards = giftCards.filter(giftCard => {
    const searchLower = searchTerm.toLowerCase();
    const cardCodeLower = giftCard.card_code.toLowerCase();
    const guestNameLower = getGuestNameById(giftCard.issued_to_guest_id).toLowerCase();
    
    const matchesSearch = cardCodeLower.includes(searchLower) || 
                         guestNameLower.includes(searchLower);
    const matchesStatus = !statusFilter || giftCard.status === statusFilter;
    const matchesCardType = !cardTypeFilter || giftCard.card_type === cardTypeFilter;
    
    return matchesSearch && matchesStatus && matchesCardType;
  });

  // Pagination logic
  const totalItems = filteredGiftCards.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGiftCards = filteredGiftCards.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                <span className="text-gray-900 font-medium">Gift Card Management</span>
              </nav>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gift Card Management</h1>
                    <p className="text-gray-600 mt-1">Manage gift cards and track their usage</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gift Card
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search gift cards..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={cardTypeFilter}
                    onChange={(e) => {
                      setCardTypeFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="eCard">eCard</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Gift Cards Table */}
            {loadingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading gift cards...</p>
              </div>
                         ) : filteredGiftCards.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No gift cards found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter || cardTypeFilter 
                    ? 'Try adjusting your search or filters.' 
                    : 'Get started by creating a new gift card.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Card Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issued To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                                     <tbody className="bg-white divide-y divide-gray-200">
                     {paginatedGiftCards.map((giftCard) => (
                      <tr key={giftCard.gift_card_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {giftCard.card_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            giftCard.card_type === 'eCard' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {giftCard.card_type}
                          </span>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           ${Number(giftCard.initial_amount).toFixed(2)}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           ${Number(giftCard.current_balance).toFixed(2)}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(giftCard.status)}`}>
                            {giftCard.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(giftCard.payment_status)}`}>
                            {giftCard.payment_status}
                          </span>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {getGuestNameById(giftCard.issued_to_guest_id)}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewGiftCard(giftCard)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(giftCard)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit gift card"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGiftCard(giftCard)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete gift card"
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
               <div className="mt-6">
                 <Pagination
                   currentPage={currentPage}
                   totalPages={totalPages}
                   totalItems={totalItems}
                   itemsPerPage={itemsPerPage}
                   onPageChange={handlePageChange}
                   onItemsPerPageChange={handleItemsPerPageChange}
                 />
               </div>
             )}
          </div>
        </main>
      </div>

      {/* Add/Edit Gift Card Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingGiftCard ? 'Edit Gift Card' : 'Create New Gift Card'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Type *
                  </label>
                  <select
                    name="card_type"
                    value={formData.card_type}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.card_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="eCard">eCard</option>
                    <option value="physical">Physical</option>
                  </select>
                  {formErrors.card_type && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.card_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Amount *
                  </label>
                  <input
                    type="number"
                    name="initial_amount"
                    value={formData.initial_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.initial_amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.initial_amount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.initial_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Guest *
                   </label>
                   <select
                     name="issued_to_guest_id"
                     value={formData.issued_to_guest_id || ''}
                     onChange={handleInputChange}
                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                       formErrors.issued_to_guest_id ? 'border-red-500' : 'border-gray-300'
                     }`}
                     required
                   >
                     <option value="">Select a guest</option>
                     {guests.map((guest) => (
                       <option key={guest.guest_id} value={guest.guest_id}>
                         {guest.first_name} {guest.last_name} - {guest.email}
                       </option>
                     ))}
                   </select>
                   {formErrors.issued_to_guest_id && (
                     <p className="mt-1 text-sm text-red-600">{formErrors.issued_to_guest_id}</p>
                   )}
                 </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Expiry Date *
                   </label>
                   <input
                     type="date"
                     name="expiry_date"
                     value={formData.expiry_date || ''}
                     onChange={handleInputChange}
                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                       formErrors.expiry_date ? 'border-red-500' : 'border-gray-300'
                     }`}
                     required
                   />
                   {formErrors.expiry_date && (
                     <p className="mt-1 text-sm text-red-600">{formErrors.expiry_date}</p>
                   )}
                 </div>
              </div>

                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Notes *
                 </label>
                 <textarea
                   name="notes"
                   value={formData.notes || ''}
                   onChange={handleInputChange}
                   rows={3}
                   className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                     formErrors.notes ? 'border-red-500' : 'border-gray-300'
                   }`}
                   placeholder="Add any additional notes..."
                   required
                 />
                 {formErrors.notes && (
                   <p className="mt-1 text-sm text-red-600">{formErrors.notes}</p>
                 )}
               </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    editingGiftCard ? 'Update Gift Card' : 'Create Gift Card'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Gift Card Modal */}
      {showViewModal && viewingGiftCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Gift Card Details</h2>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Code</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{viewingGiftCard.card_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Type</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingGiftCard.card_type}</p>
                </div>
                                 <div>
                   <label className="block text-sm font-medium text-gray-700">Initial Amount</label>
                   <p className="mt-1 text-sm text-gray-900">${Number(viewingGiftCard.initial_amount).toFixed(2)}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Current Balance</label>
                   <p className="mt-1 text-sm text-gray-900">${Number(viewingGiftCard.current_balance).toFixed(2)}</p>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(viewingGiftCard.status)}`}>
                    {viewingGiftCard.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getPaymentStatusColor(viewingGiftCard.payment_status)}`}>
                    {viewingGiftCard.payment_status}
                  </span>
                </div>
                                 <div>
                   <label className="block text-sm font-medium text-gray-700">Issued To</label>
                   <p className="mt-1 text-sm text-gray-900">{getGuestNameById(viewingGiftCard.issued_to_guest_id)}</p>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issued At</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(viewingGiftCard.issued_at).toLocaleDateString()}</p>
                </div>
                {viewingGiftCard.expiry_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(viewingGiftCard.expiry_date).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingGiftCard.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingGiftCard.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
