import { describe, it, expect } from 'vitest';
import { filterFiles, formatBytes, isSameFile, matchesAccept, syncInputFiles } from './files';

const file = (name: string, type = '', size = 10, lastModified = 1) => {
  const f = new File(['x'.repeat(size)], name, { type, lastModified });
  return f;
};

describe('matchesAccept', () => {
  it('accepts anything when there is no accept', () => {
    expect(matchesAccept(file('a.exe'), undefined)).toBe(true);
    expect(matchesAccept(file('a.exe'), ' , ')).toBe(true);
  });

  it('matches an extension, ignoring case', () => {
    expect(matchesAccept(file('Report.PDF'), '.pdf')).toBe(true);
    expect(matchesAccept(file('report.pdf.exe'), '.pdf')).toBe(false);
  });

  it('matches a MIME type and a wildcard type', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'image/png')).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(file('a.mp4', 'video/mp4'), 'image/*')).toBe(false);
    expect(matchesAccept(file('a.png', 'image/png'), 'image/jpeg')).toBe(false);
  });

  it('matches any one of several', () => {
    const accept = '.pdf, image/*';
    expect(matchesAccept(file('a.pdf'), accept)).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), accept)).toBe(true);
    expect(matchesAccept(file('a.txt', 'text/plain'), accept)).toBe(false);
  });
});

describe('formatBytes', () => {
  it('counts in 1024s with a decimal under ten', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(812)).toBe('812 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(12 * 1024)).toBe('12 KB');
    expect(formatBytes(3.2 * 1024 * 1024)).toBe('3.2 MB');
    expect(formatBytes(5 * 1024 ** 3)).toBe('5 GB');
  });
});

describe('isSameFile', () => {
  it('is the same object, or the same name, size and date', () => {
    const a = file('a.txt');
    expect(isSameFile(a, a)).toBe(true);
    expect(isSameFile(a, file('a.txt'))).toBe(true);
    expect(isSameFile(a, file('a.txt', '', 11))).toBe(false);
    expect(isSameFile(a, file('b.txt'))).toBe(false);
    expect(isSameFile(a, file('a.txt', '', 10, 2))).toBe(false);
  });
});

describe('filterFiles', () => {
  const open = { accept: undefined, maxSize: undefined, maxFiles: undefined, multiple: true };

  it('accepts everything it can, in order', () => {
    const picked = [file('a'), file('b')];
    expect(filterFiles(picked, [], open)).toEqual({ accepted: picked, rejected: [] });
  });

  it('rejects by type and by size', () => {
    const png = file('a.png', 'image/png');
    const big = file('b.png', 'image/png', 100);
    const txt = file('c.txt', 'text/plain');
    const { accepted, rejected } = filterFiles([png, big, txt], [], {
      ...open,
      accept: 'image/*',
      maxSize: 50,
    });
    expect(accepted).toEqual([png]);
    expect(rejected).toEqual([
      { file: big, reason: 'size' },
      { file: txt, reason: 'type' },
    ]);
  });

  it('rejects what does not fit under maxFiles, counting the files already there', () => {
    const have = [file('a')];
    const [b, c, d] = [file('b'), file('c'), file('d')] as [File, File, File];
    const { accepted, rejected } = filterFiles([b, c, d], have, { ...open, maxFiles: 3 });
    expect(accepted).toEqual([b, c]);
    expect(rejected).toEqual([{ file: d, reason: 'count' }]);
  });

  it('takes only the first file when it is not multiple, and rejects the rest', () => {
    const [a, b] = [file('a'), file('b')] as [File, File];
    const { accepted, rejected } = filterFiles([a, b], [], { ...open, multiple: false });
    expect(accepted).toEqual([a]);
    expect(rejected).toEqual([{ file: b, reason: 'count' }]);
  });

  it('checks type and size before the count, so a count rejection is always a valid file', () => {
    const [a, bad] = [file('a.png', 'image/png'), file('b.txt', 'text/plain')] as [File, File];
    const { rejected } = filterFiles([a, bad], [], {
      ...open,
      accept: 'image/*',
      multiple: false,
    });
    expect(rejected).toEqual([{ file: bad, reason: 'type' }]);
  });

  it('drops a file that is already there without rejecting it', () => {
    const have = [file('a')];
    expect(filterFiles([file('a'), file('a')], have, open)).toEqual({ accepted: [], rejected: [] });
    const twice = filterFiles([file('b'), file('b')], [], open);
    expect(twice.accepted).toHaveLength(1);
  });
});

describe('syncInputFiles', () => {
  const inputWith = (files: File[]) => {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: files, configurable: true, writable: true });
    return input;
  };

  it('leaves an input that already holds the files alone', () => {
    const a = file('a');
    const input = inputWith([a]);
    syncInputFiles(input, [a]);
    expect(input.files).toEqual([a]);
  });

  it('builds a file list in a DataTransfer where there is one', () => {
    const built: File[] = [];
    class FakeTransfer {
      items = { add: (f: File) => built.push(f) };
      get files() {
        return [...built];
      }
    }
    const original = globalThis.DataTransfer;
    globalThis.DataTransfer = FakeTransfer as unknown as typeof DataTransfer;
    try {
      const [a, b] = [file('a'), file('b')] as [File, File];
      const input = inputWith([a]);
      syncInputFiles(input, [a, b]);
      expect(input.files).toEqual([a, b]);
    } finally {
      globalThis.DataTransfer = original;
    }
  });

  it('does not throw where there is no DataTransfer', () => {
    const input = inputWith([file('a')]);
    expect(() => syncInputFiles(input, [file('a'), file('b')])).not.toThrow();
  });
});
