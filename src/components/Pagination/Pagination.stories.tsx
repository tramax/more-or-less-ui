import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { asControlled, showCode } from '../../../.storybook/snippet';
import { LinkProvider } from '../Link';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Pagination, PAGINATION_DEFAULTS } from './Pagination';

const VARIANTS = ['less', 'normal', 'more'] as const;

// The parent owns the page, so every story needs one. The `page` arg is where it starts.
const Stateful = ({ page: initial, onChange, ...args }: ComponentProps<typeof Pagination>) => {
  const [page, setPage] = useState(initial);
  return (
    <Pagination
      {...args}
      page={page}
      onChange={(next) => {
        setPage(next);
        onChange?.(next);
      }}
    />
  );
};

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  // Start the controls at the component's defaults
  args: { ...PAGINATION_DEFAULTS, page: 5, pageCount: 20 },
  render: (args) => <Stateful {...args} />,
  parameters: {
    docs: {
      source: {
        transform: asControlled(PAGINATION_DEFAULTS, {
          as: 'Pagination',
          prop: 'page',
          setter: 'setPage',
        }),
      },
    },
  },
  argTypes: {
    // Storybook only reads defaults from destructuring, so state them for the Default column
    size: {
      control: 'select',
      options: ['less', 'normal', 'more'],
      table: { defaultValue: { summary: PAGINATION_DEFAULTS.size } },
    },
    siblingCount: { control: 'number', table: { defaultValue: { summary: '1' } } },
    boundaryCount: { control: 'number', table: { defaultValue: { summary: '1' } } },
    isDisabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    'aria-label': { control: 'text', table: { defaultValue: { summary: 'Pagination' } } },
    onChange: { action: 'changed' },
  },
};
export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const Size: Story = {
  parameters: showCode(
    VARIANTS.map(
      (v) => `<Pagination size="${v}" page={page} pageCount={20} onChange={setPage} />`,
    ).join('\n'),
  ),
  render: () => (
    <Stack>
      {VARIANTS.map((v) => (
        <Stateful key={v} size={v} page={5} pageCount={20} onChange={() => {}} />
      ))}
    </Stack>
  ),
};

/** The row is the same width on every page once the list is longer than it, so nothing shifts under the pointer. */
export const LongList: Story = {
  args: { page: 1, pageCount: 200 },
};

/** Up to as many pages as the row has places, every page is shown and there are no gaps. */
export const FewPages: Story = {
  args: { page: 2, pageCount: 5 },
};

/** More pages around the current one, and at the ends. */
export const Siblings: Story = {
  parameters: showCode(
    `<Pagination page={page} pageCount={60} siblingCount={2} boundaryCount={2} onChange={setPage} />`,
  ),
  render: () => (
    <Stateful page={30} pageCount={60} siblingCount={2} boundaryCount={2} onChange={() => {}} />
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/**
 * For another language: the names of the buttons. They change what a screen reader says and what voice
 * control calls them by, not what is drawn (a page shows its number,
 * the ends a chevron), so the story prints the names next to the component. A label you leave out is
 * the English default.
 */
export const Labels: Story = {
  parameters: showCode(
    `<Pagination
  page={page}
  pageCount={20}
  onChange={setPage}
  aria-label="Pagination des résultats"
  labels={{
    previous: 'Page précédente',
    next: 'Page suivante',
    page: (page) => \`Aller à la page \${page}\`,
  }}
/>`,
  ),
  render: function Render() {
    const [page, setPage] = useState(5);
    const labels = {
      previous: 'Page précédente',
      next: 'Page suivante',
      page: (n: number) => `Aller à la page ${n}`,
    };
    return (
      <Stack>
        <Pagination
          page={page}
          pageCount={20}
          onChange={setPage}
          aria-label="Pagination des résultats"
          labels={labels}
        />
        <Text>
          Heard by a screen reader: “Pagination des résultats”, “{labels.previous}”, “
          {labels.page(page)}” (current), “{labels.page(page + 1)}”, …, “{labels.next}”.
        </Text>
      </Stack>
    );
  },
};

/**
 * With `getHref` the pages are real links, so "open in new tab" and crawlers work. Under a
 * `LinkProvider` a click goes to your router with no page load; here the "router" is a state.
 */
export const Links: Story = {
  parameters: showCode(
    `const navigate = useNavigate();
const [params] = useSearchParams();
<LinkProvider navigate={navigate}>
  <Pagination
    page={Number(params.get('page') ?? 1)}
    pageCount={20}
    getHref={(page) => \`/items?page=\${page}\`}
  />
</LinkProvider>`,
  ),
  render: function Render() {
    const [url, setUrl] = useState('/items?page=5');
    const page = Number(new URL(url, 'http://x').searchParams.get('page'));
    return (
      <LinkProvider navigate={setUrl} resolveHref={(href) => `#${href}`}>
        <Stack>
          <Pagination page={page} pageCount={20} getHref={(next) => `/items?page=${next}`} />
          <Text>Address: {url}</Text>
        </Stack>
      </LinkProvider>
    );
  },
};
