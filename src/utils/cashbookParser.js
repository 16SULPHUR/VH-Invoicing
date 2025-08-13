// A robust parser for the provided cash balance chat logs
// Produces two arrays: transactions and snapshots

const MONTHS = {
	jan: "01",
	feb: "02",
	mar: "03",
	apr: "04",
	may: "05",
	jun: "06",
	jul: "07",
	aug: "08",
	sep: "09",
	oct: "10",
	nov: "11",
	dec: "12",
};

const normalizeAccount = (s) => (s || "").trim().toUpperCase();
const toNumber = (s) => {
	if (typeof s === "number") return s;
	if (!s) return 0;
	const clean = String(s).replace(/[,₹\s]/g, "");
	const n = Number(clean);
	return Number.isNaN(n) ? 0 : n;
};

const parseDate = (s) => {
	// Accept formats like 19/07/2025 or Yesterday (ignored, fallback to today)
	const str = (s || "").trim();
	const today = new Date();
	if (/yesterday/i.test(str)) {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d.toISOString().slice(0, 10);
	}
	const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
	if (m) {
		const dd = m[1].padStart(2, "0");
		const mm = m[2].padStart(2, "0");
		let yyyy = m[3];
		if (yyyy.length === 2) yyyy = `20${yyyy}`;
		return `${yyyy}-${mm}-${dd}`;
	}
	return today.toISOString().slice(0, 10);
};

const extractDateFromLine = (line) => {
	// Examples: "— 19/07/2025, 21:20" or "— Yesterday at 21:47"
	const m1 = line.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
	if (m1) return parseDate(m1[1]);
	if (/yesterday/i.test(line)) return parseDate("yesterday");
	return null;
};

export function parseCashbookText(text) {
	const lines = text.split(/\r?\n/);
	const transactions = [];
	const snapshots = [];

	let currentAuthor = null;
	let currentDate = null;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		if (!raw) continue;
		const line = raw.trim();

		// Track author lines like "Name — 19/07/2025, 21:20" or just "Name — ..."
		if (/—/.test(line)) {
			const [authorPart, rest] = line.split(/—/, 2);
			const a = authorPart.trim();
			if (a) currentAuthor = a;
			const dt = extractDateFromLine(line);
			if (dt) currentDate = dt;
			continue;
		}

		// Lines like HOME- 9600 + 2400 = 11500 or HOME-16500+4500=21000
		let m = line.match(/^([A-Za-z ]+)-\s*([\-\d,]+)\s*([+\-])\s*([\-\d,]+)\s*=\s*([\-\d,]+)/i);
		if (m) {
			const account = normalizeAccount(m[1]);
			const a = toNumber(m[2]);
			const op = m[3] === "-" ? -1 : 1;
			const b = toNumber(m[4]) * op;
			const total = toNumber(m[5]);
			const date = currentDate || parseDate();
			// Record delta as transaction
			transactions.push({ account, txn_date: date, amount: b, type: b >= 0 ? "inflow" : "outflow", author: currentAuthor, note: `${a} ${op === 1 ? "+" : "-"} ${Math.abs(toNumber(m[4]))} = ${total}` });
			// Snapshot of resulting total
			snapshots.push({ account, as_of_date: date, balance: total, author: currentAuthor, note: "tallied" });
			continue;
		}

		// Lines like SHOP-320 or HOME- 19000
	m = line.match(/^([A-Za-z ]+)-\s*\(?\s*([\-]?\d[\d,]*)\s*\)?/i);
		if (m) {
			const account = normalizeAccount(m[1]);
			const total = toNumber(m[2]);
			const date = currentDate || parseDate();
			snapshots.push({ account, as_of_date: date, balance: total, author: currentAuthor, note: "snapshot" });
			continue;
		}

		// Lines like ACCOUNT- 25000 = 29500 (explicit snapshot after change)
		m = line.match(/^([A-Za-z ]+)-\s*([\-\d,]+)\s*=\s*([\-\d,]+)/i);
		if (m) {
			const account = normalizeAccount(m[1]);
			const total = toNumber(m[3]);
			const date = currentDate || parseDate();
			snapshots.push({ account, as_of_date: date, balance: total, author: currentAuthor, note: line });
			continue;
		}

		// Bank deposit lines: "29000 - 25000 [bank deposit]" or "- 20000 [bank deposit]"
		m = line.match(/(bank\s*deposit)/i);
		if (m) {
			const numMatch = line.match(/([\-\d,]+)/g);
			const amount = numMatch ? toNumber(numMatch[numMatch.length - 1]) : 0;
			const date = currentDate || parseDate();
			// Treat as outflow from HOME by default if not specified
			transactions.push({ account: "HOME", txn_date: date, amount: -Math.abs(amount), type: "bank_deposit", author: currentAuthor, note: "bank deposit" });
			continue;
		}

		// TALLIED or explicit tally results "21000-20000(BANK)= 1000"
		m = line.match(/(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)\s*\(\s*BANK\s*\)\s*=\s*(\d[\d,]*)/i);
		if (m) {
			const prev = toNumber(m[1]);
			const bank = toNumber(m[2]);
			const home = toNumber(m[3]);
			const date = currentDate || parseDate();
			// Record deposit as outflow and a snapshot of resulting home balance
			transactions.push({ account: "HOME", txn_date: date, amount: -Math.abs(bank), type: "bank_deposit", author: currentAuthor, note: `${prev}-${bank} bank` });
			snapshots.push({ account: "HOME", as_of_date: date, balance: home, author: currentAuthor, note: "tallied" });
			continue;
		}

		// Combined HOME + other notes like "HOME- 28100 - 20000 [bank deposit] = 8100"
		m = line.match(/^([A-Za-z ]+)-\s*([\-\d,]+)\s*[-–]\s*([\-\d,]+)[^=]*=\s*([\-\d,]+)/i);
		if (m) {
			const account = normalizeAccount(m[1]);
			const prev = toNumber(m[2]);
			const delta = -Math.abs(toNumber(m[3]));
			const total = toNumber(m[4]);
			const date = currentDate || parseDate();
			transactions.push({ account, txn_date: date, amount: delta, type: delta >= 0 ? "inflow" : "outflow", author: currentAuthor, note: `${prev} -> ${total}` });
			snapshots.push({ account, as_of_date: date, balance: total, author: currentAuthor, note: "tallied" });
			continue;
		}

		// Explicit totals: "HOME- 17000 + 2000" without equals; treat as transaction only
		m = line.match(/^([A-Za-z ]+)-\s*([\-\d,]+)\s*([+\-])\s*([\-\d,]+)/i);
		if (m) {
			const account = normalizeAccount(m[1]);
			const op = m[3] === "-" ? -1 : 1;
			const amount = toNumber(m[4]) * op;
			const date = currentDate || parseDate();
			transactions.push({ account, txn_date: date, amount, type: amount >= 0 ? "inflow" : "outflow", author: currentAuthor, note: line });
			continue;
		}

		// Ignore other lines like SHASHI, DUE TO, etc., but if numeric line with HOME/SHOP nearby, already handled.
	}

	return { transactions, snapshots };
}

export default parseCashbookText;


