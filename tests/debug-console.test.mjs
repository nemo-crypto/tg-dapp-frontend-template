import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/Root/Root.tsx', import.meta.url), 'utf8');
function mount(debug, load) {
  const effects = [];
  const jsx = (Component, props) => typeof Component === 'function' ? Component(props) : null;
  const provider = ({ children }) => children;
  const react = { useEffect: fn => effects.push(fn), useMemo: fn => fn() };
  const telegram = { useLaunchParams: () => ({ startParam: debug ? 'debug' : undefined, platform: 'ios' }), useMiniApp: () => ({}), useThemeParams: () => ({}), useViewport: () => undefined, bindMiniAppCSSVars: () => {}, bindThemeParamsCSSVars: () => {}, SDKProvider: provider };
  const modules = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@telegram-apps/sdk-react': telegram,
    '@nextui-org/react': { NextUIProvider: provider }, '@tonconnect/ui-react': { TonConnectUIProvider: provider },
    '@telegram-apps/telegram-ui': { AppRoot: provider }, '@/components/ErrorBoundary': { ErrorBoundary: provider },
    '@/hooks/useDidMount': { useDidMount: () => true },
  };
  // Keep dynamic imports controlled so late imports and failures can be exercised.
  const code = ts.transpileModule(source.replaceAll('import("eruda")', '__loadEruda()'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { URL, exports, require: id => modules[id] || {}, process: { env: { NODE_ENV: 'production' } }, window: { location: { href: 'https://example.invalid/' } }, __loadEruda: load, console });
  exports.Root({ children: null });
  const cleanups = effects.map(fn => fn());
  return () => cleanups.forEach(fn => typeof fn === 'function' && fn());
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('ordinary launches never load the debug console', async () => {
  let loads = 0;
  const unmount = mount(false, async () => { loads++; return { default: { init() {} } }; });
  await flush();
  unmount();
  assert.equal(loads, 0);
});
test('debug launches initialize once and destroy on cleanup', async () => {
  let starts = 0, stops = 0;
  const unmount = mount(true, async () => ({ default: { init() { starts++; }, destroy() { stops++; } } }));
  await flush();
  assert.equal(starts, 1);
  unmount();
  assert.equal(stops, 1);
});
