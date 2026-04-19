import io
import sqlite3
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env vars
load_dotenv()

import os
from fastapi.responses import StreamingResponse
from core.pdf_generator import pdf_generator
from core.dataset_summarizer import dataset_summarizer
from groq import Groq
from datetime import datetime

# Setup core Groq client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Import project modules
from core.privacy_filter import privacy_filter
from core.db_loader import db_loader
from core.metric_dict import metric_dict
from core.sql_safety import sql_safety
from core.conversation_memory import conversation_memory
from core.chart_selector import chart_selector
from agents.intent_clarifier import intent_clarifier
from agents.sql_generator import sql_generator
from agents.validator import validator_explainer

# Lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.schema = None
    app.state.blocked_columns = []
    yield
    db_loader.reset()

app = FastAPI(title="Talk to Data", version="1.0.0", lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app", "https://caring-elegance-production-1386.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# Models
class QueryRequest(BaseModel):
    question: str

# ── Cache Router Helper ──────────────────────────────────────────────────────
import re

# Month name → zero-padded number
_MONTH_MAP = {
    "january": "01", "february": "02", "march": "03",   "april": "04",
    "may":     "05", "june":     "06", "july":  "07",   "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "jun": "06", "jul": "07", "aug": "08", "sep": "09",
    "oct": "10", "nov": "11", "dec": "12",
}

# Quarter labels — including ordinal word forms
_QUARTER_MAP = {
    "q1": "Q1", "q2": "Q2", "q3": "Q3", "q4": "Q4",
    "quarter 1": "Q1", "quarter 2": "Q2", "quarter 3": "Q3", "quarter 4": "Q4",
    "first quarter": "Q1", "second quarter": "Q2",
    "third quarter": "Q3", "fourth quarter": "Q4",
    "1st quarter": "Q1", "2nd quarter": "Q2",
    "3rd quarter": "Q3", "4th quarter": "Q4",
}

_STAT_KEYWORDS = {
    "average", "avg", "mean", "total", "sum", "minimum", "min",
    "maximum", "max", "how much", "what was", "what is", "show me",
    "standard deviation", "std", "spread", "missing", "null", "revenue",
}

# Business metric aliases → most-likely underlying column name
_METRIC_ALIASES = {
    "revenue":  ["amount", "revenue", "sales", "total_amount", "price"],
    "sales":    ["amount", "sales", "revenue", "total_amount"],
    "orders":   ["order_id", "orders", "quantity", "amount"],
    "quantity": ["quantity", "units", "qty"],
    "amount":   ["amount", "total_amount", "sales"],
}

def _resolve_column(question_lower: str, profile: dict) -> str | None:
    """Resolve what numeric column the user is most likely asking about."""
    # Direct column name match
    col_candidates = [col for col in profile if col.lower() in question_lower]
    if col_candidates:
        return col_candidates[0]

    # Alias match (e.g. "revenue" → "amount")
    for alias, candidates in _METRIC_ALIASES.items():
        if alias in question_lower:
            for candidate in candidates:
                if candidate in profile:
                    return candidate

    # Fallback: first numeric column in profile
    return next(iter(profile), None)

def _try_cache_route(question: str, profile: dict) -> dict | None:
    """
    Pure-Python fast-path router.
    Returns a cached stats slice if the question is a simple temporal or
    statistical lookup that can be answered without SQL. Returns None otherwise.
    """
    if not profile:
        return None

    q = question.lower()

    # ── Detect range queries ───────────────────────────────────────────────
    # If the user is asking about a range, the fast path cannot handle it.
    if re.search(r'\b(from|between)\b.*\b(to|and|through|until|-)\b', q):
        return None

    # Must contain at least one statistical intent keyword
    if not any(kw in q for kw in _STAT_KEYWORDS):
        return None

    # ── Detect time granularity ──────────────────────────────────────────────
    time_key: str | None = None
    granularity: str | None = None

    # Helper: get the year from question OR auto-detect from profile
    def _get_year(p_col: dict) -> str | None:
        m = re.search(r"\b(20\d{2})\b", q)
        if m:
            return m.group(1)
        # No year in question → pick the only or most recent year in profile
        years = sorted(p_col.get("by_year", {}).keys())
        return years[-1] if years else None

    # First pass: identify which column we're targeting so we can look up years
    target_col = _resolve_column(q, profile)
    col_profile = profile.get(target_col, {}) if target_col else {}

    # Try month (+ optional year)
    for month_name, month_num in _MONTH_MAP.items():
        if month_name in q:
            year = _get_year(col_profile)
            if year:
                time_key = f"{year}-{month_num}"
                granularity = "by_month"
            break

    # Try quarter (+ optional year) — checked BEFORE plain year so "Q3 2024" works
    if not time_key:
        # Longer keys first to avoid "q1" matching inside "quarter 1"
        for qname in sorted(_QUARTER_MAP, key=len, reverse=True):
            if qname in q:
                year = _get_year(col_profile)
                if year:
                    time_key = f"{_QUARTER_MAP[qname]}-{year}"
                    granularity = "by_quarter"
                break

    # Try plain year
    if not time_key:
        m = re.search(r"\b(20\d{2})\b", q)
        if m:
            time_key = m.group(1)
            granularity = "by_year"

    # Overall dataset keywords
    if not time_key:
        overall_kw = {"overall", "in total", "all time", "entire dataset",
                      "across all", "total rows", "how many rows"}
        if any(kw in q for kw in overall_kw):
            granularity = "overall"

    if not granularity:
        return None  # Fall through to full SQL pipeline

    if not target_col:
        return None

    # ── Retrieve slice ───────────────────────────────────────────────────────
    if granularity == "overall":
        return {target_col: col_profile.get("overall", {})}

    time_bucket = col_profile.get(granularity, {})
    if time_key and time_key in time_bucket:
        return {target_col: {time_key: time_bucket[time_key]}}

    # Time key not found in cache (data doesn't cover that period → fall through)
    return None


# ── End Cache Router Helper ──────────────────────────────────────────────────

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")
        
    if df.shape[1] < 2 or df.shape[0] < 1:
        raise HTTPException(status_code=400, detail="CSV must have at least 2 columns and 1 row")
        
    filtered_df, blocked_columns = privacy_filter.filter_columns(df)
    schema = db_loader.load_csv(filtered_df)
    
    app.state.schema = schema
    app.state.blocked_columns = blocked_columns
    
    return {
        "success": True,
        "message": "File loaded successfully",
        "filename": file.filename,
        "schema": schema,
        "blocked_columns": blocked_columns,
        "row_count": len(filtered_df)
    }

@app.post("/query")
async def query_data(req: QueryRequest):
    if not db_loader.is_loaded():
        return JSONResponse(
            status_code=400, 
            content={"error": "No file uploaded yet. Please upload a CSV first."}
        )

    # ── FAST PATH ROUTER ──────────────────────────────────────────────────────
    # Detect simple temporal / statistical lookup questions and serve them
    # directly from the precomputed temporal profile, skipping Agent 1 & 2.
    cache_result = _try_cache_route(req.question, db_loader.get_temporal_profile())
    if cache_result is not None:
        explanation = validator_explainer.explain_from_cache(req.question, cache_result)
        
        conversation_memory.add_turn(
            question=req.question,
            clarified_question=req.question,
            sql="-- Served from pre-computed temporal cache. No previous SQL statement exists.",
            answer=explanation.get("answer", ""),
            key_insight=explanation.get("key_insight", "")
        )
        
        return {
            "answer": explanation.get("answer", ""),
            "confidence": explanation.get("confidence", 0.95),
            "confidence_label": explanation.get("confidence_label", "High"),
            "key_insight": explanation.get("key_insight", ""),
            "data_note": explanation.get("data_note", "Answered from precomputed cache"),
            "sql_used": "CACHE HIT — no SQL required",
            "sql_explanation": "This answer was served from pre-computed statistics calculated at upload time.",
            "results": [],
            "clarified_intent": None,
            "success": True,
            "cache_hit": True
        }
    # ── END FAST PATH ─────────────────────────────────────────────────────────

    schema = db_loader.get_schema()
    metric_dict_str = metric_dict.to_prompt_string()
    
    # Phase 1: Clarify intent
    context = conversation_memory.get_context_string()
    clarified = intent_clarifier.clarify(req.question, schema, metric_dict_str, context)
    
    # Phase 2: Generate SQL
    if clarified and clarified.get("metric"):
        formula = metric_dict.get_definition(clarified["metric"])
        if formula:
            clarified["metric_sql_formula"] = formula
            
    last_sql = conversation_memory.get_last_sql()
    sql_result = sql_generator.generate(clarified, schema, last_sql)
    if not sql_result.get("success"):
        return JSONResponse(
            status_code=422,
            content={"error": sql_result.get("error", "Unknown error"), "step": "sql_generation"}
        )
        
    # Phase 3: Safety check
    safety = sql_safety.check(sql_result["sql"])
    if not safety["safe"]:
        return JSONResponse(
            status_code=422, 
            content={"error": safety["reason"], "step": "safety_check"}
        )
        
    # Phase 4: Execution
    try:
        results = db_loader.execute_query(sql_result["sql"])
    except sqlite3.Error as e:
        return JSONResponse(
            status_code=422,
            content={"error": str(e), "step": "execution"}
        )
        
    # Phase 5: Interpretation
    explanation = validator_explainer.explain(req.question, sql_result["sql"], results)
    
    conversation_memory.add_turn(
        question=req.question,
        clarified_question=clarified.get("clarified_question", req.question),
        sql=sql_result["sql"],
        answer=explanation.get("answer", ""),
        key_insight=explanation.get("key_insight", "")
    )
    
    chart_config = chart_selector.select(req.question, clarified, results)
    
    return {
        "answer": explanation.get("answer", ""),
        "confidence": explanation.get("confidence", 0.0),
        "confidence_label": explanation.get("confidence_label", "Low"),
        "key_insight": explanation.get("key_insight", ""),
        "data_note": explanation.get("data_note", ""),
        "sql_used": sql_result["sql"],
        "sql_explanation": sql_result.get("explanation", ""),
        "results": results,
        "clarified_intent": clarified,
        "success": True,
        "cache_hit": False,
        "chart_config": chart_config
    }

@app.get("/schema")
async def get_schema():
    if not db_loader.is_loaded():
        raise HTTPException(status_code=404, detail="No data loaded")
        
    return {
        "schema": app.state.schema,
        "blocked_columns": app.state.blocked_columns,
        "loaded": True
    }

@app.post("/reset")
async def reset_session():
    db_loader.reset()
    app.state.schema = None
    app.state.blocked_columns = []
    conversation_memory.clear()
    return {"success": True, "message": "Session reset"}

@app.get("/conversation/history")
async def get_conversation_history():
    return {
        "history": conversation_memory.history,
        "turn_count": len(conversation_memory.history)
    }

@app.get("/metrics")
async def get_metrics():
    return {"metrics": metric_dict.get_all()}

@app.post("/summarize")
async def summarize_data():
    if not db_loader.is_loaded():
        return JSONResponse(status_code=400, content={"error": "No file uploaded yet."})
    
    try:
        rev_formula = metric_dict.get_definition("revenue") or "SUM(amount)"
        top_metrics = db_loader.execute_query(f"SELECT COUNT(*) as total_rows, {rev_formula} as total_revenue FROM data")
        
        best_region = db_loader.execute_query(f"SELECT region, {rev_formula} as revenue FROM data WHERE region IS NOT NULL GROUP BY region ORDER BY revenue DESC LIMIT 1")
        worst_region = db_loader.execute_query(f"SELECT region, {rev_formula} as revenue FROM data WHERE region IS NOT NULL GROUP BY region ORDER BY revenue ASC LIMIT 1")
        top_product = db_loader.execute_query(f"SELECT product, COUNT(*) as total_sold FROM data WHERE product IS NOT NULL GROUP BY product ORDER BY total_sold DESC LIMIT 1")
        
        explanation = validator_explainer.generate_summary(
            top_metrics=top_metrics,
            best_region=best_region,
            worst_region=worst_region,
            top_product=top_product
        )
        
        return {
            "answer": explanation.get("answer", ""),
            "confidence": explanation.get("confidence", 0.0),
            "confidence_label": explanation.get("confidence_label", "Low"),
            "key_insight": explanation.get("key_insight", ""),
            "data_note": explanation.get("data_note", ""),
            "sql_used": "Automated Batch Analytics",
            "sql_explanation": "Auto-generated executive batch sweep.",
            "results": [],
            "clarified_intent": None,
            "success": True
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "step": "summarize"})

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "schema_loaded": db_loader.is_loaded()
    }

@app.post("/export/pdf/answer")
async def export_answer_pdf(report_data: dict):
    try:
        pdf_bytes = pdf_generator.generate_answer_report(report_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="answer-report.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export/pdf/dataset")
async def export_dataset_pdf():
    try:
        if not db_loader.is_loaded():
            raise HTTPException(status_code=400, detail="No file uploaded yet")
        
        blocked_columns = getattr(app.state, 'blocked_columns', [])
        schema = db_loader.get_schema()
        
        summary_data = dataset_summarizer.summarize(db_loader, metric_dict, groq_client)
        summary_data["dataset_name"] = schema.get("table_name", "dataset")
        summary_data["row_count"] = schema.get("row_count", 0)
        summary_data["blocked_columns"] = blocked_columns
        summary_data["generated_at"] = datetime.now().strftime("%d %B %Y at %H:%M")
        
        pdf_bytes = pdf_generator.generate_dataset_report(summary_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="dataset-report.pdf"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
