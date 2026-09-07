"""
VittMitra RAG Knowledge Base Seeding & Chunk Ingestion Script

Chunks official government scheme guidelines, computes dense embeddings,
and stores versioned knowledge vectors into the PostgreSQL database.
"""
import sys
import json
import asyncio
from pathlib import Path
from typing import List, Dict, Any

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.scheme import Scheme, SchemeSource
from app.models.knowledge import KnowledgeChunk
from app.services.ai.chunker import SchemeKnowledgeChunker
from app.services.ai.orchestrator import AIOrchestrator

SEEDS_DIR = root_dir / "data" / "seed" / "schemes"


async def seed_knowledge_base():
    """Ingests and embeds all verified scheme documentation into knowledge_chunks table."""
    print("\n[INFO] Starting VittMitra RAG Knowledge Base Ingestion...")

    if not SEEDS_DIR.is_dir():
        print(f"[ERROR] Schemes directory not found at: {SEEDS_DIR}")
        return

    json_files = list(SEEDS_DIR.glob("*.json"))
    if not json_files:
        print(f"[WARNING] No seed JSON files found in {SEEDS_DIR}")
        return

    orchestrator = AIOrchestrator()

    async with async_session_factory() as session:
        # 1. Fetch DB schemes and sources to associate IDs
        scheme_stmt = select(Scheme)
        scheme_res = await session.execute(scheme_stmt)
        db_schemes = {s.scheme_code.upper(): s for s in scheme_res.scalars().all()}

        source_stmt = select(SchemeSource)
        source_res = await session.execute(source_stmt)
        db_sources = {(s.scheme_id, s.source_name): s for s in source_res.scalars().all()}

        total_chunks_created = 0
        total_chunks_updated = 0

        for f in json_files:
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
            except Exception as e:
                print(f"[ERROR] Could not read {f.name}: {e}")
                continue

            scheme_code = data.get("scheme_code", "").upper()
            db_scheme = db_schemes.get(scheme_code)
            scheme_id = db_scheme.id if db_scheme else None

            # Generate semantic chunks
            chunks = SchemeKnowledgeChunker.chunk_scheme(data, scheme_id=scheme_id)
            print(f"[INGEST] Processing {scheme_code}: Generated {len(chunks)} semantic chunks")

            for chunk_item in chunks:
                if db_scheme and chunk_item.source_name:
                    db_source = db_sources.get((db_scheme.id, chunk_item.source_name))
                    if db_source:
                        chunk_item.source_id = db_source.id

                embedding_vec = orchestrator.embed_text(chunk_item.content)

                existing_stmt = select(KnowledgeChunk).where(KnowledgeChunk.chunk_id == chunk_item.chunk_id)
                existing_res = await session.execute(existing_stmt)
                existing_chunk = existing_res.scalar_one_or_none()

                if existing_chunk:
                    existing_chunk.title = chunk_item.title
                    existing_chunk.content = chunk_item.content
                    existing_chunk.token_count = chunk_item.token_count
                    existing_chunk.content_hash = chunk_item.content_hash
                    existing_chunk.embedding = embedding_vec
                    existing_chunk.source_id = chunk_item.source_id
                    existing_chunk.official_url = chunk_item.official_url
                    existing_chunk.chunk_metadata = chunk_item.chunk_metadata
                    total_chunks_updated += 1
                else:
                    new_chunk = KnowledgeChunk(
                        chunk_id=chunk_item.chunk_id,
                        scheme_id=chunk_item.scheme_id,
                        scheme_code=chunk_item.scheme_code,
                        source_id=chunk_item.source_id,
                        source_name=chunk_item.source_name,
                        source_type=chunk_item.source_type,
                        official_url=chunk_item.official_url,
                        section_type=chunk_item.section_type,
                        title=chunk_item.title,
                        content=chunk_item.content,
                        token_count=chunk_item.token_count,
                        content_hash=chunk_item.content_hash,
                        embedding=embedding_vec,
                        embedding_model=chunk_item.embedding_model,
                        chunk_metadata=chunk_item.chunk_metadata,
                        version=chunk_item.version,
                    )
                    session.add(new_chunk)
                    total_chunks_created += 1

        await session.commit()
        print(f"\n[SUCCESS] Knowledge Base Ingestion Complete: {total_chunks_created} created, {total_chunks_updated} updated.")


if __name__ == "__main__":
    asyncio.run(seed_knowledge_base())
