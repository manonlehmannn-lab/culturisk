// Point d'entrée de l'application.

import { app, registerScreens, mountRoot, render, go } from './core.js';
import { loadBank } from '../engine/bank.js';
import { home, loading, setup } from './screens/home.js';
import { rules, settings, bank } from './screens/info.js';
import * as play from './screens/play.js';

registerScreens({
  loading,
  home,
  setup,
  rules,
  settings,
  bank,
  step_choose: play.step_choose,
  step_ask: play.step_ask,
  step_arbitrage: play.step_arbitrage,
  step_reveal: play.step_reveal,
  step_turnEnd: play.step_turnEnd,
  step_over: play.step_over,
  overlay_menu: play.overlay_menu,
});

mountRoot(document.getElementById('app'));
render();

loadBank()
  .then((b) => {
    app.bank = b;
    go('home');
  })
  .catch((e) => {
    app.bankError = e.message || String(e);
    render();
  });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
