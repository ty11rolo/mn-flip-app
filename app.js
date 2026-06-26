const ids = [
  "purchasePrice","arv","rehab","sqft","holdingMonths","monthlyHolding",
  "buyClosing","sellingPct","contingencyPct","rent","utilities","mortgage",
  "taxes","insurance","vacancyPct","maintenancePct","managementPct"
];

function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n) {
  return (n * 100).toFixed(1) + "%";
}

function val(id) {
  return Number(document.getElementById(id).value || 0);
}

function calculate() {
  const purchase = val("purchasePrice");
  const arv = val("arv");
  const rehabBase = val("rehab");
  const holdingMonths = val("holdingMonths");
  const monthlyHolding = val("monthlyHolding");
  const buyClosing = val("buyClosing");
  const sellingPct = val("sellingPct");
  const contingencyPct = val("contingencyPct");

  const contingency = rehabBase * contingencyPct;
  const rehab = rehabBase + contingency;
  const holding = holdingMonths * monthlyHolding;
  const sellingCosts = arv * sellingPct;
  const flipInvestment = purchase + rehab + holding + buyClosing;
  const flipProfit = arv - flipInvestment - sellingCosts;
  const flipRoi = flipInvestment > 0 ? flipProfit / flipInvestment : 0;
  const maxOffer70 = arv * 0.70 - rehab;

  document.getElementById("flipInvestment").textContent = money(flipInvestment);
  document.getElementById("flipProfit").textContent = money(flipProfit);
  document.getElementById("flipRoi").textContent = pct(flipRoi);
  document.getElementById("maxOffer70").textContent = money(maxOffer70);

  const rent = val("rent");
  const utilities = val("utilities");
  const mortgage = val("mortgage");
  const taxes = val("taxes");
  const insurance = val("insurance");
  const vacancy = rent * val("vacancyPct");
  const maintenance = rent * val("maintenancePct");
  const management = rent * val("managementPct");
  const monthlyExpenses = mortgage + taxes + insurance + utilities + vacancy + maintenance + management;
  const cashFlow = rent - monthlyExpenses;
  const annualCashFlow = cashFlow * 12;
  const noi = (rent - utilities - taxes - insurance - vacancy - maintenance - management) * 12;
  const totalCost = purchase + rehab + buyClosing;
  const capRate = totalCost > 0 ? noi / totalCost : 0;
  const cashInvested = Math.max(1, totalCost * 0.25);
  const coc = annualCashFlow / cashInvested;

  document.getElementById("cashFlow").textContent = money(cashFlow);
  document.getElementById("annualCashFlow").textContent = money(annualCashFlow);
  document.getElementById("capRate").textContent = pct(capRate);
  document.getElementById("coc").textContent = pct(coc);

  const box = document.getElementById("recommendationBox");
  box.className = "";
  let recommendation = "Needs Review";

  if (flipProfit >= 30000 && flipRoi >= 0.15 && cashFlow < 150) {
    recommendation = "Best Fit: Flip";
    box.classList.add("good");
  } else if (cashFlow >= 250 && capRate >= 0.06) {
    recommendation = "Best Fit: Rental";
    box.classList.add("good");
  } else if (flipProfit >= 20000 || cashFlow >= 100) {
    recommendation = "Possible Deal";
    box.classList.add("ok");
  } else {
    recommendation = "Likely Pass";
    box.classList.add("bad");
  }

  box.textContent = recommendation;
}

ids.forEach(id => document.getElementById(id).addEventListener("input", calculate));
document.getElementById("resetBtn").addEventListener("click", () => location.reload());
calculate();
