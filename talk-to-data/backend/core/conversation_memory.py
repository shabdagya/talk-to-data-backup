class ConversationMemory:
    def __init__(self):
        self.history = []

    def add_turn(self, question, clarified_question, sql, answer, key_insight):
        turn = {
            "question": question,
            "clarified_question": clarified_question,
            "sql": sql,
            "answer": answer,
            "key_insight": key_insight
        }
        self.history.append(turn)
        if len(self.history) > 6:
            self.history.pop(0)

    def get_context_string(self) -> str:
        if not self.history:
            return ""
        
        last_3 = self.history[-3:]
        context_str = "CONVERSATION HISTORY (last 3 turns):\n"
        
        for i, turn in enumerate(last_3, start=1):
            context_str += f"Turn {i}:\n"
            context_str += f"  Question: {turn.get('question')}\n"
            context_str += f"  Answer: {turn.get('answer')}\n"
            context_str += f"  SQL used: {turn.get('sql')}\n\n"
            
        return context_str.strip()

    def get_last_sql(self) -> str | None:
        if not self.history:
            return None
        return self.history[-1].get("sql")

    def clear(self):
        self.history = []

    def has_history(self) -> bool:
        return len(self.history) > 0

conversation_memory = ConversationMemory()
