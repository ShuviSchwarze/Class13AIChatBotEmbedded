from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from services.search_service import SearchService

search_router = APIRouter()
search_service = SearchService()

class SearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        description="Search query text",
        examples=["Low-power mode wakeup timings", "GPIO configuration", "SPI communication"]
    )
    k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of results to return",
        examples=[5]
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "Low-power mode wakeup timings",
                    "k": 5
                },
                {
                    "query": "How to configure GPIO pins",
                    "k": 3
                }
            ]
        }
    }

class SearchResult(BaseModel):
    id: Optional[str] = Field(None, description="Unique identifier for the document chunk")
    text: str = Field(..., description="The text content of the search result")
    page: int = Field(..., description="Page number in the source document")
    source: str = Field(..., description="Source document filename")
    score: float = Field(..., description="Similarity score (lower is better)")

class SearchResponse(BaseModel):
    query: str = Field(..., description="The original search query")
    results: List[SearchResult] = Field(..., description="List of search results")
    total_results: int = Field(..., description="Total number of results returned")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "Low-power mode wakeup timings",
                    "results": [
                        {
                            "id": "chunk_123",
                            "text": "The wakeup time from Stop mode is...",
                            "page": 45,
                            "source": "stm32_manual.pdf",
                            "score": 0.234
                        }
                    ],
                    "total_results": 1
                }
            ]
        }
    }

@search_router.post(
    "/search",
    response_model=SearchResponse,
    summary="Search STM32 Documentation",
    description="Perform semantic search on STM32 manual documentation using vector embeddings",
    responses={
        200: {
            "description": "Successful search operation",
            "content": {
                "application/json": {
                    "example": {
                        "query": "Low-power mode wakeup timings",
                        "results": [
                            {
                                "id": "chunk_123",
                                "text": "The wakeup time from Stop mode depends on several factors...",
                                "page": 45,
                                "source": "stm32_manual.pdf",
                                "score": 0.234
                            }
                        ],
                        "total_results": 1
                    }
                }
            },
        },
        500: {"description": "Internal server error during search"},
    },
)
async def search_manual(request: SearchRequest):
    """
    Search the STM32 manual documentation using vector similarity search.
    
    This endpoint uses sentence transformers to convert your query into a vector embedding,
    then finds the most similar document chunks using ChromaDB.
    
    **Parameters:**
    - **query**: Natural language search query (e.g., "How to configure GPIO pins")
    - **k**: Number of top results to return (1-20, default: 5)
    
    **Returns:**
    - List of relevant document chunks with similarity scores
    - Lower scores indicate higher similarity
    """
    try:
        results = search_service.search(request.query, request.k)
        
        search_results = []
        if results["documents"] and len(results["documents"][0]) > 0:
            ids = results.get("ids", [[]])[0] if "ids" in results else [None] * len(results["documents"][0])
            
            for doc_id, doc, meta, dist in zip(
                ids,
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                search_results.append(SearchResult(
                    id=doc_id,
                    text=doc,
                    page=meta.get("page", 0),
                    source=meta.get("source", ""),
                    score=float(dist)
                ))
        
        return SearchResponse(
            query=request.query,
            results=search_results,
            total_results=len(search_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@search_router.get(
    "/collection/stats",
    summary="Get Collection Statistics",
    description="Retrieve information about the indexed document collection",
    responses={
        200: {
            "description": "Collection statistics",
            "content": {
                "application/json": {
                    "example": {
                        "total_chunks": 1250,
                        "collection_name": "stm32_manual_embedding",
                        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
                        "sources": ["stm32_manual.pdf"]
                    }
                }
            },
        },
        500: {"description": "Error retrieving statistics"},
    },
)
async def get_collection_stats():
    """
    Get statistics about the document collection.
    
    Returns information about:
    - Total number of document chunks indexed
    - Collection name
    - Embedding model used
    - List of source documents
    """
    try:
        stats = search_service.get_collection_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")
