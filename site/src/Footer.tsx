import { Divider, Link, Stack, Text } from 'more-or-less-ui';
import { GITHUB_URL, STORYBOOK_URL } from './links';
import styles from './site.module.css';

export function Footer() {
  return (
    <footer>
      <Divider />
      <div className={styles.page}>
        <Stack direction="row" gap="more" justify="between" wrap className={styles.footer}>
          <Text color="less" size="less">
            MIT License. Built with the library it describes.
          </Text>
          <nav aria-label="Elsewhere">
            <Stack direction="row" gap="more" wrap>
              <Link size="less" href={STORYBOOK_URL} target="_blank" rel="noopener">
                Storybook
              </Link>
              <Link size="less" href={GITHUB_URL} target="_blank" rel="noopener">
                GitHub
              </Link>
            </Stack>
          </nav>
        </Stack>
      </div>
    </footer>
  );
}
