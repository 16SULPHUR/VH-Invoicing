import { designFor } from "./useLabelDesigns";
import { createScope } from "./variables";

/** Prompt variables across the designs in a run, asked once and shared by name. */
export function runPrompts(designs) {
  const byName = new Map();
  designs.forEach((design) =>
    design.variables
      .filter((variable) => variable.kind === "prompt")
      .forEach((variable) => byName.has(variable.name) || byName.set(variable.name, variable))
  );
  return [...byName.values()];
}

/**
 * Expands queued products into one entry per sticker, each with its design and values.
 * Counters count within each design, so two designs in one run both start at their own start.
 */
export function buildRun({ rows, designs, override, suppliers, settings, prompts = {}, printDate = new Date() }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const suppliersById = new Map(suppliers.map((supplier) => [String(supplier.id), supplier]));
  const perDesign = new Map();
  let index = 0;
  return rows.flatMap(({ product, count }) => {
    const design = designFor(product, designs, override);
    if (!design) return [];
    const supplier = suppliersById.get(String(product.supplier));
    return Array.from({ length: count }, (_, copyIndex) => {
      index += 1;
      const designIndex = (perDesign.get(design.id) ?? 0) + 1;
      perDesign.set(design.id, designIndex);
      const run = { copy: copyIndex + 1, copies: count, index, total, designIndex, printDate };
      return { design, product, scope: createScope({ design, product, supplier, settings, run, prompts }) };
    });
  });
}

/** Designs whose counters continue from the last run, moved on past the stickers just printed. */
export function advanceCounters(labels) {
  const used = new Map();
  labels.forEach(({ design }) => used.set(design.id, { design, count: (used.get(design.id)?.count ?? 0) + 1 }));
  return [...used.values()]
    .filter(({ design }) => design.variables.some((variable) => variable.kind === "counter" && variable.carry))
    .map(({ design, count }) => ({
      ...design,
      updated_at: new Date().toISOString(),
      variables: design.variables.map((variable) =>
        variable.kind === "counter" && variable.carry && variable.per !== "product"
          ? { ...variable, start: (Number(variable.start) || 1) + (Number(variable.step) || 1) * count }
          : variable
      ),
    }));
}
