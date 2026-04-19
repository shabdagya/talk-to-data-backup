class ChartSelector:
    def _get_first_numeric_column(self, results) -> str | None:
        if not results:
            return None
        first_row = results[0]
        for key, value in first_row.items():
            if isinstance(value, (int, float)):
                return key
        return None

    def _get_all_numeric_columns(self, results) -> list[str]:
        if not results:
            return []
        first_row = results[0]
        return [k for k, v in first_row.items() if isinstance(v, (int, float))]

    def _get_first_text_column(self, results) -> str | None:
        if not results:
            return None
        first_row = results[0]
        for key, value in first_row.items():
            if isinstance(value, str):
                return key
        return None

    def select(self, question: str, clarified_intent: dict, results: list[dict]) -> dict:
        if not results:
            return {"type": "none", "reason": "insufficient data"}
        
        # Check for single numeric result
        if len(results) == 1 and len(results[0]) == 1:
            val = list(results[0].values())[0]
            if isinstance(val, (int, float)):
                return {"type": "single_number", "reason": "single value result"}
        elif len(results) == 1:
             num_cols = [k for k, v in results[0].items() if isinstance(v, (int, float))]
             text_cols = [k for k, v in results[0].items() if isinstance(v, str)]
             if len(text_cols) == 0 and len(num_cols) == 1:
                 return {"type": "single_number", "reason": "single value result"}

        # Need at least 2 rows for multi-row charts
        if len(results) < 2:
            return {"type": "none", "reason": "insufficient data for chart"}

        q_lower = question.lower()
        dimensions = clarified_intent.get("dimensions", [])
        if not isinstance(dimensions, list):
            dimensions = []

        # ── Detect comparison queries with multiple numeric columns ────────
        # e.g. "compare revenue of march and july by region" returns:
        #   region | march_revenue | july_revenue
        compare_keywords = {"compare", "vs", "versus", "comparison", "against",
                            "difference", "relative"}
        is_comparison = any(kw in q_lower for kw in compare_keywords)

        num_cols = self._get_all_numeric_columns(results)
        x_key = self._get_first_text_column(results)

        if is_comparison and len(num_cols) >= 2 and x_key:
            return {
                "type": "grouped_bar",
                "x_key": x_key,
                "y_keys": num_cols,
                "reason": "comparison across multiple metrics"
            }
        
        # Detect time-based
        time_keywords = ["month", "date", "week", "year", "period", "day"]
        q_time_keywords = ["trend", "over time", "monthly", "weekly", "quarterly", "growth"]
        
        has_time_col = any(
             any(tk in k.lower() for tk in time_keywords) for k in results[0].keys()
        )
        has_time_dim = any(
             any(tk in str(d).lower() for tk in time_keywords) for d in dimensions
        )
        has_q_time = any(qkw in q_lower for qkw in q_time_keywords)
        
        if has_time_col or has_time_dim or has_q_time:
            t_x_key = None
            for key in results[0].keys():
                 if any(tk in key.lower() for tk in time_keywords):
                     t_x_key = key
                     break
            if not t_x_key:
                t_x_key = self._get_first_text_column(results) or list(results[0].keys())[0]
                
            y_key = self._get_first_numeric_column(results)
            if t_x_key and y_key:
                # If there are multiple numeric columns in time data, use grouped bar
                if len(num_cols) >= 2 and x_key:
                    return {
                        "type": "grouped_bar",
                        "x_key": t_x_key,
                        "y_keys": num_cols,
                        "reason": "time-based comparison of multiple metrics"
                    }
                return {
                    "type": "line", 
                    "x_key": t_x_key, 
                    "y_key": y_key, 
                    "reason": "time series data"
                }

        # Detect proportion/breakdown
        pie_keywords = ["breakdown", "composition", "share", "proportion", "percentage", "split", "makeup", "distribution"]
        if any(kw in q_lower for kw in pie_keywords) and len(results) <= 6:
            name_key = self._get_first_text_column(results)
            value_key = self._get_first_numeric_column(results)
            if name_key and value_key:
                return {
                    "type": "pie", 
                    "name_key": name_key, 
                    "value_key": value_key, 
                    "reason": "proportional breakdown"
                }

        # Multiple numeric columns → grouped bar even without explicit "compare"
        if len(num_cols) >= 2 and x_key:
            return {
                "type": "grouped_bar",
                "x_key": x_key,
                "y_keys": num_cols,
                "reason": "multiple metrics per category"
            }

        # Default to bar chart
        y_key = self._get_first_numeric_column(results)
        if x_key and y_key:
            return {
                "type": "bar", 
                "x_key": x_key, 
                "y_key": y_key, 
                "reason": "comparison of categories"
            }
            
        return {"type": "none", "reason": "could not map data to chart format"}

chart_selector = ChartSelector()
