import { $, $$, toast } from "./core/utils.js";
import { getState, setState } from "./core/state.js";
import { renderPage, navigate } from "./modules/pages.js";
import { mountAssistant } from "./modules/assistant.js";
import { initAuth, showAuthDialog, signOut } from "./modules/auth.js";

async function checkHealth(){
 try{const r=await fetch("/api/health");if(!r.ok)throw new Error();$("#connectionState").innerHTML="<i></i> API connected";}
 catch{$("#connectionState").innerHTML="<i style='background:#e6a23c'></i> API unavailable";}
}
function applyTheme(){
 document.documentElement.dataset.theme=getState().theme||"light";
}
function toggleTheme(){
 const next=getState().theme==="dark"?"light":"dark";setState({theme:next});applyTheme();localStorage.setItem("excelnova-theme",next);
}
async function init(){
 const savedTheme=localStorage.getItem("excelnova-theme");if(savedTheme)setState({theme:savedTheme});
 applyTheme();await initAuth();mountAssistant();checkHealth();
 $("#themeToggle").addEventListener("click",toggleTheme);
 document.addEventListener("nova:theme",toggleTheme);
 document.addEventListener("nova:auth",showAuthDialog);
 $("#authButton").addEventListener("click",()=>getState().user?signOut():showAuthDialog());
 $("#topAuthButton").addEventListener("click",()=>getState().user?signOut():showAuthDialog());
 $("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
 $("#modalClose").addEventListener("click",()=>$("#modalBackdrop").hidden=true);
 $("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")e.currentTarget.hidden=true;});
 $("#mainNav").addEventListener("click",e=>{
   const link=e.target.closest("[data-page]");if(!link)return;e.preventDefault();navigate(link.dataset.page);$("#sidebar").classList.remove("open");
 });
 window.addEventListener("hashchange",()=>renderPage(location.hash.slice(1)||"dashboard"));
 renderPage(location.hash.slice(1)||"dashboard");
}
init();
