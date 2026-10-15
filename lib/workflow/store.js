const runs = new Map();

export function setRunResult(eventId, result) {
  runs.set(eventId, result);
}

export function getRunResult(eventId) {
  return runs.get(eventId);
}