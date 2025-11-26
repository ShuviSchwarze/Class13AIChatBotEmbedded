import chromadb
from sentence_transformers import SentenceTransformer
from typing import Dict, Any

class SearchService:
    def __init__(self):
        self.chroma_dir = "./chroma_stm32"
        self.collection_name = "stm32_manual_embedding"
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        
        # Initialize model and client
        self.model = SentenceTransformer(self.embedding_model_name)
        self.client = chromadb.PersistentClient(path=self.chroma_dir)
        self.collection = self.client.get_collection(
            name=self.collection_name,
            embedding_function=None,
        )
    
    def search(self, query: str, k: int = 5) -> Dict[str, Any]:
        """
        Search the document collection for relevant chunks.
        
        Args:
            query: Search query text
            k: Number of results to return
            
        Returns:
            Dictionary containing search results
        """
        # Encode query
        query_embedding = self.model.encode(
            query,
            convert_to_numpy=True
        ).astype("float32").tolist()
        
        # Query Chroma
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )
        
        return results
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the document collection."""
        count = self.collection.count()
        
        # Get a sample to determine available sources
        sample = self.collection.get(limit=100)
        sources = set()
        if sample["metadatas"]:
            for meta in sample["metadatas"]:
                if "source" in meta:
                    sources.add(meta["source"])
        
        return {
            "total_chunks": count,
            "collection_name": self.collection_name,
            "embedding_model": self.embedding_model_name,
            "sources": list(sources)
        }
