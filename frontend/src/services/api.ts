import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Image {
  id: number;
  remote_id: number;
  title: string;
  view_count: number;
  download_count: number;
  thumbnail_url: string;
  local_path: string;
  filename: string;
  duration: string;
  image_type: string;
  mtime: number;
  created_at: string;
}

export interface CrawlLog {
  id: number;
  status: string;
  images_found: number;
  images_downloaded: number;
  error_message: string;
  created_at: string;
}

export const getImages = async (page: number = 1, limit: number = 20) => {
  const response = await api.get(`/api/images?page=${page}&limit=${limit}`);
  return response.data;
};

export const login = async (formData: FormData) => {
  const response = await api.post('/token', formData);
  return response.data;
};

export const triggerCrawl = async () => {
  const response = await api.post('/api/crawl');
  return response.data;
};

export const getLogs = async () => {
  const response = await api.get('/api/logs');
  return response.data;
};

export const deleteImage = async (id: number) => {
  const response = await api.delete(`/api/images/${id}`);
  return response.data;
};

export const getImageUrl = (localPath: string) => {
  return `${API_URL}/images/${localPath}`;
};
