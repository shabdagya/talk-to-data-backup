import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
MODEL = "llama-3.3-70b-versatile"

class ValidatorExplainer:
    """Explains SQL results to non-technical business users."""

    def explain(self, question: str, sql: str, results: list[dict]) -> dict:
        if not results:
            return {
              "answer": "No data was found matching your query. Try rephrasing or checking the date range.",
              "confidence": 0.1,
              "confidence_label": "Low",
              "key_insight": "Query returned no results",
              "data_note": "0 rows returned"
            }

        client = Groq()
        results_str = self._format_results_table(results)

        system_prompt = f"""
You are a data analyst explaining SQL results to non-technical business users.

QUESTION: {question}

SQL EXECUTED: {sql}

RESULTS:
{results_str}

RULES:
1. Answer in 2-3 sentences. Use specific numbers from the results.
2. No SQL, no technical jargon.
3. Confidence scoring:
   - High (0.85-1.0): results clearly and completely answer the question
   - Medium (0.5-0.84): results are partial or tangential
   - Low (0.0-0.49): results are empty or irrelevant
4. Return ONLY valid JSON — no markdown, no backticks

RETURN EXACTLY:
{{
  "answer": "...",
  "confidence": 0.88,
  "confidence_label": "High",
  "key_insight": "one-line summary of the most important finding",
  "data_note": "Based on X rows of data"
}}
"""
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt}
                ],
                model=MODEL,
                temperature=0.2
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
                "answer": f"Error formatting explanation: {str(e)}",
                "confidence": 0.0,
                "confidence_label": "Low",
                "key_insight": "Error",
                "data_note": ""
            }

    def explain_from_cache(self, question: str, cached_data: dict) -> dict:
        """Fast-path: interprets precomputed stats directly without going through
        Agent 1 (Intent Clarifier) or Agent 2 (SQL Generator).
        cached_data is the relevant slice from temporal_profile.
        """
        client = Groq()

        system_prompt = f"""
You are a data analyst explaining pre-computed statistics to a non-technical business user.

ORIGINAL QUESTION: {question}

PRE-COMPUTED STATISTICS (exact, no estimation):
{json.dumps(cached_data, indent=2)}

RULES:
1. Answer in 2-3 sentences using ONLY the numbers in the statistics above.
2. No SQL, no technical jargon. Round numbers sensibly.
3. Confidence should always be High (0.9+) since these are pre-calculated exact values.
4. Return ONLY valid JSON — no markdown, no backticks.

RETURN EXACTLY:
{{
  "answer": "...",
  "confidence": 0.95,
  "confidence_label": "High",
  "key_insight": "one-line summary of the most important finding",
  "data_note": "Answered from precomputed dataset profile (no SQL required)"
}}
"""
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "system", "content": system_prompt}],
                model=MODEL,
                temperature=0.1
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
                "answer": f"Cache explanation error: {str(e)}",
                "confidence": 0.0,
                "confidence_label": "Low",
                "key_insight": "Error",
                "data_note": ""
            }

    def _format_results_table(self, results: list[dict]) -> str:
        if not results:
            return "No results."
        
        limited_results = results[:10]
        keys = limited_results[0].keys()
        
        table = " | ".join(keys) + "\\n"
        table += "-|" * (len(keys) - 1) + "-\\n"
        
        for row in limited_results:
            table += " | ".join([str(row.get(k, "")) for k in keys]) + "\\n"
        return table

    def generate_summary(self, top_metrics: dict, best_region: list, worst_region: list, top_product: list) -> dict:
        client = Groq()
        
        system_prompt = f"""
You are the Chief Data Officer for the company. Write a succinct, professional 3-sentence weekly brief based on these snapshot data points:
- Key Metrics: {json.dumps(top_metrics)}
- Best Region: {json.dumps(best_region)}
- Worst Region: {json.dumps(worst_region)}
- Top Product: {json.dumps(top_product)}

RULES:
1. Provide a cohesive, fluent snapshot narrative.
2. Call out the strongest win and the biggest dragging segment.
3. Keep it purely to 3-4 sentences total.
4. Output EXACTLY as valid JSON:
{{
  "answer": "Your beautiful 3 sentence paragraph here...",
  "confidence": 0.95,
  "confidence_label": "High",
  "key_insight": "One line highlight of the biggest mover",
  "data_note": "Automated dataset snapshot"
}}
"""
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "system", "content": system_prompt}],
                model=MODEL,
                temperature=0.2
            )
            response_text = chat_completion.choices[0].message.content.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            return json.loads(response_text.strip())
        except Exception:
            return {{
                "answer": "Failed to automatically generate summary.",
                "confidence": 0, "confidence_label": "Low", "key_insight": "Error", "data_note": ""
            }}

validator_explainer = ValidatorExplainer()
