import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, Any, List

class DBLoader:
    """Manages one SQLite in-memory connection for the session."""

    def __init__(self):
        self.conn = sqlite3.connect(':memory:', check_same_thread=False)
        self.schema = None
        self.table_name = "data"

    def load_csv(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Loads df into SQLite table named 'data' and extracts its schema.
        """
        dtype_mapping = {}
        for col, dtype in df.dtypes.items():
            if pd.api.types.is_numeric_dtype(dtype):
                dtype_mapping[col] = 'REAL'
            else:
                dtype_mapping[col] = 'TEXT'

        df.to_sql(self.table_name, self.conn, if_exists='replace', index=False, dtype=dtype_mapping)

        columns_schema = []
        for col, db_type in dtype_mapping.items():
            columns_schema.append({"name": col, "type": db_type})
        
        sample_values = {}
        for col in df.columns:
            unique_vals = df[col].dropna().unique()
            if len(unique_vals) < 25:
                sample_values[col] = unique_vals.tolist()

        date_range = None
        if 'date' in df.columns:
            date_range = {"min": str(df['date'].min()), "max": str(df['date'].max())}

        temporal_profile = self._compute_temporal_profile(df)

        self.schema = {
            "table_name": self.table_name,
            "row_count": len(df),
            "columns": columns_schema,
            "sample_values": sample_values,
            "date_range": date_range,
            "temporal_profile": temporal_profile
        }

        return self.schema

    def get_schema(self) -> Dict[str, Any]:
        """Returns the loaded schema. Raises ValueError if not loaded."""
        if not self.schema:
            raise ValueError("Data has not been loaded yet.")
        return self.schema

    def execute_query(self, sql: str) -> List[Dict[str, Any]]:
        """Executes a SQL query against the in-memory database."""
        if 'LIMIT' not in sql.upper():
            sql = f"{sql} LIMIT 10"

        cursor = self.conn.cursor()
        cursor.execute(sql)
        
        columns = [description[0] for description in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return results

    def reset(self) -> bool:
        """Closes and recreates the in-memory connection, clears schema."""
        self.conn.close()
        self.conn = sqlite3.connect(':memory:', check_same_thread=False)
        self.schema = None
        return True

    def is_loaded(self) -> bool:
        """Returns True if schema is loaded."""
        return self.schema is not None

    def get_temporal_profile(self) -> Dict[str, Any]:
        """Returns the precomputed temporal profile."""
        if not self.schema:
            return {}
        return self.schema.get("temporal_profile", {})

    def _compute_temporal_profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Pre-computes min/max/mean/std/sum/null_count/zero_count per numeric
        column broken down into overall, by_month, by_quarter, by_year.
        Only computes time breakdowns if a 'date' column is present.
        """
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        if not numeric_cols:
            return {}

        def _safe_stats(series: pd.Series) -> Dict[str, Any]:
            s = series.dropna()
            return {
                "min":        round(float(s.min()), 4) if len(s) else None,
                "max":        round(float(s.max()), 4) if len(s) else None,
                "mean":       round(float(s.mean()), 4) if len(s) else None,
                "std":        round(float(s.std()), 4) if len(s) > 1 else None,
                "sum":        round(float(s.sum()), 4) if len(s) else None,
                "null_count": int(series.isna().sum()),
                "zero_count": int((series == 0).sum()),
            }

        profile: Dict[str, Any] = {}

        has_date = 'date' in df.columns
        if has_date:
            try:
                df = df.copy()
                df['_date'] = pd.to_datetime(df['date'], errors='coerce')
            except Exception:
                has_date = False

        for col in numeric_cols:
            entry: Dict[str, Any] = {}

            # Overall stats
            entry["overall"] = _safe_stats(df[col])

            if has_date:
                valid = df.dropna(subset=['_date'])

                # By Month — only if ≤ 36 distinct months
                monthly = valid.groupby(valid['_date'].dt.to_period('M'))[col]
                if monthly.ngroups <= 36:
                    entry["by_month"] = {
                        str(k): _safe_stats(g) for k, g in monthly
                    }

                # By Quarter — only if ≤ 20 distinct quarters
                quarterly = valid.groupby(valid['_date'].dt.to_period('Q'))[col]
                if quarterly.ngroups <= 20:
                    entry["by_quarter"] = {
                        str(k): _safe_stats(g) for k, g in quarterly
                    }

                # By Year — always included
                yearly = valid.groupby(valid['_date'].dt.year)[col]
                entry["by_year"] = {
                    str(k): _safe_stats(g) for k, g in yearly
                }

            profile[col] = entry

        return profile

db_loader = DBLoader()
