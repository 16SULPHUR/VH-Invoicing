import React from 'react';

const NoteField = ({ note, setNote }) => (
  <div className="mb-4">
    <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="note">
      Note:
    </label>
    <textarea
      className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
      id="note"
      rows={3}
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Add a note..."
    />
  </div>
);

export default NoteField;