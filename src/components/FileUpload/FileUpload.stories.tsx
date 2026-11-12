import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import {
  FileUpload,
  FILE_UPLOAD_DEFAULTS,
  type FileRejection,
  type UploadControl,
} from './FileUpload';

const VARIANTS = ['less', 'normal', 'more'] as const;

// The Size story renders all three variants at once, so its controls would do nothing. Its render
// returns <Column>, which Storybook can't turn into <FileUpload> code, so spell the snippet out.
const comparison = {
  controls: { disable: true },
  docs: {
    source: {
      code: VARIANTS.map((v) => `<FileUpload size="${v}" label="size=&quot;${v}&quot;" />`).join(
        '\n\n',
      ),
      transform: (code: string) => code,
    },
  },
};

const Column = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
    {children}
  </div>
);

const meta: Meta<typeof FileUpload> = {
  title: 'Inputs/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...FILE_UPLOAD_DEFAULTS, label: 'Attachments', multiple: true },
  parameters: { docs: { source: { transform: omitDefaults(FILE_UPLOAD_DEFAULTS) } } },
  decorators: [
    (Story) => (
      <div style={{ width: '28rem', maxWidth: '100%', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: FILE_UPLOAD_DEFAULTS.size } },
    },
    accept: { control: 'text' },
    maxSize: { control: 'number' },
    maxFiles: { control: 'number' },
    onChange: { action: 'changed' },
    onReject: { action: 'rejected' },
    onUploaded: { action: 'uploaded' },
  },
};
export default meta;
type Story = StoryObj<typeof FileUpload>;

/** Form mode: the files stay in the input and go with the form. Nothing is sent. */
export const Default: Story = {};

export const WithTooltip: Story = {
  args: { tooltip: 'PDF or images, up to 5 MB each.' },
};

export const Size: Story = {
  parameters: comparison,
  render: () => (
    <Column>
      {VARIANTS.map((v) => (
        <FileUpload key={v} size={v} label={`size="${v}"`} />
      ))}
    </Column>
  ),
};

/** Without `multiple` a new file replaces the old one. */
export const SingleFile: Story = {
  args: { label: 'Resume', multiple: false, accept: '.pdf', maxSize: 5 * 1024 * 1024 },
};

const MB = 1024 * 1024;

const LimitsField = () => {
  const [error, setError] = useState<string>();
  const onReject = (rejections: FileRejection[]) => {
    const names = rejections.map(({ file, reason }) => `${file.name} (${reason})`).join(', ');
    setError(`Not added: ${names}`);
  };
  return (
    <FileUpload
      label="Photos"
      multiple
      accept="image/*"
      maxSize={2 * MB}
      maxFiles={3}
      error={error}
      onReject={onReject}
      onChange={() => setError(undefined)}
    />
  );
};

/**
 * Files that fail `accept`, `maxSize` or `maxFiles` are not added; `onReject` says which and why. The
 * field never writes a message: the caller decides what to show in `error`.
 */
export const Limits: Story = {
  parameters: showCode(`const [error, setError] = useState<string>();

<FileUpload
  label="Photos"
  multiple
  accept="image/*"
  maxSize={2 * 1024 * 1024}
  maxFiles={3}
  error={error}
  onReject={(rejections) =>
    setError(\`Not added: \${rejections.map(({ file, reason }) => \`\${file.name} (\${reason})\`).join(', ')}\`)
  }
  onChange={() => setError(undefined)}
/>`),
  render: () => <LimitsField />,
};

/**
 * Upload mode: `uploadFile` is called for each picked file at once. The field sends nothing; this one
 * fakes a pre-signed upload with progress, and fails a file whose name contains "fail", to show Retry.
 * `onUploaded` gets the key it returns, for the consumer's own data. Removing a row aborts it.
 */
function fakeUpload(file: File, { signal, onProgress }: UploadControl) {
  return new Promise<string>((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent += 10 + Math.random() * 15;
      onProgress(percent / 100);
      if (percent < 100) return;
      clearInterval(timer);
      if (file.name.includes('fail')) reject(new Error('The storage service refused the upload'));
      else resolve(`uploads/${crypto.randomUUID()}/${file.name}`);
    }, 300);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

const UploadField = () => {
  const [keys, setKeys] = useState<Record<string, string>>({});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FileUpload
        label="Attachments"
        multiple
        uploadFile={fakeUpload}
        onUploaded={(file, key) => setKeys((have) => ({ ...have, [file.name]: String(key) }))}
        onChange={(files) =>
          setKeys((have) =>
            Object.fromEntries(
              Object.entries(have).filter(([name]) => files.some((f) => f.name === name)),
            ),
          )
        }
      />
      <pre style={{ margin: 0, fontSize: '0.75rem' }}>
        {JSON.stringify({ attachments: Object.values(keys) }, null, 2)}
      </pre>
    </div>
  );
};

export const UploadMode: Story = {
  parameters: showCode(`<FileUpload
  label="Attachments"
  multiple
  uploadFile={async (file, { signal, onProgress }) => {
    const { url, key } = await getPresignedUrl(file.name, file.type);
    await putWithProgress(url, file, { signal, onProgress });
    return key;
  }}
  onUploaded={(file, key) => setKeys((have) => ({ ...have, [file.name]: key }))}
  onChange={(files) => forgetKeysOfRemovedFiles(files)}
/>`),
  render: () => <UploadField />,
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const Invalid: Story = {
  args: { error: 'Attach at least one file' },
};
