import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './authenticatedApi';

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
  return await authenticatedGet<ApiResponse<RoomTypeImage[]>>('/room-type-images');
};

// POST create new room type image with file upload
export const createRoomTypeImageWithFile = async (data: CreateRoomTypeImageWithFileData): Promise<ApiResponse<RoomTypeImage>> => {
  // First upload to Cloudinary to get the URL
  const { uploadImageToCloudinary } = await import('@/lib/cloudinary');
  const imageUrl = await uploadImageToCloudinary(data.image_file);
  
  // Then save the URL to the database
  return await authenticatedPost<ApiResponse<RoomTypeImage>>('/room-type-images/upload', {
    room_group_room_type_id: data.room_group_room_type_id,
    image_url: imageUrl,
    alt_text: data.alt_text,
    is_primary: data.is_primary
  });
};

// PUT update room type image with file upload
export const updateRoomTypeImageWithFile = async (id: number, data: UpdateRoomTypeImageWithFileData): Promise<ApiResponse<RoomTypeImage>> => {
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
  
  return await authenticatedPut<ApiResponse<RoomTypeImage>>(`/room-type-images/${id}/upload`, updateData);
};

// PUT set image as primary
export const setImageAsPrimary = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedPut<ApiResponse<void>>(`/room-type-images/${id}/set-primary`);
};

// DELETE room type image
export const deleteRoomTypeImage = async (id: number): Promise<ApiResponse<void>> => {
  return await authenticatedDelete<ApiResponse<void>>(`/room-type-images/${id}`);
};
