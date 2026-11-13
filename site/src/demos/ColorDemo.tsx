import { Avatar, Grid, Indicator } from 'more-or-less-ui';
import { Cell } from './Cell';
import styles from '../site.module.css';

/** Beside the library's badge, the usual one: the same mark, in the error color. */
export function ColorDemo() {
  return (
    <Grid columns={{ minWidth: '20rem' }} gap="more" paddingTop="less">
      <Cell promise="Here: a mark on the corner that pops in. It says “something is here”, in a darker mix of the brand color (5.1:1 on white, 11.4:1 on dark).">
        <Indicator count={3} label="3 unread messages">
          <Avatar name="Ada Lovelace" />
        </Indicator>
      </Cell>

      <Cell promise="The usual: red. It says “something is wrong, hurry”, and used on everything it stops being seen.">
        <span className={styles.badgeHost}>
          <Avatar name="Ada Lovelace" />
          <span className={styles.redBadge}>3</span>
        </span>
      </Cell>
    </Grid>
  );
}
