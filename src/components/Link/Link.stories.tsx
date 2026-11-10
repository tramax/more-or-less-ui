import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showCode } from '../../../.storybook/snippet';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Link } from './Link';
import { LinkProvider } from './LinkProvider';

const VARIANTS = ['less', 'normal', 'more'] as const;

const meta: Meta<typeof Link> = {
  title: 'Navigation/Link',
  component: Link,
  tags: ['autodocs'],
  args: { href: '#docs', children: 'Read the docs' },
  argTypes: {
    // Unset on purpose: a link takes the size of the text around it
    size: { control: 'select', options: [undefined, 'less', 'normal', 'more'] },
    isCurrent: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {};

export const InASentence: Story = {
  parameters: showCode(
    `<Text as="p">Orders placed before noon ship the same day, as set out in our <Link href="/shipping">shipping policy</Link>.</Text>`,
  ),
  render: () => (
    <Text as="p">
      Orders placed before noon ship the same day, as set out in our{' '}
      <Link href="#shipping">shipping policy</Link>.
    </Text>
  ),
};

/** Unset, a link is the size of the text around it. */
export const Size: Story = {
  parameters: showCode(
    VARIANTS.map((v) => `<Link href="/docs" size="${v}">size="${v}"</Link>`).join('\n'),
  ),
  render: () => (
    <Stack align="start">
      {VARIANTS.map((v) => (
        <Link key={v} href="#docs" size={v}>
          size="{v}"
        </Link>
      ))}
    </Stack>
  ),
};

export const CurrentAndDisabled: Story = {
  parameters: showCode(
    `<Link href="/docs">A link</Link>
<Link href="/docs" isCurrent>The current page</Link>
<Link href="/docs" isDisabled>A disabled link</Link>`,
  ),
  render: () => (
    <Stack align="start">
      <Link href="#docs">A link</Link>
      <Link href="#docs" isCurrent>
        The current page
      </Link>
      <Link href="#docs" isDisabled>
        A disabled link
      </Link>
    </Stack>
  ),
};

const CODE = `// React Router
const navigate = useNavigate();
<LinkProvider navigate={navigate}>
  <App />
</LinkProvider>

// Next.js (App Router)
const router = useRouter();
<LinkProvider navigate={router.push}>…</LinkProvider>

// Under a base path, or a hash router
<LinkProvider navigate={navigate} resolveHref={(href) => \`/app\${href}\`}>…</LinkProvider>`;

/**
 * One `LinkProvider` inside your router, and every link goes to it with no page load. Here the
 * "router" is a state: press a link and the path changes; press it with Ctrl or Cmd held and the
 * browser opens it as usual.
 *
 * Links are written in the router's terms (`/team`). This one pretends to be a hash router, so it also
 * passes `resolveHref`: the anchor's real `href` is `#/team` (hover a link to see it in the status bar,
 * or right-click and copy the address), while `navigate` still gets `/team`.
 */
export const WithARouter: Story = {
  parameters: showCode(CODE),
  render: function Render() {
    const [path, setPath] = useState('/home');
    return (
      <LinkProvider navigate={setPath} resolveHref={(href) => `#${href}`}>
        <Stack align="start">
          <Text>
            Path: <strong>{path}</strong>
          </Text>
          {['/home', '/team', '/pricing'].map((to) => (
            <Link key={to} href={to} isCurrent={path === to}>
              {to}
            </Link>
          ))}
          <Link href="https://example.com" target="_blank" rel="noreferrer">
            example.com (another site, left to the browser)
          </Link>
        </Stack>
      </LinkProvider>
    );
  },
};
