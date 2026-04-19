import requests

url = "http://localhost:8000/query"

questions = [
    "Top 5 products by sales?",
    "Why did revenue drop in February?",
    "Show me monthly revenue trend for 2024",
    "What is the average order value?"
]

for q in questions:
    res = requests.post(url, json={"question": q})
    print("-------")
    print("Q:", q)
    try:
        data = res.json()
        print("SQL:", data.get("sql_used", "N/A"))
        print("RESULTS:", data.get("results", []))
    except Exception as e:
        print("Error:", e, res.text)
