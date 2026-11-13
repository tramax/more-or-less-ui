import { useState } from 'react';
import {
  Breadcrumb,
  Button,
  Indicator,
  Link,
  Menu,
  Popover,
  Stack,
  Tabs,
  Text,
  useToast,
} from 'more-or-less-ui';
import { BookClass } from './BookClass';
import { Bookings } from './Bookings';

const ACCOUNT = [
  { value: 'bookings', label: 'Your bookings' },
  { value: 'settings', label: 'Settings' },
  { value: 'out', label: 'Sign out' },
];

/**
 * A small product built from the library alone, so the pieces are seen together the way they would be
 * used: a pottery studio's booking page. Nothing here is styled by the site; change the tokens above
 * and every part of it changes with them.
 */
export function Showcase() {
  const toast = useToast();
  const [tab, setTab] = useState('book');

  return (
    <Stack gap="more">
      <Stack direction="row" gap="more" align="center" justify="between" wrap>
        <Breadcrumb
          items={[
            { label: 'Clay Studio', href: '/' },
            { label: 'Classes', href: '/' },
            { label: 'Wheel throwing' },
          ]}
        />
        <Stack direction="row" gap="normal" align="center" wrap>
          <Indicator count={2} label="2 unread notifications">
            <Popover
              aria-label="Notifications"
              trigger={
                <Button background="less" size="less">
                  Inbox
                </Button>
              }
              align="end"
            >
              <Stack gap="normal">
                <Text fontWeight="more">Two things for you</Text>
                <Text as="p">Your Thursday group moved to the big studio.</Text>
                <Text as="p">
                  A place opened on <Link href="/">Hand building</Link>.
                </Text>
              </Stack>
            </Popover>
          </Indicator>
          <Menu
            trigger={
              <Button background="less" size="less">
                Mara
              </Button>
            }
            items={ACCOUNT}
            align="end"
            onSelect={(value) =>
              value === 'bookings'
                ? setTab('bookings')
                : toast.add({ title: value === 'out' ? 'Signed out' : 'Settings are coming soon' })
            }
          />
        </Stack>
      </Stack>

      <Tabs
        aria-label="Studio"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'book', label: 'Book a class', content: <BookClass /> },
          { value: 'bookings', label: 'Your bookings', content: <Bookings /> },
        ]}
      />
    </Stack>
  );
}
