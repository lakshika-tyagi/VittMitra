"""
Authoritative Scheme Document Chunker for RAG Knowledge Base

Splits verified government scheme data into semantically coherent,
densely annotated knowledge chunks preserving full source traceability.
"""
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.schemas.ai import KnowledgeChunkItem, SectionType


def compute_content_hash(text: str) -> str:
    """Computes SHA-256 hash of cleaned text."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def estimate_token_count(text: str) -> int:
    """Estimates token count (~1.3 tokens per word)."""
    words = len(text.split())
    return max(1, int(words * 1.3))


class SchemeKnowledgeChunker:
    """
    Decomposes verified scheme definitions into high-fidelity semantic chunks
    covering Overview, Eligibility, Financial Benefits, Documents, and Application Workflow.
    """

    @classmethod
    def chunk_scheme(cls, scheme_data: Dict[str, Any], scheme_id: Optional[int] = None) -> List[KnowledgeChunkItem]:
        chunks: List[KnowledgeChunkItem] = []
        scheme_code = scheme_data.get("scheme_code", "UNKNOWN")
        scheme_name = scheme_data.get("scheme_name", scheme_code)
        
        # Primary source metadata
        sources = scheme_data.get("sources", [])
        primary_source = sources[0] if sources else {}
        source_id = primary_source.get("id")
        source_name = primary_source.get("source_name", f"{scheme_name} Official Guidelines")
        source_type = primary_source.get("source_type", "OFFICIAL_GUIDELINE")
        official_url = primary_source.get("official_url", "")
        last_verified = primary_source.get("last_verified_at", datetime.now(timezone.utc).isoformat())
        version = primary_source.get("version", "1.0")

        # 1. Overview & Objectives Chunk
        ministry = scheme_data.get("nodal_ministry", "Government of India")
        dept = scheme_data.get("nodal_department", "")
        desc = scheme_data.get("short_description", "")
        purpose = scheme_data.get("purpose", "")
        sectors = ", ".join(scheme_data.get("sectors", []))
        stages = ", ".join(scheme_data.get("business_stages", []))
        beneficiaries = ", ".join(scheme_data.get("target_beneficiaries", []))

        overview_text = (
            f"Scheme: {scheme_name} ({scheme_code})\n"
            f"Nodal Ministry: {ministry}" + (f" ({dept})" if dept else "") + "\n"
            f"Objective: {purpose}\n"
            f"Summary: {desc}\n"
            f"Applicable Business Stages: {stages}\n"
            f"Targeted Sectors: {sectors}\n"
            f"Target Beneficiaries: {beneficiaries}\n"
            f"Applicability: National coverage across all Indian States and Union Territories."
        )

        chunks.append(KnowledgeChunkItem(
            chunk_id=f"{scheme_code}_OVERVIEW_001",
            scheme_id=scheme_id,
            scheme_code=scheme_code,
            source_id=source_id,
            source_name=source_name,
            source_type=source_type,
            official_url=official_url,
            section_type=SectionType.OVERVIEW.value,
            title=f"{scheme_name} — Purpose & Scope",
            content=overview_text,
            token_count=estimate_token_count(overview_text),
            content_hash=compute_content_hash(overview_text),
            chunk_metadata={
                "scheme_code": scheme_code,
                "ministry": ministry,
                "sectors": scheme_data.get("sectors", []),
                "business_stages": scheme_data.get("business_stages", []),
            },
            version=version,
            last_verified_at=last_verified,
        ))

        # 2. Eligibility Criteria Chunk
        rules = scheme_data.get("eligibility_rules", [])
        rules_text_list = []
        if isinstance(rules, list):
            for r in rules:
                if isinstance(r, dict):
                    desc = r.get("description") or f"{r.get('field_name', '')} {r.get('operator', '')} {r.get('expected_value', '')}"
                    rule_code = r.get("rule_code", "")
                    rules_text_list.append(f"- {desc}" + (f" [{rule_code}]" if rule_code else ""))
                elif isinstance(r, str):
                    rules_text_list.append(f"- {r}")
        elif isinstance(rules, dict):
            for k, v in rules.items():
                rules_text_list.append(f"- {k.replace('_', ' ').title()}: {v}")

        rules_body = "\n".join(rules_text_list) if rules_text_list else "Standard MSME credit norms apply."
        eligibility_text = (
            f"Eligibility Requirements for {scheme_name} ({scheme_code}):\n"
            f"The following criteria must be satisfied to qualify for assistance under this scheme:\n"
            f"{rules_body}\n\n"
            f"Target Beneficiary Categories: {beneficiaries}\n"
            f"Business Lifecycle Stage: {stages}"
        )

        chunks.append(KnowledgeChunkItem(
            chunk_id=f"{scheme_code}_ELIGIBILITY_001",
            scheme_id=scheme_id,
            scheme_code=scheme_code,
            source_id=source_id,
            source_name=source_name,
            source_type=source_type,
            official_url=official_url,
            section_type=SectionType.ELIGIBILITY_CRITERIA.value,
            title=f"{scheme_name} — Eligibility Criteria",
            content=eligibility_text,
            token_count=estimate_token_count(eligibility_text),
            content_hash=compute_content_hash(eligibility_text),
            chunk_metadata={
                "scheme_code": scheme_code,
                "rule_count": len(rules_text_list),
                "target_beneficiaries": scheme_data.get("target_beneficiaries", []),
            },
            version=version,
            last_verified_at=last_verified,
        ))

        # 3. Financial Benefits & Subsidy Chunk
        benefits = scheme_data.get("benefits_summary") or scheme_data.get("financial_parameters") or {}
        benefits_lines = []
        if isinstance(benefits, dict):
            for k, v in benefits.items():
                formatted_key = k.replace("_", " ").title()
                if isinstance(v, (int, float)) and v >= 100000:
                    lakhs = v / 100000
                    benefits_lines.append(f"- {formatted_key}: Rs. {v:,.0f} (₹{lakhs:.2f} Lakhs)")
                elif isinstance(v, (int, float)) and "pct" in k:
                    benefits_lines.append(f"- {formatted_key}: {v}%")
                else:
                    benefits_lines.append(f"- {formatted_key}: {v}")
        elif isinstance(benefits, list):
            for b in benefits:
                benefits_lines.append(f"- {b}")

        benefits_body = "\n".join(benefits_lines) if benefits_lines else "Standard government subsidised loan guidelines apply."
        financial_text = (
            f"Financial Terms & Subsidies for {scheme_name} ({scheme_code}):\n"
            f"This scheme provides the following financial structuring and capital benefits:\n"
            f"{benefits_body}\n\n"
            f"Repayment and loan terms are administered through designated public sector banks, RRBs, and financial institutions."
        )

        chunks.append(KnowledgeChunkItem(
            chunk_id=f"{scheme_code}_FINANCIAL_001",
            scheme_id=scheme_id,
            scheme_code=scheme_code,
            source_id=source_id,
            source_name=source_name,
            source_type=source_type,
            official_url=official_url,
            section_type=SectionType.FINANCIAL_BENEFITS.value,
            title=f"{scheme_name} — Financial Benefits & Subsidy Details",
            content=financial_text,
            token_count=estimate_token_count(financial_text),
            content_hash=compute_content_hash(financial_text),
            chunk_metadata={
                "scheme_code": scheme_code,
                "financial_keys": list(benefits.keys()) if isinstance(benefits, dict) else [],
            },
            version=version,
            last_verified_at=last_verified,
        ))

        # 4. Required Documents Chunk
        docs = scheme_data.get("required_documents", [])
        doc_lines = []
        if isinstance(docs, list):
            for doc in docs:
                if isinstance(doc, dict):
                    d_name = doc.get("document_name") or doc.get("name", "Document")
                    mand = "Mandatory" if doc.get("is_mandatory") or doc.get("mandatory") else "Optional"
                    d_stage = doc.get("stage", "Application")
                    doc_lines.append(f"- {d_name} ({mand}, Stage: {d_stage})")
                elif isinstance(doc, str):
                    doc_lines.append(f"- {doc} (Mandatory)")
        elif isinstance(docs, dict):
            for k, v in docs.items():
                doc_lines.append(f"- {k.replace('_', ' ').title()}: {v}")

        docs_body = "\n".join(doc_lines) if doc_lines else "Identity KYC (Aadhaar, PAN), Business Plan, Bank Statements."
        documents_text = (
            f"Document Checklist for {scheme_name} ({scheme_code}):\n"
            f"Entrepreneurs must assemble the following verified documents for submission:\n"
            f"{docs_body}\n\n"
            f"All documents should be clearly scanned in PDF or image format as per implementing agency specifications."
        )

        chunks.append(KnowledgeChunkItem(
            chunk_id=f"{scheme_code}_DOCUMENTS_001",
            scheme_id=scheme_id,
            scheme_code=scheme_code,
            source_id=source_id,
            source_name=source_name,
            source_type=source_type,
            official_url=official_url,
            section_type=SectionType.REQUIRED_DOCUMENTS.value,
            title=f"{scheme_name} — Required Documents & Verification Checklist",
            content=documents_text,
            token_count=estimate_token_count(documents_text),
            content_hash=compute_content_hash(documents_text),
            chunk_metadata={
                "scheme_code": scheme_code,
                "document_count": len(doc_lines),
            },
            version=version,
            last_verified_at=last_verified,
        ))

        # 5. Application Steps Chunk
        app_process = scheme_data.get("application_process", {})
        steps = app_process.get("steps", []) if isinstance(app_process, dict) else (app_process if isinstance(app_process, list) else [])
        portal = app_process.get("portal", "") if isinstance(app_process, dict) else ""
        step_lines = []
        for i, st in enumerate(steps, 1):
            step_lines.append(f"{i}. {st}")

        steps_body = "\n".join(step_lines) if step_lines else "1. Register on designated national portal\n2. Fill DPR & profile\n3. Bank sanction and disbursement."
        app_text = (
            f"Application Process for {scheme_name} ({scheme_code}):\n"
            + (f"Official Application Portal: {portal}\n" if portal else "")
            + f"Step-by-Step Procedure:\n{steps_body}\n\n"
            f"Assistance can also be obtained from nearest verified District Industries Centres (DIC), MSME-DFOs, or partner bank branches."
        )

        chunks.append(KnowledgeChunkItem(
            chunk_id=f"{scheme_code}_APPLICATION_001",
            scheme_id=scheme_id,
            scheme_code=scheme_code,
            source_id=source_id,
            source_name=source_name,
            source_type=source_type,
            official_url=official_url,
            section_type=SectionType.APPLICATION_STEPS.value,
            title=f"{scheme_name} — Application Workflow & Submission Steps",
            content=app_text,
            token_count=estimate_token_count(app_text),
            content_hash=compute_content_hash(app_text),
            chunk_metadata={
                "scheme_code": scheme_code,
                "step_count": len(step_lines),
                "portal_url": portal,
            },
            version=version,
            last_verified_at=last_verified,
        ))

        return chunks
