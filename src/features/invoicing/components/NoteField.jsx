export function NoteField({ note, setNote }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="note">
        Note:
      </label>
      <textarea
        className="w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white focus:border-pink-500 focus:outline-none"
        id="note"
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a note..."
      />
    </div>
  );
}
