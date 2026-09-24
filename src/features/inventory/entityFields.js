export const PRODUCT_FIELDS = [
  { key: "name", label: "Product Name", type: "text" },
  { key: "quantity", label: "Quantity", type: "number", parse: (v) => parseInt(v, 10) },
  { key: "cost", label: "Cost", type: "number", parse: parseFloat },
  { key: "sellingPrice", label: "Selling Price", type: "number", parse: parseFloat },
];

/** Sends only the editable columns, parsed, so a stale row can't overwrite images or other fields. */
export function pickFields(entity, fields) {
  const changes = { id: entity.id };
  for (const { key, parse } of fields) {
    changes[key] = parse ? parse(entity[key]) : entity[key];
  }
  return changes;
}

export const SUPPLIER_FIELDS = [
  { key: "name", label: "Supplier Name", type: "text" },
  { key: "code", label: "Supplier Code", type: "text" },
];
