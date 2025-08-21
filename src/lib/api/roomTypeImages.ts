import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RoomTypeImage {
  image_id: number;
  room_group_room_type_id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  created_at: string;
  group_name?: string;
  type_name?: string;
  max_occupancy?: number;
}

export interface CreateRoomTypeImageWithFileData {
  room_group_room_type_id: number;
  image_file: File;
  alt_text?: string;
  is_primary?: boolean;
}

export interface UpdateRoomTypeImageWithFileData {
  image_file?: File;
  alt_text?: string;
  is_primary?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// GET all room type images
export const getRoomTypeImages = async (): Promise<ApiResponse<RoomTypeImage[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-type-images`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room type images');
  }
};

// POST create new room type image with file upload
export const createRoomTypeImageWithFile = async (data: CreateRoomTypeImageWithFileData): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    // First upload to Cloudinary to get the URL
    const { uploadImageToCloudinary } = await import('@/lib/cloudinary');
    const imageUrl = await uploadImageToCloudinary(data.image_file);
    
    // Then save the URL to the database
    const response = await axios.post(`${API_BASE_URL}/room-type-images/upload`, {
      room_group_room_type_id: data.room_group_room_type_id,
      image_url: imageUrl,
      alt_text: data.alt_text,
      is_primary: data.is_primary
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create room type image');
  }
};

// PUT update room type image with file upload
export const updateRoomTypeImageWithFile = async (id: number, data: UpdateRoomTypeImageWithFileData): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    let imageUrl: string | undefined;
    
    // If there's a new file, upload to Cloudinary first
    if (data.image_file) {
      const { uploadImageToCloudinary } = await import('@/lib/cloudinary');
      imageUrl = await uploadImageToCloudinary(data.image_file);
    }
    
    // Then update the database
    const updateData: any = {
      alt_text: data.alt_text,
      is_primary: data.is_primary
    };
    
    if (imageUrl) {
      updateData.image_url = imageUrl;
    }
    
    const response = await axios.put(`${API_BASE_URL}/room-type-images/${id}/upload`, updateData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update room type image');
  }
};

// PUT set image as primary
export const setImageAsPrimary = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/room-type-images/${id}/set-primary`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to set image as primary');
  }
};

// DELETE room type image
export const deleteRoomTypeImage = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/room-type-images/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete room type image');
  }
};
