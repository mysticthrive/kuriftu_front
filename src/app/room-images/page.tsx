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
  Trash2, 
  Search,
  Star,
  StarOff,
  X,
  AlertCircle,
  Grid3X3,
  List,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
  Edit,
  Check
} from 'lucide-react';
import { getRoomTypeImages, deleteRoomTypeImage, setImageAsPrimary, RoomTypeImage, createRoomTypeImageWithFile, CreateRoomTypeImageWithFileData, updateRoomTypeImageWithFile, UpdateRoomTypeImageWithFileData } from '@/lib/api/roomTypeImages';
import { getRoomGroupRoomTypes } from '@/lib/api/roomGroupRoomTypes';
import { getRoomGroups, getRoomGroupsByHotel, RoomGroup } from '@/lib/api/roomGroups';
import { getRoomTypes, getRoomTypesByHotel, RoomType } from '@/lib/api/roomTypes';
import { useHotel } from '@/contexts/HotelContext';
import Pagination from '@/components/Pagination';

export default function RoomTypeImagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { selectedHotel } = useHotel();
  
  const [images, setImages] = useState<RoomTypeImage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingImage, setDeletingImage] = useState<RoomTypeImage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  // Upload functionality
  const [formData, setFormData] = useState<CreateRoomTypeImageWithFileData>({
    room_group_room_type_id: 0,
    image_file: new File([], ''),
    alt_text: '',
    is_primary: false
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [bulkUploadModal, setBulkUploadModal] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  // Edit functionality
  const [editModal, setEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState<RoomTypeImage | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateRoomTypeImageWithFileData>({
    image_file: undefined,
    alt_text: '',
    is_primary: false
  });
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [editUploading, setEditUploading] = useState(false);

  // Room group room type relationships
  const [relationships, setRelationships] = useState<any[]>([]);

  // Enhanced multiple image management
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'relationship'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && selectedHotel) {
      fetchData();
    }
  }, [user, selectedHotel]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [imagesRes, relationshipsRes, groupsRes, typesRes] = await Promise.all([
        getRoomTypeImages(),
        getRoomGroupRoomTypes(),
        getRoomGroupsByHotel(selectedHotel),
        getRoomTypesByHotel(selectedHotel)
      ]);
      
      if (imagesRes.success && imagesRes.data) {
        // Filter images to only include those where both room group and room type belong to the selected hotel
        const filteredImages = imagesRes.data.filter((image: RoomTypeImage) => {
          const relationship = relationshipsRes.data?.find((rel: any) => rel.id === image.room_group_room_type_id);
          if (!relationship) return false;
          
          const groupBelongsToHotel = groupsRes.data?.some((group: RoomGroup) => 
            group.room_group_id === relationship.room_group_id && group.hotel === selectedHotel
          );
          const typeBelongsToHotel = typesRes.data?.some((type: RoomType) => 
            type.room_type_id === relationship.room_type_id && type.hotel === selectedHotel
          );
          return groupBelongsToHotel && typeBelongsToHotel;
        });
        setImages(filteredImages);
      }
      if (relationshipsRes.success && relationshipsRes.data) {
        // Filter relationships to only include those where both room group and room type belong to the selected hotel
        const filteredRelationships = relationshipsRes.data.filter((rel: any) => {
          const groupBelongsToHotel = groupsRes.data?.some((group: RoomGroup) => 
            group.room_group_id === rel.room_group_id && group.hotel === selectedHotel
          );
          const typeBelongsToHotel = typesRes.data?.some((type: RoomType) => 
            type.room_type_id === rel.room_type_id && type.hotel === selectedHotel
          );
          return groupBelongsToHotel && typeBelongsToHotel;
        });
        setRelationships(filteredRelationships);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
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



  const handleEdit = (image: RoomTypeImage) => {
    setEditingImage(image);
    setEditFormData({
      image_file: undefined,
      alt_text: image.alt_text || '',
      is_primary: image.is_primary
    });
    setEditSelectedFiles([]); // Reset selected files when opening edit modal
    setImagesToDelete([]); // Reset images to delete when opening edit modal
    setEditModal(true);
  };

  // Get all images for the same room type relationship (excluding those marked for deletion)
  const getImagesForRelationship = (relationshipId: number) => {
    return images.filter(img => 
      img.room_group_room_type_id === relationshipId && 
      !imagesToDelete.includes(img.image_id)
    );
  };

  // Track images to be deleted in edit modal
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingImage) return;

    try {
      setEditUploading(true);
      
      // Check if the current editing image is being deleted
      const isCurrentImageBeingDeleted = imagesToDelete.includes(editingImage.image_id);
      
      // First, delete any images that were marked for deletion
      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(imageId => 
          deleteRoomTypeImage(imageId)
        );
        
        const deleteResults = await Promise.all(deletePromises);
        const deleteSuccessCount = deleteResults.filter(result => result.success).length;
        
        if (deleteSuccessCount > 0) {
          toast.success(`${deleteSuccessCount} image(s) deleted successfully`);
        }
      }
      
      // Handle new image upload (create new images instead of replacing)
      if (editSelectedFiles.length > 0) {
        const uploadPromises = editSelectedFiles.map(async (file, index) => {
          const createData: CreateRoomTypeImageWithFileData = {
            room_group_room_type_id: editingImage.room_group_room_type_id,
            image_file: file,
            alt_text: editFormData.alt_text || `Additional image ${index + 1}`,
            is_primary: editFormData.is_primary && index === 0 // Only first image can be primary
          };
          
          return await createRoomTypeImageWithFile(createData);
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        const successCount = uploadResults.filter(result => result.success).length;
        
        if (successCount > 0) {
          toast.success(`${successCount} new image(s) uploaded successfully`);
        } else {
          toast.error('Failed to upload new images');
        }
      } else {
        // Only update the current image if no new file is uploaded and it's not being deleted
        if (!isCurrentImageBeingDeleted) {
          const updateData = {
            alt_text: editFormData.alt_text,
            is_primary: editFormData.is_primary
          };
          
          const response = await updateRoomTypeImageWithFile(editingImage.image_id, updateData);
          
          if (response.success) {
            toast.success('Image updated successfully');
          } else {
            toast.error(response.message || 'Failed to update image');
          }
        }
      }
      
      setEditModal(false);
      setEditingImage(null);
      setImagesToDelete([]);
      fetchData();
    } catch (error: any) {
      console.error('Error updating image:', error);
      toast.error(error.message || 'Failed to update image');
    } finally {
      setEditUploading(false);
    }
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEditSelectedFiles(files);
  };

  const resetForm = () => {
    setFormData({
      room_group_room_type_id: 0,
      image_file: new File([], ''),
      alt_text: '',
      is_primary: false
    });
    setPrimaryImageIndex(0);
  };

  const getRelationshipDisplayName = (relationshipId: number) => {
    const relationship = relationships.find(rel => rel.id === relationshipId);
    if (relationship) {
      return `${relationship.group_name} - ${relationship.type_name}`;
    }
    return `Room Type ${relationshipId}`;
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.type_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Group images by room_group_room_type_id
  const groupedImages = filteredImages.reduce((groups, image) => {
    const key = image.room_group_room_type_id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(image);
    return groups;
  }, {} as Record<number, RoomTypeImage[]>);

  // Convert grouped images to array and sort
  const sortedGroupedImages = Object.entries(groupedImages).map(([relationshipId, images]) => {
    const primaryImage = images.find(img => img.is_primary) || images[0];
    const sortedImages = images.sort((a, b) => {
      // Primary image first, then by creation date
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return {
      relationshipId: Number(relationshipId),
      relationshipName: getRelationshipDisplayName(Number(relationshipId)),
      primaryImage,
      allImages: sortedImages,
      imageCount: images.length,
      latestDate: Math.max(...images.map(img => new Date(img.created_at).getTime()))
    };
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = a.latestDate - b.latestDate;
        break;
      case 'name':
        comparison = (a.primaryImage.alt_text || '').localeCompare(b.primaryImage.alt_text || '');
        break;
      case 'relationship':
        comparison = a.relationshipName.localeCompare(b.relationshipName);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalItems = sortedGroupedImages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroupedImages = sortedGroupedImages.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Upload functions
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setPrimaryImageIndex(0); // Reset to first image when new files are selected
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image file');
      return;
    }

    if (!formData.room_group_room_type_id || formData.room_group_room_type_id === 0) {
      toast.error('Please select a room group and type relationship');
      return;
    }

    // Validate that the selected relationship exists
    if (!formData.room_group_room_type_id || formData.room_group_room_type_id === 0) {
      toast.error('Please select a room group and type relationship');
      return;
    }

    try {
      setBulkUploading(true);
      
      const uploadPromises = selectedFiles.map(async (file, index) => {
                 const createData: CreateRoomTypeImageWithFileData = {
           room_group_room_type_id: formData.room_group_room_type_id,
           image_file: file,
           alt_text: formData.alt_text || `Image ${index + 1}`,
           is_primary: index === primaryImageIndex && formData.is_primary
         };
        
        return await createRoomTypeImageWithFile(createData);
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(result => result.success).length;
      
             if (successCount > 0) {
         toast.success(`${successCount} images uploaded successfully`);
         setBulkUploadModal(false);
         setSelectedFiles([]);
         resetForm();
         fetchData();
       } else {
         toast.error('Failed to upload images');
       }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(error.message);
    } finally {
      setBulkUploading(false);
    }
  };

  // Multiple selection functions
  const toggleImageSelection = (imageId: number) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const toggleGroupSelection = (groupedImage: any) => {
    const allImageIds = groupedImage.allImages.map((img: any) => img.image_id);
    const allSelected = allImageIds.every((id: number) => selectedImages.includes(id));
    
    if (allSelected) {
      // Remove all images from this group
      setSelectedImages(prev => prev.filter(id => !allImageIds.includes(id)));
    } else {
      // Add all images from this group
      setSelectedImages(prev => Array.from(new Set([...prev, ...allImageIds])));
    }
  };

  const selectAllImages = () => {
    const allImageIds = sortedGroupedImages.flatMap(group => group.allImages.map(img => img.image_id));
    setSelectedImages(allImageIds);
  };

  const clearSelection = () => {
    setSelectedImages([]);
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image to delete');
      return;
    }

    try {
      const deletePromises = selectedImages.map(imageId => 
        deleteRoomTypeImage(imageId)
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(result => result.success).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} images deleted successfully`);
        setSelectedImages([]);
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting images:', error);
      toast.error(error.message);
    }
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
                          <span className="text-gray-900 font-medium">Room Images</span>
                        </nav>
                      </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Images</h1>
                    <p className="text-gray-600 mt-1">Manage multiple images for room types</p>
                  </div>
                </div>
                                 <div className="flex items-center space-x-3">
                   <div className="flex items-center bg-gray-100 rounded-lg p-1">
                     <button
                       onClick={() => setViewMode('grid')}
                       className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                       title="Grid view"
                     >
                       <Grid3X3 className="w-4 h-4" />
                     </button>
                     <button
                       onClick={() => setViewMode('list')}
                       className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                       title="List view"
                     >
                       <List className="w-4 h-4" />
                     </button>
                   </div>
                   <button
                     onClick={() => setBulkUploadModal(true)}
                     className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                   >
                     <Upload className="w-4 h-4 mr-2" />
                     Upload Images
                   </button>
                 </div>
              </div>
            </div>

            {/* Enhanced Filters and Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters & Controls</h3>
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
                      placeholder="Search images..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="relationship-asc">Room Type A-Z</option>
                    <option value="relationship-desc">Room Type Z-A</option>
                  </select>
                                     <button
                     onClick={() => {
                       setSearchTerm('');
                       setSortBy('date');
                       setSortOrder('desc');
                     }}
                     className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                   >
                     <X className="w-4 h-4 mr-2" />
                     Clear All
                   </button>
                </div>

              {/* Bulk Selection Controls */}
              {selectedImages.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {selectedImages.length} image(s) selected
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear Selection
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                                     {/* Select All Header */}
                   <div className="mb-4 flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                       <input
                         type="checkbox"
                         checked={selectedImages.length === paginatedGroupedImages.flatMap(g => g.allImages).length && paginatedGroupedImages.length > 0}
                         onChange={(e) => e.target.checked ? selectAllImages() : clearSelection()}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="text-sm text-gray-600">
                         Select all ({paginatedGroupedImages.flatMap(g => g.allImages).length} images)
                       </span>
                     </div>
                   </div>

                   {viewMode === 'grid' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                       {paginatedGroupedImages.map((groupedImage) => {
                         const allSelected = groupedImage.allImages.every(img => selectedImages.includes(img.image_id));
                         const someSelected = groupedImage.allImages.some(img => selectedImages.includes(img.image_id));
                         
                         return (
                           <div key={groupedImage.relationshipId} className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                             someSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                           }`}>
                             <div className="relative">
                               <input
                                 type="checkbox"
                                 checked={allSelected}
                                 ref={(el) => {
                                   if (el) el.indeterminate = someSelected && !allSelected;
                                 }}
                                 onChange={() => toggleGroupSelection(groupedImage)}
                                 className="absolute top-2 left-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded z-10"
                               />
                               <img
                                 src={groupedImage.primaryImage.image_url}
                                 alt={groupedImage.primaryImage.alt_text || 'Room type image'}
                                 className="w-full h-48 object-cover"
                                 onError={(e) => {
                                   e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                 }}
                               />
                               {groupedImage.primaryImage.is_primary && (
                                 <div className="absolute top-2 right-2">
                                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                     <Star className="w-3 h-3 mr-1" />
                                     Primary
                                   </span>
                                 </div>
                               )}
                               {groupedImage.imageCount > 1 && (
                                 <div className="absolute top-2 right-2">
                                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                     {groupedImage.imageCount} images
                                   </span>
                                 </div>
                               )}
                                                                                                <div className="absolute bottom-2 right-2 flex space-x-1">
                                   {!groupedImage.primaryImage.is_primary && (
                                     <button
                                       onClick={() => handleSetPrimary(groupedImage.primaryImage)}
                                       className="p-1 bg-white bg-opacity-80 rounded text-gray-600 hover:text-yellow-600"
                                       title="Set as primary"
                                     >
                                       <Star className="w-4 h-4" />
                                     </button>
                                   )}
                                   <button
                                     onClick={() => handleEdit(groupedImage.primaryImage)}
                                     className="p-1 bg-white bg-opacity-80 rounded text-gray-600 hover:text-blue-600"
                                     title="Edit primary image"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </button>
                                 </div>
                             </div>
                             <div className="p-4">
                               <div className="mb-2">
                                 <h3 className="text-sm font-medium text-gray-900 truncate">
                                   {groupedImage.relationshipName}
                                 </h3>
                                 {groupedImage.primaryImage.alt_text && (
                                   <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                     {groupedImage.primaryImage.alt_text}
                                   </p>
                                 )}
                                 <p className="text-xs text-gray-500 mt-1">
                                   {groupedImage.imageCount} image{groupedImage.imageCount > 1 ? 's' : ''}
                                 </p>
                               </div>
                               <div className="flex items-center justify-between">
                                 <span className="text-xs text-gray-500">
                                   {new Date(groupedImage.primaryImage.created_at).toLocaleDateString()}
                                 </span>
                                                                   <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        setDeletingImage(groupedImage.primaryImage);
                                        setShowDeleteModal(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-500"
                                      title="Delete primary image"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   ) : (
                     <div className="space-y-2">
                       {paginatedGroupedImages.map((groupedImage) => {
                         const allSelected = groupedImage.allImages.every(img => selectedImages.includes(img.image_id));
                         const someSelected = groupedImage.allImages.some(img => selectedImages.includes(img.image_id));
                         
                         return (
                           <div key={groupedImage.relationshipId} className={`flex items-center space-x-4 p-4 border rounded-lg ${
                             someSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                           }`}>
                             <input
                               type="checkbox"
                               checked={allSelected}
                               ref={(el) => {
                                 if (el) el.indeterminate = someSelected && !allSelected;
                               }}
                               onChange={() => toggleGroupSelection(groupedImage)}
                               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                             />
                             <img
                               src={groupedImage.primaryImage.image_url}
                               alt={groupedImage.primaryImage.alt_text || 'Room type image'}
                               className="w-16 h-16 object-cover rounded"
                               onError={(e) => {
                                 e.currentTarget.src = 'https://via.placeholder.com/64x64?text=Image+Not+Found';
                               }}
                             />
                             <div className="flex-1 min-w-0">
                               <h3 className="text-sm font-medium text-gray-900 truncate">
                                 {groupedImage.relationshipName}
                               </h3>
                               {groupedImage.primaryImage.alt_text && (
                                 <p className="text-xs text-gray-500 truncate">
                                   {groupedImage.primaryImage.alt_text}
                                 </p>
                               )}
                               <p className="text-xs text-gray-500">
                                 {groupedImage.imageCount} image{groupedImage.imageCount > 1 ? 's' : ''} • {new Date(groupedImage.primaryImage.created_at).toLocaleDateString()}
                               </p>
                             </div>
                             <div className="flex items-center space-x-2">
                               {groupedImage.primaryImage.is_primary && (
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                   <Star className="w-3 h-3 mr-1" />
                                   Primary
                                 </span>
                               )}
                               {groupedImage.imageCount > 1 && (
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                   {groupedImage.imageCount} images
                                 </span>
                               )}
                                                                                                <div className="flex items-center space-x-1">
                                   {!groupedImage.primaryImage.is_primary && (
                                     <button
                                       onClick={() => handleSetPrimary(groupedImage.primaryImage)}
                                       className="p-1 text-gray-400 hover:text-yellow-600"
                                       title="Set as primary"
                                     >
                                       <Star className="w-4 h-4" />
                                     </button>
                                   )}
                                   <button
                                     onClick={() => handleEdit(groupedImage.primaryImage)}
                                     className="p-1 text-gray-400 hover:text-blue-600"
                                     title="Edit primary image"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </button>


                                   <button
                                     onClick={() => {
                                       setDeletingImage(groupedImage.primaryImage);
                                       setShowDeleteModal(true);
                                     }}
                                     className="p-1 text-gray-400 hover:text-red-500"
                                     title="Delete primary image"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
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





        {/* Upload Modal */}
        {bulkUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upload Images to Room Type
                </h2>
                <button
                  onClick={() => {
                    setBulkUploadModal(false);
                    setSelectedFiles([]);
                    setPrimaryImageIndex(0);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Room Group - Room Type Relationship *
                   </label>
                   <select
                     value={formData.room_group_room_type_id || ''}
                     onChange={(e) => {
                       const selectedId = Number(e.target.value);
                       setFormData({ ...formData, room_group_room_type_id: selectedId });
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select room group and type relationship</option>
                     {relationships.map(rel => (
                       <option key={rel.id} value={rel.id}>
                         {rel.group_name} - {rel.type_name}
                       </option>
                     ))}
                   </select>
                   {formData.room_group_room_type_id && (
                     <p className="text-xs text-gray-500 mt-1">
                       Selected: {getRelationshipDisplayName(formData.room_group_room_type_id)}
                     </p>
                   )}
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Files *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBulkFileSelect}
                      className="hidden"
                      id="bulk-file-input"
                      required
                    />
                    <label htmlFor="bulk-file-input" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to select multiple images or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: JPG, PNG, GIF, WebP (Max size: 5MB per file)
                      </p>
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Selected Files ({selectedFiles.length}):
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className={`flex items-center justify-between text-sm p-2 rounded ${
                            index === primaryImageIndex ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="primaryImage"
                                checked={index === primaryImageIndex}
                                onChange={() => setPrimaryImageIndex(index)}
                                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className={`truncate ${index === primaryImageIndex ? 'font-medium text-blue-900' : 'text-gray-600'}`}>
                                {file.name}
                              </span>
                              {index === primaryImageIndex && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Alt Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Default description for all images (can be overridden individually)"
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used as the default description. Individual images can be edited later.
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="bulk_is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="bulk_is_primary" className="ml-2 block text-sm text-gray-900">
                    Set selected image as primary
                  </label>
                </div>
                {selectedFiles.length > 0 && formData.is_primary && (
                  <p className="text-xs text-gray-500 mt-1">
                    The selected image will be marked as the primary/featured image for this room type.
                  </p>
                )}

                

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkUploadModal(false);
                      setSelectedFiles([]);
                      setPrimaryImageIndex(0);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkUploading || selectedFiles.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {bulkUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading {selectedFiles.length} images...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {selectedFiles.length} Images
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal && editingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Image
                </h2>
                                 <button
                                        onClick={() => {
                       setEditModal(false);
                       setEditingImage(null);
                       setEditFormData({
                         image_file: undefined,
                         alt_text: '',
                         is_primary: false
                       });
                       setEditSelectedFiles([]);
                       setImagesToDelete([]);
                     }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                  <X className="w-6 h-6" />
                </button>
              </div>

                             <form onSubmit={handleEditSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Room Type
                     </label>
                     <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                       {getRelationshipDisplayName(editingImage.room_group_room_type_id)}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Current Image
                     </label>
                     <img
                       src={editingImage.image_url}
                       alt={editingImage.alt_text || 'Current image'}
                       className="w-full h-48 object-cover rounded-lg border"
                       onError={(e) => {
                         e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                       }}
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     All Images for This Room Type
                   </label>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                     {getImagesForRelationship(editingImage.room_group_room_type_id).map((img) => (
                       <div
                         key={img.image_id}
                         className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                           img.image_id === editingImage.image_id
                             ? 'border-blue-500 ring-2 ring-blue-200'
                             : 'border-gray-200 hover:border-gray-300'
                         }`}
                                                   onClick={() => {
                            setEditingImage(img);
                            setEditFormData({
                              image_file: undefined,
                              alt_text: img.alt_text || '',
                              is_primary: img.is_primary
                            });
                          }}
                       >
                         <img
                           src={img.image_url}
                           alt={img.alt_text || 'Room image'}
                           className="w-full h-24 object-cover"
                           onError={(e) => {
                             e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Image+Not+Found';
                           }}
                         />
                         {img.is_primary && (
                           <div className="absolute top-1 right-1">
                             <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                               <Star className="w-2 h-2" />
                             </span>
                           </div>
                         )}
                         {img.image_id === editingImage.image_id && (
                           <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                             <div className="bg-blue-600 text-white rounded-full p-1">
                               <Check className="w-3 h-3" />
                             </div>
                           </div>
                         )}
                                                   <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImagesToDelete(prev => [...prev, img.image_id]);
                            }}
                            className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete this image"
                          >
                            <X className="w-2 h-2" />
                          </button>
                       </div>
                     ))}
                   </div>
                   <p className="text-xs text-gray-500 mt-1">
                     Click on any image to edit it. The selected image is highlighted in blue. Hover over images to see delete options. Deleted images will be removed when you click "Update Image".
                   </p>
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                         <input
                       type="file"
                       multiple
                       accept="image/*"
                       onChange={handleEditFileSelect}
                       className="hidden"
                       id="edit-file-input"
                     />
                    <label htmlFor="edit-file-input" className="cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to select a new image or drag and drop
                      </p>
                                         <p className="text-xs text-gray-500 mt-1">
                     This will add new images to this room type (not replace the current ones)
                   </p>
                 </label>
               </div>
               {editSelectedFiles.length > 0 && (
                 <div className="mt-4">
                   <h4 className="text-sm font-medium text-gray-700 mb-2">
                     Selected Files ({editSelectedFiles.length}):
                   </h4>
                   <div className="max-h-32 overflow-y-auto space-y-1">
                     {editSelectedFiles.map((file, index) => (
                       <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50">
                         <span className="truncate text-gray-600">
                           {file.name}
                         </span>
                         <span className="text-xs text-gray-500">
                           {(file.size / 1024 / 1024).toFixed(2)} MB
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Alt Text
                   </label>
                   <input
                     type="text"
                     value={editFormData.alt_text}
                     onChange={(e) => setEditFormData({ ...editFormData, alt_text: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Description of the image"
                     maxLength={255}
                   />
                 </div>

                 <div className="flex items-center">
                   <input
                     type="checkbox"
                     id="edit_is_primary"
                     checked={editFormData.is_primary}
                     onChange={(e) => setEditFormData({ ...editFormData, is_primary: e.target.checked })}
                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                   />
                   <label htmlFor="edit_is_primary" className="ml-2 block text-sm text-gray-900">
                     Set as primary image
                   </label>
                 </div>

                

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                                                              onClick={() => {
                       setEditModal(false);
                       setEditingImage(null);
                       setEditFormData({
                         image_file: undefined,
                         alt_text: '',
                         is_primary: false
                       });
                       setEditSelectedFiles([]);
                       setImagesToDelete([]);
                     }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                                     <button
                     type="submit"
                     disabled={editUploading}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                   >
                                           {editUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {imagesToDelete.includes(editingImage?.image_id || 0) ? 'Deleting...' : 
                           editSelectedFiles.length > 0 ? 'Uploading...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          {imagesToDelete.includes(editingImage?.image_id || 0) ? (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Image{imagesToDelete.length > 1 ? ` (${imagesToDelete.length} total)` : ''}
                            </>
                          ) : editSelectedFiles.length > 0 ? (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Add {editSelectedFiles.length} New Image{editSelectedFiles.length > 1 ? 's' : ''}{imagesToDelete.length > 0 ? ` (${imagesToDelete.length} to delete)` : ''}
                            </>
                          ) : (
                            <>
                              <Edit className="w-4 h-4 mr-2" />
                              Update Image{imagesToDelete.length > 0 ? ` (${imagesToDelete.length} to delete)` : ''}
                            </>
                          )}
                        </>
                      )}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
