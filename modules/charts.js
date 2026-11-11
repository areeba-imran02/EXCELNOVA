import { resolvedRows } from "./sheet.js";
import { $ } from "../core/utils.js";
let activeChart;
export function mountChart(){
  const rows=resolvedRows();const canvas=$("#dataChart");if(!canvas)return;
  if(!window.Chart){canvas.parentElement.innerHTML="Chart library unavailable. Check internet connection.";return;}
  const headers=rows[0]||[];const labelSelect=$("#labelColumn"),valueSelect=$("#valueColumn"),typeSelect=$("#chartType");
  labelSelect.innerHTML=headers.map((h,i)=>`<option value="${i}">${String(h||`Column ${i+1}`).replace(/[<>&"]/g,"")}</option>`).join("");
  valueSelect.innerHTML=headers.map((h,i)=>`<option value="${i}">${String(h||`Column ${i+1}`).replace(/[<>&"]/g,"")}</option>`).join("");
  const numericIndex=headers.findIndex((_,i)=>rows.slice(1).some(r=>Number.isFinite(Number(r[i]))&&r[i]!==""));
  if(numericIndex>=0)valueSelect.value=String(numericIndex);
  const draw=()=>{
    const li=+labelSelect.value,vi=+valueSelect.value;
    const totals=new Map();
    rows.slice(1).forEach(r=>{const label=String(r[li]??"Unknown");const value=Number(r[vi]);if(Number.isFinite(value))totals.set(label,(totals.get(label)||0)+value);});
    const labels=[...totals.keys()],data=[...totals.values()];
    if(activeChart)activeChart.destroy();
    activeChart=new Chart(canvas,{type:typeSelect.value,data:{labels,datasets:[{label:String(headers[vi]||"Value"),data,borderWidth:2,backgroundColor:["#246bfd","#7657f6","#28c9d5","#54b68b","#f2a65a","#d66c9c"],borderColor:"#246bfd",tension:.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:typeSelect.value!=="bar"}},scales:{y:{beginAtZero:true}}}});
  };
  [labelSelect,valueSelect,typeSelect].forEach(el=>el.addEventListener("change",draw));draw();
  $("#downloadChart")?.addEventListener("click",()=>{const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="excelnova-chart.png";a.click();});
}
