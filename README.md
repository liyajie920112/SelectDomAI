# Select DOM AI

Chrome extension for selecting a localhost DOM element and copying its `outerHTML`.

## Development

1. Install dependencies:
   `pnpm install`
2. Build the extension:
   `pnpm build`
3. Load `/Users/liyajie/liyajiegit/select-dom-ai/dist/extension` as an unpacked Chrome extension.
4. Open a localhost page such as `http://localhost:3000`.
5. Click the floating DOM trigger, choose an element, and the extension will copy that element's `outerHTML` to your clipboard automatically.
6. Drag the floating trigger to reposition it anywhere in the viewport.

## Packaging

- Run `pnpm package` to build the extension and create a versioned zip in `artifacts/`
