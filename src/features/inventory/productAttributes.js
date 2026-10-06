/**
 * products.attributes arrives with docs/schema/sticker_designer.sql. Rows fetched with select *
 * carry the key once the column exists, so its absence means the SQL has not been run yet.
 */
export const hasAttributesColumn = (products) => products.length === 0 || products.some((product) => "attributes" in product);

export const cleanAttributes = (attributes) =>
  Object.fromEntries(
    Object.entries(attributes ?? {})
      .map(([key, value]) => [key, String(value ?? "").trim()])
      .filter(([, value]) => value !== "")
  );
