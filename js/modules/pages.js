import { getState, setState, persist } from "../core/state.js";
import { $, escapeHtml, toast, formatNumber } from "../core/utils.js";
import { mountSheetTools, getSheetContext, addRowsFromBuilder } from "./sheet.js";
import { renderAnalytics, calculateProfile } from "./analytics.js";
import { mountChart } from "./charts.js";
import { post } from "../core/api.js";

const titleMap={dashboard:"Dashboard",projects:"My Projects",spreadsheet:"Spreadsheet Workspace",builder:"AI Spreadsheet Builder",formula:"Formula Studio",analyst:"Data Analyst",visualization:"Visualization Studio",academy:"Excel Academy",practice:"Practice Lab",reports:"Reports",settings:"Settings"};
function titleBlock(title,desc,action=""){return `<div class="page-title-row"><div><p class="eyebrow">EXCELNOVA AI WORKSPACE</p><h1 class="page-title">${title}</h1><p class="subtext">${desc}</p></div>${action}</div>`;}
export function renderPage(page){
  setState({activePage:page});
  $("#pageCrumb").textContent=titleMap[page]||"Dashboard";
  $("#assistantContext").textContent=titleMap[page]||"Dashboard";
  document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
  const host=$("#pageContent");
  const renderers={dashboard:dashboard,projects:projects,spreadsheet:spreadsheet,builder:builder,formula:formula,analyst:analyst,visualization:visualization,academy:academy,practice:practice,reports:reports,settings:settings};
  host.innerHTML=(renderers[page]||dashboard)();
  bindPage(page);
}
function dashboard(){
 const projects=getState().projects;const rows=getSheetContext().rows;
 return `${titleBlock("Good to see you.","Turn spreadsheet work into clear, confident decisions.",'<button class="btn primary" id="newProject">＋ New project</button>')}
 <section class="hero"><div class="hero-copy"><span class="eyebrow" style="color:#b8c8ff">✦ INTRODUCING EXCELNOVA AI</span><h2>Make your data<br><em>work smarter.</em></h2><p>Build spreadsheets, understand your data, and learn spreadsheet workflows in one intelligent workspace.</p><button class="btn" data-go="spreadsheet">Open spreadsheet →</button></div></section>
 <div class="grid stats"><div class="stat"><small>My projects</small><strong>${projects.length}</strong><span>Saved in this browser</span></div><div class="stat"><small>Current data rows</small><strong>${Math.max(0,rows.length-1)}</strong><span>In active sheet</span></div><div class="stat"><small>Current columns</small><strong>${rows[0]?.length||0}</strong><span>In active sheet</span></div><div class="stat"><small>AI provider</small><strong style="font-size:16px">Gemini</strong><span>Requires your API key</span></div></div>
 <div class="grid two-col"><section class="panel"><div class="panel-head"><div><h3>Quick start</h3><p>Choose what you want to do next.</p></div></div><div class="quick-actions">
 <button class="quick-action" data-go="spreadsheet"><span class="tile-icon">▦</span><span><b>Open spreadsheet</b><small>Edit cells, use formulas, import and export files</small></span>→</button>
 <button class="quick-action" data-go="builder"><span class="tile-icon">✧</span><span><b>Build a sheet with AI</b><small>Generate a starter table from a description</small></span>→</button>
 <button class="quick-action" data-go="analyst"><span class="tile-icon">⌁</span><span><b>Analyse data</b><small>Find missing values and numeric summaries</small></span>→</button></div></section>
 <section class="panel"><div class="panel-head"><div><h3>Recent projects</h3><p>Your saved workspace projects.</p></div><button class="btn" data-go="projects">View all</button></div>${projects.length?projects.slice(-4).reverse().map(p=>`<div class="settings-row"><span>${escapeHtml(p.name)}</span><small>${new Date(p.updatedAt).toLocaleDateString()}</small></div>`).join(""):'<div class="empty"><strong>No saved projects yet</strong>Create a project to keep your work organised.</div>'}</section></div>`;
}
function projects(){
 const list=getState().projects;
 return `${titleBlock("My Projects","Save and reopen your spreadsheet work.",'<button class="btn primary" id="newProject">＋ New project</button>')}
 ${list.length?`<div class="grid cards">${list.map(p=>`<article class="tool-card"><div class="tile-icon">▤</div><h3>${escapeHtml(p.name)}</h3><p>Updated ${new Date(p.updatedAt).toLocaleString()}</p><button class="btn soft" data-open-project="${p.id}">Open project</button> <button class="btn danger" data-delete-project="${p.id}">Delete</button></article>`).join("")}</div>`:'<div class="panel empty"><strong>Your projects will appear here</strong>Create a project to save the current spreadsheet in this browser.</div>'}`;
}
function spreadsheet(){
 return `${titleBlock("Spreadsheet Workspace","Edit cells, calculate supported formulas, and import or export your data.",'<button class="btn primary" id="exportXlsx">Export XLSX</button>')}
 <div class="toolbar"><button class="btn" id="addRow">＋ Row</button><button class="btn" id="addCol">＋ Column</button><label class="btn" for="importFile">Import CSV / XLSX</label><input id="importFile" type="file" accept=".csv,.xlsx,.xls" hidden><button class="btn" id="exportCsv">Export CSV</button><span class="spacer"></span><button class="btn danger" id="clearSheet">Clear sheet</button></div>
 <div class="formula-bar"><label id="cellAddress">A1</label><input class="input" id="formulaInput" placeholder="Enter a value or formula, e.g. =SUM(C2:C6)"><button class="btn primary" id="applyFormula">Apply</button></div>
 <div class="sheet-wrap" id="sheetHost"></div><p class="formula-hint">Supported formulas: SUM, AVERAGE, COUNT, COUNTA, MAX, MIN and simple cell arithmetic (+ − × ÷). This is a limited formula engine, not full Excel compatibility.</p>`;
}
function builder(){
 return `${titleBlock("AI Spreadsheet Builder","Describe a spreadsheet template. Gemini can propose columns and sample rows, which you can edit afterwards.")}
 <section class="panel"><label class="subtext" for="builderPrompt">What spreadsheet do you want to create?</label><textarea class="textarea" id="builderPrompt" placeholder="Example: Create a monthly expense tracker with date, category, description, payment method, amount and notes."></textarea><div class="toolbar" style="margin-top:10px"><button class="btn primary" id="buildSheet">Generate spreadsheet with AI</button><span class="subtext">Requires Gemini API key</span></div><div id="builderResult"></div></section>`;
}
function formula(){
 return `${titleBlock("Formula Studio","Generate and understand spreadsheet formulas using natural language.")}
 <section class="panel"><label class="subtext" for="formulaPrompt">Describe what you want the formula to calculate.</label><textarea class="textarea" id="formulaPrompt" placeholder="Example: Add all values in C2 to C50 only when column B says North."></textarea><div class="toolbar" style="margin-top:10px"><button class="btn primary" id="generateFormula">Generate formula</button></div><div id="formulaResult"></div></section>
 <div class="grid cards" style="margin-top:14px"><article class="tool-card"><h3>SUM</h3><p>Adds numeric values in a range.</p><code>=SUM(B2:B10)</code></article><article class="tool-card"><h3>AVERAGE</h3><p>Calculates the arithmetic mean.</p><code>=AVERAGE(C2:C10)</code></article><article class="tool-card"><h3>COUNT</h3><p>Counts numeric cells.</p><code>=COUNT(A2:A20)</code></article></div>`;
}
function analyst(){
 return `${titleBlock("Data Analyst","Profile the active spreadsheet using actual local calculations.")}
 <section class="panel"><div class="panel-head"><div><h3>Data quality and statistics</h3><p>Missing values, duplicates and numeric summaries.</p></div><button class="btn primary" id="runAnalysis">Run analysis</button></div><div id="analysisResults"></div><div class="toolbar"><button class="btn soft" id="askAiAnalysis">Explain these findings with AI</button></div></section>`;
}
function visualization(){
 return `${titleBlock("Visualization Studio","Create a chart from the current spreadsheet data.")}
 <section class="panel"><div class="toolbar"><label class="subtext">Label column</label><select class="select inline-input" id="labelColumn"></select><label class="subtext">Numeric column</label><select class="select inline-input" id="valueColumn"></select><select class="select inline-input" id="chartType"><option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie</option><option value="doughnut">Doughnut</option></select><button class="btn" id="downloadChart">Download PNG</button></div><div class="chart-box"><canvas id="dataChart"></canvas></div></section>`;
}
const lessons=[
 ["Spreadsheet basics","Understand workbooks, sheets, rows, columns and cells.","A cell is the intersection of a row and a column. Example: B3 means column B, row 3."],
 ["Cell references","Learn relative, absolute and mixed references.","A1 changes when copied. $A$1 stays fixed. A$1 fixes the row; $A1 fixes the column."],
 ["Core formulas","Use SUM, AVERAGE, COUNT, MAX and MIN.","=SUM(B2:B8) adds values from B2 through B8."],
 ["Logical formulas","Use IF to return results based on a condition.","=IF(C2>=50,\"Pass\",\"Try again\") checks whether C2 is at least 50."],
 ["Data cleaning","Find blanks, duplicates and inconsistent values.","Standardise spelling, trim spaces, and review duplicate records before deleting."],
 ["Charts and insights","Choose charts that communicate data clearly.","Use line charts for change over time and bar charts for category comparisons."]
];
function academy(){
 return `${titleBlock("Excel Academy","Short, structured lessons from spreadsheet basics to analysis.")}
 <div class="grid cards">${lessons.map((l,i)=>`<article class="lesson-card"><div class="eyebrow">LESSON ${String(i+1).padStart(2,"0")}</div><h3>${l[0]}</h3><p>${l[1]}</p><button class="btn soft" data-lesson="${i}">Open lesson</button></article>`).join("")}</div><p class="subtext" style="margin-top:12px">Lessons are introductory content in this MVP. Personalised course tracking and expanded assessments remain future work.</p>`;
}
function practice(){
 return `${titleBlock("Practice Lab","Test your spreadsheet knowledge with short questions.")}
 <section class="panel"><div class="eyebrow">QUICK QUIZ</div><h3>Which formula adds all numeric values from B2 through B9?</h3><div class="quick-actions" style="margin-top:12px"><button class="quick-action" data-answer="wrong">=COUNT(B2:B9)</button><button class="quick-action" data-answer="correct">=SUM(B2:B9)</button><button class="quick-action" data-answer="wrong">=AVERAGE(B2:B9)</button></div><div id="quizFeedback" class="subtext"></div></section>`;
}
function reports(){
 const p=calculateProfile();
 return `${titleBlock("Reports","Create a printable summary from the current spreadsheet.")}
 <section class="panel" id="reportArea"><div class="panel-head"><div><h3>Spreadsheet summary</h3><p>Calculated locally from your active sheet.</p></div><button class="btn primary" id="printReport">Print / Save as PDF</button></div>
 <div class="grid metric-grid"><div class="metric"><small>Rows</small><strong>${p.rowCount}</strong></div><div class="metric"><small>Columns</small><strong>${p.columnCount}</strong></div><div class="metric"><small>Missing values</small><strong>${p.columns.reduce((s,c)=>s+c.missing,0)}</strong></div></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>Column</th><th>Type</th><th>Average</th><th>Min</th><th>Max</th><th>Missing</th></tr></thead><tbody>${p.columns.map(c=>`<tr><td>${escapeHtml(c.name)}</td><td>${c.type}</td><td>${formatNumber(c.average)}</td><td>${formatNumber(c.min)}</td><td>${formatNumber(c.max)}</td><td>${c.missing}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function settings(){
 return `${titleBlock("Settings","Manage your local workspace preferences and account connection.")}
 <section class="panel"><div class="settings-row"><span><b>Appearance</b><small>Switch between light and dark mode.</small></span><button class="btn" id="settingsTheme">Toggle theme</button></div>
 <div class="settings-row"><span><b>Account</b><small>Supabase authentication is optional.</small></span><button class="btn" id="settingsAuth">Sign in / Register</button></div>
 <div class="settings-row"><span><b>Gemini model chain</b><small>Configured on the backend. API key is never exposed in this page.</small></span><button class="btn" id="checkModels">Check configuration</button></div>
 <div class="settings-row"><span><b>Local data</b><small>Projects and current sheet are stored in this browser.</small></span><button class="btn danger" id="clearLocal">Reset local data</button></div><div id="settingsResult"></div></section>`;
}
function bindPage(page){
 if(page==="spreadsheet")mountSheetTools();
 if(page==="analyst"){renderAnalytics();$("#runAnalysis").onclick=renderAnalytics;$("#askAiAnalysis").onclick=()=>document.dispatchEvent(new CustomEvent("nova:ask",{detail:"Explain the data profile on the Data Analyst page. Use these calculated values: "+JSON.stringify(calculateProfile())}));}
 if(page==="visualization")mountChart();
 if(page==="builder")$("#buildSheet").onclick=async()=>{
   const prompt=$("#builderPrompt").value.trim();if(!prompt)return toast("Describe the spreadsheet first.");
   const btn=$("#buildSheet");btn.disabled=true;btn.textContent="Generating...";
   try{const result=await post("/api/ai/generate",{task:"spreadsheet_builder",prompt,context:{}});$("#builderResult").innerHTML=`<div class="result-box">${escapeHtml(result.text)}</div><p class="subtext">AI suggestions are text only. Review the proposed columns before using them in your sheet.</p>`;}
   catch(e){toast(e.message);}finally{btn.disabled=false;btn.textContent="Generate spreadsheet with AI";}
 };
 if(page==="formula")$("#generateFormula").onclick=async()=>{
   const prompt=$("#formulaPrompt").value.trim();if(!prompt)return toast("Describe the calculation first.");
   const btn=$("#generateFormula");btn.disabled=true;btn.textContent="Generating...";
   try{const r=await post("/api/ai/generate",{task:"excel_formula",prompt,context:getSheetContext()});$("#formulaResult").innerHTML=`<div class="result-box">${escapeHtml(r.text)}</div>`;}
   catch(e){toast(e.message);}finally{btn.disabled=false;btn.textContent="Generate formula";}
 };
 if(page==="practice")document.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>{$("#quizFeedback").textContent=b.dataset.answer==="correct"?"Correct! SUM adds values in a range.":"Not quite. Try the SUM function.";});
 if(page==="academy")document.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>{const l=lessons[+b.dataset.lesson];alert(`${l[0]}\n\n${l[1]}\n\n${l[2]}`);});
 if(page==="reports")$("#printReport").onclick=()=>window.print();
 if(page==="settings"){
   $("#settingsTheme").onclick=()=>document.dispatchEvent(new Event("nova:theme"));
   $("#settingsAuth").onclick=()=>document.dispatchEvent(new Event("nova:auth"));
   $("#checkModels").onclick=async()=>{try{const r=await fetch("/api/ai/models").then(x=>x.json());$("#settingsResult").innerHTML=`<div class="result-box">API key configured: ${r.keyConfigured?"Yes":"No"}\nModels: ${r.configuredModels.join(" → ")}</div>`;}catch(e){toast(e.message);}};
   $("#clearLocal").onclick=()=>{if(confirm("Reset all local ExcelNova data in this browser?")){localStorage.clear();location.reload();}};
 }
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
 $("#newProject")?.addEventListener("click",createProject);
 document.querySelectorAll("[data-open-project]").forEach(b=>b.onclick=()=>openProject(b.dataset.openProject));
 document.querySelectorAll("[data-delete-project]").forEach(b=>b.onclick=()=>deleteProject(b.dataset.deleteProject));
}
function createProject(){
 const name=prompt("Enter a project name:");if(!name?.trim())return;
 const projects=[...getState().projects,{id:crypto.randomUUID(),name:name.trim(),sheet:structuredClone(getState().sheet),updatedAt:new Date().toISOString()}];
 setState({projects,currentProject:projects.at(-1).id});toast("Project saved in this browser.");navigate("projects");
}
function openProject(id){
 const p=getState().projects.find(x=>x.id===id);if(!p)return;
 setState({sheet:p.sheet,currentProject:id});toast("Project opened.");navigate("spreadsheet");
}
function deleteProject(id){
 if(!confirm("Delete this saved project?"))return;
 setState({projects:getState().projects.filter(p=>p.id!==id)});navigate("projects");toast("Project deleted.");
}
export function navigate(page){if(!titleMap[page])page="dashboard";location.hash=page;renderPage(page);}
