import { newId } from "../designModel";
import { renameInSource } from "../expr";

const r2 = (value) => Math.round(value * 100) / 100;

export function patchElements(design, changes) {
  return {
    ...design,
    elements: design.elements.map((element) => (changes[element.id] ? { ...element, ...changes[element.id] } : element)),
  };
}

export function addElement(design, element, { atBottom = false } = {}) {
  return { ...design, elements: atBottom ? [element, ...design.elements] : [...design.elements, element] };
}

export function removeElements(design, ids) {
  return { ...design, elements: design.elements.filter((element) => !ids.includes(element.id) || element.locked) };
}

export function duplicateElements(design, ids, offset = 1) {
  const copies = design.elements
    .filter((element) => ids.includes(element.id))
    .map((element) => ({ ...structuredClone(element), id: newId(), name: `${element.name} copy`, locked: false, x: r2(element.x + offset), y: r2(element.y + offset) }));
  return { design: { ...design, elements: [...design.elements, ...copies] }, ids: copies.map(({ id }) => id) };
}

/** Moves the selection one step toward the front (+1) or back (-1) of the stack, or all the way. */
export function reorder(design, ids, direction) {
  const elements = [...design.elements];
  if (direction === "front" || direction === "back") {
    const picked = elements.filter((element) => ids.includes(element.id));
    const rest = elements.filter((element) => !ids.includes(element.id));
    return { ...design, elements: direction === "front" ? [...rest, ...picked] : [...picked, ...rest] };
  }
  const order = direction > 0 ? [...elements.keys()].reverse() : [...elements.keys()];
  for (const index of order) {
    const target = index + direction;
    if (!ids.includes(elements[index].id) || target < 0 || target >= elements.length || ids.includes(elements[target].id)) continue;
    [elements[index], elements[target]] = [elements[target], elements[index]];
  }
  return { ...design, elements };
}

export function moveTo(design, id, toIndex) {
  const elements = design.elements.filter((element) => element.id !== id);
  const moved = design.elements.find((element) => element.id === id);
  elements.splice(Math.max(0, Math.min(elements.length, toIndex)), 0, moved);
  return { ...design, elements };
}

/** Aligns to the selection's bounds, or to the label when one object is selected. */
export function align(design, ids, edge) {
  const picked = design.elements.filter((element) => ids.includes(element.id) && !element.locked);
  if (picked.length === 0) return design;
  const bounds =
    picked.length === 1
      ? { left: 0, top: 0, right: design.size.width, bottom: design.size.height }
      : {
          left: Math.min(...picked.map((e) => e.x)),
          top: Math.min(...picked.map((e) => e.y)),
          right: Math.max(...picked.map((e) => e.x + e.w)),
          bottom: Math.max(...picked.map((e) => e.y + e.h)),
        };
  const place = {
    left: () => ({ x: bounds.left }),
    center: (e) => ({ x: (bounds.left + bounds.right - e.w) / 2 }),
    right: (e) => ({ x: bounds.right - e.w }),
    top: () => ({ y: bounds.top }),
    middle: (e) => ({ y: (bounds.top + bounds.bottom - e.h) / 2 }),
    bottom: (e) => ({ y: bounds.bottom - e.h }),
  }[edge];
  return patchElements(
    design,
    Object.fromEntries(picked.map((element) => [element.id, Object.fromEntries(Object.entries(place(element)).map(([k, v]) => [k, r2(v)]))]))
  );
}

/** Equal gaps between three or more objects, across or down. */
export function distribute(design, ids, axis) {
  const picked = design.elements.filter((element) => ids.includes(element.id) && !element.locked);
  if (picked.length < 3) return design;
  const [pos, size] = axis === "x" ? ["x", "w"] : ["y", "h"];
  const sorted = [...picked].sort((a, b) => a[pos] - b[pos]);
  const start = sorted[0][pos];
  const end = Math.max(...sorted.map((e) => e[pos] + e[size]));
  const gap = (end - start - sorted.reduce((sum, e) => sum + e[size], 0)) / (sorted.length - 1);
  let cursor = start;
  const changes = {};
  sorted.forEach((element) => {
    changes[element.id] = { [pos]: r2(cursor) };
    cursor += element[size] + gap;
  });
  return patchElements(design, changes);
}

/** Renames a design variable everywhere the design refers to it. */
export function renameVariable(design, from, to) {
  const swapTemplate = (text) => renameInSource(text, from, to, { template: true });
  const swapExpr = (text) => renameInSource(text, from, to);
  return {
    ...design,
    variables: design.variables.map((variable) => ({
      ...variable,
      name: variable.name === from ? to : variable.name,
      expr: variable.expr === undefined ? undefined : swapExpr(variable.expr),
      value: variable.kind === "text" && variable.value !== undefined ? swapTemplate(variable.value) : variable.value,
    })),
    elements: design.elements.map((element) => ({
      ...element,
      ...(element.text !== undefined && { text: swapTemplate(element.text) }),
      ...(element.value !== undefined && { value: swapTemplate(element.value) }),
      ...(element.condition && {
        condition: {
          ...element.condition,
          field: element.condition.field === undefined ? undefined : swapExpr(element.condition.field),
          expr: element.condition.expr === undefined ? undefined : swapExpr(element.condition.expr),
        },
      }),
    })),
  };
}
