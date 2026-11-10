import { useCallback, useEffect, useRef, useState } from 'react';

/** Where one file is. `progress` is 0-1, or undefined until `uploadFile` first reports it. */
export type FileStatus =
  | { state: 'uploading'; progress: number | undefined }
  | { state: 'done' }
  | { state: 'error'; message: string };

/** What `uploadFile` is given besides the file. */
export interface UploadControl {
  /** Aborted when the file is removed, or replaced in a single-file field, or the field is unmounted. */
  signal: AbortSignal;
  /** Report how far along the upload is, 0 to 1. Values outside that are held to it. */
  onProgress: (fraction: number) => void;
}

export type UploadFile = (file: File, control: UploadControl) => Promise<unknown>;

interface Options {
  /** Without it the hook does nothing: form mode. */
  uploadFile: UploadFile | undefined;
  onUploaded: ((file: File, result: unknown) => void) | undefined;
  /** Called when a file's upload ends, for the field's live region. */
  onSettled: (file: File, outcome: 'done' | 'error') => void;
  /** The files in the list. One that is not in it any more (a controlled parent dropped it) is aborted. */
  files: File[];
}

const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : 'Upload failed';

/**
 * The uploads of FileUpload's upload mode: starts `uploadFile` for a file, keeps where each file is
 * (by `File` identity), and aborts one that leaves the list. It does no network itself.
 *
 * An upload that is aborted never reports: the promise's result, its failure and its progress are all
 * ignored once the signal is aborted, so a consumer that does not look at the signal is still safe.
 */
export function useFileUploads({ uploadFile, onUploaded, onSettled, files }: Options) {
  const [statuses, setStatuses] = useState<ReadonlyMap<File, FileStatus>>(new Map());
  const controllers = useRef(new Map<File, AbortController>());

  // The newest callbacks, for an upload that started under older ones. Set after render, not during.
  const latest = useRef({ uploadFile, onUploaded, onSettled });
  useEffect(() => {
    latest.current = { uploadFile, onUploaded, onSettled };
  });

  const setStatus = useCallback((file: File, status: FileStatus | undefined) => {
    setStatuses((previous) => {
      const next = new Map(previous);
      if (status) next.set(file, status);
      else next.delete(file);
      return next;
    });
  }, []);

  const forget = useCallback(
    (file: File) => {
      controllers.current.get(file)?.abort();
      controllers.current.delete(file);
      setStatus(file, undefined);
    },
    [setStatus],
  );

  const start = useCallback(
    (file: File) => {
      const upload = latest.current.uploadFile;
      if (!upload) return;
      controllers.current.get(file)?.abort();
      const controller = new AbortController();
      controllers.current.set(file, controller);
      const { signal } = controller;
      setStatus(file, { state: 'uploading', progress: undefined });

      const onProgress = (fraction: number) => {
        if (signal.aborted || !Number.isFinite(fraction)) return;
        setStatus(file, { state: 'uploading', progress: Math.min(Math.max(fraction, 0), 1) });
      };

      // `upload` may throw before it returns a promise; that is a failure like any other
      new Promise<unknown>((resolve) => resolve(upload(file, { signal, onProgress }))).then(
        (result) => {
          if (signal.aborted) return;
          controllers.current.delete(file);
          setStatus(file, { state: 'done' });
          latest.current.onUploaded?.(file, result);
          latest.current.onSettled(file, 'done');
        },
        (error: unknown) => {
          if (signal.aborted) return;
          controllers.current.delete(file);
          setStatus(file, { state: 'error', message: messageOf(error) });
          latest.current.onSettled(file, 'error');
        },
      );
    },
    [setStatus],
  );

  // A controlled parent can take a file out of the list without the field's own remove button
  useEffect(() => {
    for (const [file, controller] of controllers.current) {
      if (!files.includes(file)) {
        controller.abort();
        controllers.current.delete(file);
      }
    }
  }, [files]);

  useEffect(() => {
    const running = controllers.current;
    return () => {
      for (const controller of running.values()) controller.abort();
      running.clear();
    };
  }, []);

  return { statuses, start, retry: start, forget };
}
