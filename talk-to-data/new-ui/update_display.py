import os

with open("app/page.tsx", "r") as f:
    code = f.read()

# 1. Add Imports
imports_str = """import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
"""
code = code.replace('import axios from "axios"', imports_str)

# 2. LandingPage: Badge
old_lp_badge = """        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 mb-8">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-purple-300 text-sm font-medium">
            AI-Powered Analytics
          </span>
        </div>"""
new_lp_badge = """        {/* Badge */}
        <Badge variant="outline" className="flex items-center gap-2 px-4 py-1.5 rounded-full border-purple-500/40 bg-purple-500/10 text-purple-300 mb-8">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium">
            AI-Powered Analytics
          </span>
        </Badge>"""
code = code.replace(old_lp_badge, new_lp_badge)

# 3. LandingPage: Feature Cards
old_lp_cards = """        {/* Feature Cards */}
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
        </div>"""
new_lp_cards = """        {/* Feature Cards */}
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
        </div>"""
code = code.replace(old_lp_cards, new_lp_cards)

# 4. UploadPage: Informational Blocks (Cards)
old_up_info = """        {/* Right Column */}
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
        </div>"""

new_up_info = """        {/* Right Column */}
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
        </div>"""
code = code.replace(old_up_info, new_up_info)

with open("app/page.tsx", "w") as f:
    f.write(code)

print("LandingPage and UploadPage cards applied!")
