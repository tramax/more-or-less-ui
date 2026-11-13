// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TextField } from '../TextField/TextField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

// jsdom has a `window`, so a server render is only seen in the node environment. React 18 warns
// ("useLayoutEffect does nothing on the server") for every layout effect it meets there.
describe('rendering on a server', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not warn about useLayoutEffect', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderToString(<TextField label="Name" type="number" />);
    renderToString(
      <SegmentedControl
        label="View"
        defaultValue="a"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    );
    expect(error).not.toHaveBeenCalled();
  });
});
