import axios from 'axios';

// Base API configuration
const envUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = (envUrl && typeof envUrl === 'string' && envUrl.trim())
  ? envUrl.trim().replace(/\/+$/, '')
  : 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const api = {
  // Test connection & warmup backend
  getRoot: async () => {
    const res = await client.get('/warmup');
    return res.data;
  },

  warmup: async () => {
    const res = await client.get('/warmup');
    return res.data;
  },

  // Start video processing job with file upload
  processVideo: async (file, language, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    const res = await client.post('/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      timeout: 300000, // 5 min timeout for large file uploads
    });
    return res.data; // returns { job_id }
  },

  // Base API URL utility
  baseUrl: API_BASE_URL,
};

