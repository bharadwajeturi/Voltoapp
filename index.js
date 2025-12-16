import { registerRootComponent } from 'expo';
import App from './src/App';

// 🟢 FIX: Polyfill for libraries expecting 'GLOBAL'
if (typeof global.self === 'undefined') {
  global.self = global;
}
if (typeof global.window === 'undefined') {
  global.window = global;
}
// Some old libs use 'GLOBAL' instead of 'global'
global.GLOBAL = global;

registerRootComponent(App);