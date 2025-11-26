# API Documentation

## Overview

This API provides endpoints for managing documents, building search indexes, and performing semantic search on STM32 documentation.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, no authentication is required (configure as needed for production).

## API Endpoints

### 1. Index Management

#### Build Index (Asynchronous)
Build the search index in the background.

**Endpoint:** `POST /api/v1/index/build`

**Response:**
```json
{
  "success": true,
  "message": "Indexing started in background. Use /index/status to check progress."
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/index/build
```

---

#### Build Index (Synchronous)
Build the search index and wait for completion.

**Endpoint:** `POST /api/v1/index/build/sync`

**Response:**
```json
{
  "success": true,
  "message": "Index built successfully",
  "total_chunks": 1250,
  "previous_chunks": 800,
  "files_processed": [
    {
      "filename": "stm32_manual.pdf",
      "pages": 150,
      "chunks": 1250
    }
  ],
  "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
  "collection_name": "stm32_manual_embedding"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/index/build/sync
```

---

#### Get Index Status
Check the status of the indexing operation.

**Endpoint:** `GET /api/v1/index/status`

**Response:**
```json
{
  "is_running": false,
  "last_result": {
    "success": true,
    "message": "Index built successfully",
    "total_chunks": 1250
  },
  "progress": null
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/index/status
```

---

### 2. Search Operations

#### Search Documentation
Perform semantic search on the indexed documents.

**Endpoint:** `POST /api/v1/search`

**Request Body:**
```json
{
  "query": "Low-power mode wakeup timings",
  "k": 5
}
```

**Parameters:**
- `query` (string, required): Search query text
- `k` (integer, optional): Number of results to return (1-20, default: 5)

**Response:**
```json
{
  "query": "Low-power mode wakeup timings",
  "results": [
    {
      "id": "chunk_123",
      "text": "The wakeup time from Stop mode depends on...",
      "page": 45,
      "source": "stm32_manual.pdf",
      "score": 0.234
    }
  ],
  "total_results": 1
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Low-power mode wakeup timings", "k": 5}'
```

---

#### Get Collection Statistics
Get information about the indexed document collection.

**Endpoint:** `GET /api/v1/collection/stats`

**Response:**
```json
{
  "total_chunks": 1250,
  "collection_name": "stm32_manual_embedding",
  "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
  "sources": ["stm32_manual.pdf"]
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/collection/stats
```

---

### 3. File Management

#### List Files
Get a list of all files in the document_source directory.

**Endpoint:** `GET /api/v1/files`

**Response:**
```json
{
  "files": [
    {
      "filename": "stm32_manual.pdf",
      "filepath": "/api/v1/files/download/stm32_manual.pdf",
      "size": 2048576,
      "extension": ".pdf"
    }
  ],
  "total_files": 1
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/files
```

---

#### Upload File
Upload a PDF file to the document_source directory.

**Endpoint:** `POST /api/v1/files/upload`

**Request:** Multipart form data with file

**Supported file types:** PDF (.pdf), Text (.txt), Word (.docx, .doc)

**Maximum file size:** 100MB

**Response:**
```json
{
  "message": "File uploaded successfully",
  "filename": "stm32_manual.pdf",
  "filepath": "/api/v1/files/download/stm32_manual.pdf",
  "size": 2048576
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/files/upload \
  -F "file=@/path/to/stm32_manual.pdf"
```

---

#### Download File
Download a file from the document_source directory.

**Endpoint:** `GET /api/v1/files/download/{filename}`

**Example:**
```bash
curl -O http://localhost:8000/api/v1/files/download/stm32_manual.pdf
```

---

#### Delete File
Delete a file from the document_source directory.

**Endpoint:** `DELETE /api/v1/files/{filename}`

**Response:**
```json
{
  "message": "File deleted successfully",
  "filename": "stm32_manual.pdf"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/v1/files/stm32_manual.pdf
```

---

### 4. System Endpoints

#### Health Check
Check if the API is running and healthy.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "STM32 Manual Search API",
  "version": "1.0.0"
}
```

**Example:**
```bash
curl http://localhost:8000/health
```

---

#### API Root
Get basic API information and links to documentation.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "STM32 Manual Search API",
  "version": "1.0.0",
  "docs": "/docs",
  "redoc": "/redoc",
  "openapi": "/openapi.json"
}
```

**Example:**
```bash
curl http://localhost:8000/
```

---

## Interactive Documentation

Visit the following URLs for interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Complete Workflow Example

### 1. Upload a Document
```bash
curl -X POST http://localhost:8000/api/v1/files/upload \
  -F "file=@stm32_reference_manual.pdf"
```

### 2. Build the Index
```bash
# Asynchronous (recommended for large documents)
curl -X POST http://localhost:8000/api/v1/index/build

# Check status
curl http://localhost:8000/api/v1/index/status

# OR Synchronous (waits for completion)
curl -X POST http://localhost:8000/api/v1/index/build/sync
```

### 3. Search the Documentation
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to configure GPIO pins for alternate functions",
    "k": 3
  }'
```

### 4. View Collection Statistics
```bash
curl http://localhost:8000/api/v1/collection/stats
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (e.g., indexing already in progress)
- `413`: Payload Too Large (file size exceeds limit)
- `500`: Internal Server Error

Error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

## Notes

- After uploading new files or deleting existing files, you must rebuild the index for changes to take effect in search results.
- The asynchronous build endpoint (`/index/build`) is recommended for production use as it doesn't block the API.
- Lower similarity scores indicate better matches in search results.
- Filenames are automatically sanitized to remove special characters and spaces.
