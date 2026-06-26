const ids=["address","purchasePrice","arv","sqft","roofSquares","sidingSquares","soffitLf","windows","doors","lvpSqft","paintSqft","kitchenScope","bathScope","miscRepairs","roofPrice","sidingPrice","soffitPrice","windowPrice","doorPrice","lvpPrice","paintPrice","contingencyPct","buyClosing","sellingPct","rent","mortgage","taxes","insurance","utilities","vacancyPct","maintenancePct","demoWeeks","exteriorWeeks","interiorWeeks","punchWeeks","listingWeeks","closingWeeks","holdMortgage","holdTaxes","holdInsurance","holdUtilities","holdLawn","holdMisc"];
const $=id=>document.getElementById(id), n=id=>Number($(id).value||0), s=id=>$(id).value;
function money(x){return x.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}
function pct(x){return (x*100).toFixed(1)+"%"}
function showTab(id,btn){document.querySelectorAll(".tab,.tabbtn").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");btn.classList.add("active")}
function timeline(){
 let weeks=n("demoWeeks")+n("exteriorWeeks")+n("interiorWeeks")+n("punchWeeks")+n("listingWeeks")+n("closingWeeks");
 let months=weeks/4.345;
 let monthly=n("holdMortgage")+n("holdTaxes")+n("holdInsurance")+n("holdUtilities")+n("holdLawn")+n("holdMisc");
 let total=monthly*months;
 $("totalWeeks").textContent=weeks.toFixed(1);
 $("totalMonths").textContent=months.toFixed(1);
 $("monthlyHoldingCalc").textContent=money(monthly);
 $("timelineHolding").textContent=money(total);
 return {weeks,months,monthly,total};
}
function calc(){
 let t=timeline();
 let rehabBase=n("roofSquares")*n("roofPrice")+n("sidingSquares")*n("sidingPrice")+n("soffitLf")*n("soffitPrice")+n("windows")*n("windowPrice")+n("doors")*n("doorPrice")+n("lvpSqft")*n("lvpPrice")+n("paintSqft")*n("paintPrice")+n("kitchenScope")+n("bathScope")+n("miscRepairs");
 let rehab=rehabBase*(1+n("contingencyPct")), purchase=n("purchasePrice"), arv=n("arv");
 let flipInvestment=purchase+rehab+t.total+n("buyClosing");
 let flipProfit=arv-flipInvestment-arv*n("sellingPct"), flipRoi=flipInvestment?flipProfit/flipInvestment:0, maxOffer=arv*.70-rehab-t.total;
 let rent=n("rent"), cashFlow=rent-(n("mortgage")+n("taxes")+n("insurance")+n("utilities")+rent*n("vacancyPct")+rent*n("maintenancePct"));
 let noi=(rent-n("taxes")-n("insurance")-n("utilities")-rent*n("vacancyPct")-rent*n("maintenancePct"))*12;
 let totalCost=purchase+rehab+n("buyClosing"), capRate=totalCost?noi/totalCost:0;
 let strategy="Needs Review", cls="ok";
 if(flipProfit>=30000&&flipRoi>=.15){strategy="Best Fit: Flip";cls="good"} else if(cashFlow>=250&&capRate>=.06){strategy="Best Fit: Rental";cls="good"} else if(flipProfit>=15000||cashFlow>=100){strategy="Possible Deal";cls="ok"} else {strategy="Likely Pass";cls="bad"}
 $("rehabTotal").textContent=money(rehab);$("holdingTotal").textContent=money(t.total);$("flipInvestment").textContent=money(flipInvestment);$("flipProfit").textContent=money(flipProfit);$("flipRoi").textContent=pct(flipRoi);$("maxOffer").textContent=money(maxOffer);$("cashFlow").textContent=money(cashFlow)+"/mo";$("capRate").textContent=pct(capRate);
 $("dashRehab").textContent=money(rehab);$("dashHolding").textContent=money(t.total);$("dashProfit").textContent=money(flipProfit);$("dashCash").textContent=money(cashFlow)+"/mo";$("dashStrategy").textContent=strategy;
 $("recommendation").className=cls;$("recommendation").textContent=strategy;
 $("reportText").textContent=`MN Flip Pro Deal Report

Property: ${s("address")}
Purchase Price: ${money(purchase)}
ARV: ${money(arv)}
Sq Ft: ${s("sqft")}

Rehab Estimate: ${money(rehab)}
Holding Period: ${t.weeks.toFixed(1)} weeks / ${t.months.toFixed(1)} months
Monthly Holding Cost: ${money(t.monthly)}
Total Holding Cost: ${money(t.total)}

Flip Analysis
Total Investment: ${money(flipInvestment)}
Expected Profit: ${money(flipProfit)}
ROI: ${pct(flipRoi)}
Max Offer 70% Rule adjusted for holding: ${money(maxOffer)}

Rental Analysis
Monthly Rent: ${money(rent)}
Monthly Cash Flow: ${money(cashFlow)}
Cap Rate: ${pct(capRate)}

Recommendation: ${strategy}`;
 return {address:s("address"),purchase,arv,rehab,holding:t.total,flipProfit,cashFlow,capRate,strategy,date:new Date().toLocaleDateString()};
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
function copyPrompt(){ $("aiPrompt").select(); document.execCommand("copy");}
function importJson(){
 try{
  const d=JSON.parse($("aiJson").value);
  Object.keys(d).forEach(k=>{ if($(k)&&d[k]!==""&&d[k]!=null) $(k).value=d[k]; });
  $("importStatus").textContent="Imported successfully.";
  calc();
 }catch(e){ $("importStatus").textContent="Import failed. Paste valid JSON only."; }
}
function saveDeal(){let d=calc(), deals=JSON.parse(localStorage.getItem("dealsv6")||"[]");deals.unshift(d);localStorage.setItem("dealsv6",JSON.stringify(deals));renderSaved()}
function renderSaved(){let deals=JSON.parse(localStorage.getItem("dealsv6")||"[]");$("savedDeals").innerHTML=deals.length?deals.map((d,i)=>`<div class="saved-card"><b>${d.address}</b><br>${d.date} • ${d.strategy}<br>Profit: ${money(d.flipProfit)} • Cash flow: ${money(d.cashFlow)}/mo<br><button onclick="deleteDeal(${i})">Delete</button></div>`).join(""):"No saved deals yet."}
function deleteDeal(i){let deals=JSON.parse(localStorage.getItem("dealsv6")||"[]");deals.splice(i,1);localStorage.setItem("dealsv6",JSON.stringify(deals));renderSaved()}
function clearDeals(){localStorage.removeItem("dealsv6");renderSaved()}
ids.forEach(id=>$(id).addEventListener("input",calc));ids.forEach(id=>$(id).addEventListener("change",calc));calc();renderSaved();buildPrompt();