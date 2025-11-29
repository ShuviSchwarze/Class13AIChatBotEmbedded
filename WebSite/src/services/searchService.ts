// Search Service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SearchResult {
  id: string;
  text: string;
  page?: number;
  source?: string;
  score: number;
}

export interface SearchRequest {
  query: string;
  k?: number; // Number of results (1-20, default: 5)
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total_results: number;
}

/**
 * Search Controller
 * Handles semantic search operations
 */
class SearchService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search documentation
   * POST /api/v1/search
   * 
   * Perform semantic search on the indexed documents.
   * 
   * @param query - Search query text
   * @param k - Number of results to return (1-20, default: 5)
   */
  async search(query: string, k: number = 5): Promise<SearchResponse> {
    const request: SearchRequest = {
      query,
      k: Math.min(Math.max(k, 1), 20), // Clamp between 1 and 20
    };

    const response = await fetch(`${this.baseUrl}/api/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Search failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Format search results for display
   * 
   * @param results - Search results to format
   * @returns Formatted text representation
   */
  formatResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    return results.map((result, index) => {
      const source = result.source ? ` (${result.source}` : '';
      const page = result.page ? `, page ${result.page})` : result.source ? ')' : '';
      const score = ` [Score: ${result.score.toFixed(3)}]`;
      
      return `${index + 1}. ${result.text}${source}${page}${score}`;
    }).join('\n\n');
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;
