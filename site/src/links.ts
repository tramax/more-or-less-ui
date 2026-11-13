/**
 * Storybook is a separate app. Under `pnpm storybook` it is on its own port; in the Pages build it is
 * published inside the site, at `/more-or-less-ui/storybook/` (`import.meta.env.BASE_URL` is `/` in
 * development and `/more-or-less-ui/` in that build).
 */
export const STORYBOOK_URL = import.meta.env.DEV
  ? 'http://localhost:6006/'
  : `${import.meta.env.BASE_URL}storybook/`;
export const GITHUB_URL = 'https://github.com/tramax/more-or-less-ui';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/nguyensontra';
