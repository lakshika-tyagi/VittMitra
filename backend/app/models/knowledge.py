"""
RAG Knowledge Base Database Models

Defines the database schema for chunked scheme guidelines, official sources,
embedding vectors, and versioned knowledge retrieval metadata.
"""
from typing import Optional, Any, Dict, List
from datetime import datetime, timezone
from sqlalchemy import (
    Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class KnowledgeChunk(Base, TimestampMixin):
    """
    Structured, chunked knowledge document from verified government guidelines
    used for semantic RAG retrieval and source-grounded LLM synthesis.
    """
    __tablename__ = "knowledge_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chunk_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    # Associated Scheme (Optional for general MSME policy chunks)
    scheme_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=True, index=True)
    scheme_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    
    # Traceability to official SchemeSource
    source_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("scheme_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="OFFICIAL_GUIDELINE", nullable=False)
    official_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Semantic categorization
    section_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # overview, eligibility_criteria, financial_benefits, required_documents, application_steps, nodal_agencies
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Technical & vector indexing
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False) # SHA-256
    embedding: Mapped[Optional[List[float]]] = mapped_column(JSON, nullable=True) # Dense vector representation
    embedding_model: Mapped[str] = mapped_column(String(100), default="text-embedding-004", nullable=False)
    
    # Granular metadata (keywords, sub-sections, applicability tags)
    chunk_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    last_verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    scheme: Mapped[Optional["Scheme"]] = relationship("Scheme", foreign_keys=[scheme_id])
    source: Mapped[Optional["SchemeSource"]] = relationship("SchemeSource", foreign_keys=[source_id])
