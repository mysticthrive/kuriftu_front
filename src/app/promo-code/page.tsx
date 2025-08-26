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
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Percent,
  DollarSign,
  Users,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  PromoCode, 
  getPromoCodes, 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode,
  CreatePromoCodeData,
  UpdatePromoCodeData 
} from '@/lib/api/promoCodes';
import Pagination from '@/components/Pagination';

export default function PromoCodePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCode, setDeletingCode] = useState<PromoCode | null>(null);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState<CreatePromoCodeData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_amount: 0,
    max_discount: 0,
    valid_from: '',
    valid_until: '',
    max_usage: 0,
    status: 'active'
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
      fetchPromoCodes();
    }
  }, [user]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  const fetchPromoCodes = async () => {
    try {
      setLoadingData(true);
      
      const response = await getPromoCodes();
      if (response.success && response.data) {
        setPromoCodes(response.data);
        setTotalItems(response.data.length);
      }
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      toast.error(error.message || 'Failed to fetch promo codes');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['discount_value', 'min_amount', 'max_discount', 'max_usage'].includes(name) 
        ? parseFloat(value) || 0 
        : value
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
    
    if (!formData.code.trim()) {
      errors.code = 'Promo code is required';
    } else if (formData.code.length > 50) {
      errors.code = 'Promo code must be less than 50 characters';
    }

    if (formData.discount_value <= 0) {
      errors.discount_value = 'Discount value must be greater than 0';
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      errors.discount_value = 'Percentage discount cannot exceed 100%';
    }

    if ((formData.min_amount || 0) < 0) {
      errors.min_amount = 'Minimum amount cannot be negative';
    }

    if (formData.max_discount && formData.max_discount <= 0) {
      errors.max_discount = 'Maximum discount must be greater than 0';
    }

    if (!formData.valid_from) {
      errors.valid_from = 'Valid from date is required';
    } else if (!editingCode && new Date(formData.valid_from) < new Date(new Date().setHours(0, 0, 0, 0))) {
      errors.valid_from = 'Valid from date cannot be in the past';
    }

    if (!formData.valid_until) {
      errors.valid_until = 'Valid until date is required';
    }

    if (formData.valid_from && formData.valid_until && new Date(formData.valid_from) >= new Date(formData.valid_until)) {
      errors.valid_until = 'Valid until date must be after valid from date';
    }

    if (formData.max_usage && formData.max_usage <= 0) {
      errors.max_usage = 'Maximum usage must be greater than 0';
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
      
      // Prepare data for API - convert empty strings to undefined for optional fields
      const apiData = {
        ...formData,
        description: formData.description || undefined,
        min_amount: formData.min_amount || undefined,
        max_discount: formData.max_discount || undefined,
        max_usage: formData.max_usage || undefined
      };
      
      if (editingCode) {
        const response = await updatePromoCode(editingCode.promo_code_id, apiData);
        if (response.success) {
          toast.success('Promo code updated successfully');
          setShowModal(false);
          setEditingCode(null);
          resetForm();
          fetchPromoCodes();
        }
      } else {
        const response = await createPromoCode(apiData);
        if (response.success) {
          toast.success('Promo code created successfully');
          setShowModal(false);
          resetForm();
          fetchPromoCodes();
        }
      }
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      if (error.errors) {
        const errors: {[key: string]: string} = {};
        error.errors.forEach((err: any) => {
          errors[err.path] = err.msg;
        });
        setFormErrors(errors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.message || 'Failed to save promo code');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_amount: code.min_amount || 0,
      max_discount: code.max_discount || 0,
      valid_from: code.valid_from.split('T')[0],
      valid_until: code.valid_until.split('T')[0],
      max_usage: code.max_usage || 0,
      status: code.status
    });
    setShowModal(true);
  };

  const handleDeleteClick = (code: PromoCode) => {
    setDeletingCode(code);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCode) return;

    try {
      setDeleting(true);
      const response = await deletePromoCode(deletingCode.promo_code_id);
      if (response.success) {
        setPromoCodes(prev => prev.filter(code => code.promo_code_id !== deletingCode.promo_code_id));
        toast.success('Promo code deleted successfully');
        handleCloseDeleteModal();
      }
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast.error(error.message || 'Failed to delete promo code');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingCode(null);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_amount: 0,
      max_discount: 0,
      valid_from: '',
      valid_until: '',
      max_usage: 0,
      status: 'active'
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCode(null);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: Check },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: X },
      expired: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDiscountDisplay = (code: PromoCode) => {
    if (code.discount_type === 'percentage') {
      return (
        <div className="flex items-center">
          <Percent className="w-4 h-4 text-gray-400 mr-1" />
          <span className="text-sm font-medium text-gray-900">{code.discount_value}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{Number(code.discount_value).toFixed(2)}</span>
        </div>
      );
    }
  };

  // Client-side filtering and pagination
  const filteredPromoCodes = promoCodes.filter(code => {
    const matchesSearch = !searchTerm || 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.description && code.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !selectedStatus || code.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPromoCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromoCodes = filteredPromoCodes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
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
                <span className="text-gray-900 font-medium">Promo Code Management</span>
              </nav>
            </div>
            
            {/* Page Title */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Promo Code Management</h1>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Promo Code
                </button>
              </div>
            </div>

                         {/* Search and Status Filter */}
             <div className="bg-white rounded-lg shadow p-6 mb-6">
               <div className="flex items-center space-x-4">
                 <div className="flex-1 relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                   <input
                     type="text"
                     placeholder="Search promo codes..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
                 <select
                   value={selectedStatus}
                   onChange={(e) => setSelectedStatus(e.target.value)}
                   className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="">All Status</option>
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                   <option value="expired">Expired</option>
                 </select>
                 <button
                   onClick={() => {
                     setSearchTerm('');
                     setSelectedStatus('');
                   }}
                   className="text-sm text-gray-600 hover:text-gray-800 underline px-3 py-2"
                 >
                   Clear Filters
                 </button>
               </div>
             </div>

            {/* Promo Codes Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loadingData ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading promo codes...</p>
                </div>
              ) : filteredPromoCodes.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No promo codes found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedStatus ? 'Try adjusting your search terms or filters.' : 'Get started by creating your first promo code.'}
                  </p>
                  {!searchTerm && !selectedStatus && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Promo Code
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Validity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPromoCodes.map((code) => (
                        <tr key={code.promo_code_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {code.code}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {code.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getDiscountDisplay(code)}
                            {code.min_amount > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Min: ${code.min_amount ? Number(code.min_amount).toFixed(2) : '0.00'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                                <span>{new Date(code.valid_from).toLocaleDateString()}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                to {new Date(code.valid_until).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-gray-400 mr-1" />
                                <span>{code.current_usage}</span>
                                {code.max_usage && (
                                  <span className="text-gray-500">/ {code.max_usage}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(code.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(code)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(code)}
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
              {filteredPromoCodes.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPromoCodes.length}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
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
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter promo code"
                  />
                  {formErrors.code && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    id="discount_type"
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    id="discount_value"
                    name="discount_value"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.discount_value ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={formData.discount_type === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount'}
                  />
                  {formErrors.discount_value && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.discount_value}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="min_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Amount
                  </label>
                  <input
                    type="number"
                    id="min_amount"
                    name="min_amount"
                    step="0.01"
                    min="0"
                    value={formData.min_amount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.min_amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter minimum amount"
                  />
                  {formErrors.min_amount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.min_amount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="max_discount" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount
                  </label>
                  <input
                    type="number"
                    id="max_discount"
                    name="max_discount"
                    step="0.01"
                    min="0"
                    value={formData.max_discount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.max_discount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter maximum discount"
                  />
                  {formErrors.max_discount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.max_discount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    id="valid_from"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.valid_from ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.valid_from && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.valid_from}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    id="valid_until"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.valid_until ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.valid_until && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.valid_until}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="max_usage" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Usage
                  </label>
                  <input
                    type="number"
                    id="max_usage"
                    name="max_usage"
                    min="0"
                    value={formData.max_usage}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.max_usage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter maximum usage (0 for unlimited)"
                  />
                  {formErrors.max_usage && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.max_usage}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description (optional)"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingCode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 transform transition-all">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Promo Code</h2>
                <p className="text-gray-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the promo code:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-medium text-gray-900 font-mono">{deletingCode.code}</p>
                {deletingCode.description && (
                  <p className="text-sm text-gray-600 mt-1">{deletingCode.description}</p>
                )}
                <div className="flex items-center mt-2">
                  {getDiscountDisplay(deletingCode)}
                  <span className="text-sm text-gray-600 ml-2">
                    (Min: ${deletingCode.min_amount ? Number(deletingCode.min_amount).toFixed(2) : '0.00'})
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Usage: {deletingCode.current_usage}
                  {deletingCode.max_usage && ` / ${deletingCode.max_usage}`}
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
                  'Delete Promo Code'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}