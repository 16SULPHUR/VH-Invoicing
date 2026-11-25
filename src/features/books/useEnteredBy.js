import { useState } from "react";

const STORAGE_KEY = "cashbook.enteredBy";

function read() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function useEnteredBy() {
  const [name, setName] = useState(read);

  const update = (value) => {
    setName(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage unavailable; the name just isn't remembered
    }
  };

  return [name, update];
}
