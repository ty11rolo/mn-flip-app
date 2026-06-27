const ids=["address","purchasePrice","arv","sqft","pricingMode","roofSquares","sidingSquares","soffitLf","windows","doors","lvpSqft","paintSqft","kitchenScope","bathScope","miscRepairs","roofPrice","sidingPrice","soffitPrice","windowPrice","doorPrice","lvpPrice","paintPrice","contingencyPct","buyClosing","sellingPct","targetProfit","targetRoi","rent","mortgage","taxes","insurance","utilities","vacancyPct","maintenancePct","targetCashFlow","targetCapRate","demoWeeks","exteriorWeeks","interiorWeeks","punchWeeks","listingWeeks","closingWeeks","holdMortgage","holdTaxes","holdInsurance","holdUtilities","holdLawn","holdMisc"];
const importMap={address:"address",purchasePrice:"purchasePrice",arv:"arv",sqft:"sqft",roofSquares:"roofSquares",sidingSquares:"sidingSquares",soffitLf:"soffitLf",windows:"windows",doors:"doors",lvpSqft:"lvpSqft",paintSqft:"paintSqft",miscRepairs:"miscRepairs",rent:"rent",mortgage:"mortgage",taxes:"taxes",insurance:"insurance",utilities:"utilities",demoWeeks:"demoWeeks",exteriorWeeks:"exteriorWeeks",interiorWeeks:"interiorWeeks",punchWeeks:"punchWeeks",listingWeeks:"listingWeeks",closingWeeks:"closingWeeks"};
const $=id=>document.getElementById(id), n=id=>Number($(id).value||0), s=id=>$(id).value;
const kitchenCosts={0:{diy:0,hybrid:0,contractor:0},1:{diy:3500,hybrid:5500,contractor:8500},2:{diy:8500,hybrid:13000,contractor:22000},3:{diy:15000,hybrid:23000,contractor:38000}};
const bathCosts={0:{diy:0,hybrid:0,contractor:0},1:{diy:2000,hybrid:3500,contractor:6500},2:{diy:5500,hybrid:8500,contractor:14000},3:{diy:8500,hybrid:13000,contractor:22000}};
function money(x){return Number(x||0).toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}
function number(x){return Number(x||0).toLocaleString("en-US",{maximumFractionDigits:0})}
function pct(x){return (Number(x||0)*100).toFixed(1)+"%"}
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function showTab(id,btn){document.querySelectorAll(".tab,.tabbtn").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");btn.classList.add("active")}
function modeLabel(mode){return mode==="diy"?"DIY":mode==="hybrid"?"Hybrid":"Contractor"}
function modeMultipliers(mode){
 if(mode==="diy") return {roof:1,siding:1,soffit:1,windows:1,doors:1,lvp:1,paint:1,misc:1};
 if(mode==="hybrid") return {roof:2.4,siding:2.2,soffit:2.0,windows:1.65,doors:1.55,lvp:1.75,paint:1.8,misc:1.35};
 return {roof:3.6,siding:3.4,soffit:3.0,windows:2.25,doors:2.1,lvp:2.6,paint:3.0,misc:1.75};
}
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
function categoryCosts(mode){
 const m=modeMultipliers(mode);
 const k=Number($("kitchenScope").value||0), b=Number($("bathScope").value||0);
 return {
  roof:n("roofSquares")*n("roofPrice")*m.roof,
  siding:n("sidingSquares")*n("sidingPrice")*m.siding,
  soffit:n("soffitLf")*n("soffitPrice")*m.soffit,
  windows:n("windows")*n("windowPrice")*m.windows,
  doors:n("doors")*n("doorPrice")*m.doors,
  flooring:n("lvpSqft")*n("lvpPrice")*m.lvp,
  paint:n("paintSqft")*n("paintPrice")*m.paint,
  kitchen:kitchenCosts[k][mode],
  bathroom:bathCosts[b][mode],
  misc:n("miscRepairs")*m.misc
 };
}
function rehabCost(mode){
 const c=categoryCosts(mode);
 const subtotal=Object.values(c).reduce((a,b)=>a+b,0);
 return {subtotal,contingency:subtotal*n("contingencyPct"),total:subtotal*(1+n("contingencyPct")),categories:c};
}
function probabilityFromMetrics(primaryRatio,secondaryRatio,riskPenalty){return clamp(Math.round((primaryRatio*60)+(secondaryRatio*30)-riskPenalty+10),0,100)}
function vote(prob){if(prob>=70)return"PASS / STRONG";if(prob>=50)return"MAYBE";return"DO NOT PASS"}
function voteClass(prob){if(prob>=70)return"good";if(prob>=50)return"ok";return"bad"}
function analyzeMode(mode){
 const t=timeline(), r=rehabCost(mode), purchase=n("purchasePrice"), arv=n("arv");
 const sellingCosts=arv*n("sellingPct");
 const flipInvestment=purchase+r.total+t.total+n("buyClosing");
 const flipProfit=arv-flipInvestment-sellingCosts;
 const flipRoi=flipInvestment?flipProfit/flipInvestment:0;
 const maxOffer=arv*.70-r.total-t.total;
 const rent=n("rent"), vacancy=rent*n("vacancyPct"), maintenance=rent*n("maintenancePct");
 const cashFlow=rent-(n("mortgage")+n("taxes")+n("insurance")+n("utilities")+vacancy+maintenance);
 const noi=(rent-n("taxes")-n("insurance")-n("utilities")-vacancy-maintenance)*12;
 const totalCost=purchase+r.total+n("buyClosing");
 const capRate=totalCost?noi/totalCost:0;
 const rehabRisk=(r.total/(arv||1))*100, timelineRisk=t.months>6?10:t.months>4?5:0;
 const flipProb=probabilityFromMetrics(flipProfit/(n("targetProfit")||30000),flipRoi/(n("targetRoi")||.15),rehabRisk*.35+timelineRisk);
 const rentalProb=probabilityFromMetrics(cashFlow/(n("targetCashFlow")||250),capRate/(n("targetCapRate")||.06),rehabRisk*.25);
 return {mode,t,rehab:r,sellingCosts,flipInvestment,flipProfit,flipRoi,maxOffer,cashFlow,noi,capRate,flipProb,rentalProb};
}
function calc(){
 const mode=s("pricingMode"), a=analyzeMode(mode);
 $("rehabTotal").textContent=money(a.rehab.total);$("holdingTotal").textContent=money(a.t.total);$("flipInvestment").textContent=money(a.flipInvestment);$("sellingCosts").textContent=money(a.sellingCosts);$("flipProfit").textContent=money(a.flipProfit);$("flipRoi").textContent=pct(a.flipRoi);$("maxOffer").textContent=money(a.maxOffer);$("cashFlow").textContent=money(a.cashFlow)+"/mo";$("capRate").textContent=pct(a.capRate);
 $("dashMode").textContent=modeLabel(mode);$("dashRehab").textContent=money(a.rehab.total);$("dashProfit").textContent=money(a.flipProfit);$("dashCash").textContent=money(a.cashFlow)+"/mo";
 $("flipProb").style.width=a.flipProb+"%"; $("rentalProb").style.width=a.rentalProb+"%";
 $("flipVote").className="vote "+voteClass(a.flipProb); $("rentalVote").className="vote "+voteClass(a.rentalProb);
 $("flipVote").textContent=vote(a.flipProb)+" — "+a.flipProb+"%"; $("rentalVote").textContent=vote(a.rentalProb)+" — "+a.rentalProb+"%";
 $("flipExplanation").textContent=`Flip analysis (${modeLabel(mode)} mode): Rehab is estimated at ${money(a.rehab.total)} and holding costs are ${money(a.t.total)}. Total investment is ${money(a.flipInvestment)} before selling costs, with estimated selling costs of ${money(a.sellingCosts)}. Based on an ARV of ${money(n("arv"))}, expected flip profit is ${money(a.flipProfit)} and ROI is ${pct(a.flipRoi)}. The probability compares this to your target profit and ROI, then reduces the score for rehab size and timeline risk.`;
 $("rentalExplanation").textContent=`Rental analysis (${modeLabel(mode)} mode): Estimated cash flow is ${money(a.cashFlow)} per month after mortgage, taxes, insurance, utilities, vacancy, and maintenance. The estimated cap rate is ${pct(a.capRate)}. The probability compares this to your cash-flow and cap-rate targets, then reduces the score when the rehab cost is large compared with ARV.`;
 renderScenarios(); renderReport(a);
 return {address:s("address"),mode,rehab:a.rehab.total,flipProfit:a.flipProfit,cashFlow:a.cashFlow,flipProb:a.flipProb,rentalProb:a.rentalProb,date:new Date().toLocaleDateString()};
}
function renderScenarios(){
 $("scenarioRows").innerHTML=["diy","hybrid","contractor"].map(mode=>{const a=analyzeMode(mode);return `<tr><td><b>${modeLabel(mode)}</b></td><td>${money(a.rehab.total)}</td><td>${money(a.flipInvestment)}</td><td>${money(a.flipProfit)}</td><td>${pct(a.flipRoi)}</td><td>${money(a.cashFlow)}/mo</td><td>${pct(a.capRate)}</td><td><span class="pill ${voteClass(a.flipProb)}">${vote(a.flipProb)} ${a.flipProb}%</span></td><td><span class="pill ${voteClass(a.rentalProb)}">${vote(a.rentalProb)} ${a.rentalProb}%</span></td></tr>`}).join("");
 const cats=["roof","siding","soffit","windows","doors","flooring","paint","kitchen","bathroom","misc"];
 $("breakdownRows").innerHTML=cats.map(cat=>`<tr><td><b>${cat.charAt(0).toUpperCase()+cat.slice(1)}</b></td><td>${money(categoryCosts("diy")[cat])}</td><td>${money(categoryCosts("hybrid")[cat])}</td><td>${money(categoryCosts("contractor")[cat])}</td></tr>`).join("");
}
function renderReport(a){
 $("reportText").textContent=`MN Flip Pro v10 Deal Report

Property: ${s("address")}
Purchase Price: ${money(n("purchasePrice"))}
ARV: ${money(n("arv"))}
Sq Ft: ${number(n("sqft"))}
Selected Pricing Mode: ${modeLabel(s("pricingMode"))}

Selected Mode Analysis
Rehab Estimate: ${money(a.rehab.total)}
Holding Period: ${a.t.weeks.toFixed(1)} weeks / ${a.t.months.toFixed(1)} months
Monthly Holding Cost: ${money(a.t.monthly)}
Total Holding Cost: ${money(a.t.total)}

Flip Analysis
Total Investment: ${money(a.flipInvestment)}
Selling Costs: ${money(a.sellingCosts)}
Expected Profit: ${money(a.flipProfit)}
ROI: ${pct(a.flipRoi)}
Max Offer 70% Rule adjusted for holding: ${money(a.maxOffer)}
Flip Pass Probability: ${a.flipProb}%
Flip Vote: ${vote(a.flipProb)}

Rental Analysis
Monthly Rent: ${money(n("rent"))}
Monthly Cash Flow: ${money(a.cashFlow)}
Cap Rate: ${pct(a.capRate)}
Rental Pass Probability: ${a.rentalProb}%
Rental Vote: ${vote(a.rentalProb)}

Scenario Comparison
DIY Rehab: ${money(analyzeMode("diy").rehab.total)} | Flip Profit: ${money(analyzeMode("diy").flipProfit)}
Hybrid Rehab: ${money(analyzeMode("hybrid").rehab.total)} | Flip Profit: ${money(analyzeMode("hybrid").flipProfit)}
Contractor Rehab: ${money(analyzeMode("contractor").rehab.total)} | Flip Profit: ${money(analyzeMode("contractor").flipProfit)}

Flip Notes:
${$("flipExplanation").textContent}

Rental Notes:
${$("rentalExplanation").textContent}`;
}
function buildPrompt(){
 $("aiPrompt").value=`Analyze this real estate listing as a Minnesota flip/rental deal. I will provide photos/screenshots separately if available.

URL/reference: ${s("listingUrl")}
Address: ${s("aiAddress")}
Price: ${s("aiPrice")}
Sq Ft: ${s("aiSqft")}
Beds/Baths: ${s("aiBedsBaths")}
Listing notes: ${s("aiNotes")}
Photo notes: ${s("photoNotes")}

Return ONLY valid JSON with these exact keys:
{"address":"","purchasePrice":0,"arv":0,"sqft":0,"roofSquares":0,"sidingSquares":0,"soffitLf":0,"windows":0,"doors":0,"lvpSqft":0,"paintSqft":0,"kitchenScope":2,"bathScope":2,"miscRepairs":3000,"rent":0,"mortgage":0,"taxes":0,"insurance":0,"utilities":0,"demoWeeks":1,"exteriorWeeks":2,"interiorWeeks":4,"punchWeeks":1,"listingWeeks":2,"closingWeeks":4,"notes":""}

Use kitchenScope only as 0 none, 1 light, 2 medium, 3 full.
Use bathScope only as 0 none, 1 light, 2 full, 3 higher-end.
Be conservative. Estimate material quantities, rental assumptions, and timeline.`;
}
function copyPrompt(){ $("aiPrompt").select(); document.execCommand("copy"); setImportStatus("Prompt copied.", true); }
function cleanJsonText(raw){let text=(raw||"").trim();text=text.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim();const first=text.indexOf("{"),last=text.lastIndexOf("}");if(first!==-1&&last!==-1&&last>first)text=text.slice(first,last+1);return text.replace(/[“”]/g,'"').replace(/[‘’]/g,"'")}
function parseJsonFromBox(){const cleaned=cleanJsonText($("aiJson").value);$("aiJson").value=cleaned;return JSON.parse(cleaned)}
function setImportStatus(msg,ok){$("importStatus").className=ok?"success":"error";$("importStatus").textContent=msg}
function validateJsonOnly(){try{const d=parseJsonFromBox();const keys=Object.keys(d),supported=keys.filter(k=>importMap[k]||k==="kitchenScope"||k==="bathScope"),unsupported=keys.filter(k=>!importMap[k]&&k!=="notes"&&k!=="kitchenScope"&&k!=="bathScope");setImportStatus(`Valid JSON ✅\nSupported fields found: ${supported.length}\n${unsupported.length ? "Ignored fields: "+unsupported.join(", ") : "No unsupported fields."}`,true)}catch(e){setImportStatus(`Invalid JSON ❌\n${e.message}`,false)}}
function importJson(){try{const d=parseJsonFromBox();let updated=[],ignored=[];Object.keys(d).forEach(k=>{if((importMap[k]||k==="kitchenScope"||k==="bathScope")&&$(k)&&d[k]!==""&&d[k]!=null){$(k).value=d[k];updated.push(k)}else if(k!=="notes"){ignored.push(k)}});if(d.mortgage!==undefined)$("holdMortgage").value=d.mortgage;if(d.taxes!==undefined)$("holdTaxes").value=d.taxes;if(d.insurance!==undefined)$("holdInsurance").value=d.insurance;if(d.utilities!==undefined)$("holdUtilities").value=d.utilities;calc();showTab("deal",document.querySelector('[onclick*="deal"]'));setImportStatus(`Imported successfully ✅\nUpdated fields: ${updated.join(", ")}\n${ignored.length ? "Ignored fields: "+ignored.join(", ") : ""}`,true)}catch(e){setImportStatus(`Import failed ❌\n${e.message}`,false)}}
function pasteSampleJson(){$("aiJson").value=JSON.stringify({"address":"308 17th St NW, Willmar, MN 56201","purchasePrice":145000,"arv":220000,"sqft":1134,"roofSquares":18,"sidingSquares":16,"soffitLf":160,"windows":10,"doors":2,"lvpSqft":900,"paintSqft":2200,"kitchenScope":2,"bathScope":2,"miscRepairs":4500,"rent":2200,"mortgage":1732,"taxes":225,"insurance":125,"utilities":250,"demoWeeks":1,"exteriorWeeks":2,"interiorWeeks":4,"punchWeeks":1,"listingWeeks":2,"closingWeeks":4,"notes":"Sample import."},null,2)}
function saveDeal(){let d=calc(),deals=JSON.parse(localStorage.getItem("dealsv10")||"[]");deals.unshift(d);localStorage.setItem("dealsv10",JSON.stringify(deals));renderSaved()}
function renderSaved(){let deals=JSON.parse(localStorage.getItem("dealsv10")||"[]");$("savedDeals").innerHTML=deals.length?deals.map((d,i)=>`<div class="saved-card"><b>${d.address}</b><br>${d.date} • ${modeLabel(d.mode)}<br>Flip probability: ${d.flipProb}% • Rental probability: ${d.rentalProb}%<br>Profit: ${money(d.flipProfit)} • Cash flow: ${money(d.cashFlow)}/mo<br><button onclick="deleteDeal(${i})">Delete</button></div>`).join(""):"No saved deals yet."}
function deleteDeal(i){let deals=JSON.parse(localStorage.getItem("dealsv10")||"[]");deals.splice(i,1);localStorage.setItem("dealsv10",JSON.stringify(deals));renderSaved()}
function clearDeals(){localStorage.removeItem("dealsv10");renderSaved()}
ids.forEach(id=>$(id).addEventListener("input",calc));ids.forEach(id=>$(id).addEventListener("change",calc));calc();renderSaved();buildPrompt();