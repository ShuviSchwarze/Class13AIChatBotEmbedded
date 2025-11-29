# API Services Structure

## Overview
The API integration has been separated into individual controller services for better organization and maintainability.

## Directory Structure

```
WebSite/src/services/
├── api.ts              # Main entry point - re-exports all services
├── fileService.ts      # File upload/download/delete operations
├── indexService.ts     # Search index building and management
├── searchService.ts    # Semantic document search
└── chatService.ts      # AI chat with document context
```

## Quick Import Guide

### Option 1: Import Individual Services (Recommended)
```typescript
import { fileService } from '@/services/fileService';
import { indexService } from '@/services/indexService';
import { searchService } from '@/services/searchService';
import { chatService } from '@/services/chatService';
```

### Option 2: Import Through Main API
```typescript
import api from '@/services/api';

api.files.uploadFile(file);
api.index.buildIndexAsync();
api.search.search(query);
api.chat.chat(message);
```

### Option 3: Import Types and Services
```typescript
import { 
  fileService, 
  indexService, 
  FileInfo, 
  SearchResult 
} from '@/services/api';
```

## Service Responsibilities

### 📁 FileService
- List uploaded documents
- Upload new documents (PDF, TXT, DOCX)
- Delete documents
- Download documents
- Track upload progress

### 🔨 IndexService
- Build search index (async/sync)
- Monitor index build status
- Poll for completion
- Get collection statistics

### 🔍 SearchService
- Semantic search on documents
- Configure result count (k parameter)
- Format results for display

### 💬 ChatService
- Send chat messages with AI
- Maintain conversation history
- Stream responses (if available)
- Use document context for answers

## Component Usage Example

```typescript
import { useState, useEffect } from 'react';
import { fileService, type FileInfo } from '@/services/fileService';

export function DocumentManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { files } = await fileService.listFiles();
      setFiles(files);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await fileService.uploadFile(file, (progress) => {
        console.log(`Progress: ${progress}%`);
      });
      await loadFiles(); // Reload list
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // ... rest of component
}
```

## Configuration

Create `.env` file in WebSite directory:
```env
VITE_API_URL=http://localhost:8000
```

## Backend Requirements

Ensure Python backend is running:
```bash
cd python_be
python run.py
```

Backend should be available at `http://localhost:8000`

## API Documentation

For detailed API documentation, see:
- `API_INTEGRATION.md` - Full integration guide
- `python_be/API_DOCUMENTATION.md` - Backend API reference
