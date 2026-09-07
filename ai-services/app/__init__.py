"""
VittMitra AI Services Application Package
"""
__version__ = "0.1.0"

from app.schemas.ai import (
    ConfidenceLevel,
    SectionType,
    CitationSource,
    GroundedChatRequest,
    GroundedChatResponse,
    GroundedExplainRequest,
    KnowledgeChunkItem,
)
from app.rag.chunker import SchemeKnowledgeChunker
from app.rag.embeddings import EmbeddingService, cosine_similarity
from app.retrieval.retriever import HybridRAGRetriever
from app.prompts.templates import SYSTEM_GROUNDING_PROMPT, build_grounded_prompt
from app.gemini.client import GeminiClient
from app.orchestration.orchestrator import AIOrchestrator

__all__ = [
    "ConfidenceLevel",
    "SectionType",
    "CitationSource",
    "GroundedChatRequest",
    "GroundedChatResponse",
    "GroundedExplainRequest",
    "KnowledgeChunkItem",
    "SchemeKnowledgeChunker",
    "EmbeddingService",
    "cosine_similarity",
    "HybridRAGRetriever",
    "SYSTEM_GROUNDING_PROMPT",
    "build_grounded_prompt",
    "GeminiClient",
    "AIOrchestrator",
]
