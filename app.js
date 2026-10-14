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

  // Budget Studio is stored separately from transactions and savings goals.
  const BUDGET_KEY = "island-ledger-budget-plans-v1";
  const DEFAULT_BUDGET_CATEGORIES = [
    {id:"rent",name:"Rent & bills",amount:100},
    {id:"groceries",name:"Groceries & food",amount:100},
    {id:"car",name:"Car expenses",amount:75},
    {id:"savings",name:"Savings",amount:100},
    {id:"creator",name:"Creator / model",amount:50},
    {id:"ads",name:"Paid advertising",amount:50},
    {id:"other",name:"Other costs",amount:25}
  ];
  let budgetCategories = DEFAULT_BUDGET_CATEGORIES.map(c=>({...c}));
  let budgetPlans = [];
  try {
    const stored = JSON.parse(localStorage.getItem(BUDGET_KEY) || "[]");
    if (Array.isArray(stored)) budgetPlans = stored.filter(p => p && typeof p.id === "string" && typeof p.name === "string" && Number.isFinite(p.total) && Array.isArray(p.categories));
  } catch (e) { console.warn("Could not read saved budget plans", e); }
  const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const budgetTotalInput = $("budgetTotal");
  const distributionMode = $("distributionMode");
  const budgetMessage = $("budgetMessage");
  function saveBudgetPlans() {
    try { localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetPlans)); }
    catch (e) { budgetMessage.textContent = "Browser storage unavailable; this plan may not persist."; }
  }
  function distributeBudget(newTotal, mode) {
    newTotal = Math.max(0, roundMoney(newTotal));
    if (!budgetCategories.length) return;
    if (mode === "equal") {
      const each = Math.floor((newTotal / budgetCategories.length) * 100) / 100;
      let used = 0;
      budgetCategories.forEach((c,i) => { c.amount = i === budgetCategories.length - 1 ? roundMoney(newTotal-used) : each; used += c.amount; });
    } else if (mode === "proportional") {
      const oldTotal = budgetCategories.reduce((sum,c)=>sum+Math.max(0,Number(c.amount)||0),0);
      if (oldTotal <= 0) {
        const each = Math.floor((newTotal / budgetCategories.length) * 100) / 100;
        let used = 0;
        budgetCategories.forEach((c,i) => { c.amount = i === budgetCategories.length - 1 ? roundMoney(newTotal-used) : each; used += c.amount; });
      } else {
        let used = 0;
        budgetCategories.forEach((c,i) => { c.amount = i === budgetCategories.length - 1 ? roundMoney(newTotal-used) : roundMoney(newTotal * c.amount / oldTotal); used += c.amount; });
      }
    }
    renderBudgetCategories();
  }
  function refreshSavedPlanOptions(selectedId="") {
    const select = $("savedBudgetPlans");
    select.replaceChildren();
    const placeholder = el("option", "", "Choose a saved plan"); placeholder.value = ""; select.append(placeholder);
    budgetPlans.forEach(plan => { const option=el("option","",plan.name); option.value=plan.id; select.append(option); });
    select.value = selectedId;
  }
  function renderBudgetSummary() {
    const total = Math.max(0, Number(budgetTotalInput.value) || 0);
    const allocated = roundMoney(budgetCategories.reduce((sum,c)=>sum+(Number(c.amount)||0),0));
    const remaining = roundMoney(total-allocated);
    $("budgetAllocated").textContent = money.format(allocated);
    $("budgetRemaining").textContent = `${remaining < 0 ? "−" : ""}${money.format(Math.abs(remaining))}`;
    $("budgetCategoryCount").textContent = String(budgetCategories.length);
    const status = $("budgetStatus"); status.classList.toggle("over", remaining < -0.009);
    if (remaining < -0.009) status.textContent = `Over budget by ${money.format(Math.abs(remaining))}. Reduce one or more categories.`;
    else if (Math.abs(remaining) < 0.009) status.textContent = "Fully allocated — your budget balances.";
    else status.textContent = `${money.format(remaining)} left to allocate.`;
  }
  function renderBudgetCategories() {
    const list = $("budgetCategories"); list.replaceChildren();
    const total = Math.max(0, Number(budgetTotalInput.value) || 0);
    budgetCategories.forEach(category => {
      const row=el("article","budget-category");
      const top=el("div","budget-category-top");
      const name=el("span","budget-category-name",category.name);
      const amount=document.createElement("input"); amount.type="number"; amount.min="0"; amount.step="0.01"; amount.value=String(roundMoney(category.amount)); amount.setAttribute("aria-label",`${category.name} amount in TTD`);
      amount.addEventListener("input",()=>{category.amount=Math.max(0,roundMoney(Number(amount.value)||0));const range=row.querySelector(".budget-range");range.value=String(Math.min(Number(range.max),category.amount));const pct=row.querySelector(".budget-category-meta strong");pct.textContent=total>0?`${Math.round(category.amount/total*100)}% of budget`:"0% of budget";renderBudgetSummary();});
      amount.addEventListener("change",()=>{amount.value=String(roundMoney(category.amount));});
      const remove=el("button","remove-category","Remove"); remove.type="button"; remove.addEventListener("click",()=>{budgetCategories=budgetCategories.filter(c=>c.id!==category.id);renderBudgetCategories();});
      top.append(name,amount,remove);
      const range=document.createElement("input"); range.className="budget-range"; range.type="range"; range.min="0"; range.max=String(Math.max(100,total*2,Number(category.amount)||0)); range.step="1"; range.value=String(Math.min(Number(range.max),Number(category.amount)||0)); range.setAttribute("aria-label",`Adjust ${category.name}`);
      range.addEventListener("input",()=>{category.amount=roundMoney(Number(range.value));amount.value=String(category.amount);row.querySelector(".budget-category-meta strong").textContent=total>0?`${Math.round(category.amount/total*100)}% of budget`:"0% of budget";renderBudgetSummary();});
      const meta=el("div","budget-category-meta");meta.append(el("span","","Move the slider or enter an amount"),el("strong","",total>0?`${Math.round(category.amount/total*100)}% of budget`:"0% of budget"));
      row.append(top,range,meta);list.append(row);
    });
    renderBudgetSummary();
  }
  budgetTotalInput.addEventListener("change",()=>{
    const total=Math.max(0,roundMoney(Number(budgetTotalInput.value)||0)); budgetTotalInput.value=String(total);
    if(distributionMode.value!=="manual") distributeBudget(total,distributionMode.value); else renderBudgetCategories();
  });
  distributionMode.addEventListener("change",()=>{
    if(distributionMode.value!=="manual") distributeBudget(Number(budgetTotalInput.value)||0,distributionMode.value);
  });
  $("addBudgetCategory").addEventListener("click",()=>{$("newBudgetCategoryForm").hidden=false;$ ("newBudgetCategoryName").focus();});
  $("cancelBudgetCategory").addEventListener("click",()=>{$("newBudgetCategoryForm").reset();$("newBudgetCategoryForm").hidden=true;});
  $("newBudgetCategoryForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("newBudgetCategoryName").value.trim();if(!name)return;
    budgetCategories.push({id:makeId(),name,amount:0});renderBudgetCategories();e.currentTarget.reset();e.currentTarget.hidden=true;budgetMessage.textContent=`Added “${name}”. Set its amount using the slider or amount field.`;
  });
  $("saveBudgetPlan").addEventListener("click",()=>{
    const name=$("budgetPlanName").value.trim();if(!name){budgetMessage.textContent="Enter a name for this budget plan first.";$("budgetPlanName").focus();return;}
    const total=Math.max(0,roundMoney(Number(budgetTotalInput.value)||0));
    const existing=budgetPlans.find(p=>p.name.toLowerCase()===name.toLowerCase());
    const plan={id:existing?existing.id:makeId(),name,total,categories:budgetCategories.map(c=>({...c,amount:roundMoney(c.amount)})),distributionMode:distributionMode.value,updatedAt:Date.now()};
    if(existing) budgetPlans=budgetPlans.map(p=>p.id===existing.id?plan:p);else budgetPlans.push(plan);
    saveBudgetPlans();refreshSavedPlanOptions(plan.id);budgetMessage.textContent=`“${name}” saved in this browser.`;
  });
  $("loadBudgetPlan").addEventListener("click",()=>{
    const plan=budgetPlans.find(p=>p.id===$("savedBudgetPlans").value);if(!plan){budgetMessage.textContent="Choose a saved plan to load.";return;}
    $("budgetPlanName").value=plan.name;budgetTotalInput.value=String(plan.total);budgetCategories=plan.categories.filter(c=>c&&typeof c.id==="string"&&typeof c.name==="string"&&Number.isFinite(Number(c.amount))).map(c=>({...c,amount:Math.max(0,roundMoney(c.amount))}));distributionMode.value=plan.distributionMode||"proportional";renderBudgetCategories();budgetMessage.textContent=`Loaded “${plan.name}”. Changes are not saved until you press Save plan.`;
  });
  $("deleteBudgetPlan").addEventListener("click",()=>{
    const id=$("savedBudgetPlans").value;if(!id){budgetMessage.textContent="Choose a saved plan to delete.";return;}
    const plan=budgetPlans.find(p=>p.id===id);if(!plan)return;
    if(confirm(`Delete the saved budget plan “${plan.name}”?`)){budgetPlans=budgetPlans.filter(p=>p.id!==id);saveBudgetPlans();refreshSavedPlanOptions();budgetMessage.textContent=`Deleted “${plan.name}”. Current unsaved allocations remain on screen.`;}
  });
  refreshSavedPlanOptions();renderBudgetCategories();

  $("clearButton").addEventListener("click",()=>{if(!transactions.length){$("formMessage").textContent="No entries to clear.";return;}if(confirm("Delete all transactions saved in this browser? Savings goals will remain. This cannot be undone.")){transactions=[];saveTransactions();renderTransactions();$("formMessage").textContent="All transactions cleared."; }});
  $("date").value=localDate();$("year").textContent=new Date().getFullYear();renderTransactions();renderGoals();
})();
