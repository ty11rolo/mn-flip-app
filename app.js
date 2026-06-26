const ids=["address","purchasePrice","arv","sqft","roofSquares","sidingSquares","soffitLf","windows","doors","lvpSqft","paintSqft","kitchenScope","bathScope","miscRepairs","roofPrice","sidingPrice","soffitPrice","windowPrice","doorPrice","lvpPrice","paintPrice","contingencyPct","buyClosing","sellingPct","targetProfit","targetRoi","rent","mortgage","taxes","insurance","utilities","vacancyPct","maintenancePct","targetCashFlow","targetCapRate","demoWeeks","exteriorWeeks","interiorWeeks","punchWeeks","listingWeeks","closingWeeks","holdMortgage","holdTaxes","holdInsurance","holdUtilities","holdLawn","holdMisc"];
const importMap={address:"address",purchasePrice:"purchasePrice",arv:"arv",sqft:"sqft",roofSquares:"roofSquares",sidingSquares:"sidingSquares",soffitLf:"soffitLf",windows:"windows",doors:"doors",lvpSqft:"lvpSqft",paintSqft:"paintSqft",kitchenScope:"kitchenScope",bathScope:"bathScope",miscRepairs:"miscRepairs",rent:"rent",mortgage:"mortgage",taxes:"taxes",insurance:"insurance",utilities:"utilities",demoWeeks:"demoWeeks",exteriorWeeks:"exteriorWeeks",interiorWeeks:"interiorWeeks",punchWeeks:"punchWeeks",listingWeeks:"listingWeeks",closingWeeks:"closingWeeks"};
const $=id=>document.getElementById(id), n=id=>Number($(id).value||0), s=id=>$(id).value;
function money(x){return Number(x||0).toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}
function number(x){return Number(x||0).toLocaleString("en-US",{maximumFractionDigits:0})}
function pct(x){return (Number(x||0)*100).toFixed(1)+"%"}
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function showTab(id,btn){document.querySelectorAll(".tab,.tabbtn").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");btn.classList.add("active")}
function timeline(){
 let weeks=n("demoWeeks")+n("exteriorWeeks")+n("interiorWeeks")+n("punchWeeks")+n("listingWeeks")+n("closingWeeks");
 let months=weeks/4.345;
 let monthly=n("holdMortgage")+n("holdTaxes")+n("holdInsurance")+n("holdUtilities")+n("holdLawn")+n("holdMisc");
 let total=monthly*months;
 $("totalWeeks").textContent=weeks.toFixed(1)+" weeks";
 $("totalMonths").textContent=months.toFixed(1)+" months";
 $("monthlyHoldingCalc").textContent=money(monthly);
 $("timelineHolding").textContent=money(total);
 return {weeks,months,monthly,total};
}
function probabilityFromMetrics(primaryRatio, secondaryRatio, riskPenalty){
 return clamp(Math.round((primaryRatio*60)+(secondaryRatio*30)-riskPenalty+10),0,100);
}
function vote(prob){
 if(prob>=70) return "PASS / STRONG";
 if(prob>=50) return "MAYBE";
 return "DO NOT PASS";
}
function voteClass(prob){
 if(prob>=70) return "good";
 if(prob>=50) return "ok";
 return "bad";
}
function calc(){
 let t=timeline();
 let rehabBase=n("roofSquares")*n("roofPrice")+n("sidingSquares")*n("sidingPrice")+n("soffitLf")*n("soffitPrice")+n("windows")*n("windowPrice")+n("doors")*n("doorPrice")+n("lvpSqft")*n("lvpPrice")+n("paintSqft")*n("paintPrice")+n("kitchenScope")+n("bathScope")+n("miscRepairs");
 let rehab=rehabBase*(1+n("contingencyPct")), purchase=n("purchasePrice"), arv=n("arv");
 let sellingCosts=arv*n("sellingPct");
 let flipInvestment=purchase+rehab+t.total+n("buyClosing");
 let flipProfit=arv-flipInvestment-sellingCosts, flipRoi=flipInvestment?flipProfit/flipInvestment:0, maxOffer=arv*.70-rehab-t.total;
 let rent=n("rent"), vacancy=rent*n("vacancyPct"), maintenance=rent*n("maintenancePct");
 let rentalExpenses=n("mortgage")+n("taxes")+n("insurance")+n("utilities")+vacancy+maintenance;
 let cashFlow=rent-rentalExpenses;
 let noi=(rent-n("taxes")-n("insurance")-n("utilities")-vacancy-maintenance)*12;
 let totalCost=purchase+rehab+n("buyClosing"), capRate=totalCost?noi/totalCost:0;
 let rehabRisk=(rehab/(arv||1))*100;
 let timelineRisk=t.months>6 ? 10 : t.months>4 ? 5 : 0;
 let flipProb=probabilityFromMetrics(flipProfit/(n("targetProfit")||30000), flipRoi/(n("targetRoi")||.15), rehabRisk*.35+timelineRisk);
 let rentalProb=probabilityFromMetrics(cashFlow/(n("targetCashFlow")||250), capRate/(n("targetCapRate")||.06), rehabRisk*.25);
 $("rehabTotal").textContent=money(rehab);$("holdingTotal").textContent=money(t.total);$("flipInvestment").textContent=money(flipInvestment);$("sellingCosts").textContent=money(sellingCosts);$("flipProfit").textContent=money(flipProfit);$("flipRoi").textContent=pct(flipRoi);$("maxOffer").textContent=money(maxOffer);$("cashFlow").textContent=money(cashFlow)+"/mo";$("capRate").textContent=pct(capRate);
 $("dashRehab").textContent=money(rehab);$("dashHolding").textContent=money(t.total);$("dashProfit").textContent=money(flipProfit);$("dashCash").textContent=money(cashFlow)+"/mo";
 $("dashStrategy").textContent = flipProb>=rentalProb ? "Flip: "+vote(flipProb) : "Rental: "+vote(rentalProb);
 $("flipProb").style.width=flipProb+"%"; $("rentalProb").style.width=rentalProb+"%";
 $("flipVote").className="vote "+voteClass(flipProb); $("rentalVote").className="vote "+voteClass(rentalProb);
 $("flipVote").textContent=vote(flipProb)+" — "+flipProb+"%";
 $("rentalVote").textContent=vote(rentalProb)+" — "+rentalProb+"%";
 $("flipExplanation").textContent=`Flip analysis: This deal is estimated to produce ${money(flipProfit)} in profit on a total investment of ${money(flipInvestment)}, which equals a ${pct(flipRoi)} ROI. The score compares that against your current targets of ${money(n("targetProfit"))} profit and ${pct(n("targetRoi"))} ROI, then subtracts risk for a rehab budget of ${money(rehab)} and an estimated ${t.months.toFixed(1)} month holding period. A lower score usually means the purchase price, ARV, rehab cost, or timeline needs to improve before the flip is attractive.`;
 $("rentalExplanation").textContent=`Rental analysis: This property is estimated to cash flow ${money(cashFlow)} per month after mortgage, taxes, insurance, utilities, vacancy, and maintenance. The estimated cap rate is ${pct(capRate)} based on total cost of ${money(totalCost)}. The score compares that against your current targets of ${money(n("targetCashFlow"))}/month cash flow and ${pct(n("targetCapRate"))} cap rate, then adjusts for rehab size because a larger renovation increases risk before the property can start producing income.`;
 $("reportText").textContent=`MN Flip Pro Deal Report

Property: ${s("address")}
Purchase Price: ${money(purchase)}
ARV: ${money(arv)}
Sq Ft: ${number(n("sqft"))}

Rehab Estimate: ${money(rehab)}
Holding Period: ${t.weeks.toFixed(1)} weeks / ${t.months.toFixed(1)} months
Monthly Holding Cost: ${money(t.monthly)}
Total Holding Cost: ${money(t.total)}

Flip Analysis
Total Investment: ${money(flipInvestment)}
Selling Costs: ${money(sellingCosts)}
Expected Profit: ${money(flipProfit)}
ROI: ${pct(flipRoi)}
Max Offer 70% Rule adjusted for holding: ${money(maxOffer)}
Flip Pass Probability: ${flipProb}%
Flip Vote: ${vote(flipProb)}

Rental Analysis
Monthly Rent: ${money(rent)}
Monthly Cash Flow: ${money(cashFlow)}
Cap Rate: ${pct(capRate)}
Rental Pass Probability: ${rentalProb}%
Rental Vote: ${vote(rentalProb)}

Flip Notes:
${$("flipExplanation").textContent}

Rental Notes:
${$("rentalExplanation").textContent}`;
 return {address:s("address"),purchase,arv,rehab,holding:t.total,flipProfit,cashFlow,capRate,flipProb,rentalProb,date:new Date().toLocaleDateString()};
}
function buildPrompt(){
 $("aiPrompt").value=`Analyze this real estate listing as a Minnesota flip/rental deal. I will provide photos/screenshots separately if available.

URL: ${s("listingUrl")}
Address: ${s("aiAddress")}
Price: ${s("aiPrice")}
Sq Ft: ${s("aiSqft")}
Beds/Baths: ${s("aiBedsBaths")}
Listing notes: ${s("aiNotes")}
Photo notes: ${s("photoNotes")}

Return ONLY valid JSON with these exact keys:
{"address":"","purchasePrice":0,"arv":0,"sqft":0,"roofSquares":0,"sidingSquares":0,"soffitLf":0,"windows":0,"doors":0,"lvpSqft":0,"paintSqft":0,"kitchenScope":8500,"bathScope":5500,"miscRepairs":3000,"rent":0,"mortgage":0,"taxes":0,"insurance":0,"utilities":0,"demoWeeks":1,"exteriorWeeks":2,"interiorWeeks":4,"punchWeeks":1,"listingWeeks":2,"closingWeeks":4,"notes":""}

Use kitchenScope only as 0, 3500, 8500, or 15000.
Use bathScope only as 0, 2000, 5500, or 8500.
Be conservative. Estimate material quantities, rental assumptions, and timeline.`;
}
function copyPrompt(){ $("aiPrompt").select(); document.execCommand("copy"); setImportStatus("Prompt copied.", true); }
function cleanJsonText(raw){
 let text=(raw||"").trim();
 text=text.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim();
 const first=text.indexOf("{"), last=text.lastIndexOf("}");
 if(first!==-1 && last!==-1 && last>first){ text=text.slice(first,last+1); }
 text=text.replace(/[“”]/g,'"').replace(/[‘’]/g,"'");
 return text;
}
function parseJsonFromBox(){ const cleaned=cleanJsonText($("aiJson").value); $("aiJson").value=cleaned; return JSON.parse(cleaned); }
function setImportStatus(msg, ok){ $("importStatus").className=ok?"success":"error"; $("importStatus").textContent=msg; }
function validateJsonOnly(){
 try{
  const d=parseJsonFromBox();
  const keys=Object.keys(d), supported=keys.filter(k=>importMap[k]), unsupported=keys.filter(k=>!importMap[k]&&k!=="notes");
  setImportStatus(`Valid JSON ✅
Supported fields found: ${supported.length}
${unsupported.length ? "Ignored fields: "+unsupported.join(", ") : "No unsupported fields."}`, true);
 }catch(e){ setImportStatus(`Invalid JSON ❌
${e.message}`, false); }
}
function importJson(){
 try{
  const d=parseJsonFromBox();
  let updated=[], ignored=[];
  Object.keys(d).forEach(k=>{
    if(importMap[k] && $(importMap[k]) && d[k]!=="" && d[k]!==null && d[k]!==undefined){ $(importMap[k]).value=d[k]; updated.push(k); }
    else if(k!=="notes"){ ignored.push(k); }
  });
  if(d.mortgage!==undefined) $("holdMortgage").value=d.mortgage;
  if(d.taxes!==undefined) $("holdTaxes").value=d.taxes;
  if(d.insurance!==undefined) $("holdInsurance").value=d.insurance;
  if(d.utilities!==undefined) $("holdUtilities").value=d.utilities;
  calc();
  showTab("deal", document.querySelector('[onclick*="deal"]'));
  setImportStatus(`Imported successfully ✅
Updated fields: ${updated.join(", ")}
${ignored.length ? "Ignored fields: "+ignored.join(", ") : ""}`, true);
 }catch(e){ setImportStatus(`Import failed ❌
${e.message}`, false); }
}
function pasteSampleJson(){
 $("aiJson").value=JSON.stringify({"address":"308 17th St NW, Willmar, MN 56201","purchasePrice":145000,"arv":220000,"sqft":1134,"roofSquares":18,"sidingSquares":16,"soffitLf":160,"windows":10,"doors":2,"lvpSqft":900,"paintSqft":2200,"kitchenScope":8500,"bathScope":5500,"miscRepairs":4500,"rent":2200,"mortgage":1732,"taxes":225,"insurance":125,"utilities":250,"demoWeeks":1,"exteriorWeeks":2,"interiorWeeks":4,"punchWeeks":1,"listingWeeks":2,"closingWeeks":4,"notes":"Sample import."}, null, 2);
}
function saveDeal(){let d=calc(), deals=JSON.parse(localStorage.getItem("dealsv8")||"[]");deals.unshift(d);localStorage.setItem("dealsv8",JSON.stringify(deals));renderSaved()}
function renderSaved(){let deals=JSON.parse(localStorage.getItem("dealsv8")||"[]");$("savedDeals").innerHTML=deals.length?deals.map((d,i)=>`<div class="saved-card"><b>${d.address}</b><br>${d.date}<br>Flip probability: ${d.flipProb}% • Rental probability: ${d.rentalProb}%<br>Profit: ${money(d.flipProfit)} • Cash flow: ${money(d.cashFlow)}/mo<br><button onclick="deleteDeal(${i})">Delete</button></div>`).join(""):"No saved deals yet."}
function deleteDeal(i){let deals=JSON.parse(localStorage.getItem("dealsv8")||"[]");deals.splice(i,1);localStorage.setItem("dealsv8",JSON.stringify(deals));renderSaved()}
function clearDeals(){localStorage.removeItem("dealsv8");renderSaved()}
ids.forEach(id=>$(id).addEventListener("input",calc));ids.forEach(id=>$(id).addEventListener("change",calc));calc();renderSaved();buildPrompt();