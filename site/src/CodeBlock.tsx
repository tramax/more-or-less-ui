import { useEffect, useRef, useState } from 'react';
import { Button } from 'more-or-less-ui';
import styles from './site.module.css';

/** A snippet to read and copy. No syntax highlighting: it would be a dependency for a few lines. */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // No clipboard (an insecure page, a denied permission): the code is still there to select
    }
  };

  return (
    <div className={styles.codeBlock}>
      <pre className={styles.pre} tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
      <Button
        className={styles.copy}
        size="less"
        background="less"
        onClick={copy}
        aria-label={`Copy: ${label}`}
      >
        {isCopied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
