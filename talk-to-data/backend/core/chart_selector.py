class ChartSelector:
    def _get_first_numeric_column(self, results) -> str | None:
        if not results:
            return None
        first_row = results[0]
        for key, value in first_row.items():
            if isinstance(value, (int, float)):
                return key
        return None

    def _get_first_text_column(self, results) -> str | None:
        if not results:
            return None
        first_row = results[0]
        for key, value in first_row.items():
            if isinstance(value, str):
                return key
        return None

    def select(self, question: str, clarified_intent: dict, results: list[dict]) -> dict:
        if not results or len(results) < 2:
            return {"type": "none", "reason": "insufficient data"}
        
        # Check for single numeric result
        if len(results) == 1 and len(results[0]) == 1:
            val = list(results[0].values())[0]
            if isinstance(val, (int, float)):
                return {"type": "single_number", "reason": "single value result"}
        elif len(results) == 1: # Single row with potentially multiple columns but only one is numeric and no text?
             num_cols = [k for k, v in results[0].items() if isinstance(v, (int, float))]
             text_cols = [k for k, v in results[0].items() if isinstance(v, str)]
             if len(text_cols) == 0 and len(num_cols) == 1:
                 return {"type": "single_number", "reason": "single value result"}

        q_lower = question.lower()
        dimensions = clarified_intent.get("dimensions", [])
        if not isinstance(dimensions, list):
            dimensions = []
        
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
            x_key = None
            for key in results[0].keys():
                 if any(tk in key.lower() for tk in time_keywords):
                     x_key = key
                     break
            if not x_key:
                x_key = self._get_first_text_column(results) or list(results[0].keys())[0]
                
            y_key = self._get_first_numeric_column(results)
            if x_key and y_key:
                return {
                    "type": "line", 
                    "x_key": x_key, 
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

        # Default to bar chart
        x_key = self._get_first_text_column(results)
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
