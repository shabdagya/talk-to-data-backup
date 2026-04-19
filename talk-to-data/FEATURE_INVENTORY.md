# Talk to Data - Codebase Architecture

This document tracks all features, routes, API calls, state variables, and components currently present in the codebase.

## 🚀 Application Features
- **File Upload & Schema Inference:** Drag-and-drop CSV uploading, dynamically extracting basic SQL schemas.
- **Automated PII Filtering:** Auto-detects and drops sensitive columns (e.g. emails, SSNs).
- **Core Orchestration / 3-Agent Pipeline:**
  - **Intent Clarifier:** Prepares the intent and injects ongoing conversational memory.
  - **SQL Generator:** Uses isolated schema structure (never raw data) to generate queries.
  - **Validator & Explainer:** Executes SQLite and interprets results.
- **Conversational Memory:** Preserves multi-turn state (up to 6 turns) so queries can chain together conditionally.
- **Fast-Path Caching:** Skips SQL generation for simple time-series questions leveraging `metric_dict` for sub-second responses.
- **Auto Chart Selection:** Deterministic system interpreting query traits and returning configs to render `line`, `pie`, `bar`, or `single_number` graphics automatically.
- **PDF Reporting Engine (ReportLab):**
  - **Individual Answers:** Generates 4-page PDF breakdowns of specific AI queries highlighting SQL metrics.
  - **Dataset Summaries:** Groq-powered 5-page PDF dataset rundowns of KPI performance.

## 🔗 Backend Routes (`main.py`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/upload` | Loads CSV into SQLite memory, filters PII, and returns schema |
| `POST` | `/query` | Main query handler connecting Groq agent pipelines |
| `GET` | `/schema` | Retrieves current active DB schema |
| `POST` | `/reset` | Flushes DB memory entirely |
| `GET` | `/conversation/history` | Dumps current memory state tracked by `ConversationMemory` |
| `GET` | `/metrics` | Computes overview metrics manually defined in `metric_dict` |
| `POST` | `/summarize` | Runs batch queries to execute the primary dataset summary answer |
| `GET` | `/health` | Application status and schema-loaded flag |
| `POST` | `/export/pdf/answer` | Ingests UI context and returns `StreamingResponse` for Answer PDF |
| `POST` | `/export/pdf/dataset` | Uses `dataset_summarizer` to auto-build and return the full PDF payload |

## ☎️ Frontend API Calls (to Backend)
| Protocol | Target Route | Location |
| :--- | :--- | :--- |
| `axios.post` | `/upload` | `FileUpload.jsx` (Sending `FormData`) |
| `axios.get` | `/metrics` | `App.jsx` (Triggered post-upload) |
| `axios.post` | `/reset` | `App.jsx` |
| `axios.post` | `/query` | `App.jsx` (Payload contains `{ question }`) |
| `axios.post` | `/summarize` | `App.jsx` |
| `fetch` | `/export/pdf/dataset` | `App.jsx` (Awaits byte stream mapping to `<a>` anchor) |
| `fetch` | `/export/pdf/answer` | `AnswerCard.jsx` (Awaits byte stream) |

## 🧠 State Management (React `useState`)
### `App.jsx`
- `schemaLoaded` *(Boolean)* - Validates if UI shows Upload vs Main Dashboard.
- `schema` *(Object)* - Retains column and sample layout.
- `blockedColumns` *(Array)* - Flags dropped headers for the UI Privacy tags.
- `chatHistory` *(Array<Object>)* - Tracks query chains and loading messages.
- `metrics` *(Object)* - Overview KPI numbers.
- `datasetReportLoading` *(Boolean)* - Prevents double-clicking during 15-second dataset generations.

### `FileUpload.jsx`
- `dragActive` *(Boolean)* - CSS hook for file dragging over window.
- `file` *(Object)* - Mounted selected CSV.
- `error` / `loading` / `success` *(Tracking markers)*.

### `SchemaPanel.jsx`
- `activeTab` *(String)* - Toggles between `<Columns>` and `<Overview/Metrics>`.

### `ChatWindow.jsx`
- `input` *(String)* - Live tracking over user prompt textbox.

### `AnswerCard.jsx`
- `sqlOpen` *(Boolean)* - Toggles accordion for SQL code trace.
- `copied` *(Boolean)* - Flag to trigger "✓ Copied" delay icon.
- `exportLoading` / `exportError` / `exportSuccess` - State toggles for immediate PDF exports.

## 🖥 React UI Components
- **`App`**: Layout controller rendering correct component views based on loaded state.
- **`FileUpload`**: Centered file dropping component triggering `/upload`. 
- **`SchemaPanel`**: Left-oriented drawer exposing the SQL architecture representation to the user natively alongside privacy actions.
- **`ChatWindow`**: Reusable log renderer utilizing arrays of queries alongside built-in `Context Chips` handling dynamic questioning states.
- **`AnswerCard`**: Complex payload renderer digesting AI Confidence Labels (`success`/`loading`/`error`), Recharts auto-visualizing (`LineChart`/`BarChart`/`PieChart`), and SQL debugging parameters.
