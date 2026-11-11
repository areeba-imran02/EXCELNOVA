import { getState } from "../core/state.js";
import { resolvedRows } from "./sheet.js";
import { $, escapeHtml, formatNumber } from "../core/utils.js";

export function calculateProfile(){
  const rows=resolvedRows();if(rows.length<2)return {rowCount:0,columnCount:0,columns:[]};
  const headers=rows[0].map((h,i)=>String(h||`Column ${i+1}`));
  const body=rows.slice(1);
  const columns=headers.map((name,i)=>{
    const vals=body.map(r=>r[i]??"");
    const nonempty=vals.filter(v=>v!==""&&v!==null&&v!==undefined);
    const nums=nonempty.map(Number).filter(n=>Number.isFinite(n));
    const frequencies={};nonempty.forEach(v=>frequencies[String(v)]=(frequencies[String(v)]||0)+1);
    const duplicateCount=Object.values(frequencies).reduce((s,n)=>s+Math.max(0,n-1),0);
    return {name,missing:vals.length-nonempty.length,nonempty:nonempty.length,numeric:nums.length,
      sum:nums.reduce((a,b)=>a+b,0),average:nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null,
      min:nums.length?Math.min(...nums):null,max:nums.length?Math.max(...nums):null,duplicates:duplicateCount,
      type:nums.length===nonempty.length&&nums.length?"Numeric":nonempty.length?"Text / mixed":"Empty"};
  });
  return {rowCount:body.length,columnCount:headers.length,columns};
}
export function renderAnalytics(){
  const host=$("#analysisResults");if(!host)return;
  const p=calculateProfile();
  host.innerHTML=`<div class="grid metric-grid">
    <div class="metric"><small>Data rows</small><strong>${p.rowCount}</strong></div>
    <div class="metric"><small>Columns</small><strong>${p.columnCount}</strong></div>
    <div class="metric"><small>Missing cells</small><strong>${p.columns.reduce((s,c)=>s+c.missing,0)}</strong></div>
  </div><div class="table-wrap"><table class="table"><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Duplicates</th><th>Average</th><th>Min</th><th>Max</th></tr></thead><tbody>
  ${p.columns.map(c=>`<tr><td>${escapeHtml(c.name)}</td><td>${c.type}</td><td>${c.missing}</td><td>${c.duplicates}</td><td>${formatNumber(c.average)}</td><td>${formatNumber(c.min)}</td><td>${formatNumber(c.max)}</td></tr>`).join("")}</tbody></table></div>`;
  return p;
}
