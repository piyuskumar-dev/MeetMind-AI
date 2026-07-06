import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Test connection
  getRoot: async () => {
    const res = await client.get('/');
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
    });
    return res.data; // returns { job_id }
  },

  // Base API URL utility
  baseUrl: API_BASE_URL,
};
