/**
 * A reconciliation is a counted balance on a date; only transactions on or after
 * the latest reconciliation are applied on top of it.
 */
export function computeBalances({ accounts, transactions, reconciliations }) {
  const snapshotsByAccount = new Map();
  for (const snapshot of reconciliations) {
    const list = snapshotsByAccount.get(snapshot.account_id) ?? [];
    list.push(snapshot);
    snapshotsByAccount.set(snapshot.account_id, list);
  }

  const transactionsByAccount = new Map();
  for (const transaction of transactions) {
    const list = transactionsByAccount.get(transaction.account_id) ?? [];
    list.push(transaction);
    transactionsByAccount.set(transaction.account_id, list);
  }

  const balances = {};

  for (const account of accounts) {
    const snapshots = (snapshotsByAccount.get(account.id) ?? [])
      .slice()
      .sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));
    const latestSnapshot = snapshots.at(-1);

    let balance = Number(latestSnapshot?.balance ?? 0);

    for (const transaction of transactionsByAccount.get(account.id) ?? []) {
      if (!latestSnapshot || transaction.txn_date >= latestSnapshot.as_of_date) {
        balance += Number(transaction.amount) || 0;
      }
    }

    balances[account.id] = balance;
  }

  return balances;
}

export function accountDisplayName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/** Money leaving the till is stored as a negative amount. */
export function normalizeAmount(amount, type) {
  const magnitude = Math.abs(Number(amount));
  return ["outflow", "bank_deposit"].includes(type) ? -magnitude : magnitude;
}
