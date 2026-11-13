import { Divider, Link, SegmentedControl, Stack, useTheme } from 'more-or-less-ui';
import { GITHUB_URL, STORYBOOK_URL } from './links';
import { useRouter } from './router';
import styles from './site.module.css';

// Components is Storybook, a page of its own beside the site: it opens in a new tab and is never current
const NAV = [
  { href: '/principles', label: 'Principles', page: 'principles' },
  { href: STORYBOOK_URL, label: 'Components', page: null },
  { href: '/about', label: 'About', page: 'about' },
] as const;

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/** The site's own theme toggle is the library's SegmentedControl and ThemeProvider, nothing else. */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl
      aria-label="Color theme"
      size="less"
      options={THEMES}
      value={theme}
      onChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
    />
  );
}

export function Header() {
  const { route } = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.page}>
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap="more"
          wrap
          className={styles.headerRow}
        >
          <Link href="/" className={styles.brand} isCurrent={route.page === 'home'}>
            <span className={styles.logo} aria-hidden="true" />
            More or Less UI
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            <Stack direction="row" gap="more" wrap>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  isCurrent={route.page === item.page}
                  {...(item.page === null && { target: '_blank', rel: 'noopener' })}
                >
                  {item.label}
                </Link>
              ))}
            </Stack>
          </nav>
          <Stack direction="row" align="center" gap="more" wrap>
            <Link href={GITHUB_URL} target="_blank" rel="noopener">
              GitHub
            </Link>
            <ThemeToggle />
          </Stack>
        </Stack>
      </div>
      <Divider />
    </header>
  );
}
