import re
from typing import Dict, Any

class SQLSafetyChecker:
    """Validates SQL to prevent destructive operations."""

    BLOCKED_KEYWORDS = [
        'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 
        'CREATE', 'TRUNCATE', 'REPLACE', 'MERGE', 'EXEC', 'GRANT', 'REVOKE'
    ]

    def sanitize(self, sql: str) -> str:
        """Strips SQL comments and whitespace."""
        sql = re.sub(r'/\*.*?\*/', '', sql, flags=re.DOTALL)
        sql = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)
        return sql.strip()

    def check(self, sql: str) -> Dict[str, Any]:
        """Checks if the SQL starts with SELECT and contains no blocked keywords."""
        safe_sql = self.sanitize(sql)
        
        if not (safe_sql.upper().startswith('SELECT') or safe_sql.upper().startswith('WITH')):
            return {"safe": False, "reason": "Query must start with SELECT or WITH"}
            
        upper_sql = safe_sql.upper()
        
        for keyword in self.BLOCKED_KEYWORDS:
            pattern = r'\b' + keyword + r'\b'
            if re.search(pattern, upper_sql):
                return {"safe": False, "reason": f"Blocked keyword found: {keyword}"}
                
        return {"safe": True, "reason": "Query is safe"}

sql_safety = SQLSafetyChecker()
