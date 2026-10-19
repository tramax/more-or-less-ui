import { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import '@/styles.css';
import './preview.css';

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals['theme'] === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <Story />;
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Colour theme (sets data-theme on <html>)',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    // With no background selected, the canvas colour comes from preview.css and
    // follows the theme toggle. Picking one here overrides it.
    backgrounds: {
      options: {
        white: { name: 'White', value: '#ffffff' },
        light: { name: 'Light', value: '#f5f2ef' },
        dark: { name: 'Dark', value: '#1c1917' },
      },
    },
  },
};

export default preview;
