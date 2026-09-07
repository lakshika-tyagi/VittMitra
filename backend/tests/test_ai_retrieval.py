"""
Hybrid RAG Retriever and Semantic Filtering Unit Tests
"""
import pytest
from app.schemas.ai import KnowledgeChunkItem
from app.services.ai.retriever import HybridRAGRetriever
from app.services.ai.embeddings import EmbeddingService


@pytest.fixture
def sample_knowledge_chunks():
    emb = EmbeddingService()
    
    chunks_data = [
        {
            "chunk_id": "PMEGP_overview",
            "scheme_id": 1,
            "scheme_code": "PMEGP",
            "source_id": 101,
            "source_name": "KVIC Official Portal",
            "source_type": "OFFICIAL_PORTAL",
            "official_url": "https://www.kviconline.gov.in/pmegpeportal",
            "section_type": "overview",
            "title": "PMEGP Overview and Objectives",
            "content": "Prime Minister's Employment Generation Programme is a major credit-linked subsidy programme aimed at generating self-employment opportunities through micro-enterprise establishment.",
            "token_count": 30,
            "content_hash": "hash_pmegp_1",
            "version": "1.0",
        },
        {
            "chunk_id": "PMEGP_eligibility_criteria",
            "scheme_id": 1,
            "scheme_code": "PMEGP",
            "source_id": 101,
            "source_name": "KVIC Official Portal",
            "source_type": "OFFICIAL_PORTAL",
            "official_url": "https://www.kviconline.gov.in/pmegpeportal",
            "section_type": "eligibility_criteria",
            "title": "PMEGP Eligibility Criteria",
            "content": "Any individual above 18 years of age is eligible. For setting up of projects costing above Rs. 10 lakh in manufacturing sector, the beneficiary should possess at least VIII standard pass qualification.",
            "token_count": 38,
            "content_hash": "hash_pmegp_2",
            "version": "1.0",
        },
        {
            "chunk_id": "MUDRA_financial_benefits",
            "scheme_id": 2,
            "scheme_code": "MUDRA",
            "source_id": 102,
            "source_name": "MUDRA Official Guidelines",
            "source_type": "GAZETTE_NOTIFICATION",
            "official_url": "https://www.mudra.org.in",
            "section_type": "financial_benefits",
            "title": "MUDRA Loan Categories & Financial Terms",
            "content": "Pradhan Mantri MUDRA Yojana provides loans up to 10 Lakhs to non-corporate, non-farm small/micro enterprises across Shishu (up to 50k), Kishore (50k to 5 Lakhs) and Tarun (5 to 10 Lakhs) categories.",
            "token_count": 42,
            "content_hash": "hash_mudra_1",
            "version": "1.0",
        },
        {
            "chunk_id": "STANDUP_overview",
            "scheme_id": 3,
            "scheme_code": "STANDUP_INDIA",
            "source_id": 103,
            "source_name": "Stand-Up India Portal",
            "source_type": "OFFICIAL_PORTAL",
            "official_url": "https://www.standupmitra.in",
            "section_type": "overview",
            "title": "Stand-Up India Scheme Overview",
            "content": "Stand-Up India Scheme facilitates bank loans between 10 lakh and 1 Crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower and at least one woman borrower per bank branch.",
            "token_count": 39,
            "content_hash": "hash_standup_1",
            "version": "1.0",
        },
    ]

    items = []
    for d in chunks_data:
        item = KnowledgeChunkItem(
            chunk_id=d["chunk_id"],
            scheme_id=d["scheme_id"],
            scheme_code=d["scheme_code"],
            source_id=d["source_id"],
            source_name=d["source_name"],
            source_type=d["source_type"],
            official_url=d["official_url"],
            section_type=d["section_type"],
            title=d["title"],
            content=d["content"],
            token_count=d["token_count"],
            content_hash=d["content_hash"],
            embedding=emb.embed_text(d["content"]),
            embedding_model="text-embedding-004-fallback",
            chunk_metadata={},
            version=d["version"],
            last_verified_at="2026-09-07T00:00:00Z",
        )
        items.append(item)
    return items


def test_retriever_ranking_by_scheme_code(sample_knowledge_chunks):
    """Verify retriever boosts target scheme code accurately."""
    retriever = HybridRAGRetriever()
    
    # Query matching PMEGP eligibility
    results = retriever.rank_chunks(
        query="What is the minimum age and education requirement for PMEGP manufacturing?",
        chunks=sample_knowledge_chunks,
        top_k=2,
        threshold=0.20,
        target_scheme_code="PMEGP",
    )

    assert len(results) > 0
    top_chunk, score = results[0]
    assert top_chunk.scheme_code == "PMEGP"
    assert top_chunk.section_type in ["eligibility_criteria", "overview"]
    assert score > 0.3


def test_retriever_citation_extraction(sample_knowledge_chunks):
    """Verify that extract_citation_sources produces unique verified source references."""
    retriever = HybridRAGRetriever()
    
    scored = [(c, 0.85) for c in sample_knowledge_chunks[:2]]
    sources = retriever.extract_citation_sources(scored)

    # Both are from KVIC portal, should deduplicate to 1 citation source
    assert len(sources) == 1
    assert sources[0].source_name == "KVIC Official Portal"
    assert sources[0].official_url == "https://www.kviconline.gov.in/pmegpeportal"


def test_retriever_high_threshold_isolation(sample_knowledge_chunks):
    """Verify that completely unrelated queries yield no results under high threshold."""
    retriever = HybridRAGRetriever()
    
    results = retriever.rank_chunks(
        query="Quantum gravity string theory in 11 dimensions",
        chunks=sample_knowledge_chunks,
        top_k=3,
        threshold=0.75,
    )

    assert len(results) == 0
