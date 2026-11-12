import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
} from 'react';
import type { ScaleProp } from '@/types/scale';
import { CheckIcon } from '../_shared/CheckIcon';
import { CloseButton } from '../_shared/CloseButton';
import { FieldError } from '../_shared/FieldError';
import { IconButton } from '../_shared/IconButton';
import { OptionText } from '../_shared/OptionText';
import { TextFieldFrame } from '../_shared/TextFieldFrame';
import type { FieldNameProps } from '../_shared/types';
import { useControlledState } from '../_shared/useControlledState';
import { VisuallyHidden } from '../_shared/VisuallyHidden';
import { Progress } from '../Progress';
import { RetryIcon, UploadIcon } from './FileIcons';
import { filterFiles, formatBytes, syncInputFiles, type FileRejection } from './files';
import { useFileUploads, type UploadFile } from './useFileUploads';
import { clsx } from '@/utils/clsx';
import styles from './FileUpload.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export { TEXT_FIELD_DEFAULTS as FILE_UPLOAD_DEFAULTS } from '../_shared/TextFieldFrame';

export type { FileRejection, RejectionReason } from './files';
export type { FileStatus, UploadControl, UploadFile } from './useFileUploads';

type FileUploadBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'color'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'accept'
  | 'multiple'
  | 'children'
> &
  FieldNameProps & {
    /** Sets the font size; the zone's padding and the rows' gaps follow it. */
    size?: ScaleProp;
    /** Visible label above the zone. Without it, pass `aria-label` or `aria-labelledby`. */
    label?: string;
    /**
     * Marks the field invalid and shows this message below the list. The caller decides when, and
     * what to say (`onReject` says which files were turned away and why).
     */
    error?: string;
    /** Not clickable, not focusable, dimmed. Uses the native `disabled` attribute. */
    isDisabled?: boolean;
    /** Native `required` (form mode) and an asterisk after the label. */
    isRequired?: boolean;
    /** What the picker offers, in the native syntax (".pdf, image/*"). Also checked on a drop. */
    accept?: string;
    /** More than one file. Without it a new file replaces the old one. */
    multiple?: boolean;
    /** The biggest file, in bytes. A bigger one is not added. */
    maxSize?: number;
    /** The most files in the list (with `multiple`). The ones that don't fit are not added. */
    maxFiles?: number;
    /** The files (controlled). */
    value?: File[];
    /** The files at the start (uncontrolled). In upload mode these are not uploaded. */
    defaultValue?: File[];
    /** Called with the whole list after a file is added or removed. */
    onChange?: (files: File[]) => void;
    /** Called with the files that were turned away, and why. They are not in the list. */
    onReject?: (rejections: FileRejection[]) => void;
  };

type FormModeProps = {
  uploadFile?: undefined;
  onUploaded?: never;
};

type UploadModeProps = {
  /**
   * Upload mode. Called for each file the user picks, at once; the component sends nothing itself.
   * Report progress with `onProgress(0-1)`, stop when `signal` is aborted (the file was removed), and
   * return what the file becomes (a key, a URL). A rejection is shown on the file, with a Retry.
   */
  uploadFile: UploadFile;
  /** Called with what `uploadFile` returned, once, when the file has been uploaded. */
  onUploaded?: (file: File, result: unknown) => void;
};

export type FileUploadProps = FileUploadBaseProps & (FormModeProps | UploadModeProps);

const NO_FILES: File[] = [];

/** "Accepts .pdf, image/* · Up to 5 MB each · Up to 3 files": what the zone says it will take. */
function describeLimits(accept: string | undefined, maxSize?: number, maxFiles?: number) {
  const types = (accept ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  return (
    [
      types.length > 0 && `Accepts ${types.join(', ')}`,
      maxSize !== undefined && `Up to ${formatBytes(maxSize)} each`,
      maxFiles !== undefined && `Up to ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}`,
    ]
      .filter(Boolean)
      .join(' · ') || undefined
  );
}

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files');

/**
 * Takes files from the user, by dropping them on a zone or by the picker, and lists them with a button
 * to remove each. A native `<input type="file">` is stretched over the zone, so click, keyboard,
 * dropping, `accept`, `required` and form submission are the browser's.
 *
 * Two uses, told apart by `uploadFile`:
 * - **Form mode** (no `uploadFile`): the files stay in the input and go with the form (`name`).
 * - **Upload mode**: each picked file is handed to `uploadFile` at once (for a pre-signed URL, say),
 *   and the list shows where each one is: progress, done, or failed with a Retry. `onUploaded` gets
 *   what `uploadFile` returned. Removing a file aborts its upload.
 */
export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    value,
    defaultValue,
    onChange,
    onReject,
    uploadFile,
    onUploaded,
    ...props
  },
  ref,
) {
  const isUploadMode = uploadFile !== undefined;
  const [files, record] = useControlledState<File[]>(value, defaultValue ?? NO_FILES);
  const [announcement, setAnnouncement] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // dragenter / dragleave also fire for what is inside the zone, so the drag is over it while the
  // enters outnumber the leaves
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Where focus goes after a file is removed: the row that took its place, or -1 for the input
  const focusAfterRemoval = useRef<number | null>(null);

  const uploads = useFileUploads({
    uploadFile,
    onUploaded,
    files,
    onSettled: (file, outcome) =>
      setAnnouncement(`${file.name} ${outcome === 'done' ? 'uploaded' : 'failed'}`),
  });

  // The input's own list follows the value (form mode), including one the parent changed
  useEffect(() => {
    if (inputRef.current && !uploadFile) syncInputFiles(inputRef.current, files);
  }, [files, uploadFile]);

  // Not a dependency list: runs after the render that follows the click, whether or not the parent
  // took the file out, so a parent that ignores the removal gets focus back on the same button
  useEffect(() => {
    const index = focusAfterRemoval.current;
    if (index === null) return;
    focusAfterRemoval.current = null;
    const row = index >= 0 ? listRef.current?.children[index] : undefined;
    const buttons = row ? Array.from(row.querySelectorAll('button')) : [];
    (buttons.at(-1) ?? inputRef.current)?.focus();
  });

  const commit = (next: File[]) => {
    record(next);
    onChange?.(next);
  };

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const picked = Array.from(input.files ?? []);
    const { accepted, rejected } = filterFiles(picked, multiple ? files : NO_FILES, {
      accept,
      maxSize,
      maxFiles,
      multiple,
    });
    const next = multiple ? [...files, ...accepted] : accepted.length > 0 ? accepted : files;

    // The input shows the list (form mode), or nothing: in upload mode the files are the list's now,
    // and an empty input lets the same file be picked again
    if (uploadFile) input.value = '';
    else syncInputFiles(input, next);

    if (rejected.length > 0) onReject?.(rejected);
    if (accepted.length === 0) return;

    if (uploadFile) {
      if (!multiple) files.forEach(uploads.forget);
      accepted.forEach(uploads.start);
    }
    setAnnouncement(`${accepted.length} ${accepted.length === 1 ? 'file' : 'files'} added`);
    commit(next);
  };

  const handleRemove = (file: File, index: number) => {
    if (uploadFile) uploads.forget(file);
    const next = files.filter((have) => have !== file);
    focusAfterRemoval.current = Math.min(index, next.length - 1);
    setAnnouncement(`${file.name} removed`);
    commit(next);
  };

  const hint = describeLimits(accept, maxSize, maxFiles);
  const prompt = multiple ? 'Drop files here or browse' : 'Drop a file here or browse';

  return (
    <TextFieldFrame {...props} rootClassName={styles.root}>
      {(
        {
          className,
          disabled,
          required,
          id,
          'aria-invalid': isInvalid,
          // A file input has no read-only state
          readOnly: _readOnly,
          ...control
        },
        rest,
      ) => (
        <>
          <div
            className={clsx(className, styles.zone)}
            data-dragging={isDragging || undefined}
            data-invalid={isInvalid || undefined}
            onDragEnter={(event) => {
              if (!hasFiles(event)) return;
              dragDepth.current += 1;
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (!hasFiles(event)) return;
              dragDepth.current = Math.max(dragDepth.current - 1, 0);
              if (dragDepth.current === 0) setIsDragging(false);
            }}
            onDrop={() => {
              dragDepth.current = 0;
              setIsDragging(false);
            }}
          >
            <OptionText label={prompt} icon={<UploadIcon />} {...(hint && { description: hint })} />
            <input
              // No native tooltip ("No file chosen"): the zone says what it wants
              title=""
              {...rest}
              {...control}
              id={id}
              ref={(node) => {
                inputRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
              }}
              type="file"
              className={styles.input}
              disabled={disabled}
              // A file input can't be required in upload mode: it is always emptied after a pick
              required={required && !isUploadMode}
              aria-required={(required && isUploadMode) || undefined}
              aria-invalid={isInvalid}
              accept={accept}
              multiple={multiple}
              onChange={handlePick}
            />
          </div>
          {files.length > 0 && (
            <ul ref={listRef} className={styles.list}>
              {files.map((file, index) => {
                const status = uploads.statuses.get(file);
                const errorId = `${id}-file-${index}-error`;
                return (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className={styles.file}
                  >
                    <div className={styles.main}>
                      <span className={styles.text}>
                        <OptionText label={file.name} description={formatBytes(file.size)} />
                      </span>
                      <span className={styles.actions}>
                        {status?.state === 'done' && (
                          <span role="img" aria-label="Uploaded" className={styles.done}>
                            <CheckIcon className={styles.doneIcon} />
                          </span>
                        )}
                        {status?.state === 'error' && (
                          <IconButton
                            label={`Retry ${file.name}`}
                            icon={RetryIcon}
                            isDisabled={disabled}
                            onClick={() => uploads.retry(file)}
                          />
                        )}
                        <CloseButton
                          label={`Remove ${file.name}`}
                          isDisabled={disabled}
                          onClick={() => handleRemove(file, index)}
                        />
                      </span>
                    </div>
                    {status?.state === 'uploading' && (
                      <Progress
                        size="1em"
                        aria-label={`Uploading ${file.name}`}
                        {...(status.progress !== undefined && { value: status.progress * 100 })}
                      />
                    )}
                    {status?.state === 'error' && (
                      <FieldError id={errorId}>{status.message}</FieldError>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        </>
      )}
    </TextFieldFrame>
  );
});
