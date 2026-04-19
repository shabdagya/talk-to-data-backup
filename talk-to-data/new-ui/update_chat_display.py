import os

with open("app/page.tsx", "r") as f:
    code = f.read()

# 1. Update AI Message wrapper to Card
old_ai_msg = """                {msg.type === "ai" && (
                  <div className="max-w-[75%]">
                    <div className="bg-white/[0.06] border border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] px-5 py-4">
                      {/* Header */}"""
new_ai_msg = """                {msg.type === "ai" && (
                  <div className="max-w-[75%]">
                    <Card className="bg-white/[0.06] border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] border text-white">
                      <CardContent className="p-5">
                        {/* Header */}"""
code = code.replace(old_ai_msg, new_ai_msg)

old_ai_footer = """                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
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
                )}"""
new_ai_footer = """                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
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
                      </CardContent>
                    </Card>
                  </div>
                )}"""
code = code.replace(old_ai_footer, new_ai_footer)

# 2. Update Loading Message wrapper to Card
old_load_msg = """                {msg.type === "loading" && (
                  <div className="max-w-[75%]">
                    <div className="bg-white/[0.06] border border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] px-5 py-4">"""
new_load_msg = """                {msg.type === "loading" && (
                  <div className="max-w-[75%]">
                    <Card className="bg-white/[0.06] border-white/10 rounded-[4px] rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] border text-white">
                      <CardContent className="p-5">"""
code = code.replace(old_load_msg, new_load_msg)

old_load_foot = """                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-white/25">Clarifying intent</span>
                        <span className="text-purple-300">Generating SQL</span>
                        <span className="text-white/25">Validating answer</span>
                      </div>
                    </div>
                  </div>
                )}"""
new_load_foot = """                      <div className="flex items-center gap-4 text-xs">
                          <span className="text-white/25">Clarifying intent</span>
                          <span className="text-purple-300">Generating SQL</span>
                          <span className="text-white/25">Validating answer</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}"""
code = code.replace(old_load_foot, new_load_foot)

# 3. Replace Accordion SQL View
old_sql_acc = """                      {/* SQL Collapsible */}
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
                      )}"""
new_sql_acc = """                      {/* SQL Collapsible */}
                      {msg.sql && (
                        <div className="mt-4">
                          <Accordion type="single" collapsible className="w-full border-none">
                            <AccordionItem value="sql" className="border-none">
                              <AccordionTrigger className="py-2 text-white/30 hover:text-white/60 text-xs hover:no-underline justify-start gap-1">
                                View SQL
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="mt-1 bg-black/30 border border-white/[0.08] rounded-xl p-3">
                                  <code className="text-purple-300 text-xs font-mono">
                                    {msg.sql}
                                  </code>
                                  {msg.sqlExplanation && (
                                    <p className="text-white/50 text-xs italic mt-2">
                                      {msg.sqlExplanation}
                                    </p>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}"""
code = code.replace(old_sql_acc, new_sql_acc)

with open("app/page.tsx", "w") as f:
    f.write(code)

print("ChatPage Cards and Accordions updated!")
