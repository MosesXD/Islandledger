(() => {
  const TX_KEY = "island-ledger-transactions-v1";
  const GOAL_KEY = "island-ledger-goals-v1";
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat("en-TT", {style:"currency", currency:"TTD"});
  let transactions = [], goals = [];
  try {
    const saved = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
    if (Array.isArray(saved)) transactions = saved.filter(t => t && typeof t.id==="string" && typeof t.description==="string" && Number.isFinite(t.amount) && t.amount>0 && ["income","expense"].includes(t.type) && typeof t.category==="string" && typeof t.date==="string");
  } catch (e) { console.warn("Could not read saved entries", e); }
  try {
    const saved = JSON.parse(localStorage.getItem(GOAL_KEY) || "[]");
    if (Array.isArray(saved)) goals = saved.filter(g => g && typeof g.id==="string" && typeof g.name==="string" && Number.isFinite(g.target) && g.target>0 && Number.isFinite(g.saved) && g.saved>=0);
  } catch (e) { console.warn("Could not read saved goals", e); }
  const localDate = () => { const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
  function saveTransactions(){ try {localStorage.setItem(TX_KEY,JSON.stringify(transactions));} catch(e){$("formMessage").textContent="Browser storage unavailable; changes may not persist.";}}
  function saveGoals(){ try {localStorage.setItem(GOAL_KEY,JSON.stringify(goals));} catch(e){$("goalMessage") && ($("goalMessage").textContent="Browser storage unavailable; changes may not persist.");}}
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function makeId(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;}
  function renderTransactions(){
    const income=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const expenses=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    $("incomeTotal").textContent=money.format(income);$("expenseTotal").textContent=money.format(expenses);$("balanceTotal").textContent=money.format(income-expenses);
    const list=$("transactionList");list.replaceChildren();$("emptyState").hidden=transactions.length>0;
    [...transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).forEach(t=>{
      const li=el("li","transaction"),info=el("div","transaction-info");
      info.append(el("strong","",t.description),el("small","",`${t.category} · ${t.date}`));
      const amount=el("span",`amount ${t.type}`,`${t.type==="income"?"+":"−"}${money.format(t.amount)}`);
      const remove=el("button","remove","×");remove.type="button";remove.setAttribute("aria-label",`Delete ${t.description}`);
      remove.addEventListener("click",()=>{transactions=transactions.filter(x=>x.id!==t.id);saveTransactions();renderTransactions();});
      li.append(info,amount,remove);list.append(li);
    });
    const totals=new Map();transactions.filter(t=>t.type==="expense").forEach(t=>totals.set(t.category,(totals.get(t.category)||0)+t.amount));
    const area=$("categoryBreakdown");area.replaceChildren();const entries=[...totals.entries()].sort((a,b)=>b[1]-a[1]);
    if(!entries.length){area.textContent="Add an expense to see categories.";return;}
    entries.forEach(([name,value])=>{const row=el("div","category"),head=el("div","category-head");head.append(el("strong","",name),el("span","",money.format(value)));const bar=el("div","bar");const fill=el("span");fill.style.width=`${value/entries[0][1]*100}%`;bar.append(fill);row.append(head,bar);area.append(row);});
  }
  function renderGoals(){
    const list=$("goalsList");list.replaceChildren();$("goalsEmpty").hidden=goals.length>0;
    goals.forEach(g=>{
      const card=el("article","goal-card"),head=el("div","goal-head");
      head.append(el("strong","",g.name),el("span","",`${money.format(g.saved)} / ${money.format(g.target)}`));
      const track=el("div","bar goal-bar"),fill=el("span");fill.style.width=`${Math.min(100,(g.saved/g.target)*100)}%`;track.append(fill);
      const meta=el("div","goal-meta",`${Math.min(100,Math.round(g.saved/g.target*100))}% saved`);
      const actions=el("div","goal-actions"),add=el("button","","Add savings"),remove=el("button","textbutton","Delete");
      add.type="button";remove.type="button";
      add.addEventListener("click",()=>{const raw=prompt(`How much have you added to “${g.name}” (TTD)?`);if(raw===null)return;const amount=Number(raw);if(!Number.isFinite(amount)||amount<=0){alert("Enter an amount greater than zero.");return;}g.saved=Math.round((g.saved+amount)*100)/100;saveGoals();renderGoals();});
      remove.addEventListener("click",()=>{if(confirm(`Delete the savings goal “${g.name}”?`)){goals=goals.filter(x=>x.id!==g.id);saveGoals();renderGoals();}});
      actions.append(add,remove);card.append(head,track,meta,actions);list.append(card);
    });
  }
  $("transactionForm").addEventListener("submit",e=>{
    e.preventDefault();const data=new FormData(e.currentTarget);const description=String(data.get("description")||"").trim();const amount=Number(data.get("amount"));const type=String(data.get("type"));const category=String(data.get("category"));const date=String(data.get("date"));
    if(!description||!Number.isFinite(amount)||amount<=0||!date||!["income","expense"].includes(type)){$("formMessage").textContent="Check the description, amount, type, and date.";return;}
    transactions.push({id:makeId(),description,amount:Math.round(amount*100)/100,type,category,date,createdAt:Date.now()});saveTransactions();renderTransactions();e.currentTarget.reset();$("date").value=localDate();$("formMessage").textContent="Transaction added."; $("description").focus();
  });
  $("goalForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("goalName").value.trim(),target=Number($("goalTarget").value),saved=Number($("goalSaved").value);
    if(!name||!Number.isFinite(target)||target<=0||!Number.isFinite(saved)||saved<0){return;}
    goals.push({id:makeId(),name,target:Math.round(target*100)/100,saved:Math.round(saved*100)/100});
    saveGoals();renderGoals();e.currentTarget.reset();$("goalSaved").value="0";$("goalName").focus();
  });
  $("clearButton").addEventListener("click",()=>{if(!transactions.length){$("formMessage").textContent="No entries to clear.";return;}if(confirm("Delete all transactions saved in this browser? Savings goals will remain. This cannot be undone.")){transactions=[];saveTransactions();renderTransactions();$("formMessage").textContent="All transactions cleared."; }});
  $("date").value=localDate();$("year").textContent=new Date().getFullYear();renderTransactions();renderGoals();
})();
