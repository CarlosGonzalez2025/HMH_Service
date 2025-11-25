/**
 * Firebase Storage Integration
 * Real file upload and management
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { auth } from '../firebaseConfig';

const storage = getStorage();

// ============================================
// FILE UPLOAD
// ============================================

export interface UploadResult {
  success: boolean;
  url?: string;
  name?: string;
  error?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - File object to upload
 * @param path - Storage path (e.g., 'activities/123/supports')
 * @param fileName - Optional custom file name
 */
export const uploadFile = async (
  file: File,
  path: string,
  fileName?: string
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(fileName || file.name);
    const fullPath = `${path}/${timestamp}_${sanitizedName}`;

    // Create reference
    const storageRef = ref(storage, fullPath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      name: sanitizedName
    };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message || 'Error al subir el archivo'
    };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  path: string
): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => uploadFile(file, path));
  return Promise.all(uploadPromises);
};

// ============================================
// FILE VALIDATION
// ============================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): ValidationResult => {
  // Check file exists
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'El archivo excede el tamaño máximo de 10MB' };
  }

  // Check file type
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Archives
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Use PDF, Word, Excel, imágenes o archivos ZIP'
    };
  }

  return { valid: true };
};

// ============================================
// FILE MANAGEMENT
// ============================================

/**
 * Delete a file from storage
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * List all files in a path
 */
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);

    const urls = await Promise.all(
      result.items.map(item => getDownloadURL(item))
    );

    return urls;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

// ============================================
// HELPERS
// ============================================

/**
 * Sanitize file name for storage
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .replace(/_{2,}/g, '_');
};

/**
 * Get file extension
 */
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate storage path for activity supports
 */
export const getActivitySupportsPath = (tenantId: string, activityId: string): string => {
  return `tenants/${tenantId}/activities/${activityId}/supports`;
};

/**
 * Generate storage path for client documents
 */
export const getClientDocumentsPath = (tenantId: string, clientId: string): string => {
  return `tenants/${tenantId}/clients/${clientId}/documents`;
};

/**
 * Generate storage path for provider documents
 */
export const getProviderDocumentsPath = (tenantId: string, providerId: string): string => {
  return `tenants/${tenantId}/providers/${providerId}/documents`;
};

// ============================================
// REACT HOOKS
// ============================================

/**
 * Hook for file upload with progress
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const upload = async (file: File, path: string): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const result = await uploadFile(file, path);

    if (!result.success) {
      setError(result.error || 'Error al subir archivo');
    }

    setUploading(false);
    setProgress(100);

    return result;
  };

  return { upload, uploading, progress, error };
};

// Import React for hooks
import React from 'react';
