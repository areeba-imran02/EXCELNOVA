import { $, escapeHtml, toast } from "../core/utils.js";
import { post } from "../core/api.js";
import { getState } from "../core/state.js";
import { getSheetContext } from "./sheet.js";

function addMessage(role,text,meta=""){
 const log=$("#chatLog");
 const node=document.createElement("div");node.className=`message ${role}`;node.textContent=text;log.appendChild(node);
 if(meta){const m=document.createElement("div");m.className="message-meta";m.textContent=meta;log.appendChild(m);}
 log.scrollTop=log.scrollHeight;
}
function addEvent(event){
 const log=$("#chatLog");const el=document.createElement("div");el.className="agent-event";
 el.textContent=`${event.agent}: ${event.detail}`;log.appendChild(el);log.scrollTop=log.scrollHeight;
}
async function send(message){
 const clean=message.trim();if(!clean)return;
 addMessage("user",clean);$("#chatInput").value="";$("#assistantStatus").textContent="Working...";
 const button=$(".send-btn");button.disabled=true;
 const history=getState().chatHistory.slice(-8);
 try{
   const result=await post("/api/ai/chat",{message:clean,context:{page:getState().activePage,sheet:getSheetContext()},history});
   (result.events||[]).forEach(e=>addEvent({agent:"Gemini Model Router",detail:`${e.model}: ${e.status}`}));
   addMessage("assistant",result.text,`${result.agent} · ${result.model}${result.fallbackUsed?" · fallback model used":""}`);
   const updated=[...history,{role:"user",content:clean},{role:"assistant",content:result.text}];
   // Store only a bounded local conversation history.
   localStorage.setItem("excelnova-chat-history",JSON.stringify(updated.slice(-30)));
 }catch(error){addMessage("assistant",`I couldn't complete that request: ${error.message}`,"Check your Gemini API key, model availability, and quota.");}
 finally{$("#assistantStatus").textContent="Ready to help";button.disabled=false;}
}
export function mountAssistant(){
 try{
   const history=JSON.parse(localStorage.getItem("excelnova-chat-history")||"[]");
   history.slice(-10).forEach(m=>addMessage(m.role==="user"?"user":"assistant",m.content));
 }catch{}
 $("#chatForm").addEventListener("submit",e=>{e.preventDefault();send($("#chatInput").value);});
 document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>send(b.dataset.prompt)));
 document.addEventListener("nova:ask",e=>send(e.detail));
 $("#assistantToggle").addEventListener("click",()=>$("#assistantPanel").classList.toggle("open"));
}
