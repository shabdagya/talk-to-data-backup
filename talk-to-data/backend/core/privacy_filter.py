import pandas as pd
from typing import Tuple, List

class PrivacyFilter:
    """Detects and removes sensitive columns from a pandas DataFrame."""

    BLOCKED_KEYWORDS = [
        'ssn', 'email', 'phone', 'password', 'dob', 'birth', 'address',
        'credit', 'card', 'national_id', 'passport', 'ip_address', 'salary',
        'secret', 'token', 'pin', 'username', 'first_name', 'last_name', 'name'
    ]

    def get_blocked_columns(self, df: pd.DataFrame) -> List[str]:
        """Returns a list of column names that would be blocked."""
        blocked_cols = []
        for col in df.columns:
            col_lower = str(col).lower()
            for keyword in self.BLOCKED_KEYWORDS:
                if keyword in col_lower:
                    blocked_cols.append(col)
                    break
        return blocked_cols

    def filter_columns(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Removes blocked columns from df, returns both (filtered_df, list_of_blocked_column_names)."""
        blocked_cols = self.get_blocked_columns(df)
        filtered_df = df.drop(columns=blocked_cols)
        return filtered_df, blocked_cols

privacy_filter = PrivacyFilter()
