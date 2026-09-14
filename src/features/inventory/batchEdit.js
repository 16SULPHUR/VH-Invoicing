export const BATCH_EDIT_FIELDS = ["sellingPrice", "cost", "quantity"];

export const EMPTY_BATCH_EDIT = Object.fromEntries(
  BATCH_EDIT_FIELDS.map((field) => [field, { value: "", type: "fixed" }])
);

/**
 * A "fixed" change sets the field outright; a "percentage" change adjusts the
 * product's current value by that percent. Fields left blank are untouched.
 */
export function buildBatchUpdate(product, batchEditData) {
  const update = {};

  for (const field of BATCH_EDIT_FIELDS) {
    const { value, type } = batchEditData[field] ?? {};
    if (!value) continue;

    update[field] =
      type === "fixed"
        ? Math.round(Number(value))
        : Math.round(Number(product[field]) * (1 + Number(value) / 100));
  }

  return update;
}
