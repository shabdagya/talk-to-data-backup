import pandas as pd
import numpy as np
import os
import random
from datetime import datetime

def generate_sales_data(filepath="sales_data.csv", num_rows=500):
    np.random.seed(42)
    random.seed(42)
    
    order_ids = [f"ORD-{str(i).zfill(4)}" for i in range(1, num_rows + 1)]
    
    month_weights = {
        1: 1.0, 2: 0.85, 3: 1.0,
        4: 1.0, 5: 1.0, 6: 1.0,
        7: 1.0, 8: 1.0, 9: 1.0,
        10: 1.4, 11: 1.4, 12: 1.4
    }
    
    months = list(month_weights.keys())
    probs = np.array(list(month_weights.values()))
    probs = probs / probs.sum()
    
    sampled_months = np.random.choice(months, size=num_rows, p=probs)
    dates = []
    for m in sampled_months:
        day = np.random.randint(1, 29)
        dates.append(pd.Timestamp(f"2024-{m:02d}-{day:02d}"))
        
    dates.sort()
    
    regions = np.random.choice(
        ['North', 'South', 'East', 'West'], 
        size=num_rows, 
        p=[0.35, 0.25, 0.22, 0.18]
    )
    
    products = np.random.choice(
        ['Product A', 'Product B', 'Product C', 'Product D'],
        size=num_rows,
        p=[0.40, 0.25, 0.20, 0.15]
    )
    
    price_map = {'Product A': 299.99, 'Product B': 149.99, 'Product C': 499.99, 'Product D': 89.99}
    unit_prices = [price_map[p] for p in products]
    
    channels = np.random.choice(['Online', 'Retail', 'Wholesale'], size=num_rows)
    
    names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Michael Brown', 'Emily Davis', 
             'Chris Wilson', 'Sarah Taylor', 'David Anderson', 'Laura Thomas', 'James Jackson']
    salespersons = np.random.choice(names, size=num_rows)
    
    quantities = np.random.randint(1, 51, size=num_rows)
    amounts = np.round(quantities * np.array(unit_prices), 2)
    
    statuses = np.random.choice(['completed', 'pending', 'refunded'], size=num_rows, p=[0.80, 0.12, 0.08])
    
    customer_ids = [f"CUS-{str(np.random.randint(1000, 9999))}" for _ in range(num_rows)]
    
    first_names = ['john', 'sarah', 'mike', 'susan', 'chris', 'jessica', 'matt', 'ashley', 'david', 'amanda']
    last_names = ['smith', 'johnson', 'williams', 'jones', 'brown', 'davis', 'miller', 'wilson', 'moore', 'taylor']
    
    customer_emails = [f"{np.random.choice(first_names)}.{np.random.choice(last_names)}{np.random.randint(1, 100)}@gmail.com" for _ in range(num_rows)]
    customer_ssns = [f"{np.random.randint(100, 999)}-{np.random.randint(10, 99)}-{np.random.randint(1000, 9999)}" for _ in range(num_rows)]
    
    df = pd.DataFrame({
        'order_id': order_ids,
        'date': dates,
        'region': regions,
        'product': products,
        'channel': channels,
        'salesperson': salespersons,
        'quantity': quantities,
        'unit_price': unit_prices,
        'amount': amounts,
        'status': statuses,
        'customer_id': customer_ids,
        'customer_email': customer_emails,
        'customer_ssn': customer_ssns
    })
    
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')
    df.to_csv(filepath, index=False)
    
    total_rows = len(df)
    total_rev = df[df['status'] == 'completed']['amount'].sum()
    rev_by_region = df[df['status'] == 'completed'].groupby('region')['amount'].sum().to_dict()
    
    print("--- Summary Data ---")
    print(f"Total Rows: {total_rows}")
    print(f"Total Revenue (completed): ${total_rev:,.2f}")
    print("Revenue by Region:")
    for r, v in rev_by_region.items():
        print(f"  {r}: ${v:,.2f}")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'sales_data.csv')
    generate_sales_data(output_path)
