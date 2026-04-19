import json
from datetime import datetime

class DatasetSummarizer:
    """Summarizes an SQLite dataset into an aggregated dictionary."""

    def summarize(self, db_loader, metric_dict, groq_client) -> dict:
        """Executes aggregate queries and uses an LLM to generate a narrative."""
        
        # 1. Overview metrics
        ov_sql = '''
        SELECT
          SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as total_revenue,
          COUNT(order_id) as total_orders,
          COUNT(CASE WHEN status='completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status='pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status='refunded' THEN 1 END) as refunds,
          ROUND(COUNT(CASE WHEN status='refunded' THEN 1 END) * 100.0 / COUNT(order_id), 1) as refund_rate,
          ROUND(AVG(CASE WHEN status='completed' THEN amount END), 2) as average_order_value,
          SUM(quantity) as total_units_sold,
          MIN(date) as date_range_start,
          MAX(date) as date_range_end
        FROM data
        '''
        overview_res = db_loader.execute_query(ov_sql)
        overview = overview_res[0] if overview_res else {}

        # 2. Revenue by region
        rg_sql = '''
        SELECT
          region,
          ROUND(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 2) as revenue,
          COUNT(order_id) as orders,
          ROUND(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) * 100.0 /
            SUM(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END)) OVER(), 1) as share_pct
        FROM data
        GROUP BY region
        ORDER BY revenue DESC
        '''
        by_region = db_loader.execute_query(rg_sql)

        # 3. Revenue by product
        pd_sql = '''
        SELECT
          product,
          ROUND(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 2) as revenue,
          SUM(quantity) as units_sold,
          ROUND(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) * 100.0 /
            SUM(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END)) OVER(), 1) as share_pct
        FROM data
        GROUP BY product
        ORDER BY revenue DESC
        '''
        by_product = db_loader.execute_query(pd_sql)

        # 4. Revenue by channel
        ch_sql = '''
        SELECT
          channel,
          ROUND(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 2) as revenue,
          COUNT(order_id) as orders
        FROM data
        GROUP BY channel
        ORDER BY revenue DESC
        '''
        by_channel = db_loader.execute_query(ch_sql)

        # 5. Monthly trend
        mt_sql = '''
        SELECT
          strftime('%Y-%m', date) as month,
          ROUND(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 2) as revenue,
          COUNT(order_id) as orders
        FROM data
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month ASC
        '''
        monthly_trend = db_loader.execute_query(mt_sql)

        # Derive top_performers
        tp = {}
        if by_region:
            tp["top_region"] = by_region[0].get("region", "Unknown")
        if by_product:
            tp["top_product"] = by_product[0].get("product", "Unknown")
        if by_channel:
            tp["top_channel"] = by_channel[0].get("channel", "Unknown")
            
        if monthly_trend:
            best_m = max(monthly_trend, key=lambda x: x.get("revenue", 0))
            worst_m = min(monthly_trend, key=lambda x: x.get("revenue", float('inf')))
            tp["best_month"] = best_m.get("month", "Unknown")
            tp["worst_month"] = worst_m.get("month", "Unknown")

        ai_summary = ""
        try:
            prompt = '''
            You are a data analyst. Write a 3-4 sentence executive summary of this
            sales dataset in plain English for a non-technical business audience.
            Be specific with numbers. Use £ symbol for currency.
            Return ONLY the summary paragraph — no headings, no bullet points.
            '''
            user_msg = json.dumps({
                "overview": overview,
                "top_performers": tp
            })
            response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": user_msg}
                ],
                temperature=0.4,
                max_tokens=300
            )
            ai_summary = response.choices[0].message.content.strip()
        except Exception as e:
             rev = overview.get('total_revenue', 0)
             ordrs = overview.get('total_orders', 0)
             rgn = tp.get('top_region', 'Unknown')
             prd = tp.get('top_product', 'Unknown')
             rate = overview.get('refund_rate', 0)
             ai_summary = f"Total revenue was £{rev:,.2f} from {ordrs} orders. {rgn} was the top region and {prd} was the best product. The refund rate was {rate}%."

        return {
            "overview": overview,
            "by_region": by_region,
            "by_product": by_product,
            "by_channel": by_channel,
            "monthly_trend": monthly_trend,
            "top_performers": tp,
            "ai_summary": ai_summary
        }

dataset_summarizer = DatasetSummarizer()
