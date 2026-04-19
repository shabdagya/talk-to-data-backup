import sys

with open("app/page.tsx", "r") as f:
    code = f.read()

# 1. Imports
code = code.replace(
    'import { useState, useRef, useEffect } from "react"',
    'import { useState, useRef, useEffect } from "react"\\nimport axios from "axios"\\n\\nconst API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"\\n'
)

# 2. Navbar props & buttons
code = code.replace(
    'function Navbar({ screen }: { screen: Screen }) {',
    'function Navbar({ screen, onReset, onDatasetReport, datasetReportLoading, schema }: { screen: Screen, onReset?: () => void, onDatasetReport?: () => void, datasetReportLoading?: boolean, schema?: any }) {'
)
code = code.replace(
    '<p className="text-white/40 text-xs">sales_data_2025.csv</p>',
    '<p className="text-white/40 text-xs">{schema?.table_name || "dataset.csv"}</p>'
)
code = code.replace(
    '''              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors">
                <BarChart3 className="w-4 h-4" />
                Full Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>''',
    '''              <button 
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
              </button>'''
)

# 3. UploadPage functions
old_upload = """  const [uploadState, setUploadState] = useState<UploadState>("idle")
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
  }"""
new_upload = """  const [uploadState, setUploadState] = useState<UploadState>("idle")
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
  }"""
code = code.replace(old_upload, new_upload)
code = code.replace(
    'function UploadPage({ onNavigate }: { onNavigate: (screen: Screen) => void }) {',
    'function UploadPage({ onNavigate, onUploadSuccess }: { onNavigate: (screen: Screen) => void, onUploadSuccess: (schema: any, blockedColumns: string[]) => void }) {'
)
code = code.replace('onChange={handleFileSelect}', 'onChange={(e) => handleFileSelect(e.target.files?.[0])}')
code = code.replace(
    '''            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFileSelect()
            }}''',
    '''            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFileSelect(e.dataTransfer.files?.[0])
            }}'''
)
code = code.replace(
    '''                <button
                  onClick={handleAnalyze}
                  className="w-full max-w-xs px-8 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
                >
                  Analyse Data →
                </button>''',
    '''                <button
                  onClick={handleAnalyze}
                  className="w-full max-w-xs px-8 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
                >
                  Analyse Data →
                </button>
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}'''
)

# 4. ChatPage layout changes
code = code.replace(
    'function ChatPage() {',
    'function ChatPage({ chatHistory, onNewMessage, schema, blockedColumns }: { chatHistory: any[], onNewMessage: (q: string) => void, schema?: any, blockedColumns?: string[] }) {'
)
code = code.replace('const [messages] = useState<Message[]>(sampleMessages)\\n', '')
code = code.replace('messages.map(', 'chatHistory.map(')
code = code.replace('messages[index - 1]', 'chatHistory[index - 1]')
code = code.replace('[messages]', '[chatHistory]') 

# Update schema rendering
code = code.replace(
    '''                  <p className="text-white text-sm font-semibold">sales_data.csv</p>
                  <p className="text-white/40 text-xs">500 rows</p>''',
    '''                  <p className="text-white text-sm font-semibold">{schema?.table_name || "sales_data.csv"}</p>
                  <p className="text-white/40 text-xs">{schema?.row_count || 500} rows</p>'''
)
code = code.replace('schemaColumns.map((col)', '(schema?.columns || schemaColumns).map((col: any)')
code = code.replace('hiddenColumns.map((col)', '(blockedColumns || hiddenColumns).map((col: string)')

# 5. Navbar calls
code = code.replace('<Navbar screen="landing" />', '<Navbar screen="landing" />') # safe no-op
code = code.replace('<Navbar screen="upload" />', '<Navbar screen="upload" />')
code = code.replace(
    '<Navbar screen="chat" />',
    '<Navbar screen="chat" schema={schema} onReset={() => {}} />' # We'll fix this in TalkToData
)

with open("app/page.tsx", "w") as f:
    f.write(code)

print("Page updated!")
