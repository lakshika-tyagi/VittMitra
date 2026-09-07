"""
Hybrid Semantic & Metadata-Filtered RAG Retriever

Executes similarity search over verified scheme knowledge chunks with
scheme-level isolation, section weighting, and relevance thresholding.
"""
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.ai import KnowledgeChunkItem, CitationSource, SectionType
from app.services.ai.embeddings import EmbeddingService, cosine_similarity


class HybridRAGRetriever:
    """
    Hybrid retriever combining structured SQL filtering with dense vector similarity.
    """

    def __init__(self, embedding_service: Optional[EmbeddingService] = None):
        self.embedding_service = embedding_service or EmbeddingService()

    async def retrieve_from_db(
        self,
        db: AsyncSession,
        query: str,
        scheme_id: Optional[int] = None,
        scheme_code: Optional[str] = None,
        section_types: Optional[List[str]] = None,
        top_k: int = 5,
        threshold: float = 0.25,
    ) -> List[Tuple[KnowledgeChunkItem, float]]:
        """
        Retrieves relevant knowledge chunks from the PostgreSQL database using hybrid ranking.
        """
        from app.models.knowledge import KnowledgeChunk

        stmt = select(KnowledgeChunk).where(KnowledgeChunk.is_active == True)
        
        # 1. Structured SQL Filter
        filters = []
        if scheme_id:
            filters.append(KnowledgeChunk.scheme_id == scheme_id)
        elif scheme_code:
            filters.append(KnowledgeChunk.scheme_code == scheme_code.upper().strip())
        
        if section_types:
            filters.append(KnowledgeChunk.section_type.in_(section_types))
        
        if filters:
            stmt = stmt.where(and_(*filters))

        result = await db.execute(stmt)
        db_chunks = result.scalars().all()

        if not db_chunks:
            # Fallback to unrestricted scheme query if specific scheme produced 0 rows
            if scheme_id or scheme_code:
                stmt_fallback = select(KnowledgeChunk).where(KnowledgeChunk.is_active == True)
                if section_types:
                    stmt_fallback = stmt_fallback.where(KnowledgeChunk.section_type.in_(section_types))
                result_fallback = await db.execute(stmt_fallback)
                db_chunks = result_fallback.scalars().all()

        chunk_items: List[KnowledgeChunkItem] = []
        for c in db_chunks:
            chunk_items.append(KnowledgeChunkItem(
                chunk_id=c.chunk_id,
                scheme_id=c.scheme_id,
                scheme_code=c.scheme_code,
                source_id=c.source_id,
                source_name=c.source_name,
                source_type=c.source_type,
                official_url=c.official_url,
                section_type=c.section_type,
                title=c.title,
                content=c.content,
                token_count=c.token_count,
                content_hash=c.content_hash,
                embedding=c.embedding,
                embedding_model=c.embedding_model,
                chunk_metadata=c.chunk_metadata or {},
                version=c.version,
                last_verified_at=c.last_verified_at.isoformat() if c.last_verified_at else "",
            ))

        return self.rank_chunks(query, chunk_items, top_k=top_k, threshold=threshold, target_scheme_code=scheme_code)

    def rank_chunks(
        self,
        query: str,
        chunks: List[KnowledgeChunkItem],
        top_k: int = 5,
        threshold: float = 0.20,
        target_scheme_code: Optional[str] = None,
    ) -> List[Tuple[KnowledgeChunkItem, float]]:
        """
        Ranks candidate chunks using cosine similarity + lexical relevance boosts.
        """
        if not chunks:
            return []

        query_embedding = self.embedding_service.embed_text(query)
        scored_candidates: List[Tuple[KnowledgeChunkItem, float]] = []

        query_lower = query.lower()
        query_words = set(query_lower.split())

        for chunk in chunks:
            chunk_vec = chunk.embedding
            if not chunk_vec:
                chunk_vec = self.embedding_service.embed_text(chunk.content)

            # Cosine semantic similarity
            sim = cosine_similarity(query_embedding, chunk_vec)

            # Lexical keyword boost
            content_lower = chunk.content.lower()
            title_lower = chunk.title.lower()
            
            overlap = sum(1 for w in query_words if len(w) > 3 and (w in content_lower or w in title_lower))
            keyword_boost = min(0.30, overlap * 0.08)

            # Target scheme affinity boost
            scheme_boost = 0.0
            if target_scheme_code and chunk.scheme_code:
                if target_scheme_code.upper() == chunk.scheme_code.upper():
                    scheme_boost = 0.15

            total_score = sim + keyword_boost + scheme_boost

            if total_score >= threshold or sim >= threshold:
                scored_candidates.append((chunk, round(total_score, 4)))

        # Sort descending by relevance score
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return scored_candidates[:top_k]

    @staticmethod
    def extract_citation_sources(scored_chunks: List[Tuple[KnowledgeChunkItem, float]]) -> List[CitationSource]:
        """Extracts unique verified CitationSource records from retrieved chunks."""
        seen_keys = set()
        sources: List[CitationSource] = []

        for chunk, _ in scored_chunks:
            key = (chunk.source_name, chunk.official_url)
            if key not in seen_keys:
                seen_keys.add(key)
                sources.append(CitationSource(
                    source_id=chunk.source_id,
                    source_name=chunk.source_name,
                    source_type=chunk.source_type,
                    official_url=chunk.official_url,
                    section_type=chunk.section_type,
                    last_verified_at=chunk.last_verified_at,
                ))

        return sources
