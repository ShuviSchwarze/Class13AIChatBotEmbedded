// File Management Service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface FileInfo {
  filename: string;
  filepath: string;
  size: number;
  extension: string;
}

export interface FileListResponse {
  files: FileInfo[];
  total_files: number;
}

export interface UploadResponse {
  message: string;
  filename: string;
  filepath: string;
  size: number;
}

export interface DeleteResponse {
  message: string;
  filename: string;
}

/**
 * File Management Controller
 * Handles all file-related API operations
 */
class FileService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get list of all uploaded files
   * GET /api/v1/files
   */
  async listFiles(): Promise<FileListResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/files`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to fetch files: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Upload a file to the server
   * POST /api/v1/files/upload
   * 
   * @param file - File to upload (PDF, TXT, DOCX, DOC)
   * @param onProgress - Optional callback for upload progress (0-100)
   */
  async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || `Upload failed: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${this.baseUrl}/api/v1/files/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Delete a file from the server
   * DELETE /api/v1/files/{filename}
   * 
   * @param filename - Name of the file to delete
   */
  async deleteFile(filename: string): Promise<DeleteResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/files/${encodeURIComponent(filename)}`, 
      {
        method: 'DELETE',
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to delete file: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get download URL for a file
   * 
   * @param filename - Name of the file
   * @returns Full URL to download the file
   */
  getDownloadUrl(filename: string): string {
    return `${this.baseUrl}/api/v1/files/download/${encodeURIComponent(filename)}`;
  }

  /**
   * Download a file (triggers browser download)
   * GET /api/v1/files/download/{filename}
   * 
   * @param filename - Name of the file to download
   */
  async downloadFile(filename: string): Promise<void> {
    const url = this.getDownloadUrl(filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
export const fileService = new FileService();
export default fileService;
