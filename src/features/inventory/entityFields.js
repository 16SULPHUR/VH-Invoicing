export const PRODUCT_FIELDS = [
  { key: "name", label: "Product Name", type: "text" },
  { key: "quantity", label: "Quantity", type: "number", parse: (v) => parseInt(v, 10) },
  { key: "cost", label: "Cost", type: "number", parse: parseFloat },
  { key: "sellingPrice", label: "Selling Price", type: "number", parse: parseFloat },
];

export const SUPPLIER_FIELDS = [
  { key: "name", label: "Supplier Name", type: "text" },
  { key: "code", label: "Supplier Code", type: "text" },
];
