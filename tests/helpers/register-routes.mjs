import {registerHooks} from 'node:module';
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') return nextResolve('next/server.js', context);
  if (specifier.startsWith('@/')) return nextResolve(new URL('../../src/' + specifier.slice(2) + '.ts', import.meta.url).href, context);
  return nextResolve(specifier, context);
}});
