export function DataError({ label }: { label: string }) {
  return (
    <div className="data-state" role="status">
      <h2>{label} unavailable</h2>
      <p>Please try again shortly. The rest of the chapter hub is still available.</p>
    </div>
  );
}

export function DataEmpty({ message }: { message: string }) {
  return (
    <div className="data-state" role="status">
      <p>{message}</p>
    </div>
  );
}
