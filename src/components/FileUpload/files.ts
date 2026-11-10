/** Why a picked file was not added. */
export type RejectionReason = 'type' | 'size' | 'count';

export interface FileRejection {
  file: File;
  reason: RejectionReason;
}

/**
 * Whether a file passes an `accept` string in the native syntax: ".pdf", "image/*", "image/png", with
 * commas between. The input checks it for the picker's filter, but a file dropped on it, and a
 * browser that ignores the filter, get through, so it is checked here too. Empty accepts anything.
 */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/** "0 B", "812 B", "1.4 KB", "12 KB", "3.2 MB": 1024 to a step, one decimal under 10. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Math.max(bytes, 0);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const shown = unit === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${shown} ${units[unit]}`;
}

/** Two `File` objects for the same file on disk: a second pick of it is not a new file. */
export const isSameFile = (a: File, b: File) =>
  a === b || (a.name === b.name && a.size === b.size && a.lastModified === b.lastModified);

interface FilterOptions {
  accept: string | undefined;
  maxSize: number | undefined;
  maxFiles: number | undefined;
  multiple: boolean;
}

/**
 * Splits what was picked into what is added and what is not. `current` is what is already in the list
 * and stays there (empty when a new pick replaces it, i.e. not `multiple`). Order matters: the type
 * and size of a file are checked before the count, so "too many" only ever lands on a valid file. A
 * file already in the list is dropped without a rejection: nothing was wrong with it.
 */
export function filterFiles(picked: File[], current: File[], options: FilterOptions) {
  const { accept, maxSize, maxFiles, multiple } = options;
  const capacity = multiple ? (maxFiles ?? Infinity) - current.length : 1;
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];

  for (const file of picked) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
    else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' });
    else if ([...current, ...accepted].some((have) => isSameFile(have, file))) continue;
    else if (accepted.length >= capacity) rejected.push({ file, reason: 'count' });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/**
 * Makes the input's own file list `files`, so the form submits what the list shows and `required`
 * agrees with it. A file input can't be set to a value, but it can be given a `FileList` built in a
 * `DataTransfer`. Where that is missing (jsdom, an old browser) the input keeps what the user last
 * picked, and the list is still right.
 */
export function syncInputFiles(input: HTMLInputElement, files: File[]) {
  const have = input.files;
  if (have && have.length === files.length && files.every((file, i) => have[i] === file)) return;
  try {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
  } catch {
    if (files.length === 0) input.value = '';
  }
}
