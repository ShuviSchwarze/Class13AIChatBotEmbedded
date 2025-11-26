import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"  # Avoid huggingface complaint
import glob
import pymupdf
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import chromadb


class IndexService:
    def __init__(self):
        self.document_dir = "./document_source"
        self.chroma_dir = "./chroma_stm32"
        self.collection_name = "stm32_manual_embedding"
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.max_chars = 1500
        self.overlap = 200
        
        # Initialize model
        self.model = None
    
    def _load_model(self):
        """Lazy load the embedding model."""
        if self.model is None:
            self.model = SentenceTransformer(self.embedding_model_name)
        return self.model
    
    def _split_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        paras = [p.strip() for p in text.split("\n") if p.strip()]
        chunks, current = [], ""
        for p in paras:
            if len(current) + len(p) + 1 > self.max_chars:
                chunks.append(current)
                # keep some tail as overlap
                current = current[-self.overlap:] + "\n" + p
            else:
                current += "\n" + p if current else p
        if current:
            chunks.append(current)
        return chunks
    
    def _load_and_chunk_pdf(self, pdf_path: str) -> List[Dict]:
        """
        Load a PDF and split each page into overlapping text chunks.
        Returns a list of dicts: {page, text, source}
        """
        doc = pymupdf.open(pdf_path)
        pages = []
        for i, page in enumerate(doc):
            text = page.get_text("text")
            pages.append({"page": i + 1, "text": text})
        
        all_chunks = []
        src_name = os.path.basename(pdf_path)
        for page in pages:
            for chunk in self._split_into_chunks(page["text"]):
                all_chunks.append({
                    "page": page["page"],
                    "text": chunk,
                    "source": src_name,
                })
        
        return all_chunks, len(pages)
    
    def build_index(self) -> Dict[str, Any]:
        """
        Build the search index from all PDFs in the document_source directory.
        
        Returns:
            Dictionary containing build statistics and status
        """
        # Check if document directory exists
        if not os.path.isdir(self.document_dir):
            return {
                "success": False,
                "error": f"Document directory '{self.document_dir}' not found.",
                "message": "Please create the directory and add PDF files."
            }
        
        # Find PDF files
        pdf_files = sorted(glob.glob(os.path.join(self.document_dir, "*.pdf")))
        if not pdf_files:
            return {
                "success": False,
                "error": f"No PDF files found in '{self.document_dir}'.",
                "message": "Please add PDF files to the document_source directory."
            }
        
        # Collect all chunks from all PDFs
        all_texts: List[str] = []
        all_metadatas: List[Dict] = []
        all_ids: List[str] = []
        file_stats = []
        
        chunk_idx = 0
        for pdf_path in pdf_files:
            try:
                chunks, pages = self._load_and_chunk_pdf(pdf_path)
                file_stats.append({
                    "filename": os.path.basename(pdf_path),
                    "pages": pages,
                    "chunks": len(chunks)
                })
                
                for c in chunks:
                    all_texts.append(c["text"])
                    all_metadatas.append({
                        "page": c["page"],
                        "source": c["source"],
                        "file_path": pdf_path,
                    })
                    all_ids.append(f"chunk_{chunk_idx}")
                    chunk_idx += 1
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Error processing {os.path.basename(pdf_path)}: {str(e)}",
                    "files_processed": file_stats
                }
        
        if not all_texts:
            return {
                "success": False,
                "error": "No text chunks collected from PDFs.",
                "message": "PDFs may be empty or unreadable."
            }
        
        # Load embedding model
        try:
            model = self._load_model()
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to load embedding model: {str(e)}"
            }
        
        # Encode document chunks
        try:
            doc_embeddings = model.encode(
                all_texts,
                convert_to_numpy=True,
                show_progress_bar=False
            )
            doc_embeddings = doc_embeddings.astype("float32")
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to encode documents: {str(e)}",
                "files_processed": file_stats
            }
        
        # Create/update Chroma collection
        try:
            client = chromadb.PersistentClient(path=self.chroma_dir)
            collection = client.get_or_create_collection(
                name=self.collection_name,
                embedding_function=None,
            )
            
            # Clear old data if re-indexing
            old_count = 0
            if collection.count() > 0:
                existing = collection.get()
                existing_ids = existing.get("ids", [])
                if existing_ids:
                    old_count = len(existing_ids)
                    collection.delete(ids=existing_ids)
            
            # Add new data
            collection.add(
                ids=all_ids,
                documents=all_texts,
                metadatas=all_metadatas,
                embeddings=doc_embeddings.tolist(),
            )
            
            new_count = collection.count()
            
            return {
                "success": True,
                "message": "Index built successfully",
                "total_chunks": new_count,
                "previous_chunks": old_count,
                "files_processed": file_stats,
                "embedding_model": self.embedding_model_name,
                "collection_name": self.collection_name
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update ChromaDB collection: {str(e)}",
                "files_processed": file_stats
            }
