import os

with open("app/page.tsx", "r") as f:
    code = f.read()

# 1. Update catch block and add handleSummarize
old_catch = """    } catch (err: any) {
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          type: "ai",
          content: err.response?.data?.error || "Failed to fetch answer. Please try again.",
          loading: false 
        } : msg
      ));
    }
  };"""

new_catch = """    } catch (err: any) {
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          type: "ai",
          content: "Failed to load response.",
          error: err.response?.data?.error || "Failed to fetch answer. Please try again.",
          loading: false 
        } : msg
      ));
    }
  };

  const handleSummarize = async () => {
    const loadingId = Date.now().toString();
    const loadingMessage = {
      id: loadingId,
      type: "loading",
      content: "Generate Executive Summary",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loading: true,
      error: null,
      blocked_columns: blockedColumns,
      dataset_name: schema?.table_name || "dataset",
      row_count: schema?.row_count || 0
    };
    
    setChatHistory(prev => [...prev, loadingMessage]);

    try {
      const res = await axios.post(`${API_URL}/summarize`);
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          type: "ai", 
          content: res.data.answer,
          confidence: res.data.confidence_label,
          insight: res.data.key_insight,
          sql: res.data.sql_used,
          sqlExplanation: res.data.sql_explanation,
          chartData: res.data.results,
          chart_config: res.data.chart_config,
          data_note: res.data.data_note,
          loading: false 
        } : msg
      ));
    } catch (err: any) {
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          type: "ai",
          content: "Summary failed.",
          error: err.response?.data?.error || "Failed to generate summary.",
          loading: false 
        } : msg
      ));
    }
  };"""

code = code.replace(old_catch, new_catch)

# 2. Add AIResponseCard error UI
old_aicard_top = """  const [exportSuccess, setExportSuccess] = useState(false);

  const handleCopy = () => {"""

new_aicard_top = """  const [exportSuccess, setExportSuccess] = useState(false);

  if (msg.error) {
    return (
      <div className="max-w-[75%] mt-4">
        <Card className="bg-red-500/10 border-red-500/20 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] border text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400 text-sm">⚠</span>
              <h3 className="font-bold text-red-300 text-sm">Could not answer this question</h3>
            </div>
            <p className="text-red-200/80 text-xs">{msg.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCopy = () => {"""

code = code.replace(old_aicard_top, new_aicard_top)

# 3. ChatPage signature
old_chatpage_sig = """  onReset?: () => void,
  onDatasetReport?: () => void,
  datasetReportLoading?: boolean
}) {"""
new_chatpage_sig = """  onReset?: () => void,
  onDatasetReport?: () => void,
  datasetReportLoading?: boolean,
  onSummarize?: () => void
}) {"""

code = code.replace(old_chatpage_sig, new_chatpage_sig)

# 4. TalkToData mapping
old_chat_usage = """             metrics={metrics}
             onReset={handleReset}
             onDatasetReport={handleDatasetReport}
             datasetReportLoading={datasetReportLoading}
          />"""
new_chat_usage = """             metrics={metrics}
             onReset={handleReset}
             onDatasetReport={handleDatasetReport}
             datasetReportLoading={datasetReportLoading}
             onSummarize={handleSummarize}
          />"""

code = code.replace(old_chat_usage, new_chat_usage)

# 5. Empty State Mapping
old_chatpage_map = """          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatHistory.map((msg, index) => ("""
new_chatpage_map = """          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 fade-in mt-12">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Ask a question about your data</h2>
                <p className="text-sm text-white/50 mb-8">Try: 'What is revenue by region?' or 'Show me monthly trends'</p>
                <button 
                  onClick={onSummarize}
                  className="px-6 py-3 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 hover:border-purple-400 focus:outline-none transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Executive Summary
                </button>
              </div>
            ) : (
            chatHistory.map((msg, index) => ("""

code = code.replace(old_chatpage_map, new_chatpage_map)

# 6. Close parenthesis for chat map
old_chatpage_map_end = """              </div>
            ))}
            <div ref={messagesEndRef} />"""
new_chatpage_map_end = """              </div>
            ))}
            )}
            <div ref={messagesEndRef} />"""

code = code.replace(old_chatpage_map_end, new_chatpage_map_end)


with open("app/page.tsx", "w") as f:
    f.write(code)

print("Layer 4 logic injected.")
