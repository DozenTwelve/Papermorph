/* scene6.js — Found it. YOLO: no more asking. Claude works at full speed on the stage, the commands fly past, he
   ticks off router, cable and port in his single, the laptop connects (screen, then the port's light on the stage),
   and the backups scroll by: "They're hiding." */
'use strict';
const PRE6 = 2.5;
const BAK = '1794121312';   // Sun 8 Nov 2026 02:01:52 EST: omarchy-refresh-config's backup stamp (date +%s)
const BAKS = ['hypr/hyprland.lua', 'hypr/bindings.lua', 'hypr/input.lua', 'hypr/looknfeel.lua', 'hypr/monitors.lua',
  'alacritty/alacritty.toml', 'ghostty/config', 'kitty/kitty.conf', 'btop/btop.conf', 'starship.toml', 'tmux/tmux.conf',
  'lazygit/config.yml', 'foot/foot.ini', 'imv/config', 'git/config'];
function scene6(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene6', PRE6, c, t);
  const fly = 1.15, conn = at('c12'), seat = conn + 1.2, find = at('c13');
  const L = (t, kind, text, cps = 160) => ({ at: t, kind, text, cps });
  const term = termScreen(p, [
    L(fly, 'cmd', 'journalctl -b -u NetworkManager'),
    L(fly + .25, 'out', "Nov 08 02:03:11 omarchy NetworkManager[812]: <info>  [1794121391.4432] NetworkManager (version 1.52.0) is starting..."),
    L(fly + .3, 'out', "Nov 08 02:03:11 omarchy NetworkManager[812]: <info>  [1794121391.5120] manager: (enp3s0): new Ethernet device (carrier: OFF, driver: 'r8169', ifindex: 2)"),
    L(fly + .55, 'cmd', 'systemctl status systemd-networkd'),
    L(fly + .8, 'out', '○ systemd-networkd.service - Network Configuration'),
    L(fly + .8, 'out', '     Loaded: loaded (/usr/lib/systemd/system/systemd-networkd.service; disabled; preset: enabled)'),
    L(fly + .85, 'bad', '     Active: inactive (dead) since Sun 2026-11-08 02:03:09 EST; 18h ago'),
    L(fly + 1.05, 'cmd', 'pacman -Qi omarchy'),
    L(fly + 1.25, 'out', 'Name            : omarchy'),
    L(fly + 1.25, 'out', 'Version         : 4.5.0-1'),
    L(fly + 1.3, 'bad', 'Install Date    : Sun 08 Nov 2026 02:01:47 AM EST'),
    L(conn + .05, 'cmd', 'nmcli device connect enp3s0'),
    L(conn + .55, 'ok', "Device 'enp3s0' successfully activated with 'b2f1c0de-7a3e-4c51-9d1e-0f6a4e2c9a11'."),
    L(find + .05, 'cmd', "find ~/.config -name '*.bak.*'"),
    ...BAKS.map((b, i) => L(find + .45 + i * .045, 'ok', `/home/martin/.config/${b}.bak.${BAK}`)),
  ], { yolo: true });
  const shots = [shot(0, 'wide'), shot(fly, 'screen', null, { over: 'term' }), shot(at('c11', -.05), 'single', 'claude'),
    shot(conn, 'screen', null, { over: 'term' }), shot(seat - .05, 'wide'), shot(at('c12', 2.3) - .05, 'single', 'claude'),
    shot(find, 'screen', null, { over: 'term' }), shot(at('c13', 1.5) - .05, 'single', 'claude')];
  const S = shooter(st, shots, { term: term.g });
  stingAt('scene6');
  const ticks = ['router', 'cable', 'port'].map((k, i) => ({ t: m(`c11.${k}`) + .5, g: stamp(p, `<g transform="translate(1180 ${250 + i * 150}) rotate(-6)"><rect x="-10" y="-50" width="330" height="100" rx="16" fill="#fff" stroke="${CW_INK}" stroke-width="7"/><text x="30" y="20" font-family="${MARKER}" font-size="54" fill="${CW_INK}">${k}</text><circle cx="262" r="36" fill="#2f9e44" stroke="${CW_INK}" stroke-width="6"/><path d="M246,2 L258,16 L282,-14" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>`) }));
  const twoAm = { t: m('c11.update') + 1.2, g: stamp(p, `<g transform="translate(1250 700) rotate(5)"><rect x="-190" y="-60" width="380" height="110" rx="14" fill="#1b1030" stroke="#ff4fb4" stroke-width="6"/><text y="20" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="60" fill="#ff4fb4">02:01 AM</text></g>`) };
  sfx('scene6', .05, 'typing', 1.2); sfx('scene6', 1.0, 'plug', 1.8); sfx('scene6', fly, 'typing', .8);
  ticks.forEach(k => sfx('scene6', k.t, 'pop', 1));
  sfx('scene6', conn + .55, 'chime', 1); sfx('scene6', seat, 'typing', .9); sfx('scene6', seat + .3, 'tick', 1.4); sfx('scene6', find, 'typing', .6);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'term') term.draw(q);
    const ct = talk(q, 'scene6', PRE6, 'c11', 'c12', 'c13');
    ticks.forEach(k => vis(k.g, cur.who === 'claude' && q >= k.t && q < at('c12')));
    vis(twoAm.g, cur.who === 'claude' && q >= twoAm.t && q < at('c12'));
    let cl = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, star: Math.floor(q * 4) % 2 ? '#ff2a2a' : '#e8582a', spin: q * 720, lids: .3,
      mouth: ct === 'X' ? 0 : ct, shut: blinkAt(q, 14), frontL: true, frontR: true };
    let lit = q >= seat + .3;
    if (q < fly) {   // YOLO speed: a flurry of typing with his back to us, then he turns, steps over and slaps the plug in
      const tw = span(q, .78, .98);
      if (q < .78) cl = typingBack(st, cl, q, 18);
      else {
        const o = { ...cl, ...toward(TYPE_AT, CABLE_AT, tw), lean: -6 * tw, eyeY: .8, eyeX: -.6, ...swap(q, .78, false) };
        const a = st.claude.aim({ ...o, lean: 0 }, 'L', [PLACE.port[0] + 8, PLACE.port[1] + 4]);
        cl = { ...o, armL: 15 + (a.armL - 15) * tw, reachL: 1 + (a.reachL - 1) * tw, armR: 25 };
      }
    } else if (cur.kind === 'wide') {   // types the connect with his back to us; the port's light comes on
      cl = typingBack(st, cl, q, 12);
    } else if (q < at('c12')) {   // a fist pumped on each "fine" (left, right, both), then a shrug that eases in from there
      const fines = ['router', 'cable', 'port'].map(k => m(`c11.${k}`) + .4);
      const pump = t => q >= t - .1 ? Math.max(0, 1 - Math.abs(q - t - .08) / .3) : 0;
      const shrug = span(q, m('c11.update'), m('c11.update') + .35);
      const L = Math.max(pump(fines[0]), pump(fines[2])), R = Math.max(pump(fines[1]), pump(fines[2]));
      cl = { ...cl, lids: .45, brow: -.2 + .5 * shrug, spin: q * 60, star: '#e8582a', look: .3 * shrug, eyeX: .5 * shrug, bob: 8 * shrug,
        armL: 20 + 110 * L + (100 - 20) * shrug, armR: 20 + 110 * R + (100 - 20) * shrug, reachL: .9, reachR: .9 };
    } else cl = { ...cl, spin: q * 60, star: '#e8582a', lids: q >= at('c13') ? .62 : .45, brow: q >= at('c13') ? -.6 : 0,
      look: q >= at('c13') ? -.25 : 0, eyeX: q >= at('c13') ? -.7 : 0, cigar: q >= at('c13'), bob: q >= at('c13') ? -10 : 0 };
    st.frame(q, f, { door: 1, lap: { open: true, screen: 9 }, plug: { lit }, flicker: !lit });
    castPose(st, cur, f, {
      doc: docSolder(st, q, f, { look: .5 * glance(q, 2), eyeX: .9 * glance(q, 2), lids: .3 }, glance(q, 2)),
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], look: .6, eyeX: .9, brow: 1, lids: 0, mouth: 'wobble', shut: blinkAt(q, 15),
        frontL: true, frontR: true, armL: -14, armR: -14, reachL: .85, reachR: .85 },
      claude: cl,
    });
    st.fxHTML = cl.cigar && cur.who === 'claude' ? smokeSVG(...emberAt(st, cl), q, 4, 1.2) : '';
  });
}
