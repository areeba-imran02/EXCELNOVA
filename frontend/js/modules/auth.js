import { setState, getState } from "../core/state.js";
import { $, toast } from "../core/utils.js";
let supabaseClient=null;
export async function initAuth(){
  try{
    const cfg=await fetch("/api/config").then(r=>r.json());
    if(cfg.supabaseEnabled&&window.supabase?.createClient){
      supabaseClient=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
      const {data}=await supabaseClient.auth.getSession();
      if(data.session)applyUser(data.session.user);
      supabaseClient.auth.onAuthStateChange((_event,session)=>applyUser(session?.user||null));
    }
  }catch(e){console.warn("Auth configuration unavailable",e);}
  updateProfile();
}
function applyUser(user){setState({user:user?{id:user.id,email:user.email,name:user.user_metadata?.full_name||user.email}:null});updateProfile();}
function updateProfile(){
  const user=getState().user;
  $("#profileName").textContent=user?.name||"Guest User";
  $("#profileMode").textContent=user?"Supabase account":"Local workspace";
  $("#profileAvatar").textContent=user?.name?.slice(0,2).toUpperCase()||"GU";
  $("#topAuthButton").textContent=user?"IN":"GU";
  $("#authButton").title=user?"Sign out":"Sign in";
}
export function showAuthDialog(){
  const modal=document.querySelector("#modalBackdrop");modal.hidden=false;
  document.querySelector("#modalTitle").textContent=getState().user?"Account":"Sign in / Create account";
  document.querySelector("#modalBody").innerHTML=supabaseClient?`
    <form class="modal-form" id="authForm">
      <label>Email<input class="input" type="email" name="email" required autocomplete="email"></label>
      <label>Password<input class="input" type="password" name="password" required minlength="6" autocomplete="current-password"></label>
      <label>Full name (for sign up)<input class="input" name="name" autocomplete="name"></label>
      <button class="btn primary" type="submit">Sign in</button>
      <button class="btn" type="button" id="signUpBtn">Create account</button>
      <p>Supabase email confirmation settings may require you to verify your email before signing in.</p>
    </form>`:`<div class="result-box">Supabase is not configured. ExcelNova is currently using local guest mode. Add SUPABASE_URL and SUPABASE_ANON_KEY to your deployment environment to enable account registration and sign-in.</div>`;
  if(!supabaseClient)return;
  const form=$("#authForm");
  form.addEventListener("submit",async e=>{
    e.preventDefault();const fd=new FormData(form);
    const {error}=await supabaseClient.auth.signInWithPassword({email:fd.get("email"),password:fd.get("password")});
    if(error)return toast(error.message);modal.hidden=true;toast("Signed in.");
  });
  $("#signUpBtn").addEventListener("click",async()=>{
    const fd=new FormData(form);
    const {error}=await supabaseClient.auth.signUp({email:fd.get("email"),password:fd.get("password"),options:{data:{full_name:fd.get("name")||""}}});
    if(error)return toast(error.message);toast("Sign-up submitted. Check your email if confirmation is enabled.");
  });
}
export async function signOut(){
  if(!supabaseClient)return showAuthDialog();
  const {error}=await supabaseClient.auth.signOut();if(error)toast(error.message);else toast("Signed out.");
}
