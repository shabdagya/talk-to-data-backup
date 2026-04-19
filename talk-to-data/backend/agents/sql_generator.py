import json
from groq import Groq
import os
from dotenv import load_dotenv
from core.sql_safety import sql_safety

load_dotenv()
MODEL = "llama-3.3-70b-versatile"

class SQLGenerator:
    """Generates SQLite SQL statements based on clarified intent."""

    def generate(self, clarified_intent: dict, schema: dict, last_sql: str = None) -> dict:
        client = Groq()

        schema_lines = [f"Table name: {schema['table_name']}"]
        for col in schema['columns']:
            schema_lines.append(f"- {col['name']} ({col['type']})")
        schema_text = "\n".join(schema_lines)

        limit_val = clarified_intent.get('limit')
        if not limit_val:
            limit_val = 10

        memory_block = f"""
PREVIOUS SQL FOR REFERENCE:
{last_sql}

If the current intent is a follow-up or refinement, use this as a base
and modify only what changed. Keep the same table, same joins if any.
""" if last_sql else ""

        system_prompt = f"""
You are a SQLite SQL query generator. Write ONE SELECT query only.

SCHEMA:
{schema_text}
{memory_block}
STRICT RULES:
1. Only SELECT statements. Never DROP, DELETE, UPDATE, INSERT, ALTER.
2. Table name is always: data
3. Use exact column names from the schema
4. Use CASE WHEN syntax for conditional aggregation (not FILTER keyword)
5. For dates: use strftime('%Y-%m', date) for month, strftime('%Y', date) for year
6. Always include LIMIT {limit_val}
7. Return ONLY a JSON object — no markdown, no backticks
8. ALWAYS USE the exact SQL expression provided in 'metric_sql_formula' for aggregating your metric instead of generic column references!
9. For **COMPARISONS** (e.g. "Region A vs Region B" or "This month vs last month"): Build your query using a Common Table Expression (WITH clause) or LEFT JOIN so that both compared metrics are output side-by-side in the same result row.

USER INTENT:
{json.dumps(clarified_intent, indent=2)}

RETURN EXACTLY:
{{
  "sql": "SELECT ...",
  "explanation": "Plain English explanation of what this query does"
}}
"""

        for attempt in range(2):
            try:
                chat_completion = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                    ],
                    model=MODEL,
                    temperature=0.0
                )
                
                response_text = chat_completion.choices[0].message.content.strip()
                
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                    
                result = json.loads(response_text.strip())
                sql = result.get('sql', '')
                
                # Guard: LLM sometimes emits {placeholder} template syntax
                if '{' in sql or '}' in sql:
                    if attempt == 0:
                        continue  # retry
                    return {
                        "sql": None,
                        "explanation": None,
                        "success": False,
                        "error": "Generated SQL contained template placeholders. Please rephrase your question more specifically."
                    }
                
                safety_check = sql_safety.check(sql)
                if not safety_check['safe']:
                    return {
                        "sql": None, 
                        "explanation": None, 
                        "success": False, 
                        "error": safety_check['reason']
                    }
                    
                return {
                    "sql": sql,
                    "explanation": result.get('explanation', ''),
                    "success": True,
                    "error": None
                }

            except Exception as e:
                if attempt == 1:
                    return {
                        "sql": None,
                        "explanation": None,
                        "success": False,
                        "error": str(e)
                    }

        return {"sql": None, "explanation": None, "success": False, "error": "Unknown error"}

sql_generator = SQLGenerator()
