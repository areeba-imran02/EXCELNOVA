import { getState, updateSheet } from "../core/state.js";
import { $, escapeHtml, toast, downloadBlob } from "../core/utils.js";

const colName = n => {
  let s = "";
  while (n >= 0) { s = String.fromCharCode(n % 26 + 65) + s; n = Math.floor(n / 26) - 1; }
  return s;
};
function cellValue(row, col, rows, depth = 0) {
  if (depth > 10) return "#CYCLE!";
  const raw = rows[row]?.[col] ?? "";
  if (typeof raw !== "string" || !raw.startsWith("=")) return raw;
  return evaluateFormula(raw.slice(1), rows, depth + 1);
}
function evaluateFormula(expr, rows, depth) {
  const ref = expr.match(/^([A-Z]+)(\d+)$/i);
  if (ref) return Number(cellValue(Number(ref[2])-1, colIndex(ref[1]), rows, depth)) || 0;
  const range = expr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (range) {
    const vals = [];
    for (let r=Number(range[2])-1;r<=Number(range[4])-1;r++)
      for(let c=colIndex(range[1]);c<=colIndex(range[3]);c++) vals.push(Number(cellValue(r,c,rows,depth)) || 0);
    return vals;
  }
  const fn = expr.match(/^(SUM|AVERAGE|COUNT|COUNTA|MAX|MIN)\((.*)\)$/i);
  if (fn) {
    const args = fn[2].split(",").flatMap(part => {
      const m = part.trim().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
      if (m) {
        const vals=[];
        for(let r=+m[2]-1;r<=+m[4]-1;r++) for(let c=colIndex(m[1]);c<=colIndex(m[3]);c++) vals.push(Number(cellValue(r,c,rows,depth))||0);
        return vals;
      }
      const single=part.trim().match(/^([A-Z]+)(\d+)$/i);
      if(single) return [cellValue(+single[2]-1,colIndex(single[1]),rows,depth)];
      const n=Number(part.trim()); return Number.isFinite(n)?[n]:[];
    });
    const nums=fn[1].toUpperCase()==="COUNTA"?args.filter(v=>v!==""&&v!==null):args.map(Number).filter(Number.isFinite);
    switch(fn[1].toUpperCase()){
      case "SUM":return nums.reduce((a,b)=>a+b,0);
      case "AVERAGE":return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0;
      case "COUNT":return nums.length;
      case "COUNTA":return nums.length;
      case "MAX":return nums.length?Math.max(...nums):0;
      case "MIN":return nums.length?Math.min(...nums):0;
    }
  }
  const arithmetic = expr.match(/^([A-Z]+\d+|\d+(?:\.\d+)?)\s*([+\-*/])\s*([A-Z]+\d+|\d+(?:\.\d+)?)$/i);
  if (arithmetic) {
    const value = token => {
      const m=token.match(/^([A-Z]+)(\d+)$/i);
      return m ? Number(cellValue(+m[2]-1,colIndex(m[1]),rows,depth))||0 : Number(token);
    };
    const a=value(arithmetic[1]), b=value(arithmetic[3]);
    if(arithmetic[2]==="/"&&b===0)return "#DIV/0!";
    return arithmetic[2]==="+"?a+b:arithmetic[2]==="-"?a-b:arithmetic[2]==="*"?a*b:a/b;
  }
  return "#NAME?";
}
function colIndex(s){return s.toUpperCase().split("").reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;}
export function resolvedRows(rows=getState().sheet.rows) {
  return rows.map((row,r)=>row.map((_,c)=>cellValue(r,c,rows)));
}
export function getSheetContext() {
  return { name:getState().sheet.name, rows:resolvedRows(), formulas:getState().sheet.rows };
}
export function renderSheet() {
  const host=$("#sheetHost"); if(!host)return;
  const rows=getState().sheet.rows;
  const width=Math.max(1,...rows.map(r=>r.length));
  let html='<table class="sheet"><thead><tr><th class="row-number">#</th>';
  for(let c=0;c<width;c++)html+=`<th>${colName(c)}</th>`;
  html+='</tr></thead><tbody>';
  rows.forEach((row,r)=>{
    html+=`<tr><th class="row-number">${r+1}</th>`;
    for(let c=0;c<width;c++){
      const raw=row[c]??"", val=cellValue(r,c,rows);
      html+=`<td><input data-r="${r}" data-c="${c}" aria-label="${colName(c)}${r+1}" value="${escapeHtml(raw)}" title="Value: ${escapeHtml(val)}"></td>`;
    }
    html+='</tr>';
  });
  html+='</tbody></table>';host.innerHTML=html;
  host.querySelectorAll("input").forEach(input=>{
    input.addEventListener("change",()=>{
      const copy=getState().sheet.rows.map(r=>[...r]);
      const r=+input.dataset.r,c=+input.dataset.c;
      while(copy[r].length<=c)copy[r].push("");
      copy[r][c]=input.value;updateSheet(copy);renderSheet();
      $("#formulaInput").value=input.value;
      $("#cellAddress").textContent=`${colName(c)}${r+1}`;
    });
    input.addEventListener("focus",()=>{
      $("#cellAddress").textContent=`${colName(+input.dataset.c)}${+input.dataset.r+1}`;
      $("#formulaInput").value=input.value;
    });
  });
}
export function mountSheetTools(){
  renderSheet();
  $("#addRow")?.addEventListener("click",()=>{const rows=getState().sheet.rows.map(r=>[...r]);rows.push(Array(rows[0]?.length||5).fill(""));updateSheet(rows);renderSheet();});
  $("#addCol")?.addEventListener("click",()=>{const rows=getState().sheet.rows.map(r=>[...r,""]);updateSheet(rows);renderSheet();});
  $("#applyFormula")?.addEventListener("click",()=>{
    const address=$("#cellAddress").textContent.match(/^([A-Z]+)(\d+)$/);
    if(!address)return toast("Select a cell first.");
    const rows=getState().sheet.rows.map(r=>[...r]);const r=+address[2]-1,c=colIndex(address[1]);
    while(rows.length<=r)rows.push([]);
    while(rows[r].length<=c)rows[r].push("");
    rows[r][c]=$("#formulaInput").value;updateSheet(rows);renderSheet();toast("Cell updated.");
  });
  $("#importFile")?.addEventListener("change",importFile);
  $("#exportCsv")?.addEventListener("click",exportCsv);
  $("#exportXlsx")?.addEventListener("click",exportXlsx);
  $("#clearSheet")?.addEventListener("click",()=>{if(confirm("Clear all sheet data?")){updateSheet([["Column A","Column B"],["",""]]);renderSheet();}});
}
async function importFile(event){
  const file=event.target.files?.[0];if(!file)return;
  if(file.size>8*1024*1024){toast("File is larger than 8 MB.");event.target.value="";return;}
  try{
    const buffer=await file.arrayBuffer();
    let rows;
    if(file.name.toLowerCase().endsWith(".csv")){
      const text=new TextDecoder().decode(buffer);
      rows=parseCsv(text);
    }else{
      if(!window.XLSX)throw new Error("XLSX library did not load. Check your internet connection.");
      const workbook=XLSX.read(buffer,{type:"array"});
      rows=XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]],{header:1,defval:""});
    }
    if(!rows.length)throw new Error("No data found in this file.");
    updateSheet(rows.slice(0,5001).map(r=>r.slice(0,50)));renderSheet();toast("File imported into the current sheet.");
  }catch(e){toast(e.message||"Could not import file.");}
  event.target.value="";
}
function parseCsv(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){field+='"';i++;}
    else if(ch==='"')quoted=!quoted;
    else if(ch===","&&!quoted){row.push(field);field="";}
    else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&next==="\n")i++;row.push(field);rows.push(row);row=[];field="";}
    else field+=ch;
  }
  row.push(field);if(row.some(x=>x!==""))rows.push(row);return rows;
}
function safeCsv(value){
  let s=String(value??"");
  if(/^[\s]*[=+\-@]/.test(s))s="'"+s;
  return `"${s.replace(/"/g,'""')}"`;
}
function exportCsv(){
  const rows=resolvedRows();const csv=rows.map(r=>r.map(safeCsv).join(",")).join("\r\n");
  downloadBlob(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),"excelnova-sheet.csv");
}
function exportXlsx(){
  if(!window.XLSX)return toast("XLSX library not available.");
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(resolvedRows()),"Sheet1");XLSX.writeFile(wb,"excelnova-sheet.xlsx");
}
export function addRowsFromBuilder(headers, sampleRows){
  const rows=[headers,...sampleRows];updateSheet(rows);renderSheet();
}
