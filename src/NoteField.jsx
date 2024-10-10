import React from 'react';

const NoteField = ({ note, setNote }) => (
  <div className="mb-4">
    <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="note">
      Note:
    </label>
    <input
      className="w-full p-2 border border-gray-300 rounded-md"
      placeholder="NOTE"
      type="text"
      id="note"
      value={note}
      onChange={(e) => setNote(e.target.value)}
    />
  </div>
);

export default NoteField