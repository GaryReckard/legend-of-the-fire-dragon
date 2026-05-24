// GitHub Pages serves the site at https://<user>.github.io/legend-of-the-fire-dragon/
// so all asset URLs must be prefixed with that subpath. In CI we set BASE_PATH;
// locally `npm run dev` falls back to "/" so dev-server URLs stay clean.
const base = process.env.BASE_PATH ?? '/';

export default {
  base,
  server: { port: 5173, open: true },
  build: { target: 'es2020' }
};
