from datetime import datetime
from typing import Dict, Optional

class MetricDict:
    """The semantic layer mapping business terms to SQL expressions."""

    METRIC_DICTIONARY = {
        "revenue": "SUM(CASE WHEN status='completed' THEN amount ELSE 0 END)",
        "total_sales": "SUM(amount)",
        "orders": "COUNT(order_id)",
        "completed_orders": "COUNT(CASE WHEN status='completed' THEN 1 END)",
        "pending_orders": "COUNT(CASE WHEN status='pending' THEN 1 END)",
        "refunds": "COUNT(CASE WHEN status='refunded' THEN 1 END)",
        "refund_rate": "ROUND(COUNT(CASE WHEN status='refunded' THEN 1 END) * 100.0 / COUNT(order_id), 2)",
        "average_order_value": "ROUND(AVG(CASE WHEN status='completed' THEN amount END), 2)",
        "units_sold": "SUM(quantity)"
    }

    def get_definition(self, term: str) -> Optional[str]:
        """Returns the SQL expression for the given term, utilizing case-insensitive partial matching."""
        term_lower = term.lower()
        for key, val in self.METRIC_DICTIONARY.items():
            if term_lower in key or key in term_lower:
                return val
        return None

    def get_all(self) -> Dict[str, str]:
        """Returns the entire metric dictionary."""
        return self.METRIC_DICTIONARY

    def to_prompt_string(self) -> str:
        """Returns a formatted string listing all metric definitions for AI prompts."""
        lines = ["BUSINESS METRICS (use these exact SQL snippets if applicable):"]
        for key, val in self.METRIC_DICTIONARY.items():
            lines.append(f"- {key}: {val}")
        return "\\n".join(lines)

    def get_column_context(self, schema: dict) -> str:
        """Returns context hints about the date column limits from the dynamically loaded schema."""
        dr = schema.get("date_range")
        if dr:
            return (f"TIME CONTEXT: The dataset contains data spanning between {dr['min']} and {dr['max']}. "
                    f"If the user asks for generic times (like 'this year'), base it off the dataset max year. "
                    f"If they ask for a month without a year (like 'february'), assume the query applies to the dataset year(s).")
        return "When filtering by date, use the 'date' column with SQLite date functions."

metric_dict = MetricDict()
