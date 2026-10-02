import { change } from "./analytics";
import { dayLabel, hourLabel, percent, rupees, WEEKDAYS, weekdayLabel } from "./format";

/** Plain sentences about what stands out, most useful first. tone: good | bad | note. */
export function buildInsights({ now, previous, days, products, customers, grid, stock, lastYear }) {
  const out = [];
  if (!now.bills) return out;

  const salesChange = change(now.sales, previous?.sales);
  if (salesChange != null) {
    out.push({
      tone: salesChange >= 0 ? "good" : "bad",
      text: `Sales are ${percent(Math.abs(salesChange))} ${salesChange >= 0 ? "up" : "down"} on the previous period (${rupees(previous.sales)} then, ${rupees(now.sales)} now).`,
    });
    const billChange = change(now.bills, previous.bills);
    const avgChange = change(now.averageBill, previous.averageBill);
    if (billChange != null && avgChange != null && Math.abs(salesChange) > 0.05) {
      const driver = Math.abs(billChange) > Math.abs(avgChange) ? `${Math.abs(billChange) > 0.01 ? (billChange > 0 ? "more" : "fewer") : "the same number of"} bills (${now.bills} vs ${previous.bills})` : `a ${avgChange > 0 ? "bigger" : "smaller"} average bill (${rupees(now.averageBill)} vs ${rupees(previous.averageBill)})`;
      out.push({ tone: "note", text: `Mostly because of ${driver}.` });
    }
  }

  const yoy = change(now.sales, lastYear?.sales);
  if (yoy != null) out.push({ tone: yoy >= 0 ? "good" : "bad", text: `Against the same dates last year, sales are ${percent(Math.abs(yoy))} ${yoy >= 0 ? "higher" : "lower"}.` });

  const best = [...days].sort((a, b) => b.sales - a.sales)[0];
  if (best?.sales > 0 && days.length > 1) out.push({ tone: "note", text: `Best day was ${weekdayLabel(best.period)} ${dayLabel(best.period)} with ${rupees(best.sales)} from ${best.bills} bills.` });

  const weekday = WEEKDAYS.map((_, w) => grid[w].reduce((s, c) => s + c.sales, 0));
  const hours = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + row[h].sales, 0));
  const topDay = weekday.indexOf(Math.max(...weekday));
  const topHour = hours.indexOf(Math.max(...hours));
  if (weekday[topDay] > 0) out.push({ tone: "note", text: `${WEEKDAYS[topDay]} is the busiest day and ${hourLabel(topHour)} to ${hourLabel((topHour + 1) % 24)} the busiest hour, so keep the counter fully staffed then.` });

  if (now.margin != null) {
    out.push({
      tone: now.margin >= 0.3 ? "good" : "note",
      text: `Real margin on items with a cost price is ${percent(now.margin)}, so profit is about ${rupees(now.profit)}.${now.costCoverage < 0.9 ? ` ${percent(1 - now.costCoverage)} of sales are items not in the stock list, so this is an estimate.` : ""}`,
    });
  }

  const creditShare = now.sales > 0 ? now.credit / now.sales : 0;
  const prevCreditShare = previous?.sales > 0 ? previous.credit / previous.sales : null;
  if (creditShare > 0.1) out.push({ tone: prevCreditShare != null && creditShare > prevCreditShare ? "bad" : "note", text: `${percent(creditShare)} of sales went on credit (${rupees(now.credit)})${prevCreditShare != null ? `, against ${percent(prevCreditShare)} before` : ""}.` });

  if (now.discount > 0 && now.sales > 0) out.push({ tone: now.discount / now.sales > 0.08 ? "bad" : "note", text: `Items sold ${rupees(now.discount)} below their tag price, ${percent(now.discount / (now.sales + now.discount), 1)} of the tag value.` });

  const topProduct = [...products].sort((a, b) => b.sales - a.sales)[0];
  if (topProduct) out.push({ tone: "good", text: `${topProduct.name} earned the most: ${rupees(topProduct.sales)} from ${topProduct.quantity} pieces.` });

  const topMargin = products.filter((p) => p.margin != null && p.quantity >= 3).sort((a, b) => b.profit - a.profit)[0];
  if (topMargin && topMargin.name !== topProduct?.name) out.push({ tone: "good", text: `${topMargin.name} made the most profit (${rupees(topMargin.profit)} at ${percent(topMargin.margin)} margin).` });

  const topCustomer = [...customers].sort((a, b) => b.sales - a.sales)[0];
  if (topCustomer) out.push({ tone: "note", text: `${topCustomer.name} is the biggest customer this period: ${rupees(topCustomer.sales)} over ${topCustomer.bills} bills.` });

  const returning = customers.filter((c) => c.first && c.first < new Date(`${days[0]?.period}T00:00:00`)).length;
  if (customers.length >= 5) out.push({ tone: "note", text: `${returning} of ${customers.length} named customers had shopped before; ${customers.length - returning} are new.` });

  if (now.walkIns > 0 && now.bills > 0) {
    const share = now.walkIns / now.bills;
    if (share > 0.3) out.push({ tone: "bad", text: `${percent(share)} of bills have no customer name, so those buyers can't be invited back.` });
  }

  const idle = stock.filter((s) => s.stock > 0 && s.idleDays != null && s.idleDays >= 180);
  const idleCost = idle.reduce((s, r) => s + r.stockCost, 0);
  if (idleCost > 0) out.push({ tone: "bad", text: `${rupees(idleCost)} of stock at cost (${idle.length === 1 ? "1 design" : `${idle.length} designs`}) has not sold in 6 months or more.` });

  if (now.returns < 0) out.push({ tone: "note", text: `Returns took ${rupees(-now.returns)} off sales.` });

  return out;
}
