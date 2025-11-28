"""
UNS-Shatak Configuration
社宅管理システム (Apartment Management System)
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "UNS-Shatak"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "社宅管理システム (Apartment Management System)"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://shatak_admin:shatak_secret_2024@localhost:5433/uns_shatak"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6380/0"
    
    # Security
    SECRET_KEY: str = "uns-shatak-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3100,http://localhost:3101"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings"""
    return Settings()


settings = get_settings()
