/** The table has not been created yet (the SQL in docs/schema has not been run). */
export function isMissingTable(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

/** A column the app writes does not exist yet. */
export function isMissingColumn(error) {
  return error?.code === "42703" || error?.code === "PGRST204";
}
