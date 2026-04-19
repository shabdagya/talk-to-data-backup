import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
MODEL = "llama-3.3-70b-versatile"

class IntentClarifier:
    """Interprets the user's question and returns a structured JSON object."""

    def clarify(self, question: str, schema: dict, metric_dict_str: str, conversation_context: str = "") -> dict:
        from core.metric_dict import metric_dict

        client = Groq()

        schema_lines = [f"Table: {schema['table_name']}"]
        for col in schema['columns']:
            sample_values_text = ""
            if col["name"] in schema.get("sample_values", {}):
                sample_values_text = f" (Sample values: {schema['sample_values'][col['name']]})"
            schema_lines.append(f"- {col['name']} ({col['type']}){sample_values_text}")
        schema_text = "\n".join(schema_lines)

        memory_rules = f"""
{conversation_context}

MEMORY RULES:
- If the user's question uses words like "that", "it", "those", "same", "also",
  "now filter", "break that down", "why did", "compare that" — they are referring
  to the previous question's context
- Carry forward any filters, dimensions, or time ranges from previous turns
  unless the user explicitly changes them
- If the user says "now filter by X" — keep all previous filters and add X
- If the user says "why did X drop" — use the same metric and time context as before
""" if conversation_context else ""

        system_prompt = f"""
You are an intent clarifier for a SQL data analytics chatbot.
Your job: interpret the user's question and return a structured JSON object.

DATABASE SCHEMA:
{schema_text}

{metric_dict_str}

{metric_dict.get_column_context(schema)}
{memory_rules}
RULES:
- Resolve time: "last month" → actual YYYY-MM, "this year" → current year, "Q3" → months 7,8,9
- Resolve "top" → default 5 if N not specified
- Map business terms to metric definitions above
- Return ONLY valid JSON — no markdown, no backticks, nothing outside the JSON

RETURN EXACTLY THIS STRUCTURE:
{{
  "original_question": "...",
  "clarified_question": "rewritten unambiguous version",
  "metric": "revenue",
  "dimensions": ["region"],
  "time_filter": "strftime('%Y-%m', date) = '2024-01'",
  "comparison": null,
  "limit": 5,
  "order_by": "DESC"
}}
Use null for fields that don't apply.
"""

        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
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

            return json.loads(response_text.strip())

        except Exception as e:
            return {
                "original_question": question,
                "clarified_question": None,
                "metric": None,
                "dimensions": None,
                "time_filter": None,
                "comparison": None,
                "limit": None,
                "order_by": None
            }

intent_clarifier = IntentClarifier()
