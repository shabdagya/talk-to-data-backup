import os

with open("app/page.tsx", "r") as f:
    code = f.read()

# 1. Update Recharts imports
old_imp = """import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts\""""
new_imp = """import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts\""""
code = code.replace(old_imp, new_imp)

# 2. Add chart_config and data_note mappings inside TalkToData
old_mapping = """          sqlExplanation: res.data.sql_explanation,
          chartData: res.data.results,
          loading: false 
        } : msg"""
new_mapping = """          sqlExplanation: res.data.sql_explanation,
          chartData: res.data.results,
          chart_config: res.data.chart_config,
          data_note: res.data.data_note,
          loading: false 
        } : msg"""
code = code.replace(old_mapping, new_mapping)

# 3. Inject AIResponseCard
ai_card_def = """
function AIResponseCard({ msg, blockedColumns }: { msg: any, blockedColumns?: string[] }) {
  const [copied, setCopied] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    setExportError(false);
    setExportSuccess(false);

    try {
      const response = await fetch(`${API_URL}/export/pdf/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: msg.question || "Follow-up question",
          answer: msg.content,
          confidence: null,
          confidence_label: msg.confidence,
          key_insight: msg.insight,
          data_note: msg.data_note,
          sql_used: msg.sql,
          sql_explanation: msg.sqlExplanation,
          results: msg.chartData,
          chart_config: msg.chart_config,
          blocked_columns: blockedColumns,
          dataset_name: msg.dataset_name,
          row_count: msg.row_count
        })
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'answer-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch(e) {
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(1)}K`;
    return `£${value}`;
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case "high":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-normal shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-amber-500/20 bg-amber-500/10 text-amber-400 font-normal shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-red-500/20 bg-red-500/10 text-red-400 font-normal shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Low
          </Badge>
        )
      default:
        return null
    }
  }

  const renderChart = () => {
    if (!msg.chart_config || msg.chart_config.type === "none" || !msg.chartData) return null;
    const chart_config = msg.chart_config;
    const results = msg.chartData;

    try {
      if (chart_config.type === "single_number") {
        const val = Object.values(results[0])[0] as number;
        const colName = Object.keys(results[0])[0];
        return (
          <div className="flex flex-col mb-4">
            <div className="text-4xl font-bold text-white mb-1">{formatNumber(val)}</div>
            <div className="text-white/50 text-sm uppercase tracking-wider">{colName}</div>
          </div>
        );
      }

      if (chart_config.type === "line") {
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey={chart_config.x_key} tick={{fill: "rgba(255,255,255,0.4)", fontSize: 11}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNumber as any} tick={{fill: "rgba(255,255,255,0.4)", fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => formatNumber(value)} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: "#1a0a2e", borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Line type="monotone" dataKey={chart_config.y_key} stroke="#8b5cf6" strokeWidth={2} dot={{r:3, fill: '#8b5cf6'}} />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      if (chart_config.type === "pie") {
        const COLORS = ["#8b5cf6","#a78bfa","#c4b5fd","#7c3aed","#6d28d9","#5b21b6"];
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={results} dataKey={chart_config.value_key} nameKey={chart_config.name_key}
                  cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                {results.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => formatNumber(value)} contentStyle={{ backgroundColor: "#1a0a2e", borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      if (chart_config.type === "bar") {
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey={chart_config.x_key} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatNumber as any} />
              <Tooltip formatter={(value: number) => formatNumber(value)} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} contentStyle={{ backgroundColor: "#1a0a2e", borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey={chart_config.y_key} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return (
    <div className="max-w-[75%]">
      <Card className="bg-white/[0.06] border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] border text-white">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white/60 text-xs">AI Assistant</span>
            </div>
            {msg.confidence && getConfidenceBadge(msg.confidence)}
          </div>

          {/* Content */}
          <p className="text-white text-sm leading-relaxed mb-3">{msg.content}</p>

          {/* Data Note */}
          {msg.data_note && (
            <div className="bg-amber-500/10 border-l-2 border-amber-400 rounded-r-lg px-3 py-2 mb-4">
              <p className="text-amber-200/80 text-xs">⚠️ {msg.data_note}</p>
            </div>
          )}

          {/* Insight */}
          {msg.insight && (
            <div className="bg-purple-500/10 border-l-2 border-purple-400 rounded-r-lg px-3 py-2 mb-4">
              <p className="text-purple-200 text-sm italic">💡 {msg.insight}</p>
            </div>
          )}

          {/* Chart */}
          {msg.chartData && msg.chart_config?.type !== "none" && (
            <div className="border-t border-white/[0.08] pt-4 mt-4">
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-3">
                {msg.chart_config?.type || "Chart"} Display
              </p>
              {renderChart()}
              {msg.chart_config?.reason && (
                <p className="text-white/40 text-xs italic mt-3">Chart Reason: {msg.chart_config.reason}</p>
              )}
            </div>
          )}

          {/* SQL Collapsible */}
          {msg.sql && (
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full border-none">
                <AccordionItem value="sql" className="border-none">
                  <AccordionTrigger className="py-2 text-white/30 hover:text-white/60 text-xs hover:no-underline justify-start gap-1">
                    View SQL
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-1 bg-black/30 border border-white/[0.08] rounded-xl p-3">
                      <code className="text-purple-300 text-xs font-mono">{msg.sql}</code>
                      {msg.sqlExplanation && (
                        <p className="text-white/50 text-xs italic mt-2">{msg.sqlExplanation}</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              {["Break this down", "Compare periods", "Show top 5"].map((chip) => (
                <button
                  key={chip}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300 hover:translate-x-0.5 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportPDF} 
                disabled={exportLoading}
                className={`flex items-center gap-1 text-xs transition-colors ${exportError ? "text-red-400" : exportSuccess ? "text-emerald-400" : "text-white/40 hover:text-white/70"}`}
              >
                {!exportSuccess && !exportError && <Download className="w-3.5 h-3.5" />}
                {exportLoading ? "Generating..." : exportSuccess ? "✓ Downloaded" : exportError ? "Export failed" : "Export PDF"}
              </button>
              <button
                onClick={handleCopy}
                className="text-white/30 hover:text-white/60 transition-colors"
                style={{ minWidth: "60px", textAlign: "right" }}
              >
                {copied ? (
                  <span className="text-emerald-400 text-xs">✓ Copied</span>
                ) : (
                  <Copy className="w-3.5 h-3.5 inline-block" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChatPage"""
code = code.replace("function ChatPage", ai_card_def)

# 4. Update ChatPage signature and usage
old_chatpage_sig = """function ChatPage({ 
  chatHistory, 
  onNewMessage, 
  schema, 
  blockedColumns,
  onReset,
  onDatasetReport,
  datasetReportLoading
}: { 
  chatHistory: any[], 
  onNewMessage: (q: string) => void, 
  schema?: any, 
  blockedColumns?: string[],
  onReset?: () => void,
  onDatasetReport?: () => void,
  datasetReportLoading?: boolean
}) {"""
new_chatpage_sig = """function ChatPage({ 
  chatHistory, 
  onNewMessage, 
  schema, 
  blockedColumns,
  metrics,
  onReset,
  onDatasetReport,
  datasetReportLoading
}: { 
  chatHistory: any[], 
  onNewMessage: (q: string) => void, 
  schema?: any, 
  blockedColumns?: string[],
  metrics?: any,
  onReset?: () => void,
  onDatasetReport?: () => void,
  datasetReportLoading?: boolean
}) {"""
code = code.replace(old_chatpage_sig, new_chatpage_sig)

old_chat_usage = """        {currentScreen === "chat" && (
          <ChatPage 
             chatHistory={chatHistory} 
             onNewMessage={handleNewMessage} 
             schema={schema} 
             blockedColumns={blockedColumns} 
             onReset={handleReset}
             onDatasetReport={handleDatasetReport}
             datasetReportLoading={datasetReportLoading}
          />
        )}"""
new_chat_usage = """        {currentScreen === "chat" && (
          <ChatPage 
             chatHistory={chatHistory} 
             onNewMessage={handleNewMessage} 
             schema={schema} 
             blockedColumns={blockedColumns} 
             metrics={metrics}
             onReset={handleReset}
             onDatasetReport={handleDatasetReport}
             datasetReportLoading={datasetReportLoading}
          />
        )}"""
code = code.replace(old_chat_usage, new_chat_usage)

# 5. Connect AIResponseCard into the map loop and remove getConfidenceBadge
# First, remove getConfidenceBadge from ChatPage since it's inside AIResponseCard now
get_conf_old = """
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-normal shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-amber-500/20 bg-amber-500/10 text-amber-400 font-normal shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-red-500/20 bg-red-500/10 text-red-400 font-normal shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Low
          </Badge>
        )
      default:
        return null
    }
  }
"""
code = code.replace(get_conf_old, "")

# Now replace the AI msg mapping with the AIResponseCard component
# We have a large block... Let's use substring replacement
start_ai_idx = code.find('{msg.type === "ai" && (')
end_ai_idx = code.find('{msg.type === "loading" && (')
if start_ai_idx != -1 and end_ai_idx != -1:
    old_ai_block = code[start_ai_idx:end_ai_idx]
    new_ai_block = '                {msg.type === "ai" && <AIResponseCard msg={msg} blockedColumns={blockedColumns} />}\n\n                '
    code = code.replace(old_ai_block, new_ai_block)

# Remove `copiedId` state from ChatPage since that was extracted
code = code.replace("  const [copiedId, setCopiedId] = useState<string | null>(null)\n", "")

# 6. Add SchemaPanel Tabs & Metrics rendering inside ChatPage
# Add activeTab state
chatpage_states_old = """  const [inputValue, setInputValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)"""
chatpage_states_new = """  const [inputValue, setInputValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSchemaTab, setActiveSchemaTab] = useState("columns")"""
code = code.replace(chatpage_states_old, chatpage_states_new)

# Replace Schema Section
schema_section_old = """          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Schema Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-purple-500" />
                <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider">
                  Schema
                </p>
              </div>"""
schema_section_new = """          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Schema Tabs */}
            <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setActiveSchemaTab("columns")}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${activeSchemaTab === "columns" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"}`}
              >
                Columns
              </button>
              <button
                onClick={() => setActiveSchemaTab("metrics")}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${activeSchemaTab === "metrics" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"}`}
              >
                Definitions
              </button>
            </div>

            {/* Content Switcher */}
            {activeSchemaTab === "columns" && (
              <div className="space-y-6">
                {/* Schema Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full bg-purple-500" />
                    <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider">
                      Schema
                    </p>
                  </div>"""

schema_section_end_old = """                  PII columns are hidden from queries
                </p>
              </div>
            </div>

            {/* Suggested Questions */}"""
schema_section_end_new = """                  PII columns are hidden from queries
                </p>
              </div>
            </div>
            </div>
            )}

            {activeSchemaTab === "metrics" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-blue-500" />
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider">
                    Custom Metrics
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/[0.06] p-3 space-y-2">
                  {(!metrics || Object.keys(metrics).length === 0) && (
                    <p className="text-white/30 text-xs italic">No custom definitions loaded.</p>
                  )}
                  {metrics && Object.entries(metrics).map(([key, formula]) => (
                    <div key={key} className="py-1">
                      <div className="text-white/80 text-sm font-medium mb-1">{key}</div>
                      <code className="text-purple-300 text-[10px] break-all">{str(formula)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Questions */}"""

# Need to properly replace without breaking
code = code.replace(schema_section_old, schema_section_new)

# Re-implement str(formula) fix inside python literal
schema_section_end_new = schema_section_end_new.replace("str(formula)", "formula as string")

code = code.replace(schema_section_end_old, schema_section_end_new)

with open("app/page.tsx", "w") as f:
    f.write(code)

print("Layer 3 logic injected.")
