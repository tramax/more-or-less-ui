import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { clsx } from '@/utils/clsx';
import { resolveScaleProps } from '@/utils/scale';
import type { ScaleProp } from '@/types/scale';
import styles from './Avatar.module.css';

// Exported for Storybook, which can't see defaults that aren't destructuring defaults
export const AVATAR_DEFAULTS = {
  size: 'normal',
} as const;

// The shape (a circle), the font weight and the background are not props: Avatar.module.css fixes
// them, and the background comes from the name (see getHue).
const SCALE_SPEC = {
  // Empty on purpose: without it `resolveScaleProps` can't tell the other props from scale props
  direct: [],
  // `size` sets font-size only: the box is 2.5em square (see Avatar.module.css), so it, the initials
  // and the glyph all follow it, escape-hatch values included.
  compound: { size: ['fontSize'] },
  defaults: AVATAR_DEFAULTS,
} as const;

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
  size?: ScaleProp;
  /** The picture. While it loads, and if it fails, the fallback shows instead. */
  src?: string;
  /**
   * Whose it is. It gives the initials when there is no picture, the accessible name unless `alt`
   * says otherwise, and the background color: the same name is always the same color.
   */
  name?: string;
  /**
   * The accessible name, when it should differ from `name`. `alt=""` marks the avatar decorative:
   * use it beside the person's name written out, so a screen reader doesn't say it twice.
   */
  alt?: string;
  /** The fallback, in place of the initials and the glyph: an icon, a logo's letter. */
  children?: ReactNode;
};

/** The first letter of the first and last words: "Ada Lovelace" → "AL", "ada" → "A". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  // Array.from takes a whole code point, so an emoji or a letter outside the BMP isn't split in half
  const first = (word: string | undefined) => (word ? (Array.from(word)[0] ?? '') : '');
  const [head, ...tail] = words;
  return (first(head) + first(tail[tail.length - 1])).toLocaleUpperCase();
}

/**
 * A hue (0-359 degrees) for a name, the same every time. Case and extra spaces don't matter, so
 * "Ada Lovelace" and " ada  lovelace" agree. FNV-1a over the code points, which spreads even short or
 * similar names (Ada, Adam) across the wheel.
 */
export function getHue(name: string): number {
  const normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();
  let hash = 0x811c9dc5;
  for (const char of normalized) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193);
  }
  return (hash >>> 0) % 360;
}

const isEmpty = (node: ReactNode) => node == null || typeof node === 'boolean' || node === '';

type ImageState = { src: string | undefined; status: 'loaded' | 'error' };

/**
 * A person's or an account's picture in a small circle, falling back to their initials, to content of
 * your own, or to a plain glyph, on a color taken from their name. It is not interactive: wrap it in a link or a button when it should
 * be. It is one image to assistive technology (`role="img"`, named by `alt` or `name`), or hidden when
 * it has neither.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name, alt, className, style, children, ...props },
  ref,
) {
  const { classNames, style: scaleStyle, rest } = resolveScaleProps(styles, SCALE_SPEC, props);

  // What happened to `src`, tagged with the `src` it happened to, so a new `src` starts over as
  // "loading" without an effect to reset it
  const [image, setImage] = useState<ImageState>();
  const status = src && image?.src === src ? image.status : 'loading';

  const label = alt ?? name;
  const isNamed = Boolean(label || rest['aria-label'] || rest['aria-labelledby']);
  const initials = name ? getInitials(name) : '';
  // Only the hue varies; lightness and chroma are theme tokens. A custom property, so the CSS does the color.
  const hue = name?.trim() ? getHue(name) : undefined;

  return (
    <span
      {...rest}
      ref={ref}
      role="img"
      aria-label={label || rest['aria-label']}
      aria-hidden={isNamed ? rest['aria-hidden'] : true}
      className={clsx(styles.avatar, classNames, hue === undefined && styles.anonymous, className)}
      style={{
        ...scaleStyle,
        ...(hue !== undefined && ({ '--avatar-hue': hue } as CSSProperties)),
        ...style,
      }}
    >
      {/* Under the picture while it loads, and instead of it if it fails. Not rendered once the
          picture is in, so a transparent one doesn't show it through. */}
      {status !== 'loaded' && (
        <span className={styles.fallback}>
          {!isEmpty(children) ? (
            children
          ) : initials ? (
            initials
          ) : (
            <svg className={styles.glyph} viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="5.5" r="3" />
              <path d="M2 14.5c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5z" />
            </svg>
          )}
        </span>
      )}
      {src && status !== 'error' && (
        <img
          key={src}
          // The avatar carries the name, so the picture inside is not announced a second time
          alt=""
          src={src}
          decoding="async"
          // Transparent until it has loaded: a half-loaded or broken picture is never seen
          className={clsx(styles.image, status === 'loading' && styles.loading)}
          onLoad={() => setImage({ src, status: 'loaded' })}
          onError={() => setImage({ src, status: 'error' })}
          // Already in the cache, or finished before this attached (server-rendered markup). Only
          // while loading: a ref callback runs on every render, and setting state again would loop.
          ref={(img) => {
            if (status === 'loading' && img?.complete && img.naturalWidth > 0) {
              setImage({ src, status: 'loaded' });
            }
          }}
        />
      )}
    </span>
  );
});
