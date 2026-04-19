"use client"

import { useState, useRef, useEffect } from "react"
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
function Navbar({ screen }: { screen: Screen }) {
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
              <p className="text-white/40 text-xs">sales_data_2025.csv</p>
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
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors">
                <BarChart3 className="w-4 h-4" />
                Full Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors">
                <Download className="w-4 h-4" />
                Export
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
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 mb-8">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-purple-300 text-sm font-medium">
            AI-Powered Analytics
          </span>
        </div>

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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Conversational Memory</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Ask follow-up questions naturally. Our AI remembers context and
              builds on previous queries.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Smart Visualizations</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              AI automatically selects the perfect chart type for your data.
              Line, bar, or pie — we&apos;ve got you covered.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Export Reports</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Download professional PDF reports with charts, insights, and SQL
              transparency.
            </p>
          </div>
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

function UploadPage({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    setUploadState("selected")
  }

  const handleAnalyze = () => {
    setUploadState("analyzing")
    setTimeout(() => {
      setUploadState("complete")
      setTimeout(() => {
        onNavigate("chat")
      }, 500)
    }, 2500)
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
              handleFileSelect()
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
                  onChange={handleFileSelect}
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">
                  PII Protection Enabled
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  We automatically detect and protect personally identifiable
                  information in your data.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">
                  Automatic Schema Detection
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Our AI analyses your data structure and creates an optimised
                  query interface.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Supported Formats</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  CSV files up to 100MB. Your data never leaves the server at
                  any point.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ChatPage() {
  const [messages] = useState<Message[]>(sampleMessages)
  const [inputValue, setInputValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSql, setExpandedSql] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            High
          </span>
        )
      case "medium":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Medium
          </span>
        )
      case "low":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Low
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar screen="chat" />

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
                  <p className="text-white text-sm font-semibold">sales_data.csv</p>
                  <p className="text-white/40 text-xs">500 rows</p>
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
                  {schemaColumns.map((col) => (
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
                  {hiddenColumns.map((col) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>

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
            {messages.map((msg, index) => (
              <div key={msg.id}>
                {/* Follow-up indicator */}
                {index > 0 &&
                  messages[index - 1].type === "ai" &&
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

                {msg.type === "ai" && (
                  <div className="max-w-[75%]">
                    <div className="bg-white/[0.06] border border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] px-5 py-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-white/60 text-xs">
                            AI Assistant
                          </span>
                        </div>
                        {msg.confidence && getConfidenceBadge(msg.confidence)}
                      </div>

                      {/* Content */}
                      <p className="text-white text-sm leading-relaxed mb-3">
                        {msg.content}
                      </p>

                      {/* Insight */}
                      {msg.insight && (
                        <div className="bg-purple-500/10 border-l-2 border-purple-400 rounded-r-lg px-3 py-2 mb-4">
                          <p className="text-purple-200 text-sm italic">
                            💡 {msg.insight}
                          </p>
                        </div>
                      )}

                      {/* Chart */}
                      {msg.chartData && (
                        <div className="border-t border-white/[0.08] pt-4 mt-4">
                          <p className="text-white/30 text-[9px] uppercase tracking-wider mb-3">
                            Bar Chart
                          </p>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={msg.chartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.06)"
                              />
                              <XAxis
                                dataKey="region"
                                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                              />
                              <YAxis
                                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                                tickFormatter={(v) =>
                                  `£${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1a0a2e",
                                  border: "1px solid rgba(255,255,255,0.15)",
                                  borderRadius: "8px",
                                  color: "white",
                                  fontSize: "12px",
                                }}
                                formatter={(value: number) => [
                                  `£${value.toLocaleString()}`,
                                  "Revenue",
                                ]}
                              />
                              <Bar
                                dataKey="revenue"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* SQL Collapsible */}
                      {msg.sql && (
                        <div className="mt-4">
                          <button
                            onClick={() =>
                              setExpandedSql(
                                expandedSql === msg.id ? null : msg.id
                              )
                            }
                            className="flex items-center gap-1 text-white/30 text-xs hover:text-white/60 transition-colors"
                          >
                            View SQL{" "}
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${expandedSql === msg.id ? "rotate-180" : ""}`}
                            />
                          </button>
                          {expandedSql === msg.id && (
                            <div className="mt-2 bg-black/30 border border-white/[0.08] rounded-xl p-3">
                              <code className="text-purple-300 text-xs font-mono">
                                {msg.sql}
                              </code>
                              {msg.sqlExplanation && (
                                <p className="text-white/50 text-xs italic mt-2">
                                  {msg.sqlExplanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          {["Break this down", "Compare periods", "Show top 5"].map(
                            (chip) => (
                              <button
                                key={chip}
                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300 hover:translate-x-0.5 transition-all"
                              >
                                {chip}
                              </button>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            Export PDF
                          </button>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="text-white/30 hover:text-white/60 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <span className="text-emerald-400 text-xs">
                                ✓ Copied
                              </span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {msg.type === "loading" && (
                  <div className="max-w-[75%]">
                    <div className="bg-white/[0.06] border border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] px-5 py-4">
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
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="bg-black/30 border-t border-white/[0.06] px-5 py-4">
            <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/50 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a follow-up question..."
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none"
                style={{ maxHeight: "72px" }}
              />
              <button
                disabled={!inputValue.trim()}
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
          <UploadPage onNavigate={setCurrentScreen} />
        )}
        {currentScreen === "chat" && <ChatPage />}
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
