from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    app_name: str = "STM32 Manual Search API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # ChromaDB Settings
    chroma_dir: str = "./chroma_stm32"
    collection_name: str = "stm32_manual_embedding"
    
    # Embedding Model Settings
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # CORS Settings
    cors_origins: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
