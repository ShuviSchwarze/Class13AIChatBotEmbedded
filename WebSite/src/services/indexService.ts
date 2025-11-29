// Index Management Service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface IndexBuildResponse {
  success: boolean;
  message: string;
  total_chunks?: number;
  previous_chunks?: number;
  files_processed?: Array<{
    filename: string;
    pages: number;
    chunks: number;
  }>;
  embedding_model?: string;
  collection_name?: string;
}

export interface IndexStatusResponse {
  is_running: boolean;
  last_result?: IndexBuildResponse;
  progress?: string | null;
}

export interface CollectionStatsResponse {
  total_chunks: number;
  collection_name: string;
  embedding_model: string;
  sources: string[];
}

/**
 * Index Management Controller
 * Handles all search index related operations
 */
class IndexService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build search index (asynchronous)
   * POST /api/v1/index/build
   * 
   * Starts the indexing process in the background.
   * Use getStatus() to check progress.
   */
  async buildIndexAsync(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/index/build`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to start index build: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Build search index (synchronous)
   * POST /api/v1/index/build/sync
   * 
   * Builds the index and waits for completion.
   * This may take a long time for large document sets.
   */
  async buildIndexSync(): Promise<IndexBuildResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/index/build/sync`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to build index: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get index build status
   * GET /api/v1/index/status
   * 
   * Check if indexing is running and get the last result.
   */
  async getStatus(): Promise<IndexStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/index/status`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to get index status: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get collection statistics
   * GET /api/v1/collection/stats
   * 
   * Get information about the indexed document collection.
   */
  async getCollectionStats(): Promise<CollectionStatsResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/collection/stats`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to get collection stats: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Poll index status until completion
   * 
   * @param interval - Polling interval in milliseconds (default: 2000)
   * @param onProgress - Optional callback for progress updates
   * @returns Final index build result
   */
  async pollUntilComplete(
    interval: number = 2000,
    onProgress?: (status: IndexStatusResponse) => void
  ): Promise<IndexBuildResponse> {
    return new Promise((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          const status = await this.getStatus();
          
          if (onProgress) {
            onProgress(status);
          }
          
          if (!status.is_running) {
            clearInterval(poll);
            
            if (status.last_result?.success) {
              resolve(status.last_result);
            } else {
              reject(new Error(status.last_result?.message || 'Index build failed'));
            }
          }
        } catch (error) {
          clearInterval(poll);
          reject(error);
        }
      }, interval);
    });
  }
}

// Export singleton instance
export const indexService = new IndexService();
export default indexService;
