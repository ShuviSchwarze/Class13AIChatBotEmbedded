/**
 * Main API Service - Re-exports all service modules
 * 
 * This is the main entry point for API operations.
 * Import individual services for better tree-shaking and organization.
 */

// Export all services
export * from './fileService';
export * from './indexService';
export * from './searchService';
export * from './chatService';

// Import services for convenience
import { fileService } from './fileService';
import { indexService } from './indexService';
import { searchService } from './searchService';
import { chatService } from './chatService';

/**
 * Combined API service object
 * Provides access to all API controllers in one place
 */
export const api = {
  files: fileService,
  index: indexService,
  search: searchService,
  chat: chatService,
};

export default api;
