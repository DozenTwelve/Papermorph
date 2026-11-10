/* Volume control for the player bar: a speaker button that opens a slider. engine.js loads this file and reads
   #volume when it starts each beat's audio, so the control is the same in every book. */
'use strict';
{
  document.getElementById('bHelp').insertAdjacentHTML('beforebegin', `<div class="volume">
    <button class="icon" id="bVolume" aria-label="${translate('volumeLabel')}" aria-controls="volume" title="${translate('volumeTitle')}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9v6h4l5 4V5L7 9z" fill="currentColor"/>
        <path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    <input id="volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="${translate('volumeSlider')}">
  </div>`);
  const input = document.getElementById('volume');
  document.getElementById('bVolume').onclick = () => input.focus();
  const apply = () => {
    input.style.setProperty('--volume', +input.value * 100 + '%');
    if (P.audio) P.audio.volume = +input.value;
  };
  // the volume carries over to the next chapter; a muted slider does not, so a new visit always has sound
  try { const v = +localStorage.getItem('papermorph:volume'); if (v) { input.value = v; apply(); } } catch {}
  input.oninput = () => { apply(); try { localStorage.setItem('papermorph:volume', input.value); } catch {} };
}
