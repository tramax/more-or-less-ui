import { Stack, Text, Title } from 'more-or-less-ui';
import styles from '../site.module.css';

/** A page whose content is next on the outline (site/OUTLINE.md). */
export function Coming({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.page}>
      <Stack gap="normal" className={styles.hero}>
        <Title as="h1" size="more">
          {title}
        </Title>
        <Text as="p" size="more" color="less">
          {text}
        </Text>
      </Stack>
    </div>
  );
}
