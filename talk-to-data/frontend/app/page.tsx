"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

import {
  Sparkles,
  TrendingUp,
  Zap,
  Lock,
  Upload,
  Shield,
  FileText,
  Database,
  ChevronRight,
  ChevronDown,
  Send,
  Copy,
  Download,
  Code,
  BarChart3,
  X,
  Check,
  Loader2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"

// Types
type Screen = "landing" | "upload" | "chat"
type UploadState = "idle" | "selected" | "analyzing" | "complete"
type MessageType = "user" | "ai" | "loading"

interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: string
  confidence?: "high" | "medium" | "low"
  insight?: string
  chartData?: { region: string; revenue: number }[]
  sql?: string
  sqlExplanation?: string
}

// Sample data for chat
const sampleMessages: Message[] = [
  {
    id: "1",
    type: "user",
    content: "What is the revenue by region?",
    timestamp: "12:44",
  },
  {
    id: "2",
    type: "ai",
    content:
      "The North region leads with £435,830 in revenue (35% of total sales). South follows at £311,250, with East at £224,100 and West at £195,800.",
    timestamp: "12:44",
    confidence: "high",
    insight: "North region generates 35% of all revenue",
    chartData: [
      { region: "North", revenue: 435830 },
      { region: "South", revenue: 311250 },
      { region: "East", revenue: 224100 },
      { region: "West", revenue: 195800 },
    ],
    sql: "SELECT region, SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as revenue FROM data GROUP BY region ORDER BY revenue DESC",
    sqlExplanation:
      "Aggregates completed transaction amounts by region, ordered by total revenue descending.",
  },
  {
    id: "3",
    type: "user",
    content: "Now filter that to Q4",
    timestamp: "12:45",
  },
  {
    id: "4",
    type: "ai",
    content:
      "In Q4 2024, North still leads with £158,200 — up 22% from Q3. South saw a 15% dip at £98,400 in Q4.",
    timestamp: "12:45",
    confidence: "high",
    insight: "Q4 showed strong North performance but South declined",
    chartData: [
      { region: "North", revenue: 158200 },
      { region: "South", revenue: 98400 },
      { region: "East", revenue: 72100 },
      { region: "West", revenue: 54300 },
    ],
    sql: "SELECT region, SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as revenue FROM data WHERE strftime('%m', date) IN ('10','11','12') GROUP BY region ORDER BY revenue DESC",
    sqlExplanation:
      "Filters transactions to Q4 months (Oct-Dec) and aggregates by region.",
  },
  {
    id: "5",
    type: "user",
    content: "Why did South drop in Q4?",
    timestamp: "12:46",
  },
  {
    id: "6",
    type: "loading",
    content: "",
    timestamp: "12:46",
  },
]

const schemaColumns = [
  { name: "order_id", type: "TEXT" },
  { name: "date", type: "TEXT" },
  { name: "region", type: "TEXT" },
  { name: "product", type: "TEXT" },
  { name: "amount", type: "REAL" },
  { name: "quantity", type: "REAL" },
  { name: "status", type: "TEXT" },
  { name: "discount", type: "REAL" },
]

const hiddenColumns = ["customer_name", "email", "phone"]

const suggestedQuestions = [
  "What's the total revenue?",
  "Show top 5 products",
  "Compare Q3 vs Q4",
  "Revenue trend over time",
]

// Components
function Navbar({ screen, onReset, onDatasetReport, datasetReportLoading, schema }: { screen: Screen, onReset?: () => void, onDatasetReport?: () => void, datasetReportLoading?: boolean, schema?: any }) {
  const [showSqlModal, setShowSqlModal] = useState(false)

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">Talk to Data</span>
            {screen === "chat" && (
              <p className="text-white/40 text-xs">{schema?.table_name || "dataset.csv"}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {screen === "chat" ? (
            <>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors">
                <Database className="w-4 h-4" />
                Schema
              </button>
              <button
                onClick={() => setShowSqlModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors"
              >
                <Code className="w-4 h-4" />
                SQL View
              </button>
              <button 
                onClick={onDatasetReport}
                disabled={datasetReportLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors ${datasetReportLoading ? 'opacity-50' : ''}`}
              >
                <BarChart3 className="w-4 h-4" />
                {datasetReportLoading ? 'Generating...' : 'Full Report'}
              </button>
              <button 
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
              >
                Reset
              </button>
            </>
          ) : (
            <button className="px-4 py-2 rounded-lg border border-white text-white text-sm font-medium hover:bg-white hover:text-purple-900 transition-colors">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* SQL Modal */}
      {showSqlModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowSqlModal(false)}
        >
          <div
            className="bg-[#0f0720] border border-white/10 rounded-2xl p-6 max-w-xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg">SQL Query</h3>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/50 text-sm mb-4">
              Last query executed by the AI pipeline
            </p>
            <div className="bg-black/40 border border-white/[0.08] rounded-xl p-4 mb-4">
              <code className="text-purple-300 text-sm font-mono whitespace-pre-wrap">
                {`SELECT region, 
  SUM(CASE WHEN status='completed' 
      THEN amount ELSE 0 END) as revenue 
FROM data 
WHERE strftime('%m', date) IN ('10','11','12') 
GROUP BY region 
ORDER BY revenue DESC`}
              </code>
            </div>
            <div className="mb-6">
              <p className="text-white/40 text-xs mb-1">What this does:</p>
              <p className="text-white/70 text-sm italic">
                Filters transactions to Q4 months (Oct-Dec) and aggregates
                completed order amounts by region, sorted by highest revenue.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border border-purple-500 text-purple-400 text-sm hover:bg-purple-500/10 transition-colors">
                Copy SQL
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-lg text-white/50 text-sm hover:text-white/70 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function LandingPage({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar screen="landing" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Badge */}
        <Badge variant="outline" className="flex items-center gap-2 px-4 py-1.5 rounded-full border-purple-500/40 bg-purple-500/10 text-purple-300 mb-8">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium">
            AI-Powered Analytics
          </span>
        </Badge>

        {/* Headline */}
        <h1 className="text-6xl md:text-7xl font-bold text-white text-center mb-6">
          <span className="text-transparent bg-clip-text [-webkit-text-stroke:2px_white]">
            T
          </span>
          alk to Your Data
        </h1>

        {/* Subheadline */}
        <p className="text-white/65 text-lg text-center max-w-lg leading-relaxed mb-10">
          Transform your data into insights with natural language.
          <br />
          No SQL required. Just ask questions.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4 mb-16">
          <button
            onClick={() => onNavigate("upload")}
            className="px-8 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 hover:scale-105 transition-all"
          >
            Upload CSV
          </button>
          <button
            onClick={() => onNavigate("chat")}
            className="px-8 py-3.5 rounded-xl border border-white text-white font-medium hover:bg-white hover:text-gray-900 transition-all"
          >
            Try Demo
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
          <Card className="bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all text-white border">
            <CardContent className="p-6">
              <div className="w-11 h-11 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Conversational Memory</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Ask follow-up questions naturally. Our AI remembers context and builds on previous queries.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all text-white border">
            <CardContent className="p-6">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Smart Visualizations</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                AI automatically selects the perfect chart type for your data. Line, bar, or pie — we&apos;ve got you covered.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all text-white border">
            <CardContent className="p-6">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">Export Reports</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Download professional PDF reports with charts, insights, and SQL transparency.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-16 text-white/40 text-sm">
          <Lock className="w-4 h-4" />
          <span>PII Protected • Enterprise-Grade Security</span>
        </div>
      </main>
    </div>
  )
}

function UploadPage({ onNavigate, onUploadSuccess }: { onNavigate: (screen: Screen) => void, onUploadSuccess: (schema: any, blockedColumns: string[]) => void }) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile?: File | null) => {
    if (selectedFile) {
      setFile(selectedFile)
      setUploadState("selected")
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return;
    setUploadState("analyzing")
    setError(null)
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadState("complete")
      setTimeout(() => {
        onUploadSuccess(response.data.schema, response.data.blocked_columns);
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || "An error occurred during upload.");
      setUploadState("selected")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar screen="upload" />

      <main className="flex-1 grid lg:grid-cols-[55%_45%] gap-12 p-12">
        {/* Left Column */}
        <div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Upload Your Data
          </h1>
          <p className="text-white/60 text-lg mb-8">
            Drop your CSV file and start asking questions in seconds.
          </p>

          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl h-72 flex flex-col items-center justify-center transition-all ${
              isDragging
                ? "border-purple-400 bg-purple-500/10"
                : uploadState === "idle"
                  ? "border-white/20 bg-white/5"
                  : "border-white/20 bg-white/5"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFileSelect(e.dataTransfer.files?.[0])
            }}
          >
            {uploadState === "idle" && (
              <>
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-white/60" />
                </div>
                <p className="text-white text-xl font-bold mb-1">
                  Drop your CSV here
                </p>
                <p className="text-white/50 text-sm mb-4">
                  or click to browse files
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
                >
                  Select File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                <p className="text-white/30 text-xs mt-4">
                  Maximum file size: 100MB
                </p>
              </>
            )}

            {uploadState === "selected" && (
              <div className="flex flex-col items-center w-full px-8">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 mb-4">
                  <FileText className="w-5 h-5 text-white/60" />
                  <span className="text-white text-sm">sales_data_2025.csv</span>
                  <span className="text-white/40 text-xs">2.4 MB</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-6">
                  <Check className="w-4 h-4" />
                  CSV file ready
                </div>
                <button
                  onClick={handleAnalyze}
                  className="w-full max-w-xs px-8 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
                >
                  Analyse Data →
                </button>
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              </div>
            )}

            {uploadState === "analyzing" && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
                <p className="text-white font-medium mb-6">
                  Analysing your data...
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4" />
                    Reading schema
                  </div>
                  <div className="flex items-center gap-2 text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Detecting sensitive columns...
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <span className="w-2 h-2 rounded-full bg-white/20" />
                    Preparing AI pipeline
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10 text-white border">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">PII Protection Enabled</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We automatically detect and protect personally identifiable information in your data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white border">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Automatic Schema Detection</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Our AI analyses your data structure and creates an optimised query interface.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white border">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Supported Formats</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    CSV files up to 100MB. Your data never leaves the server at any point.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


function AIResponseCard({ msg, blockedColumns, onNewMessage }: { msg: any, blockedColumns?: string[], onNewMessage?: (q: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

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
          confidence: msg.confidenceScore || 0,
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
                  onClick={() => onNewMessage && onNewMessage(chip)}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer"
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

function ChatPage({ 
  chatHistory, 
  onNewMessage, 
  schema, 
  blockedColumns,
  metrics,
  onReset,
  onDatasetReport,
  datasetReportLoading,
  onSummarize
}: { 
  chatHistory: any[], 
  onNewMessage: (q: string) => void, 
  schema?: any, 
  blockedColumns?: string[],
  metrics?: any,
  onReset?: () => void,
  onDatasetReport?: () => void,
  datasetReportLoading?: boolean,
  onSummarize?: () => void
}) {
  const [inputValue, setInputValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSchemaTab, setActiveSchemaTab] = useState("columns")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar screen="chat" schema={schema} onReset={onReset} onDatasetReport={onDatasetReport} datasetReportLoading={datasetReportLoading} />

      <div className="flex-1 flex overflow-hidden">
        {/* Schema Sidebar */}
        <div
          className={`${sidebarOpen ? "w-72" : "w-0"} bg-gradient-to-b from-white/[0.04] to-transparent border-r border-white/[0.08] transition-all duration-300 overflow-hidden flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{schema?.table_name || "sales_data.csv"}</p>
                  <p className="text-white/40 text-xs">{schema?.row_count || 500} rows</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                  </div>
              <div className="bg-black/20 rounded-xl border border-white/[0.06] p-3">
                <div className="space-y-1">
                  {(schema?.columns || schemaColumns).map((col: any) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                    >
                      <span className="text-white/70 text-xs font-mono group-hover:text-white/90 transition-colors">
                        {col.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          col.type === "REAL"
                            ? "bg-purple-500/15 text-purple-300"
                            : "bg-white/[0.06] text-white/40"
                        }`}
                      >
                        {col.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hidden Columns */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-red-500/60" />
                <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider">
                  Protected
                </p>
              </div>
              <div className="bg-red-500/[0.06] rounded-xl border border-red-500/10 p-3">
                <div className="space-y-1">
                  {(blockedColumns || hiddenColumns).map((col: string) => (
                    <div key={col} className="flex items-center gap-2.5 py-1.5 px-2">
                      <Lock className="w-3.5 h-3.5 text-red-400/60" />
                      <span className="text-red-300/50 text-xs font-mono line-through">
                        {col}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-red-300/40 text-[10px] mt-2 px-2">
                  PII columns are hidden from queries
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
                      <code className="text-purple-300 text-[10px] break-all">{formula as string}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-emerald-500/60" />
                <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider">
                  Try Asking
                </p>
              </div>
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 text-xs text-left hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-200 transition-all group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/30 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                    <span className="leading-relaxed">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="px-4 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/30 text-[10px]">
              <Shield className="w-3 h-3" />
              <span>Enterprise-grade security</span>
            </div>
          </div>
        </div>

        {/* Toggle Button (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-r-xl bg-white/[0.04] border border-l-0 border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-r-lg bg-white/5 border border-l-0 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
          style={{ left: sidebarOpen ? "240px" : "0" }}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-bold">Conversation</h2>
            <p className="text-white/50 text-sm">
              Ask follow-up questions naturally
            </p>
          </div>

          {/* Messages */}
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
            chatHistory.map((msg, index) => (
              <div key={msg.id}>
                {/* Follow-up indicator */}
                {index > 0 &&
                  chatHistory[index - 1].type === "ai" &&
                  msg.type === "user" && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-white/25 text-[10px]">
                        — follow-up —
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                  )}

                {msg.type === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-[55%]">
                      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-[18px] rounded-br-[4px] px-4 py-3">
                        <p className="text-white text-sm">{msg.content}</p>
                      </div>
                      <p className="text-white/40 text-[10px] text-right mt-1">
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                )}

                                {msg.type === "ai" && <AIResponseCard msg={msg} blockedColumns={blockedColumns} onNewMessage={onNewMessage} />}

                {msg.type === "loading" && (
                  <div className="max-w-[75%]">
                    <Card className="bg-white/[0.06] border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] border text-white">
                      <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-white/60 text-xs">
                          AI Assistant
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-blue-400/50 text-blue-400 text-xs animate-pulse">
                          Thinking...
                        </span>
                      </div>

                      {/* Shimmer bars */}
                      <div className="space-y-3 mb-4">
                        <div className="h-4 w-[80%] rounded bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
                        <div className="h-4 w-[60%] rounded bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
                        <div className="h-4 w-[72%] rounded bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
                      </div>

                      {/* Status labels */}
                      <div className="flex items-center gap-4 text-xs">
                          <span className="text-white/25">Clarifying intent</span>
                          <span className="text-purple-300">Generating SQL</span>
                          <span className="text-white/25">Validating answer</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="bg-black/30 border-t border-white/[0.06] px-5 py-4">
            <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/50 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim()) {
                      onNewMessage(inputValue.trim());
                      setInputValue("");
                    }
                  }
                }}
                placeholder="Ask a follow-up question..."
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none"
                style={{ maxHeight: "72px" }}
              />
              <button
                disabled={!inputValue.trim()}
                onClick={() => {
                  onNewMessage(inputValue.trim());
                  setInputValue("");
                }}
                className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-white/20 text-xs text-center mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TalkToData() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")

  // App.jsx State Porting
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [blockedColumns, setBlockedColumns] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [datasetReportLoading, setDatasetReportLoading] = useState(false);

  const handleUploadSuccess = async (newSchema: any, newBlockedColumns: string[]) => {
    setSchema(newSchema);
    setBlockedColumns(newBlockedColumns);
    
    try {
      const res = await axios.get(`${API_URL}/metrics`);
      setMetrics(res.data.metrics);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
    
    setSchemaLoaded(true);
    setCurrentScreen("chat");
  };

  const handleReset = async () => {
    try {
      await axios.post(`${API_URL}/reset`);
      setSchemaLoaded(false);
      setSchema(null);
      setBlockedColumns([]);
      setChatHistory([]);
      setMetrics({});
      setCurrentScreen("upload");
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  };

  const handleDatasetReport = async () => {
    setDatasetReportLoading(true);
    try {
      const response = await fetch(`${API_URL}/export/pdf/dataset`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Report generation failed");
    } finally {
      setDatasetReportLoading(false);
    }
  };

  const handleNewMessage = async (question: string) => {
    const loadingId = Date.now().toString();
    const loadingMessage = {
      id: loadingId,
      type: "loading",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loading: true,
      error: null,
      blocked_columns: blockedColumns,
      dataset_name: schema?.table_name || "dataset",
      row_count: schema?.row_count || 0
    };
    
    setChatHistory(prev => [
      ...prev, 
      { id: Date.now().toString() + "_q", type: "user", content: question, timestamp: loadingMessage.timestamp },
      loadingMessage
    ]);

    try {
      const res = await axios.post(`${API_URL}/query`, { question });
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          type: "ai", 
          question: question,
          content: res.data.answer,
          confidence: res.data.confidence_label,
          confidenceScore: res.data.confidence,
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0a1f] to-[#1a0a2e] relative">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Screen toggle buttons */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full p-1">
        {(["landing", "upload", "chat"] as Screen[]).map((screen) => (
          <button
            key={screen}
            onClick={() => setCurrentScreen(screen)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentScreen === screen
                ? "bg-purple-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {screen.charAt(0).toUpperCase() + screen.slice(1)}
          </button>
        ))}
      </div>

      {/* Screens */}
      <div className="pt-14 relative">
        {currentScreen === "landing" && (
          <LandingPage onNavigate={setCurrentScreen} />
        )}
        {currentScreen === "upload" && (
          <UploadPage onNavigate={setCurrentScreen} onUploadSuccess={handleUploadSuccess} />
        )}
        {currentScreen === "chat" && (
          <ChatPage 
             chatHistory={chatHistory} 
             onNewMessage={handleNewMessage} 
             schema={schema} 
             blockedColumns={blockedColumns} 
             metrics={metrics}
             onReset={handleReset}
             onDatasetReport={handleDatasetReport}
             datasetReportLoading={datasetReportLoading}
             onSummarize={handleSummarize}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  )
}
