"""
RAG Ingestion and Chunking Unit Tests for VittMitra Knowledge Base
"""
import pytest
from app.services.ai.chunker import SchemeKnowledgeChunker
from app.services.ai.embeddings import EmbeddingService, cosine_similarity, generate_local_embedding


def test_scheme_knowledge_chunker_basic():
    """Verify that SchemeKnowledgeChunker generates structured semantic chunks."""
    chunker = SchemeKnowledgeChunker()

    sample_scheme = {
        "id": 1,
        "scheme_code": "PMEGP",
        "scheme_name": "Prime Minister's Employment Generation Programme",
        "ministry": "Ministry of Micro, Small and Medium Enterprises (MSME)",
        "objective": "Credit linked subsidy programme for generating self-employment opportunities.",
        "target_beneficiaries": ["Unemployed youth", "Traditional artisans", "Rural entrepreneurs"],
        "eligibility_rules": {
            "min_age": 18,
            "max_age": 60,
            "education": "8th pass for projects above 10 Lakhs in manufacturing",
            "categories": ["General", "OBC", "SC", "ST", "Women"],
        },
        "financial_parameters": {
            "max_loan_amount": 5000000,
            "subsidy_urban_gen": 0.15,
            "subsidy_rural_special": 0.35,
            "beneficiary_contribution_gen": 0.10,
            "beneficiary_contribution_special": 0.05,
        },
        "required_documents": [
            {"name": "Aadhaar Card", "mandatory": True, "stage": "APPLICATION"},
            {"name": "Detailed Project Report (DPR)", "mandatory": True, "stage": "APPLICATION"},
            {"name": "Caste Certificate", "mandatory": False, "stage": "APPLICATION"},
        ],
        "application_process": {
            "portal": "https://www.kviconline.gov.in/pmegpeportal",
            "steps": [
                "Register on KVIC portal with Aadhaar",
                "Submit project proposal & DPR",
                "District Task Force Committee review",
                "Bank loan sanction and subsidy release",
            ]
        }
    }

    chunks = chunker.chunk_scheme(sample_scheme)

    assert len(chunks) == 5
    chunk_types = [c.section_type for c in chunks]
    assert "overview" in chunk_types
    assert "eligibility_criteria" in chunk_types
    assert "financial_benefits" in chunk_types
    assert "required_documents" in chunk_types
    assert "application_steps" in chunk_types

    # Validate overview chunk properties
    overview_chunk = next(c for c in chunks if c.section_type == "overview")
    assert overview_chunk.scheme_code == "PMEGP"
    assert "Prime Minister's Employment Generation Programme" in overview_chunk.content
    assert overview_chunk.content_hash is not None
    assert overview_chunk.token_count > 0
    assert "PMEGP" in overview_chunk.chunk_id



def test_embedding_service_local_fallback():
    """Verify deterministic local embedding generation and cosine similarity."""
    emb_service = EmbeddingService()
    
    text1 = "Prime Minister Employment Generation Programme subsidy for rural manufacturing."
    text2 = "PMEGP credit linked subsidy for manufacturing business."
    text3 = "Completely unrelated text about astrophysics and solar flares."

    vec1 = emb_service.embed_text(text1)
    vec2 = emb_service.embed_text(text2)
    vec3 = emb_service.embed_text(text3)

    assert len(vec1) == 128
    assert len(vec2) == 128
    assert len(vec3) == 128

    sim_related = cosine_similarity(vec1, vec2)
    sim_unrelated = cosine_similarity(vec1, vec3)

    assert sim_related > 0.4
    assert sim_related > sim_unrelated


def test_embedding_batch_local():
    """Verify batch embedding generation locally."""
    emb_service = EmbeddingService()
    texts = [
        "MUDRA loan for small businesses",
        "Stand-Up India for SC ST and women entrepreneurs",
        "PM SVANidhi for street vendors",
    ]
    vectors = emb_service.embed_batch(texts)
    assert len(vectors) == 3
    for vec in vectors:
        assert len(vec) == 128
