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
  Image, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Star,
  StarOff,
  Eye,
  X,
  Check,
  AlertCircle,
  Link,
  ExternalLink
} from 'lucide-react';
import { getRoomTypeImages, createRoomTypeImageWithFile, updateRoomTypeImageWithFile, deleteRoomTypeImage, setImageAsPrimary, RoomTypeImage, CreateRoomTypeImageWithFileData, UpdateRoomTypeImageWithFileData } from '@/lib/api/roomTypeImages';
import Pagination from '@/components/Pagination';

export default function RoomTypeImagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  const [images, setImages] = useState<RoomTypeImage[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<RoomTypeImage | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingImage, setDeletingImage] = useState<RoomTypeImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<CreateRoomTypeImageWithFileData>({
    room_group_room_type_id: 0,
    image_file: new File([], ''),
    alt_text: '',
    is_primary: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [imagesRes, relationshipsRes] = await Promise.all([
        getRoomTypeImages(),
        fetch('/api/room-group-room-types').then(res => res.json())
      ]);
      
      if (imagesRes.success && imagesRes.data) {
        setImages(imagesRes.data);
      }
      if (relationshipsRes.success && relationshipsRes.data) {
        setRelationships(relationshipsRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile && !editingImage) {
      toast.error('Please select an image file');
      return;
    }

    if (!formData.room_group_room_type_id) {
      toast.error('Please select a room group and type relationship');
      return;
    }

    try {
      setSubmitting(true);
      setUploading(true);
      
      if (editingImage) {
        const updateData: UpdateRoomTypeImageWithFileData = {
          alt_text: formData.alt_text,
          is_primary: formData.is_primary
        };
        
        if (selectedFile) {
          updateData.image_file = selectedFile;
        }
        
        const response = await updateRoomTypeImageWithFile(editingImage.image_id, updateData);
        if (response.success) {
          toast.success('Image updated successfully');
          setShowModal(false);
          setEditingImage(null);
          resetForm();
          fetchData();
        }
      } else {
        const createData: CreateRoomTypeImageWithFileData = {
          room_group_room_type_id: formData.room_group_room_type_id,
          image_file: selectedFile!,
          alt_text: formData.alt_text,
          is_primary: formData.is_primary
        };
        
        const response = await createRoomTypeImageWithFile(createData);
        if (response.success) {
          toast.success('Image added successfully');
          setShowModal(false);
          resetForm();
          fetchData();
        }
      }
    } catch (error: any) {
      console.error('Error saving image:', error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleEdit = (image: RoomTypeImage) => {
    setEditingImage(image);
    setFormData({
      room_group_room_type_id: image.room_group_room_type_id,
      image_file: new File([], ''),
      alt_text: image.alt_text || '',
      is_primary: image.is_primary
    });
    setSelectedFile(null);
    setPreviewUrl(image.image_url);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingImage) return;

    try {
      const response = await deleteRoomTypeImage(deletingImage.image_id);
      if (response.success) {
        toast.success('Image deleted successfully');
        setShowDeleteModal(false);
        setDeletingImage(null);
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message);
    }
  };

  const handleSetPrimary = async (image: RoomTypeImage) => {
    try {
      const response = await setImageAsPrimary(image.image_id);
      if (response.success) {
        toast.success('Image set as primary successfully');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error setting image as primary:', error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      room_group_room_type_id: 0,
      image_file: new File([], ''),
      alt_text: '',
      is_primary: false
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const openAddModal = () => {
    setEditingImage(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingImage(null);
    resetForm();
    setPreviewImage(null);
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.type_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRelationship = !selectedRelationship || image.room_group_room_type_id.toString() === selectedRelationship;
    
    return matchesSearch && matchesRelationship;
  });

  // Pagination logic
  const totalItems = filteredImages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedImages = filteredImages.slice(startIndex, endIndex);

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
                          <span className="text-gray-900 font-medium">Room Type Images</span>
                        </nav>
                      </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Type Images</h1>
                  </div>
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Relationships</option>
                  {relationships.map(rel => (
                    <option key={rel.id} value={rel.id}>
                      {rel.group_name} - {rel.type_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRelationship('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Images Grid */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loadingData ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading images...</p>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="p-8 text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
                  <p className="text-gray-500">Add your first image to get started.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedImages.map((image) => (
                      <div key={image.image_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative">
                          <img
                            src={image.image_url}
                            alt={image.alt_text || 'Room type image'}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                            }}
                          />
                          {image.is_primary && (
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Primary
                              </span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button
                              onClick={() => setPreviewImage(image.image_url)}
                              className="p-1 bg-white bg-opacity-80 rounded text-gray-600 hover:text-gray-900"
                              title="Preview image"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={image.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-white bg-opacity-80 rounded text-gray-600 hover:text-gray-900"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {getRelationshipDisplayName(image.room_group_room_type_id)}
                            </h3>
                            {image.alt_text && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {image.alt_text}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(image.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1">
                              {!image.is_primary && (
                                <button
                                  onClick={() => handleSetPrimary(image)}
                                  className="p-1 text-gray-400 hover:text-yellow-500"
                                  title="Set as primary"
                                >
                                  <StarOff className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(image)}
                                className="p-1 text-gray-400 hover:text-blue-500"
                                title="Edit image"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingImage(image);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Delete image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Add/Edit Image Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingImage ? 'Edit Image' : 'Add New Image'}
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
                  Room Group - Room Type Relationship *
                </label>
                <select
                  value={formData.room_group_room_type_id || ''}
                  onChange={(e) => setFormData({ ...formData, room_group_room_type_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Image File *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setFormData({ ...formData, image_file: file });
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingImage}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select an image file. Accepted formats: JPG, PNG, GIF, WebP (Max size: 5MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description of the image"
                  maxLength={255}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
                  Set as primary image
                </label>
              </div>

              {previewUrl && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image';
                    }}
                  />
                </div>
              )}

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
                  disabled={submitting || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {uploading ? 'Uploading...' : editingImage ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingImage ? 'Update Image' : 'Add Image'}
                    </>
                  )}
                </button>
              </div>
            </form>
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
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Image</h2>
                <p className="text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this image for{' '}
                <span className="font-semibold">
                  {getRelationshipDisplayName(deletingImage.room_group_room_type_id)}
                </span>?
              </p>
              {deletingImage.is_primary && (
                <p className="text-yellow-600 text-sm mt-2">
                  ⚠️ This is a primary image. Deleting it will remove the primary designation.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingImage(null);
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
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
