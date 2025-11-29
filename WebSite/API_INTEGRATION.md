# API Integration Documentation

This document describes the API integration structure for the STM32 Manual Search chatbot application.

## Architecture Overview

The API integration is organized into separate service controllers, each handling a specific domain of functionality:

```
src/services/
├── api.ts              # Main API entry point (re-exports all services)
├── fileService.ts      # File management operations
├── indexService.ts     # Search index management
├── searchService.ts    # Document search operations
└── chatService.ts      # AI chat functionality
```

## Service Controllers

### 1. File Service (`fileService.ts`)

Handles all file management operations for document uploads.

**Key Methods:**
- `listFiles()` - Get list of all uploaded files
- `uploadFile(file, onProgress?)` - Upload a document with progress tracking
- `deleteFile(filename)` - Delete a file from the server
- `downloadFile(filename)` - Download a file (triggers browser download)
- `getDownloadUrl(filename)` - Get the download URL for a file

**Supported File Types:**
- PDF (.pdf)
- Text (.txt)
- Word Documents (.doc, .docx)

**Example Usage:**
```typescript
import { fileService } from '@/services/fileService';

// List all files
const { files, total_files } = await fileService.listFiles();

// Upload with progress tracking
await fileService.uploadFile(file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});

// Delete a file
await fileService.deleteFile('document.pdf');

// Download a file
await fileService.downloadFile('document.pdf');
```

---

### 2. Index Service (`indexService.ts`)

Manages the search index building and status monitoring.

**Key Methods:**
- `buildIndexAsync()` - Start index build in background
- `buildIndexSync()` - Build index and wait for completion
- `getStatus()` - Check index build status
- `getCollectionStats()` - Get indexed collection statistics
- `pollUntilComplete(interval?, onProgress?)` - Poll status until completion

**Example Usage:**
```typescript
import { indexService } from '@/services/indexService';

// Start async build
await indexService.buildIndexAsync();

// Poll for completion
const result = await indexService.pollUntilComplete(2000, (status) => {
  console.log('Index status:', status);
});

// Get collection stats
const stats = await indexService.getCollectionStats();
console.log(`Total chunks: ${stats.total_chunks}`);
```

---

### 3. Search Service (`searchService.ts`)

Performs semantic search on indexed documents.

**Key Methods:**
- `search(query, k?)` - Search documentation (k = number of results, default: 5)
- `formatResults(results)` - Format search results for display

**Example Usage:**
```typescript
import { searchService } from '@/services/searchService';

// Search with 10 results
const response = await searchService.search('GPIO configuration', 10);

console.log(`Found ${response.total_results} results`);
response.results.forEach(result => {
  console.log(`${result.text} (score: ${result.score})`);
});

// Format results for display
const formatted = searchService.formatResults(response.results);
```

---

### 4. Chat Service (`chatService.ts`)

Handles AI chat interactions with document context.

**Key Methods:**
- `chat(message, options?)` - Send a chat message
- `chatStream(message, options?)` - Send chat with streaming response
- `createConversationHistory()` - Create new conversation history
- `addToHistory(history, role, content)` - Add message to history

**Example Usage:**
```typescript
import { chatService } from '@/services/chatService';

// Simple chat
const response = await chatService.chat('What is GPIO?', {
  useContext: true,
  k: 5
});
console.log(response.response);

// Chat with conversation history
const history = chatService.createConversationHistory();
const updatedHistory = chatService.addToHistory(
  history, 
  'user', 
  'What is GPIO?'
);

const response = await chatService.chat('Tell me more', {
  conversationHistory: updatedHistory,
  temperature: 0.7,
  maxTokens: 500
});

// Streaming chat
await chatService.chatStream('Explain UART', {
  onToken: (token) => console.log(token),
  onComplete: (full) => console.log('Complete:', full),
  onError: (error) => console.error(error)
});
```

---

## Using the Combined API

You can also import all services through the main API entry point:

```typescript
import api from '@/services/api';

// Access services through api object
await api.files.listFiles();
await api.index.buildIndexAsync();
await api.search.search('GPIO', 5);
await api.chat.chat('What is UART?');
```

Or import individual services:

```typescript
import { fileService, indexService, searchService, chatService } from '@/services/api';
```

---

## Configuration

### Environment Variables

Create a `.env` file in the `WebSite` directory:

```env
VITE_API_URL=http://localhost:8000
```

The default URL is `http://localhost:8000` if not specified.

---

## API Endpoints Reference

### File Management
- `GET /api/v1/files` - List all files
- `POST /api/v1/files/upload` - Upload file
- `DELETE /api/v1/files/{filename}` - Delete file
- `GET /api/v1/files/download/{filename}` - Download file

### Index Management
- `POST /api/v1/index/build` - Build index (async)
- `POST /api/v1/index/build/sync` - Build index (sync)
- `GET /api/v1/index/status` - Get index status
- `GET /api/v1/collection/stats` - Get collection statistics

### Search
- `POST /api/v1/search` - Search documents

### Chat
- `POST /api/v1/chat/chat` - Chat with AI
- `POST /api/v1/chat/stream` - Chat with streaming

---

## Error Handling

All service methods throw errors that can be caught and handled:

```typescript
try {
  await fileService.uploadFile(file);
} catch (error) {
  if (error instanceof Error) {
    console.error('Upload failed:', error.message);
    // Display error to user
  }
}
```

---

## Type Safety

All services are fully typed with TypeScript interfaces:

```typescript
import type { 
  FileInfo, 
  FileListResponse,
  SearchResult,
  ChatMessage 
} from '@/services/api';
```

---

## Component Integration Example

```typescript
import { useState, useEffect } from 'react';
import { fileService, FileInfo } from '@/services/fileService';

function MyComponent() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fileService.listFiles();
      setFiles(response.files);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

## Best Practices

1. **Use individual service imports** for better tree-shaking
2. **Handle errors gracefully** with try-catch blocks
3. **Show loading states** during async operations
4. **Provide user feedback** for upload progress
5. **Validate file types** before uploading
6. **Clean up** resources (e.g., file input values)
7. **Use TypeScript types** for type safety

---

## Testing

Example test setup:

```typescript
import { fileService } from '@/services/fileService';

// Mock fetch for testing
global.fetch = jest.fn();

test('should list files', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ files: [], total_files: 0 })
  });

  const result = await fileService.listFiles();
  expect(result.total_files).toBe(0);
});
```

---

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the backend has proper CORS configuration:

```python
# In main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Connection Refused
Ensure the Python backend is running on port 8000:

```bash
cd python_be
python run.py
```

### TypeScript Errors
If you get environment variable errors, ensure `vite-env.d.ts` is included in your `tsconfig.json`.
