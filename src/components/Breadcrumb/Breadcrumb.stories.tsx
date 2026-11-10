import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { omitDefaults, showCode } from '../../../.storybook/snippet';
import { LinkProvider } from '../Link';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Breadcrumb, BREADCRUMB_DEFAULTS, type BreadcrumbItem } from './Breadcrumb';

const TRAIL: BreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Shop', href: '#shop' },
  { label: 'Shoes', href: '#shoes' },
  { label: 'Trail runners' },
];

const VARIANTS = ['less', 'normal', 'more'] as const;

const meta: Meta<typeof Breadcrumb> = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...BREADCRUMB_DEFAULTS, items: TRAIL },
  parameters: { docs: { source: { transform: omitDefaults(BREADCRUMB_DEFAULTS) } } },
  argTypes: {
    // Storybook only reads defaults from destructuring, so state them for the Default column
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: BREADCRUMB_DEFAULTS.size } },
    },
    'aria-label': { control: 'text', table: { defaultValue: { summary: 'Breadcrumb' } } },
  },
};
export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {};

export const Size: Story = {
  parameters: showCode(VARIANTS.map((v) => `<Breadcrumb size="${v}" items={items} />`).join('\n')),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Breadcrumb key={v} size={v} items={TRAIL} />
      ))}
    </Stack>
  ),
};

/**
 * The last item is the current page. With no `href` it is plain text; give it one and it stays a link
 * (marked current), to reload the page or copy its address. A level before the end can have no `href`
 * too: a section that is not a page.
 */
export const CurrentPage: Story = {
  parameters: showCode(
    `<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Shoes' },          // the current page: text
  ]}
/>
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Shoes', href: '/shop/shoes' },   // still a link, marked current
  ]}
/>
<Breadcrumb items={[{ label: 'Archive' }, { label: 'Shoes' }]} /> // a level that is not a page`,
  ),
  render: () => (
    <Stack>
      <Breadcrumb
        items={[
          { label: 'Home', href: '#home' },
          { label: 'Shop', href: '#shop' },
          { label: 'Shoes' },
        ]}
      />
      <Breadcrumb
        items={[
          { label: 'Home', href: '#home' },
          { label: 'Shop', href: '#shop' },
          { label: 'Shoes', href: '#shoes' },
        ]}
      />
      <Breadcrumb items={[{ label: 'Archive' }, { label: 'Shoes' }]} />
    </Stack>
  ),
};

/** A long trail wraps onto more lines instead of overflowing. */
export const LongTrail: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '20rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    items: [
      { label: 'Home', href: '#home' },
      { label: 'Documentation', href: '#docs' },
      { label: 'Components', href: '#components' },
      { label: 'Navigation', href: '#navigation' },
      { label: 'Breadcrumb and its long name' },
    ],
  },
};

/** Under a `LinkProvider`, each level goes to your router. Here the "router" is a state. */
export const WithARouter: Story = {
  parameters: showCode(
    `const navigate = useNavigate();
<LinkProvider navigate={navigate}>
  <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
</LinkProvider>`,
  ),
  render: function Render() {
    const [path, setPath] = useState('/shop/shoes');
    const parts = path.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      ...parts.map((part, index) => ({
        label: part,
        href: `/${parts.slice(0, index + 1).join('/')}`,
      })),
    ];
    return (
      <LinkProvider navigate={setPath} resolveHref={(href) => `#${href}`}>
        <Stack>
          <Breadcrumb
            items={items.map((item, i) => (i === items.length - 1 ? { label: item.label } : item))}
          />
          <Text>Path: {path}</Text>
        </Stack>
      </LinkProvider>
    );
  },
};
