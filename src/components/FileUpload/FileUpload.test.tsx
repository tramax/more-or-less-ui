import { createRef, useState, type ComponentProps } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { FileUpload, type FileUploadProps } from './FileUpload';
import styles from './FileUpload.module.css';
import frameStyles from '../_shared/TextFieldFrame.module.css';
import type { UploadControl } from './useFileUploads';

// The label, error, id and size wiring is TextFieldFrame's, and TextField's tests cover it in full.
// These check that FileUpload is hooked up to it, and test what is its own: the file input, the list,
// the filters, the drag state, and the uploads of upload mode.

const file = (name: string, size = 10, type = '') =>
  new File(['x'.repeat(size)], name, { type, lastModified: 1 });

type Props = Partial<ComponentProps<typeof FileUpload>>;

const renderUpload = (props: Props = {}) => {
  const { container } = render(<FileUpload label="Files" {...(props as FileUploadProps)} />);
  return {
    root: container.firstElementChild as HTMLDivElement,
    input: screen.getByLabelText(/^Files/) as HTMLInputElement,
  };
};

const pick = (input: HTMLInputElement, ...files: File[]) =>
  fireEvent.change(input, { target: { files } });

const rows = () => screen.queryAllByRole('listitem');

/** An upload the test settles by hand */
const deferred = () => {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const settle = () => act(async () => {});

afterEach(cleanup);

describe('FileUpload', () => {
  describe('element', () => {
    it('renders a native file input named by its label', () => {
      const { input } = renderUpload();
      expect(input.type).toBe('file');
      expect(screen.getByLabelText('Files')).toBe(input);
    });

    it('is named by aria-label when there is no label', () => {
      const { container } = render(<FileUpload aria-label="Resume" />);
      expect(container.querySelector('label')).toBeNull();
      expect(screen.getByLabelText('Resume')).toBeTruthy();
    });

    it('forwards the ref and the rest to the input, className and style to the root', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <FileUpload
          ref={ref}
          label="Files"
          id="mine"
          name="docs"
          data-testid="u"
          className="mine"
          style={{ margin: 1 }}
        />,
      );
      const root = container.firstElementChild as HTMLElement;
      const input = screen.getByLabelText('Files') as HTMLInputElement;
      expect(ref.current).toBe(input);
      expect(input.id).toBe('mine');
      expect(input.name).toBe('docs');
      expect(input.dataset.testid).toBe('u');
      expect(root.classList.contains('mine')).toBe(true);
      expect(root.style.margin).toBe('1px');
    });

    it('puts the frame classes on the root, and the frame box on the zone', () => {
      const { root, input } = renderUpload();
      expect([...root.classList]).toEqual([frameStyles.root, frameStyles.sizeNormal, styles.root]);
      const zone = input.parentElement as HTMLElement;
      expect(zone.classList.contains(frameStyles.control as string)).toBe(true);
      expect(zone.classList.contains(styles.zone as string)).toBe(true);
      expect(input.classList.contains(styles.input as string)).toBe(true);
    });

    it('passes accept and multiple to the input, and says them in the zone', () => {
      const { input } = renderUpload({
        accept: '.pdf, image/*',
        multiple: true,
        maxSize: 5 * 1024 * 1024,
        maxFiles: 3,
      });
      expect(input.accept).toBe('.pdf, image/*');
      expect(input.multiple).toBe(true);
      expect(screen.getByText('Drop files here or browse')).toBeTruthy();
      expect(
        screen.getByText('Accepts .pdf, image/* · Up to 5 MB each · Up to 3 files'),
      ).toBeTruthy();
    });

    it('asks for one file when it is not multiple', () => {
      renderUpload();
      expect(screen.getByText('Drop a file here or browse')).toBeTruthy();
    });

    it('has no native tooltip, unless it is given one', () => {
      expect(renderUpload().input.title).toBe('');
      cleanup();
      expect(renderUpload({ title: 'Mine' }).input.title).toBe('Mine');
    });

    it('is disabled, and its remove buttons with it', () => {
      const { input } = renderUpload({ isDisabled: true, defaultValue: [file('a.txt')] });
      expect(input.disabled).toBe(true);
      expect(
        (screen.getByRole('button', { name: 'Remove a.txt' }) as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('shows the error and marks the input invalid, described by it', () => {
      const { input, root } = renderUpload({ error: 'Too big' });
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Too big').closest('p')?.id).toBe(
        input.getAttribute('aria-describedby'),
      );
      expect(root.querySelector('[data-invalid]')).toBeTruthy();
    });

    it('is natively required in form mode', () => {
      expect(renderUpload({ isRequired: true }).input.required).toBe(true);
    });
  });

  describe('form mode', () => {
    it('lists a picked file with its name and size, and a button to remove it', () => {
      const { input } = renderUpload();
      pick(input, file('report.pdf', 2048));
      expect(rows()).toHaveLength(1);
      expect(screen.getByText('report.pdf')).toBeTruthy();
      expect(screen.getByText('2 KB')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Remove report.pdf' })).toBeTruthy();
    });

    it('has no list while it is empty', () => {
      renderUpload();
      expect(screen.queryByRole('list')).toBeNull();
    });

    it('adds to the list when multiple, and replaces the file when not', () => {
      const { input } = renderUpload({ multiple: true });
      pick(input, file('a.txt'));
      pick(input, file('b.txt'));
      expect(rows()).toHaveLength(2);
      cleanup();

      const single = renderUpload();
      pick(single.input, file('a.txt'));
      pick(single.input, file('b.txt'));
      expect(rows()).toHaveLength(1);
      expect(screen.getByText('b.txt')).toBeTruthy();
      expect(screen.queryByText('a.txt')).toBeNull();
    });

    it('calls onChange with the whole list after an add and after a remove', () => {
      const onChange = vi.fn();
      const { input } = renderUpload({ multiple: true, onChange });
      const [a, b] = [file('a.txt'), file('b.txt')] as [File, File];
      pick(input, a);
      pick(input, b);
      expect(onChange).toHaveBeenLastCalledWith([a, b]);
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
      expect(onChange).toHaveBeenLastCalledWith([b]);
      expect(rows()).toHaveLength(1);
    });

    it('starts from defaultValue', () => {
      renderUpload({ defaultValue: [file('start.txt')] });
      expect(screen.getByText('start.txt')).toBeTruthy();
    });

    it('is controlled by value: it asks the parent, and shows only what the parent says', () => {
      const onChange = vi.fn();
      const a = file('a.txt');
      const b = file('b.txt');
      const { input } = renderUpload({ multiple: true, value: [a], onChange });
      pick(input, b);
      expect(onChange).toHaveBeenCalledWith([a, b]);
      expect(rows()).toHaveLength(1);
    });

    it('is controlled by value: a parent that takes the change updates the list', () => {
      const Parent = () => {
        const [files, setFiles] = useState<File[]>([]);
        return <FileUpload label="Files" multiple value={files} onChange={setFiles} />;
      };
      render(<Parent />);
      pick(screen.getByLabelText('Files') as HTMLInputElement, file('a.txt'));
      expect(rows()).toHaveLength(1);
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
      expect(rows()).toHaveLength(0);
    });

    it('does not add a file it already has, and says nothing about it', () => {
      const onReject = vi.fn();
      const { input } = renderUpload({ multiple: true, onReject });
      pick(input, file('a.txt'));
      pick(input, file('a.txt'));
      expect(rows()).toHaveLength(1);
      expect(onReject).not.toHaveBeenCalled();
    });

    it('turns away a file of the wrong type, one too big, and one too many, and says why', () => {
      const onReject = vi.fn();
      const onChange = vi.fn();
      const { input } = renderUpload({
        multiple: true,
        accept: 'image/*',
        maxSize: 50,
        maxFiles: 1,
        onReject,
        onChange,
      });
      const png = file('a.png', 10, 'image/png');
      const big = file('b.png', 100, 'image/png');
      const txt = file('c.txt', 10, 'text/plain');
      const second = file('d.png', 10, 'image/png');
      pick(input, png, big, txt, second);
      expect(onChange).toHaveBeenCalledWith([png]);
      expect(onReject).toHaveBeenCalledWith([
        { file: big, reason: 'size' },
        { file: txt, reason: 'type' },
        { file: second, reason: 'count' },
      ]);
      expect(rows()).toHaveLength(1);
    });

    it('does not call onChange when everything picked was turned away', () => {
      const onChange = vi.fn();
      const onReject = vi.fn();
      const { input } = renderUpload({ accept: '.pdf', onChange, onReject });
      pick(input, file('a.txt'));
      expect(onChange).not.toHaveBeenCalled();
      expect(onReject).toHaveBeenCalledOnce();
      expect(rows()).toHaveLength(0);
    });

    it('announces what was added and removed', () => {
      const { input } = renderUpload({ multiple: true });
      const status = screen.getByRole('status');
      pick(input, file('a.txt'), file('b.txt'));
      expect(status.textContent).toBe('2 files added');
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
      expect(status.textContent).toBe('a.txt removed');
    });

    it('moves focus to the next remove button after a removal, or to the input at the end', () => {
      const { input } = renderUpload({ multiple: true });
      pick(input, file('a.txt'), file('b.txt'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove b.txt' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }));
      expect(document.activeElement).toBe(input);
    });

    it('moves focus to the previous row when the last one is removed', () => {
      const { input } = renderUpload({ multiple: true });
      pick(input, file('a.txt'), file('b.txt'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }));
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove a.txt' }));
    });
  });

  describe('drag', () => {
    const drag = { dataTransfer: { types: ['Files'] } };

    it('marks the zone while a file is over it, counting what is inside it', () => {
      const { input } = renderUpload();
      const zone = input.parentElement as HTMLElement;
      fireEvent.dragEnter(input, drag);
      fireEvent.dragEnter(zone, drag);
      expect(zone.hasAttribute('data-dragging')).toBe(true);
      fireEvent.dragLeave(input, drag);
      expect(zone.hasAttribute('data-dragging')).toBe(true);
      fireEvent.dragLeave(zone, drag);
      expect(zone.hasAttribute('data-dragging')).toBe(false);
    });

    it('ignores a drag that carries no files', () => {
      const { input } = renderUpload();
      fireEvent.dragEnter(input, { dataTransfer: { types: ['text/plain'] } });
      expect(input.parentElement?.hasAttribute('data-dragging')).toBe(false);
    });

    it('clears the mark on a drop', () => {
      const { input } = renderUpload();
      fireEvent.dragEnter(input, drag);
      fireEvent.drop(input, drag);
      expect(input.parentElement?.hasAttribute('data-dragging')).toBe(false);
    });
  });

  describe('upload mode', () => {
    it('hands each picked file to uploadFile at once, with a signal', () => {
      const uploadFile = vi.fn(
        (_file: File, _control: UploadControl) => new Promise<unknown>(() => {}),
      );
      const { input } = renderUpload({ multiple: true, uploadFile });
      const [a, b] = [file('a.txt'), file('b.txt')] as [File, File];
      pick(input, a, b);
      expect(uploadFile).toHaveBeenCalledTimes(2);
      expect(uploadFile.mock.calls[0]?.[0]).toBe(a);
      expect(uploadFile.mock.calls[1]?.[0]).toBe(b);
      const control = uploadFile.mock.calls[0]![1];
      expect(control.signal.aborted).toBe(false);
    });

    it('does not upload a file it turned away, or one from defaultValue', () => {
      const uploadFile = vi.fn(() => new Promise<unknown>(() => {}));
      const { input } = renderUpload({
        accept: '.pdf',
        uploadFile,
        defaultValue: [file('old.pdf')],
      });
      pick(input, file('a.txt'));
      expect(uploadFile).not.toHaveBeenCalled();
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('shows an indeterminate bar, then a determinate one as progress is reported', async () => {
      let report!: (fraction: number) => void;
      const uploadFile = vi.fn((_file: File, control: UploadControl) => {
        report = control.onProgress;
        return new Promise<unknown>(() => {});
      });
      const { input } = renderUpload({ uploadFile });
      pick(input, file('a.txt'));
      const bar = screen.getByRole('progressbar', { name: 'Uploading a.txt' });
      expect(bar.hasAttribute('aria-valuenow')).toBe(false);
      act(() => report(0.4));
      expect(bar.getAttribute('aria-valuenow')).toBe('40');
      act(() => report(7));
      expect(bar.getAttribute('aria-valuenow')).toBe('100');
    });

    it('marks a finished file done, and gives onUploaded what uploadFile returned', async () => {
      const upload = deferred();
      const onUploaded = vi.fn();
      const uploadFile = vi.fn(() => upload.promise);
      const { input } = renderUpload({ uploadFile, onUploaded });
      const a = file('a.txt');
      pick(input, a);
      upload.resolve('key-1');
      await settle();
      expect(screen.queryByRole('progressbar')).toBeNull();
      expect(screen.getByRole('img', { name: 'Uploaded' })).toBeTruthy();
      expect(onUploaded).toHaveBeenCalledOnce();
      expect(onUploaded).toHaveBeenCalledWith(a, 'key-1');
      expect(screen.getByRole('status').textContent).toBe('a.txt uploaded');
    });

    it('shows a failure with its message and a Retry, and retry uploads the same file again', async () => {
      const first = deferred();
      const second = deferred();
      const uploadFile = vi
        .fn<(file: File, control: UploadControl) => Promise<unknown>>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const onUploaded = vi.fn();
      const { input } = renderUpload({ uploadFile, onUploaded });
      const a = file('a.txt');
      pick(input, a);
      first.reject(new Error('Network down'));
      await settle();
      expect(screen.getByText('Network down')).toBeTruthy();
      expect(screen.getByRole('status').textContent).toBe('a.txt failed');
      expect(onUploaded).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Retry a.txt' }));
      expect(uploadFile).toHaveBeenCalledTimes(2);
      expect(uploadFile.mock.calls[1]?.[0]).toBe(a);
      const signals = uploadFile.mock.calls.map((call) => call[1].signal);
      expect(signals[1]).not.toBe(signals[0]);
      expect(screen.queryByText('Network down')).toBeNull();
      expect(screen.getByRole('progressbar')).toBeTruthy();

      second.resolve('ok');
      await settle();
      expect(onUploaded).toHaveBeenCalledWith(a, 'ok');
      expect(screen.queryByRole('button', { name: 'Retry a.txt' })).toBeNull();
    });

    it('says "Upload failed" when it rejects with something that has no message', async () => {
      const upload = deferred();
      const { input } = renderUpload({ uploadFile: () => upload.promise });
      pick(input, file('a.txt'));
      upload.reject('nope');
      await settle();
      expect(screen.getByText('Upload failed')).toBeTruthy();
    });

    it('treats an uploadFile that throws as a failure', async () => {
      const { input } = renderUpload({
        uploadFile: () => {
          throw new Error('No URL');
        },
      });
      pick(input, file('a.txt'));
      await settle();
      expect(screen.getByText('No URL')).toBeTruthy();
    });

    it('aborts a file that is removed while it uploads, and never calls onUploaded for it', async () => {
      const upload = deferred();
      const onUploaded = vi.fn();
      const onChange = vi.fn();
      const uploadFile = vi.fn((_file: File, _control: UploadControl) => upload.promise);
      const { input } = renderUpload({ uploadFile, onUploaded, onChange });
      pick(input, file('a.txt'));
      const { signal } = uploadFile.mock.calls[0]![1];
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
      expect(signal.aborted).toBe(true);
      expect(onChange).toHaveBeenLastCalledWith([]);
      upload.resolve('late');
      await settle();
      expect(onUploaded).not.toHaveBeenCalled();
    });

    it('does not show an AbortError after the file was removed', async () => {
      const upload = deferred();
      const { input } = renderUpload({ uploadFile: () => upload.promise });
      pick(input, file('a.txt'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
      upload.reject(new DOMException('Aborted', 'AbortError'));
      await settle();
      expect(screen.queryByText('Aborted')).toBeNull();
      expect(screen.getByRole('status').textContent).toBe('a.txt removed');
    });

    it('ignores progress reported after an abort', () => {
      let report!: (fraction: number) => void;
      const { input } = renderUpload({
        uploadFile: (_file, control) => {
          report = control.onProgress;
          return new Promise<unknown>(() => {});
        },
        multiple: true,
      });
      pick(input, file('a.txt'), file('b.txt'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }));
      expect(() => act(() => report(0.5))).not.toThrow();
    });

    it('aborts the old upload when a new file replaces it in a single-file field', () => {
      const uploadFile = vi.fn(
        (_file: File, _control: UploadControl) => new Promise<unknown>(() => {}),
      );
      const { input } = renderUpload({ uploadFile });
      pick(input, file('a.txt'));
      const first = uploadFile.mock.calls[0]![1].signal;
      pick(input, file('b.txt'));
      expect(first.aborted).toBe(true);
      expect(uploadFile.mock.calls[1]![1].signal.aborted).toBe(false);
      expect(rows()).toHaveLength(1);
    });

    it('aborts everything in flight when it unmounts', () => {
      const uploadFile = vi.fn(
        (_file: File, _control: UploadControl) => new Promise<unknown>(() => {}),
      );
      const { input } = renderUpload({ multiple: true, uploadFile });
      pick(input, file('a.txt'), file('b.txt'));
      const signals = uploadFile.mock.calls.map((call) => call[1].signal);
      cleanup();
      expect(signals.every((signal) => signal.aborted)).toBe(true);
    });

    it('aborts a file that a controlled parent takes out of the list', () => {
      const uploadFile = vi.fn(
        (_file: File, _control: UploadControl) => new Promise<unknown>(() => {}),
      );
      let drop!: () => void;
      const Parent = () => {
        const [files, setFiles] = useState<File[]>([]);
        drop = () => setFiles([]);
        return (
          <FileUpload
            label="Files"
            multiple
            value={files}
            onChange={setFiles}
            uploadFile={uploadFile}
          />
        );
      };
      render(<Parent />);
      pick(screen.getByLabelText('Files') as HTMLInputElement, file('a.txt'));
      const { signal } = uploadFile.mock.calls[0]![1];
      expect(signal.aborted).toBe(false);
      act(() => drop());
      expect(signal.aborted).toBe(true);
    });

    it('empties the input after a pick, so the same file can be picked again', () => {
      const { input } = renderUpload({ uploadFile: () => new Promise<unknown>(() => {}) });
      pick(input, file('a.txt'));
      expect(input.value).toBe('');
    });

    it('is not natively required, since the input is always empty, but says it is required', () => {
      const { input } = renderUpload({
        isRequired: true,
        uploadFile: () => new Promise<unknown>(() => {}),
      });
      expect(input.required).toBe(false);
      expect(input.getAttribute('aria-required')).toBe('true');
    });
  });
});
