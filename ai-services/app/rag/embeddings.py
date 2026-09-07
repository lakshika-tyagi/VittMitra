"""
Embedding Generator & Vector Mathematical Utilities

Supports Google Gemini text-embedding-004 and deterministic local embedding fallback
for offline testing and zero-network resilience.
"""
import math
import os
import re
import logging
from typing import List, Optional

logger = logging.getLogger("vittmitra.rag.embeddings")

VECTOR_DIMENSION = 128


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculates cosine similarity between two numeric vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    
    return dot_product / (norm_a * norm_b)


def generate_local_embedding(text: str, dimension: int = VECTOR_DIMENSION) -> List[float]:
    """
    Generates a normalized, deterministic term-frequency and subword hash vector.
    Guarantees consistent semantic similarity calculations without network calls.
    """
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    tokens = [w for w in cleaned.split() if len(w) > 1]
    
    vec = [0.0] * dimension
    if not tokens:
        return vec
    
    for token in tokens:
        # Word-level hash bin
        word_hash = hash(token) % dimension
        vec[word_hash] += 2.0
        
        # 3-gram subword hashing for fuzzy matching (e.g. 'subsid', 'eligib', 'pmegp')
        for i in range(len(token) - 2):
            trigram = token[i:i+3]
            tri_hash = hash(trigram) % dimension
            vec[tri_hash] += 0.5

    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0.0:
        vec = [round(v / norm, 6) for v in vec]
    
    return vec


class EmbeddingService:
    """
    Generates text embeddings using Google Gemini API when available,
    falling back to deterministic local vectors in test/offline environments.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "text-embedding-004"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name
        self._genai_client = None

        if self.api_key:
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("Could not initialize google-genai client for embeddings: %s. Using local fallback.", e)

    def embed_text(self, text: str) -> List[float]:
        """Generates embedding vector for a single text chunk."""
        if not text or not text.strip():
            return [0.0] * VECTOR_DIMENSION

        if self._genai_client:
            try:
                response = self._genai_client.models.embed_content(
                    model=self.model_name,
                    contents=text
                )
                if response and hasattr(response, "embedding") and response.embedding:
                    values = response.embedding.values
                    norm = math.sqrt(sum(v * v for v in values))
                    if norm > 0.0:
                        return [v / norm for v in values]
                    return values
            except Exception as e:
                logger.warning("Gemini live embedding call failed: %s. Falling back to local embedding.", e)

        return generate_local_embedding(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a batch of texts."""
        return [self.embed_text(t) for t in texts]
