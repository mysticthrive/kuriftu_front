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

export interface CreateRoomTypeImageData {
  room_group_room_type_id: number;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
}

export interface UpdateRoomTypeImageData extends CreateRoomTypeImageData {}

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

// GET room type image by ID
export const getRoomTypeImageById = async (id: number): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-type-images/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room type image');
  }
};

// GET images by room group room type ID
export const getRoomTypeImagesByRelationship = async (roomGroupRoomTypeId: number): Promise<ApiResponse<RoomTypeImage[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-type-images/relationship/${roomGroupRoomTypeId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room type images by relationship');
  }
};

// GET primary images for all relationships
export const getPrimaryRoomTypeImages = async (): Promise<ApiResponse<RoomTypeImage[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/room-type-images/primary/all`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch primary room type images');
  }
};

// POST create new room type image with file upload
export const createRoomTypeImageWithFile = async (data: CreateRoomTypeImageWithFileData): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    const formData = new FormData();
    formData.append('room_group_room_type_id', data.room_group_room_type_id.toString());
    formData.append('image_file', data.image_file);
    if (data.alt_text) {
      formData.append('alt_text', data.alt_text);
    }
    if (data.is_primary !== undefined) {
      formData.append('is_primary', data.is_primary.toString());
    }

    const response = await axios.post(`${API_BASE_URL}/room-type-images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create room type image');
  }
};

// POST create new room type image (legacy - for URL)
export const createRoomTypeImage = async (data: CreateRoomTypeImageData): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/room-type-images`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create room type image');
  }
};

// PUT update room type image with file upload
export const updateRoomTypeImageWithFile = async (id: number, data: UpdateRoomTypeImageWithFileData): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    const formData = new FormData();
    if (data.image_file) {
      formData.append('image_file', data.image_file);
    }
    if (data.alt_text !== undefined) {
      formData.append('alt_text', data.alt_text);
    }
    if (data.is_primary !== undefined) {
      formData.append('is_primary', data.is_primary.toString());
    }

    const response = await axios.put(`${API_BASE_URL}/room-type-images/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update room type image');
  }
};

// PUT update room type image (legacy - for URL)
export const updateRoomTypeImage = async (id: number, data: UpdateRoomTypeImageData): Promise<ApiResponse<RoomTypeImage>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/room-type-images/${id}`, data);
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
