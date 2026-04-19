# Talk to Data - UI Migration Map (Legacy -> Next.js / shadcn)

This document maps the existing legacy React components to their equivalents (or replacements) in the new Next.js (`/new-ui/`) architecture.

## 1. New Additions (`new-ui` only)
The new Next.js project introduces a massive library of modular, atomic UI components using Shadcn UI. These represent your new design system building blocks, replacing raw HTML and CSS.

*   **Layout & Structure:** `accordion`, `aspect-ratio`, `card`, `collapsible`, `drawer`, `resizable`, `scroll-area`, `separator`, `sheet`, `sidebar`.
*   **Forms & Inputs:** `checkbox`, `form`, `input`, `input-otp`, `radio-group`, `select`, `slider`, `switch`, `textarea`, `toggle`, `toggle-group`.
*   **Navigation & Actions:** `breadcrumb`, `button`, `button-group`, `command`, `context-menu`, `dropdown-menu`, `menubar`, `navigation-menu`, `pagination`, `tabs`.
*   **Feedback & Display:** `alert`, `alert-dialog`, `avatar`, `badge`, `calendar`, `carousel`, `chart`, `dialog`, `hover-card`, `label`, `popover`, `progress`, `skeleton`, `sonner`/`toast` (notifications), `spinner`, `table`, `tooltip`.

---

## 2. Components that Overlap (Need Rewiring)
The following old, monolithic components overlap with new primitive design system components. We need to rebuild or wrap your old logic around these new primitives:

*   **`AnswerCard.jsx`**
    *   *Rewires to:* `<Card>` (for the container wrapper), `<Accordion>` (for the "sqlOpen" debugging trace), `<Badge>` (for AI confidence labels), and the new `<Chart>` component (for standardizing Recharts visualizations).
*   **`SchemaPanel.jsx`**
    *   *Rewires to:* `<Sidebar>` or `<Sheet>` (for the sliding left-oriented drawer), `<Tabs>` (to toggle between Columns and Overview/Metrics), and `<Table>` (to elegantly display the SQL architecture).
*   **`ChatWindow.jsx`**
    *   *Rewires to:* `<ScrollArea>` (for auto-scrolling log renderers), `<Input>` + `<Button>` (for the prompt submission), and potentially `<Avatar>` / `<Badge>` for human vs. AI context chips.
*   **`FileUpload.jsx`**
    *   *Rewires to:* `<Card>` (as a dropzone container), `<Spinner>` / `<Progress>` (for the loading hook), and `<Toast>` / `sonner` (for "success" or "error" messages). 

---

## 3. Features with NO Equivalent (Need to be built fresh)
The new UI only contains atomic UI building blocks. It does not currently have any actual feature combinations. The following concepts from `FEATURE_INVENTORY.md` must be built from scratch in Next.js:

*   **The Global Dashboard Layout:** A top-level container mapping to Next.js `app/page.tsx` pulling together the `SchemaPanel` and the main `ChatWindow`.
*   **The Orchestration/Agent State Layer:** All React `useState` hooks listed in the inventory (`schemaLoaded`, `chatHistory`, `metrics`, etc.) need to be rewired. This will likely involve extracting them into React Context or Zustand, bridging between Server and Client components.
*   **PDF Export Engine Connectors:** The custom functions fetching the byte streams (`/export/pdf/dataset` and `/export/pdf/answer`) are not built and will need fully customized buttons/wrappers leveraging the UI primitives.
*   **The Dynamic Chart Switcher:** The system that dynamically determines between `line`, `pie`, `bar`, or `single_number` graphics will need to be rewritten to interface natively with the new shadcn `<Chart>` component.
