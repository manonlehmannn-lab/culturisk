// Retour tactile « si possible » : API Vibration (Android) et interrupteur natif d'iOS 18+,
// dont la bascule déclenche un léger tapotement du Taptic Engine.

let enabled = true;
let iosSwitch = null;

export function setHapticsEnabled(on) {
  enabled = !!on;
}

function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

const PATTERNS = { light: 8, medium: 18, success: [12, 60, 18], warning: [30, 50, 30], heavy: [20, 40, 20, 40, 40] };

export function haptic(kind = 'light') {
  if (!enabled) return;
  try {
    if (navigator.vibrate) {
      navigator.vibrate(PATTERNS[kind] || 10);
      return;
    }
    iosTick();
    if (kind === 'success' || kind === 'heavy') setTimeout(iosTick, 90);
  } catch (e) {
    /* facultatif */
  }
}
