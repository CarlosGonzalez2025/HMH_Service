/**
 * File Upload Component
 * Uses real Firebase Storage integration
 */

import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, validateFile, formatFileSize } from '../utils/storage';

interface FileUploadProps {
  path: string; // Storage path (e.g., 'activities/123/supports')
  onUploadComplete?: (url: string, name: string) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  path,
  onUploadComplete,
  onUploadError,
  multiple = false,
  maxFiles = 5
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!multiple && selectedFiles.length > 1) {
      setErrors(['Solo puedes subir un archivo a la vez']);
      return;
    }

    if (files.length + selectedFiles.length > maxFiles) {
      setErrors([`Máximo ${maxFiles} archivos permitidos`]);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        validationErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors([]);
    }

    setFiles([...files, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrors(['No hay archivos para subir']);
      return;
    }

    setUploading(true);
    setErrors([]);
    const newUploadedFiles: { name: string; url: string }[] = [];
    const uploadErrors: string[] = [];

    for (const file of files) {
      const result = await uploadFile(file, path);

      if (result.success && result.url && result.name) {
        newUploadedFiles.push({ name: result.name, url: result.url });

        if (onUploadComplete) {
          onUploadComplete(result.url, result.name);
        }
      } else {
        uploadErrors.push(`${file.name}: ${result.error}`);

        if (onUploadError && result.error) {
          onUploadError(result.error);
        }
      }
    }

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);

    if (uploadErrors.length > 0) {
      setErrors(uploadErrors);
    } else {
      setFiles([]); // Clear file list after successful upload
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600 font-medium mb-2">
            Click para seleccionar archivos
          </p>
          <p className="text-slate-500 text-sm">
            PDF, Word, Excel, Imágenes o ZIP (máx. 10MB)
          </p>
          {multiple && (
            <p className="text-slate-400 text-xs mt-1">
              Puedes seleccionar hasta {maxFiles} archivos
            </p>
          )}
        </label>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Archivos seleccionados ({files.length})
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <File className="h-5 w-5 text-slate-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Subir {files.length} archivo{files.length > 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Archivos subidos ({uploadedFiles.length})
          </p>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-700 truncate">
                    {file.name}
                  </p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver archivo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
