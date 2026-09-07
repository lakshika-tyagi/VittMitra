"""
Pydantic Data Transfer Objects and Schemas for Grounded AI & RAG Services
"""
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class SectionType(str, Enum):
    OVERVIEW = "overview"
    ELIGIBILITY_CRITERIA = "eligibility_criteria"
    FINANCIAL_BENEFITS = "financial_benefits"
    REQUIRED_DOCUMENTS = "required_documents"
    APPLICATION_STEPS = "application_steps"
    NODAL_AGENCIES = "nodal_agencies"


class CitationSource(BaseModel):
    source_id: Optional[int] = None
    source_name: str
    source_type: str = "OFFICIAL_GUIDELINE"
    official_url: Optional[str] = None
    document_reference: Optional[str] = None
    section_type: Optional[str] = None
    last_verified_at: Optional[str] = None


class GroundedChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User question or query")
    profile_id: Optional[str] = Field(None, description="Optional UUID or ID of active entrepreneur profile")
    scheme_id: Optional[str] = Field(None, description="Optional scheme code (e.g. 'PMEGP') or ID")
    scheme_code: Optional[str] = Field(None, description="Optional scheme code (e.g. 'PMEGP')")
    topic: Optional[str] = Field("general", description="Topic focus: 'general', 'eligibility', 'finance', 'feasibility', 'documents', 'application'")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Pre-computed engine context or profile parameters")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Recent conversation turns (role, content)")
    language: Optional[str] = Field("en", description="User language preference")


class GroundedChatResponse(BaseModel):
    answer: str
    grounded: bool = True
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    sources: List[CitationSource] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "VittMitra AI is an explainable decision-support assistant grounded in official government scheme guidelines. "
        "Deterministic engines remain authoritative for eligibility, financial calculations, and application status."
    )
    evaluated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class GroundedExplainRequest(BaseModel):
    profile_id: Optional[str] = None
    scheme_code: Optional[str] = None
    topic: Optional[str] = Field("general", description="Topic: 'eligibility', 'finance', 'feasibility', 'scheme', 'documents', 'application'")
    custom_query: Optional[str] = None
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    project_cost: Optional[float] = None
    loan_amount: Optional[float] = None
    own_contribution: Optional[float] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    social_category: Optional[str] = None


class KnowledgeChunkItem(BaseModel):
    chunk_id: str
    scheme_id: Optional[int] = None
    scheme_code: Optional[str] = None
    source_id: Optional[int] = None
    source_name: str
    source_type: str
    official_url: Optional[str] = None
    section_type: str
    title: str
    content: str
    token_count: int = 0
    content_hash: str
    embedding: Optional[List[float]] = None
    embedding_model: str = "text-embedding-004"
    chunk_metadata: Dict[str, Any] = Field(default_factory=dict)
    version: str = "1.0"
    last_verified_at: str
