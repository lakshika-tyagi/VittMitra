# VittMitra AI & Intelligence Services

This module houses the AI pipelines, RAG retrieval logic, Gemini API integrations, and hybrid recommendation workflows.

## Directory Structure
- `app/llm/`: Grounded prompt engineering, Gemini API clients, and structured output parsers for explainability.
- `app/rag/`: Retrieval-Augmented Generation indexing and vector search over verified scheme documentation.
- `app/recommendation/`: Hybrid scoring combining deterministic rule outputs with personalized recommendation rankings.
- `app/main.py`: Microservice entrypoint for AI pipeline execution and standalone testing.

## Model Strategy
- **Provider**: Google Gemini API (`google-genai` / `@google/genai`)
- **Primary Use Cases**: Natural language synthesis of deterministic rule outputs, conversational chatbot, document simplification, multilingual query translation.
- **Strict Guardrail**: Gemini is never used for mathematical finance calculations or unauthorized eligibility modifications.

*Note: Full RAG and LLM integrations will be implemented in subsequent roadmap milestones.*
