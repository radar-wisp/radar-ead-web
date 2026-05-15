<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Radar Internet — Admin</title>
<style>
/* ════════════════════════════════════════════════════════════════
   Radar Internet — Admin Panel
   Design System: extraído do sistema de referência RH
   Fonte: DM Sans · Paleta: azul índigo #0002da / bg #f4f5fb
   Radius: 12px (cards) / 7px (buttons, inputs)
   Shadow: 0 2px 8px rgba(0,2,218,0.08)
════════════════════════════════════════════════════════════════ */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

:root {
  /* ── Paleta (idêntica ao sistema de referência) ── */
  --bg:           #f4f5fb;
  --surface:      #ffffff;
  --border:       #c8caee;
  --border2:      #a0a3e0;

  --text:         #00007a;
  --text2:        #2a2d9a;
  --text3:        #6668c0;
  --text4:        #94a3b8;

  --blue:         #0002da;
  --blue-d:       #0001b0;
  --blue-light:   #e6e6ff;
  --blue-mid:     #b3b3f7;

  --green:        #08c49c;
  --green-light:  #e0fff9;
  --green-dark:   #0a9e80;

  --amber:        #f59e0b;
  --amber-light:  #fef3c7;
  --amber-dark:   #b45309;

  --red:          #e02424;
  --red-light:    #fee2e2;
  --red-dark:     #b91c1c;

  --purple:       #7c3aed;
  --purple-light: #ede9fe;

  --sky:          #0284c7;
  --sky-light:    #e0f2fe;

  /* ── Sidebar tokens ── */
  --sb-bg:        #ffffff;
  --sb-border:    #e2e8f0;
  --sb-text:      #64748b;
  --sb-text-act:  #0f172a;
  --sb-act-bg:    #f1f5f9;
  --sb-hov-bg:    #f8fafc;
  --sb-section:   #94a3b8;
  --sb-w:         230px;

  /* ── Layout ── */
  --hh:           56px;
  --radius:       12px;
  --radius-sm:    7px;
  --shadow:       0 2px 8px rgba(0,2,218,.08);
  --shadow-md:    0 4px 16px rgba(0,2,218,.12);
  --font:         'DM Sans', system-ui, sans-serif;
}

/* ── Reset ── */
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }
html { font-size:14px }
body { font-family:var(--font); background:var(--bg); color:var(--text); font-size:14px; line-height:1.5; min-height:100vh; -webkit-font-smoothing:antialiased }
button { cursor:pointer; font-family:var(--font); border:none; background:none }
input,select,textarea { font-family:var(--font) }
::-webkit-scrollbar { width:6px }
::-webkit-scrollbar-track { background:transparent }
::-webkit-scrollbar-thumb { background:var(--border2); border-radius:3px }

/* ════════════════ LOGIN ════════════════ */
.login-screen {
  display:none; min-height:100vh;
  background:var(--bg);
  align-items:center; justify-content:center; padding:20px;
}
.login-screen.active { display:flex }
.login-box {
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  box-shadow:var(--shadow-md);
  padding:36px 32px; width:100%; max-width:380px;
  animation:popIn .3s ease;
}
@keyframes popIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
.brand { display:flex; align-items:center; gap:10px; margin-bottom:22px }
.brand-icon {
  width:34px; height:34px; background:var(--blue);
  border-radius:var(--radius-sm);
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:.85rem; flex-shrink:0;
}
.brand-name { font-weight:600; font-size:15px; color:var(--blue) }
.brand-name small { color:var(--sb-section); font-weight:400; font-size:11px; display:block; margin-top:2px }
.login-box h2 { font-size:17px; font-weight:600; color:var(--text); letter-spacing:-.3px; margin-bottom:4px }
.login-box p { color:var(--text3); font-size:13px; margin-bottom:22px }
.login-err {
  background:var(--red-light); border:1px solid #fca5a5; color:var(--red);
  padding:8px 11px; border-radius:var(--radius-sm); font-size:12px; margin-bottom:12px; display:none;
}
.login-err.show { display:block }
.login-hint { margin-top:12px; padding:9px 11px; background:var(--blue-light); border-radius:var(--radius-sm); font-size:11px; color:var(--blue) }

/* ════════════════ APP SHELL ════════════════ */
.app-wrap { display:none; min-height:100vh }
.app-wrap.active { display:flex }

/* ════════════════ SIDEBAR ════════════════ */
.sidebar {
  width:var(--sb-w);
  background:var(--sb-bg);
  border-right:1px solid var(--sb-border);
  display:flex; flex-direction:column;
  position:fixed; top:0; left:0; bottom:0;
  z-index:100; overflow-y:auto;
  transition:width .22s cubic-bezier(.4,0,.2,1);
}

/* ── Collapsed state (mobile / toggle) ── */
.sidebar.collapsed { width:56px }
.sidebar.collapsed .sb-brand-name,
.sidebar.collapsed .sb-label-text,
.sidebar.collapsed .sb-item-label,
.sidebar.collapsed .sb-group-arrow,
.sidebar.collapsed .sb-user-info,
.sidebar.collapsed .sb-group-children { display:none }
.sidebar.collapsed .sb-item { justify-content:center; padding:8px 0 }
.sidebar.collapsed .sb-item .ico { width:100%; margin:0 }
.sidebar.collapsed .sb-group-head { justify-content:center; padding:8px 0 }
.sidebar.collapsed .sb-group-head .ico { width:100%; margin:0 }
.sidebar.collapsed .sb-brand { padding:16px 0; justify-content:center }
.sidebar.collapsed .sb-brand-abbr { display:flex }

/* ── Brand ── */
.sb-brand {
  padding:18px 18px 14px;
  border-bottom:1px solid var(--sb-border);
  display:flex; align-items:center; gap:10px;
  flex-shrink:0;
}
.sb-brand-abbr {
  width:30px; height:30px; background:var(--blue);
  border-radius:var(--radius-sm);
  display:none; align-items:center; justify-content:center;
  color:#fff; font-weight:700; font-size:12px; flex-shrink:0;
}
.sb-brand-name {
  font-size:14px; font-weight:700;
  letter-spacing:-.3px; color:var(--blue); line-height:1.2;
}
.sb-brand-name small {
  font-size:10px; color:var(--sb-section);
  font-weight:400; display:block; margin-top:1px; letter-spacing:.01em;
}

/* ── Nav container ── */
.sb-nav { padding:8px 8px; flex:1; overflow-y:auto; overflow-x:hidden }
.sb-nav::-webkit-scrollbar { width:3px }

/* ── Section label ── */
.sb-label {
  display:flex; align-items:center; gap:6px;
  padding:14px 8px 5px; margin-top:2px;
}
.sb-label:first-child { padding-top:6px; margin-top:0 }
.sb-label-text {
  font-size:9.5px; font-weight:700; color:var(--sb-section);
  text-transform:uppercase; letter-spacing:.1em; white-space:nowrap;
}
.sb-label-line {
  flex:1; height:1px; background:var(--sb-border); opacity:.6;
}

/* ── Flat item (sem grupo) ── */
.sb-item {
  display:flex; align-items:center; gap:9px;
  padding:7px 10px; border-radius:var(--radius-sm);
  cursor:pointer; font-size:13px; color:var(--sb-text);
  margin-bottom:1px; border:none; background:none;
  width:100%; font-family:var(--font); text-align:left;
  transition:background .12s, color .12s; position:relative;
}
.sb-item .ico {
  width:18px; height:18px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.sb-item-label { flex:1; font-size:13px; line-height:1 }
.sb-item-badge {
  font-size:10px; font-weight:700; background:var(--blue-light);
  color:var(--blue); padding:1px 6px; border-radius:99px;
}
.sb-item:hover { background:var(--sb-hov-bg); color:var(--sb-text-act) }
.sb-item.active {
  background:var(--sb-act-bg); color:var(--sb-text-act); font-weight:600;
}
/* Indicador lateral no item ativo */
.sb-item.active::before {
  content:''; position:absolute; left:0; top:20%; bottom:20%;
  width:3px; background:var(--blue); border-radius:0 3px 3px 0;
}

/* ── Grupo colapsável ── */
.sb-group { margin-bottom:1px }
.sb-group-head {
  display:flex; align-items:center; gap:9px;
  padding:7px 10px; border-radius:var(--radius-sm);
  cursor:pointer; font-size:13px; color:var(--sb-text);
  border:none; background:none; width:100%;
  font-family:var(--font); text-align:left;
  transition:background .12s, color .12s; user-select:none;
}
.sb-group-head .ico {
  width:18px; height:18px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.sb-group-label { flex:1; font-size:13px }
.sb-group-arrow {
  width:14px; height:14px; color:var(--sb-section);
  transition:transform .2s ease; flex-shrink:0;
}
.sb-group-head:hover { background:var(--sb-hov-bg); color:var(--sb-text-act) }
.sb-group.open .sb-group-arrow { transform:rotate(90deg) }
.sb-group.open .sb-group-head { color:var(--sb-text-act) }

/* Filhos do grupo */
.sb-group-children {
  overflow:hidden; max-height:0;
  transition:max-height .22s cubic-bezier(.4,0,.2,1);
  padding-left:16px;
}
.sb-group.open .sb-group-children { max-height:300px }
.sb-group-children .sb-item {
  font-size:12.5px; padding:6px 10px;
  color:var(--sb-text);
}
.sb-group-children .sb-item .ico svg {
  width:13px; height:13px;
}

/* ── Footer ── */
.sb-foot { padding:12px 10px; border-top:1px solid var(--sb-border); flex-shrink:0 }
.sb-user {
  display:flex; align-items:center; gap:9px;
  padding:9px 10px; border-radius:var(--radius-sm);
  background:var(--bg); margin-bottom:8px;
  cursor:default;
}
.sb-user-av {
  width:30px; height:30px; border-radius:50%;
  background:var(--blue-light); color:var(--blue);
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:11px; flex-shrink:0;
  border:1px solid var(--border);
}
.sb-user-info { min-width:0 }
.sb-user-name { font-size:12px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.sb-user-role { font-size:11px; color:var(--text3) }

/* ════════════════ TOPBAR ════════════════ */
.main { margin-left:var(--sb-w); flex:1; min-width:0; display:flex; flex-direction:column }

.topbar {
  display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; height:var(--hh);
  background:var(--surface); border-bottom:1px solid var(--border);
  position:sticky; top:0; z-index:50; flex-shrink:0; gap:16px;
}

.topbar-crumb {
  display:flex; align-items:center; gap:6px;
  font-size:13px; color:var(--text3);
}
.topbar-crumb .crumb-cur { color:var(--text); font-weight:600; font-size:15px; letter-spacing:-.2px }
.topbar-crumb .crumb-sep { color:var(--border2); font-size:14px }

/* Search — alinhado ao ref */
.search-wrap { position:relative; max-width:300px; width:100% }
.search-wrap input {
  background:var(--bg); border:1px solid var(--border2);
  border-radius:var(--radius-sm);
  padding:7px 11px 7px 32px; font-size:13px; width:100%; outline:none;
  color:var(--text); transition:border-color .15s;
}
.search-wrap input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(0,2,218,.08) }
.search-wrap input::placeholder { color:var(--text4) }
.search-ico { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text3); font-size:13px; pointer-events:none }
.search-results {
  display:none; position:absolute; top:calc(100% + 5px); left:0; right:0;
  background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm);
  box-shadow:var(--shadow-md); z-index:200; max-height:300px; overflow-y:auto;
}
.search-results.open { display:block }
.sr-group { font-size:10px; font-weight:600; color:var(--sb-section); text-transform:uppercase; letter-spacing:.08em; padding:8px 12px 4px }
.sr-item { display:flex; align-items:center; gap:9px; padding:8px 12px; cursor:pointer; transition:background .1s; font-size:13px }
.sr-item:hover { background:var(--blue-light) }
.sr-title { font-weight:500; color:var(--text) }
.sr-sub { margin-top:1px; font-size:11px; color:var(--text3) }
.sr-empty { padding:12px; font-size:13px; color:var(--text3); text-align:center }

/* ════════════════ CONTENT ════════════════ */
.content { flex:1; overflow-y:auto; padding:20px 24px }

/* ════════════════ PAGES ════════════════ */
.pg { display:none; animation:fadeUp .18s ease }
.pg.active { display:block }
@keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }

/* ════════════════ PAGE HEADER ════════════════ */
.ph {
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:14px; margin-bottom:18px; flex-wrap:wrap;
}
.ph h2 { font-size:20px; font-weight:600; letter-spacing:-.4px; color:var(--text); margin-bottom:2px }
.ph p { font-size:12px; color:var(--text3) }

/* ════════════════ STATS / METRICS ════════════════ */
.stats {
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(190px,1fr));
  gap:12px; margin-bottom:16px;
}
.stat {
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:14px 16px;
  box-shadow:var(--shadow);
}
.stat-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:6px }
.stat-lbl { font-size:11px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px }
.stat-val { font-size:26px; font-weight:600; letter-spacing:-1px; color:var(--text); line-height:1 }
.stat-val.blue   { color:var(--blue) }
.stat-val.green  { color:var(--green) }
.stat-val.amber  { color:var(--amber) }
.stat-val.red    { color:var(--red) }
.stat-sub { font-size:11px; color:var(--text3); margin-top:4px }
.stat-sub.up   { color:var(--green) }
.stat-sub.warn { color:var(--amber) }
.stat-sub.err  { color:var(--red) }
/* Ícone outline como referência */
.stat-ico {
  width:32px; height:32px;
  border:1px solid var(--border2);
  border-radius:var(--radius-sm);
  display:flex; align-items:center; justify-content:center;
  font-size:14px; color:var(--text3); flex-shrink:0;
}

/* ════════════════ CARD / PANEL ════════════════ */
.card {
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  margin-bottom:14px;
  overflow:hidden;
}
.card-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px; border-bottom:1px solid var(--border);
  gap:10px; flex-wrap:wrap;
}
.card-title {
  font-size:13px; font-weight:600; letter-spacing:-.2px; color:var(--text);
  display:flex; align-items:center; gap:6px;
}
.card-body { padding:14px 16px }
.card-body-np { padding:0 }

/* ════════════════ BUTTONS ════════════════ */
.btn {
  padding:7px 14px; border-radius:var(--radius-sm);
  border:1px solid var(--border2); background:var(--surface);
  color:var(--text2); font-size:13px; cursor:pointer;
  font-family:var(--font); font-weight:500;
  transition:background .12s, border-color .12s;
  display:inline-flex; align-items:center; gap:5px;
  white-space:nowrap;
}
.btn:hover { background:var(--bg) }
.btn:active { transform:scale(.97) }
.btn-primary { background:var(--blue); color:#fff; border-color:var(--blue) }
.btn-primary:hover { background:var(--blue-d) }
.btn-primary:disabled { opacity:.45; cursor:not-allowed }
.btn-soft { background:var(--blue-light); color:var(--blue); border-color:var(--blue-mid) }
.btn-soft:hover { background:var(--blue-mid) }
.btn-outline { background:transparent; color:var(--blue); border-color:var(--blue-mid) }
.btn-outline:hover { background:var(--blue-light) }
.btn-ghost { background:transparent; color:var(--text3); border-color:var(--border) }
.btn-ghost:hover { background:var(--bg); color:var(--text2); border-color:var(--border2) }
.btn-danger { color:var(--red); border-color:#fca5a5; background:transparent }
.btn-danger:hover { background:var(--red-light) }
.btn-sm { padding:4px 10px; font-size:12px }
.btn-full { width:100%; justify-content:center }

/* ════════════════ FORMS ════════════════ */
.fg { display:flex; flex-direction:column; gap:5px }
.fg+.fg { margin-top:12px }
label,.fg label {
  font-size:12px; font-weight:500; color:var(--text2);
  letter-spacing:0;
}
input,select,textarea,.sel-sm {
  padding:9px 12px; border:1px solid var(--border2);
  border-radius:var(--radius-sm); font-size:13px;
  font-family:var(--font); background:var(--surface); color:var(--text);
  width:100%; outline:none;
  transition:border-color .15s, box-shadow .15s;
}
input:focus,select:focus,textarea:focus {
  border-color:var(--blue); box-shadow:0 0 0 3px rgba(0,2,218,.08);
}
input::placeholder { color:var(--text4) }
textarea { resize:vertical; min-height:70px }
select {
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236668c0' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 10px center; padding-right:28px;
}
.sel-sm { padding:4px 26px 4px 9px; font-size:12px; width:auto }
.form-row   { display:grid; grid-template-columns:1fr 1fr;     gap:12px }
.form-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px }
.full { grid-column:1/-1 }

/* ════════════════ TABLE ════════════════ */
.tbl-wrap { overflow-x:auto }
table { width:100%; border-collapse:collapse; font-size:12px }
thead th {
  background:var(--bg); color:var(--text3);
  font-size:10px; font-weight:600; text-transform:uppercase;
  letter-spacing:.05em; padding:7px 10px; text-align:left;
  border-bottom:1px solid var(--border); white-space:nowrap;
}
tbody td {
  padding:8px 10px; border-bottom:1px solid #f0f1fb;
  color:var(--text); vertical-align:middle;
}
tbody td strong { font-weight:600; font-size:12px }
tbody td small  { font-size:11px; color:var(--text3); display:block; margin-top:1px }
tbody tr:last-child td { border-bottom:none }
tbody tr:hover td { background:#fafbff }

/* ════════════════ BADGES ════════════════ */
.badge {
  display:inline-block; padding:2px 9px;
  border-radius:99px; font-size:10px; font-weight:600;
}
.badge-blue   { background:var(--blue-light);   color:var(--blue) }
.badge-green  { background:var(--green-light);  color:var(--green-dark) }
.badge-red    { background:var(--red-light);    color:var(--red-dark) }
.badge-amber  { background:var(--amber-light);  color:var(--amber-dark) }
.badge-gray   { background:#f0f0f8;             color:#5252a0 }
.badge-purple { background:var(--purple-light); color:var(--purple) }
.badge-sky    { background:var(--sky-light);    color:var(--sky) }

/* ════════════════ DASHBOARD GRID ════════════════ */
.ds-grid { display:grid; grid-template-columns:1fr 280px; gap:14px; align-items:start }
@media(max-width:960px) { .ds-grid { grid-template-columns:1fr } }

/* ════════════════ PENDÊNCIAS ════════════════ */
.pend-ok { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text2); padding:2px 0 }
.pend-item { display:flex; align-items:center; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--border); gap:10px }
.pend-item:last-child { border-bottom:none }
.pend-left { display:flex; align-items:center; gap:9px }
.pend-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0 }
.pend-expired .pend-dot { background:var(--red) }
.pend-empty   .pend-dot { background:var(--amber) }
.pend-review  .pend-dot { background:var(--blue) }
.pend-titulo { font-weight:600; font-size:12px; color:var(--text) }
.pend-label  { font-size:11px; color:var(--text3); margin-top:1px }

/* ════════════════ ATIVIDADES ════════════════ */
.ativ-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border) }
.ativ-item:last-child { border-bottom:none }
.ativ-avatar {
  width:30px; height:30px; border-radius:50%;
  background:var(--blue-light); color:var(--blue);
  display:flex; align-items:center; justify-content:center;
  font-weight:600; font-size:11px; flex-shrink:0;
  border:1px solid var(--border);
}
.ativ-info { flex:1; min-width:0 }
.ativ-titulo { font-size:12px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.ativ-sub    { font-size:11px; color:var(--text3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px }
.ativ-time   { font-size:11px; color:var(--text4); flex-shrink:0; white-space:nowrap }

/* ════════════════ ACTION MENU ════════════════ */
.action-menu-wrap { position:relative; display:inline-block }
.action-menu {
  display:none; position:absolute; right:0; top:calc(100% + 3px);
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-sm); box-shadow:var(--shadow-md);
  z-index:300; min-width:155px; padding:3px;
  animation:popIn .12s ease;
}
.action-menu.open { display:block }
.action-menu button {
  display:flex; align-items:center; gap:7px; width:100%;
  padding:7px 10px; border-radius:5px; font-size:12px; color:var(--text2);
  background:none; border:none; cursor:pointer; text-align:left;
  transition:background .1s; font-family:var(--font);
}
.action-menu button:hover { background:var(--blue-light); color:var(--blue) }
.action-menu button.danger { color:var(--red) }
.action-menu button.danger:hover { background:var(--red-light) }
.action-menu hr { border:none; border-top:1px solid var(--border); margin:2px 0 }

/* ════════════════ CURSO CARDS ════════════════ */
.curso-mini-icon {
  width:32px; height:32px; background:var(--blue-light);
  border-radius:var(--radius-sm);
  display:flex; align-items:center; justify-content:center;
  font-size:1rem; flex-shrink:0; color:var(--blue);
}
.curso-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius); padding:12px 14px;
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; margin-bottom:8px; box-shadow:var(--shadow);
  flex-wrap:wrap; transition:border-color .12s;
}
.curso-card:hover { border-color:var(--blue-mid) }
.curso-card-left { display:flex; align-items:center; gap:10px; flex:1; min-width:0 }
.curso-emoji {
  width:36px; height:36px; background:var(--blue-light);
  border-radius:var(--radius-sm);
  display:flex; align-items:center; justify-content:center;
  font-size:1.1rem; flex-shrink:0;
}
.curso-titulo { font-weight:600; font-size:13px; margin-bottom:2px; color:var(--text) }
.curso-meta { font-size:11px; color:var(--text3) }
.curso-card-right { display:flex; align-items:center; gap:7px; flex-wrap:wrap }

/* ════════════════ MÓDULOS EDITOR ════════════════ */
.mod-bloco { background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:7px; overflow:hidden }
.mod-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 11px; background:var(--surface); border-bottom:1px solid var(--border);
  font-size:12px; font-weight:600; color:var(--text);
}
.aula-row {
  display:flex; align-items:center; gap:7px;
  padding:6px 11px; border-bottom:1px solid var(--border);
  font-size:12px; color:var(--text2);
}
.aula-row:last-child { border-bottom:none }

/* ════════════════ ACESSOS ════════════════ */
.ac-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:wrap; gap:9px }
.restricoes-lista { display:flex; gap:7px; flex-wrap:wrap; margin-top:9px }
.restricao-tag {
  display:flex; align-items:center; gap:6px;
  background:var(--surface); border:1px solid var(--border);
  border-radius:99px; padding:3px 11px; font-size:11px; color:var(--text2);
}

/* ════════════════ SETOR / EQUIPE ════════════════ */
.setor-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:12px 14px; margin-bottom:8px; box-shadow:var(--shadow) }
.equipe-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:5px 8px; background:var(--bg);
  border-radius:var(--radius-sm); margin-bottom:3px; font-size:12px; color:var(--text2);
}

/* ════════════════ PUBLICAÇÃO ════════════════ */
.pub-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius); padding:14px 16px;
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; margin-bottom:8px; box-shadow:var(--shadow); flex-wrap:wrap;
}
.pub-card-left  { display:flex; align-items:center; gap:10px; flex:1; min-width:0 }
.pub-card-right { display:flex; align-items:center; gap:7px; flex-wrap:wrap }

/* ════════════════ MODAL ════════════════ */
.modal-bg {
  display:none; position:fixed; inset:0;
  background:rgba(0,0,0,.4); z-index:500;
  align-items:center; justify-content:center; padding:20px;
}
.modal-bg.open { display:flex }
.modal {
  background:var(--surface); border-radius:var(--radius);
  border:1px solid var(--border);
  padding:24px; width:100%; max-width:560px; max-height:90vh;
  overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,.12);
  animation:popIn .2s ease;
}
.modal-head {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:18px;
}
.modal-head h3 { font-size:15px; font-weight:600; color:var(--text) }
.modal-close {
  background:none; border:none; cursor:pointer;
  font-size:20px; color:var(--text3); line-height:1;
  width:28px; height:28px; display:flex; align-items:center; justify-content:center;
  border-radius:var(--radius-sm); transition:background .12s;
}
.modal-close:hover { background:var(--bg) }
.modal-foot {
  display:flex; gap:8px; justify-content:flex-end;
  margin-top:18px; padding-top:14px; border-top:1px solid var(--border);
}

/* ════════════════ TOAST ════════════════ */
.toast-stack { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:7px }
.toast {
  background:var(--text); color:#fff;
  padding:12px 18px; border-radius:var(--radius-sm);
  font-size:13px; min-width:220px;
  box-shadow:0 4px 16px rgba(0,0,0,.2);
  animation:slideIn .25s ease; display:flex; align-items:center; gap:8px;
}
.toast.s { background:#065f46; }
.toast.e { background:var(--red-dark) }
.toast.i { background:var(--blue-d) }
@keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }

/* ════════════════ EMPTY STATE ════════════════ */
.empty { padding:48px 20px; text-align:center; color:var(--text3) }
.ei { font-size:36px; margin-bottom:12px }
.empty h3 { font-size:14px; font-weight:500; color:var(--text2); margin-bottom:6px }
.empty p { font-size:13px }

/* ════════════════ UPLOAD ZONE ════════════════ */
.upload-zone {
  border:1.5px dashed var(--border2); border-radius:var(--radius);
  padding:24px; text-align:center; cursor:pointer;
  transition:all .12s; color:var(--text3);
}
.upload-zone:hover { border-color:var(--blue); background:var(--blue-light); color:var(--blue) }

/* ── Ícones SVG inline ── */
.sb-item svg, .btn svg, .card-title svg,
.action-menu button svg, .badge svg,
.modal-close svg { display:inline-block; vertical-align:middle; flex-shrink:0 }
.btn svg { margin-top:-1px }
/* Ícone da busca */
.search-ico svg { display:block }
/* Ícones nos toasts — cor branca */
.toast svg { stroke:#fff }
/* Ícones na sidebar — tamanho 15px */
.sb-item .ico svg { width:15px; height:15px }
/* Ícones stat */
.stat-ico svg { stroke:var(--text3) }
/* Ícone modal close */
.modal-close svg { stroke:var(--text3) }
/* Badge dots */
.badge span { vertical-align:middle; margin-right:2px }


/* ════════════ SIDEBAR RESPONSIVA & MOBILE ════════════ */

/* Overlay mobile */
.sb-overlay {
  display:none; position:fixed; inset:0;
  background:rgba(0,0,50,.35); z-index:99;
}
.sb-overlay.visible { display:block }

/* Botão hamburguer (mobile) */
.sb-toggle-btn {
  display:none; align-items:center; justify-content:center;
  width:34px; height:34px; border-radius:var(--radius-sm);
  border:1px solid var(--border); background:var(--surface);
  cursor:pointer; color:var(--text3); flex-shrink:0;
}

/* Scroll no nav sem scrollbar visível */
.sb-nav { scrollbar-width:none }
.sb-nav::-webkit-scrollbar { display:none }

/* ── Tablet (< 900px): sidebar colapsada por padrão ── */
@media (max-width: 900px) {
  .sidebar { width:var(--sb-w); transform:translateX(-100%); transition:transform .22s ease, width .22s ease }
  .sidebar.mobile-open { transform:translateX(0) }
  .main { margin-left:0 !important }
  .sb-toggle-btn { display:flex }
  .sb-overlay.visible { display:block }
}

/* ── Desktop: collapse para ícones apenas ── */
.main { margin-left:var(--sb-w); transition:margin-left .22s ease }
.sidebar.collapsed ~ .main,
body.sb-collapsed .main { margin-left:56px }

/* Tooltip nos itens quando collapsed */
.sidebar.collapsed .sb-item,
.sidebar.collapsed .sb-group-head { position:relative }
.sidebar.collapsed .sb-item:hover::after,
.sidebar.collapsed .sb-group-head:hover::after {
  content:attr(data-tip);
  position:absolute; left:calc(100% + 8px); top:50%;
  transform:translateY(-50%);
  background:var(--text); color:#fff; white-space:nowrap;
  font-size:11px; padding:4px 9px; border-radius:var(--radius-sm);
  pointer-events:none; z-index:200;
  box-shadow:0 2px 8px rgba(0,0,0,.15);
}

/* Botão de colapso no rodapé */
.sb-collapse-btn {
  display:flex; align-items:center; justify-content:flex-end;
  gap:6px; width:100%; padding:5px 10px;
  font-size:11px; color:var(--text4);
  background:none; border:none; cursor:pointer;
  font-family:var(--font); transition:color .12s;
  margin-bottom:6px;
}
.sb-collapse-btn:hover { color:var(--text3) }
.sb-collapse-btn svg { transition:transform .22s ease }
.sidebar.collapsed .sb-collapse-btn svg { transform:rotate(180deg) }
.sidebar.collapsed .sb-collapse-btn span { display:none }


/* ═══════════ GESTÃO DE CURSOS ═══════════ */

/* Célula de curso com miniatura */
.gc-curso-cell { display:flex; align-items:center; gap:10px }
.gc-thumb {
  width:36px; height:36px; border-radius:var(--radius-sm);
  background:var(--blue-light); color:var(--blue);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; font-size:.8rem; font-weight:700;
}
.gc-thumb img { width:100%; height:100%; object-fit:cover; border-radius:var(--radius-sm) }
.gc-titulo { font-weight:600; font-size:13px; color:var(--text); margin-bottom:2px }
.gc-desc { font-size:11px; color:var(--text4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px }

/* Progress bar inline */
.gc-prog-wrap { display:flex; align-items:center; gap:7px }
.gc-prog-bar { flex:1; height:5px; background:var(--border); border-radius:3px; overflow:hidden; min-width:50px }
.gc-prog-fill { height:100%; border-radius:3px; background:var(--blue); transition:width .3s }
.gc-prog-lbl { font-size:11px; color:var(--text4); min-width:28px; text-align:right }

/* Validade badge */
.gc-validade { font-size:11px; color:var(--text4); display:flex; align-items:center; gap:3px }
.gc-validade.vencendo { color:var(--amber) }
.gc-validade.expirado-txt { color:var(--red) }

/* Row selecionada */
tbody tr.selected td { background:#f0f4ff }

/* Checkbox na tabela */
.row-check { width:14px; height:14px; accent-color:var(--blue); cursor:pointer }

/* Modal de edição de curso */
.mc-tabs { display:flex; border-bottom:1px solid var(--border); margin-bottom:18px; gap:0 }
.mc-tab {
  padding:8px 14px; font-size:12px; font-weight:600; color:var(--text3);
  border-bottom:2px solid transparent; cursor:pointer; background:none; border-top:none; border-left:none; border-right:none;
  font-family:var(--font); transition:color .12s; margin-bottom:-1px;
}
.mc-tab.active { color:var(--blue); border-bottom-color:var(--blue) }
.mc-tab.done { color:var(--green-dark) }
.mc-pane { display:none }
.mc-pane.active { display:block }

/* Dropdown action menu melhorado */
.gc-actions { position:relative; display:inline-block }
.gc-actions-btn {
  display:flex; align-items:center; gap:4px; padding:5px 8px;
  border:1px solid var(--border); border-radius:var(--radius-sm);
  font-size:11px; color:var(--text3); background:none; cursor:pointer;
  font-family:var(--font); transition:all .12s;
}
.gc-actions-btn:hover { background:var(--bg); color:var(--text2); border-color:var(--border2) }
.gc-menu {
  display:none; position:absolute; right:0; top:calc(100% + 3px);
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-sm); box-shadow:var(--shadow-md);
  z-index:300; min-width:180px; padding:4px; animation:popIn .12s ease;
}
.gc-menu.open { display:block }
.gc-menu button {
  display:flex; align-items:center; gap:8px; width:100%; padding:7px 10px;
  border-radius:5px; font-size:12px; color:var(--text2); background:none;
  border:none; cursor:pointer; text-align:left; transition:background .1s;
  font-family:var(--font);
}
.gc-menu button:hover { background:var(--blue-light); color:var(--blue) }
.gc-menu button.danger { color:var(--red) }
.gc-menu button.danger:hover { background:var(--red-light) }
.gc-menu .sep { border:none; border-top:1px solid var(--border); margin:3px 0 }

/* Stats cards do módulo */
#gc-stats .stat-val { font-size:22px }


/* ── Toggle switch ── */
.toggle { position:relative; width:40px; height:22px; background:var(--border2); border-radius:11px; cursor:pointer; transition:background .2s; flex-shrink:0 }
.toggle.on { background:var(--blue) }
.toggle span { position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:all .2s; box-shadow:0 1px 3px rgba(0,0,0,.2) }
.toggle.on span { left:21px }
/* Grid helpers */
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px }
.fg { display:flex; flex-direction:column; gap:5px }
.fg label { font-size:12px; font-weight:600; color:var(--text2) }
.fg input,.fg select,.fg textarea {
  padding:8px 11px; border:1.5px solid var(--border2);
  border-radius:var(--radius-sm); font-size:13px; font-family:var(--font);
  color:var(--text); background:var(--surface); outline:none;
}
.fg input:focus,.fg select:focus,.fg textarea:focus {
  border-color:var(--blue); box-shadow:0 0 0 3px rgba(0,2,218,.08);
}
.fg textarea { resize:vertical; min-height:70px }
.fg select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236668c0' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:28px }


/* ═══════════ INLINE FILTER TOOLBAR ═══════════ */
.ift {
  display:flex; align-items:center; gap:0;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  padding:0; margin-bottom:14px;
  overflow:hidden; flex-wrap:wrap;
}

/* Divisor vertical entre grupos */
.ift-sep {
  width:1px; background:var(--border);
  align-self:stretch; flex-shrink:0;
}

/* Grupo de campo dentro da toolbar */
.ift-field {
  display:flex; align-items:center; gap:0;
  padding:0; position:relative; flex:1; min-width:180px;
}
.ift-field.fixed { flex:0 0 auto }

/* Ícone prefixo dentro do campo */
.ift-ico {
  position:absolute; left:12px; top:50%;
  transform:translateY(-50%); pointer-events:none;
  color:var(--text4); display:flex; align-items:center;
  z-index:1;
}

/* Input e select base */
.ift-input, .ift-select {
  width:100%; height:44px;
  padding:0 12px 0 36px;
  border:none; outline:none;
  background:transparent;
  font-family:var(--font); font-size:13px;
  color:var(--text); caret-color:var(--blue);
  transition:background .12s;
}
.ift-input::placeholder { color:var(--text4) }
.ift-input:focus, .ift-select:focus { background:#FAFAFF }

/* Select sem ícone prefixo */
.ift-select-bare {
  width:100%; height:44px;
  padding:0 32px 0 12px;
  border:none; outline:none;
  background:transparent;
  font-family:var(--font); font-size:13px;
  color:var(--text); cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a0a3e0' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 10px center;
  transition:background .12s;
}
.ift-select-bare:focus { background-color:#FAFAFF;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%230002da' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); }

/* Select com ícone prefixo */
.ift-select {
  padding-left:36px;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a0a3e0' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 10px center;
  cursor:pointer;
}
.ift-select:focus {
  background-color:#FAFAFF;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%230002da' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
}

/* Date input */
.ift-date {
  width:100%; height:44px;
  padding:0 12px 0 36px;
  border:none; outline:none; background:transparent;
  font-family:var(--font); font-size:13px; color:var(--text);
  cursor:pointer; transition:background .12s;
}
.ift-date::-webkit-calendar-picker-indicator { opacity:.4; cursor:pointer }
.ift-date:focus { background:#FAFAFF }

/* Label flutuante acima do input */
.ift-label {
  position:absolute; top:6px; left:36px;
  font-size:9px; font-weight:700; color:var(--text4);
  text-transform:uppercase; letter-spacing:.08em;
  pointer-events:none; z-index:1; white-space:nowrap;
}
/* Quando há label, o input tem padding-top maior */
.ift-with-label .ift-input,
.ift-with-label .ift-select,
.ift-with-label .ift-date,
.ift-with-label .ift-select-bare {
  padding-top:18px; height:48px;
}
.ift-with-label.ift-field { min-height:48px }
.ift.has-label { /* alinha quando mistura label/sem-label */ }

/* Botão de ação dentro da toolbar (reset / aplicar) */
.ift-btn {
  height:44px; padding:0 16px;
  border:none; background:none; cursor:pointer;
  font-family:var(--font); font-size:13px; font-weight:500;
  color:var(--text3); display:flex; align-items:center; gap:6px;
  transition:background .12s, color .12s; white-space:nowrap;
  flex-shrink:0;
}
.ift-btn:hover { background:var(--bg); color:var(--text2) }
.ift-btn.primary {
  color:var(--blue); font-weight:600;
}
.ift-btn.primary:hover { background:var(--blue-light) }
.ift-btn.danger:hover  { background:var(--red-light); color:var(--red) }

/* Chips de filtro rápido de status */
.ift-status-chips {
  display:flex; align-items:center; gap:6px;
  padding:0 14px; height:44px; flex-shrink:0;
}
.ift-chip {
  padding:3px 10px; border-radius:99px;
  font-size:11px; font-weight:600; cursor:pointer;
  border:1.5px solid var(--border); color:var(--text4);
  background:none; font-family:var(--font);
  transition:all .12s; white-space:nowrap;
}
.ift-chip:hover { border-color:var(--border2); color:var(--text2) }
.ift-chip.active-pub   { background:var(--green-light);  color:var(--green-dark);  border-color:var(--green) }
.ift-chip.active-ras   { background:var(--bg);           color:var(--text2);       border-color:var(--border2) }
.ift-chip.active-rev   { background:var(--blue-light);   color:var(--blue);        border-color:var(--blue-mid) }
.ift-chip.active-arq   { background:var(--amber-light);  color:var(--amber-dark);  border-color:var(--amber) }
.ift-chip.active-exp   { background:var(--red-light);    color:var(--red-dark);    border-color:var(--red) }

/* Badge de contagem de filtros ativos */
.ift-active-badge {
  display:none; background:var(--blue); color:#fff;
  font-size:9px; font-weight:700; padding:1px 5px;
  border-radius:99px; margin-left:4px;
}
.ift-active-badge.show { display:inline }

/* Row de lote (aparece quando há seleção) */
.ift-lote {
  display:none; align-items:center; gap:8px;
  padding:8px 16px; background:var(--blue-light);
  border-top:1px solid var(--blue-mid);
  font-size:12px; color:var(--blue); width:100%;
}
.ift-lote.show { display:flex }
.ift-lote-label { font-weight:600; margin-right:4px }
.ift-lote-sep { width:1px; height:16px; background:var(--blue-mid); margin:0 4px }

/* Responsivo: empilha quando tela pequena */
@media (max-width: 860px) {
  .ift { flex-direction:column; align-items:stretch }
  .ift-sep { width:100%; height:1px }
  .ift-field { min-width:0 }
  .ift-status-chips { flex-wrap:wrap; height:auto; padding:8px 14px }
}

</style>
</head>
<body>

<!-- LOGIN -->
<div class="login-screen" id="loginWrap">
  <div class="login-box">
    <div class="brand">
      <div class="brand-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
      <div class="brand-name">Radar Internet <small>Painel Administrativo</small></div>
    </div>
    <h2>Entrar</h2>
    <p>Acesse o painel de gestão de treinamentos</p>
    <div class="login-err" id="loginErr"></div>
    <form id="loginForm">
      <div class="fg" style="margin-bottom:12px">
        <label>E-mail</label>
        <input type="email" name="email" placeholder="admin@ead.com" value="admin@ead.com" required>
      </div>
      <div class="fg" style="margin-bottom:16px">
        <label>Senha</label>
        <input type="password" name="senha" placeholder="••••••••" value="admin123" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Entrar →</button>
    </form>
    <div class="login-hint"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg> Padrão: admin@ead.com / admin123</div>
  </div>
</div>


<!-- APP -->
<div class="app-wrap" id="appWrap">

  <div class="sb-overlay" id="sbOverlay" onclick="SidebarNav.closeMobile()"></div>
  <!-- SIDEBAR -->
  <aside class="sidebar" id="mainSidebar">
    <div class="sb-brand">
      <div class="sb-brand-abbr">R</div>
      <div class="sb-brand-name">Radar Internet <small>Plataforma EAD</small></div>
    </div>
    <nav class="sb-nav">

      
      <div class="sb-label">
        <span class="sb-label-text">Geral</span>
        <span class="sb-label-line"></span>
      </div>
      
      <button class="sb-item" data-pg="dashboard">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></span>
        <span class="sb-item-label">Dashboard</span>
        
      </button>

      
      <div class="sb-label">
        <span class="sb-label-text">Ensino</span>
        <span class="sb-label-line"></span>
      </div>
      
      <div class="sb-group open">
        <button class="sb-group-head" onclick="SidebarNav.toggleGroup(this.parentElement)">
          <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
          <span class="sb-group-label">Cursos</span>
          <span class="sb-group-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
        </button>
        <div class="sb-group-children">
          
      <button class="sb-item" data-pg="cursos">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
        <span class="sb-item-label">Gestão de Cursos</span>
        
      </button>
      <button class="sb-item" data-pg="turmas">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        <span class="sb-item-label">Turmas</span>
        
      </button>
      <button class="sb-item" data-pg="materiais">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
        <span class="sb-item-label">Materiais</span>
        
      </button>
      <button class="sb-item" data-pg="avaliacoes">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
        <span class="sb-item-label">Avaliações</span>
        
      </button>
        </div>
      </div>
      
      <button class="sb-item" data-pg="publicacao">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg></span>
        <span class="sb-item-label">Publicação</span>
        
      </button>

      
      <div class="sb-label">
        <span class="sb-label-text">Usuários</span>
        <span class="sb-label-line"></span>
      </div>
      
      <div class="sb-group open">
        <button class="sb-group-head" onclick="SidebarNav.toggleGroup(this.parentElement)">
          <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
          <span class="sb-group-label">Usuários</span>
          <span class="sb-group-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
        </button>
        <div class="sb-group-children">
          
      <button class="sb-item" data-pg="colaboradores">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
        <span class="sb-item-label">Alunos</span>
        
      </button>
      <button class="sb-item" data-pg="acessos">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
        <span class="sb-item-label">Controle de Acessos</span>
        
      </button>
        </div>
      </div>

      
      <div class="sb-label">
        <span class="sb-label-text">Acompanhamento</span>
        <span class="sb-label-line"></span>
      </div>
      
      <button class="sb-item" data-pg="relatorios">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
        <span class="sb-item-label">Relatórios</span>
        
      </button>
      
      <button class="sb-item" data-pg="certificados">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span>
        <span class="sb-item-label">Certificados</span>
        
      </button>

      
      <div class="sb-label">
        <span class="sb-label-text">Sistema</span>
        <span class="sb-label-line"></span>
      </div>
      
      <button class="sb-item" data-pg="configuracoes">
        <span class="ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M20 12h1M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 20v1M12 3V2M4.93 4.93l1.41 1.41M3 12H2"/></svg></span>
        <span class="sb-item-label">Configurações</span>
        
      </button>

    </nav>
    <div class="sb-foot">
      <div class="sb-user">
        <div class="sb-user-av">A</div>
        <div class="sb-user-info">
          <div class="sb-user-name">Administrador</div>
          <div class="sb-user-role">admin@radar.com</div>
        </div>
      </div>
      <button class="sb-collapse-btn" onclick="SidebarNav.toggleCollapse()" title="Recolher menu">
        <span>Recolher</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button class="btn btn-ghost btn-full" id="btnLogout" style="font-size:12px;padding:6px 10px;color:var(--text3)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Sair da conta
      </button>
    </div>
  </aside>


  <!-- MAIN -->
  <div class="main">
    <header class="topbar">
      <button class="sb-toggle-btn" onclick="SidebarNav.toggleMobile()" title="Menu"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <div class="topbar-crumb">
        <span>Radar Internet</span>
        <span class="crumb-sep">›</span>
        <span class="crumb-cur" id="topTitle">Dashboard</span>
      </div>

    </header>

    <div class="content">

      <!-- ═══ DASHBOARD ═══════════════════════ -->
      <div class="pg" id="pg-dashboard">
        <div class="ph">
          <div><h2>Dashboard</h2><p>Visão geral da plataforma de treinamentos</p></div>
        </div>

        <!-- Stats — padrão do sistema de referência -->
        <div class="stats">
          <div class="stat">
            <div class="stat-top">
              <div><div class="stat-lbl">Total de Cursos</div><div class="stat-val" id="ds-cursos">0</div></div>
              <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
            </div>
            <div class="stat-sub" id="ds-status-cursos">todos os cursos</div>
          </div>
          <div class="stat">
            <div class="stat-top">
              <div><div class="stat-lbl">Publicados</div><div class="stat-val blue" id="ds-publicados">0</div></div>
              <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></div>
            </div>
            <div class="stat-sub up">disponíveis para alunos</div>
          </div>
          <div class="stat">
            <div class="stat-top">
              <div><div class="stat-lbl">Colaboradores</div><div class="stat-val" id="ds-colab">0</div></div>
              <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            </div>
            <div class="stat-sub">cadastrados e ativos</div>
          </div>
          <div class="stat">
            <div class="stat-top">
              <div><div class="stat-lbl">Conclusões</div><div class="stat-val green" id="ds-concl">0</div></div>
              <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg></div>
            </div>
            <div class="stat-sub up">aulas concluídas</div>
          </div>
        </div>

        <!-- Grid: Pendências + Atividades -->
        <div class="ds-grid">

          <!-- Pendências -->
          <div class="card">
            <div class="card-head">
              <div class="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Pendências</div>
            </div>
            <div class="card-body" id="ds-pendencias">
              <div class="pend-ok"><span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg></span> Nenhuma pendência.</div>
            </div>
          </div>

          <!-- Últimas atividades -->
          <div class="card">
            <div class="card-head">
              <div class="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Últimas atividades</div>
            </div>
            <div class="card-body" id="ds-atividades">
              <div style="color:var(--text3);font-size:.82rem">Nenhuma atividade ainda.</div>
            </div>
          </div>

        </div>
      </div>

<!-- ═══ GESTÃO DE CURSOS ══════════════════ -->
<!-- ═══ GESTÃO DE CURSOS ══════════════════════════════════════ -->
      <div class="pg" id="pg-cursos">

        <!-- Page header -->
        <div class="ph">
          <div>
            <h2>Gestão de Cursos</h2>
            <p>Administre, publique e monitore todos os treinamentos</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-ghost" onclick="Cursos.exportar()" title="Exportar lista">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </button>
            <button class="btn btn-primary" onclick="window.location.href='novo-curso.html'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo Curso
            </button>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="stats" id="gc-stats" style="grid-template-columns:repeat(5,1fr)"></div>

        <!-- ── Inline Filter Toolbar ──────────────────────── -->
        <div class="ift" id="gc-toolbar">

          <!-- Busca -->
          <div class="ift-field" style="flex:2;min-width:220px">
            <span class="ift-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input class="ift-input" type="text" id="gc-search"
              placeholder="Buscar por nome, categoria, descrição..."
              oninput="Cursos.renderTabela(); IFT.updateBadge()">
          </div>

          <div class="ift-sep"></div>

          <!-- Status (chips) -->
          <div class="ift-status-chips">
            <button class="ift-chip" data-status="" onclick="IFT.setStatus(this,'')">Todos</button>
            <button class="ift-chip" data-status="publicado" onclick="IFT.setStatus(this,'publicado')">● Publicado</button>
            <button class="ift-chip" data-status="rascunho"  onclick="IFT.setStatus(this,'rascunho')">✎ Rascunho</button>
            <button class="ift-chip" data-status="revisao"   onclick="IFT.setStatus(this,'revisao')">◎ Revisão</button>
            <button class="ift-chip" data-status="arquivado" onclick="IFT.setStatus(this,'arquivado')">▣ Arquivado</button>
            <button class="ift-chip" data-status="expirado"  onclick="IFT.setStatus(this,'expirado')">✕ Expirado</button>
            <!-- hidden select para compatibilidade com renderTabela() -->
            <select id="gc-filtro-status" style="display:none"></select>
          </div>

          <div class="ift-sep"></div>

          <!-- Categoria -->
          <div class="ift-field fixed" style="min-width:160px">
            <span class="ift-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h8M4 18h12"/></svg>
            </span>
            <select class="ift-select" id="gc-filtro-cat" onchange="Cursos.renderTabela(); IFT.updateBadge()">
              <option value="">Categoria</option>
            </select>
          </div>

          <div class="ift-sep"></div>

          <!-- Formato -->
          <div class="ift-field fixed" style="min-width:130px">
            <span class="ift-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </span>
            <select class="ift-select" id="gc-filtro-fmt" onchange="Cursos.renderTabela(); IFT.updateBadge()">
              <option value="">Formato</option>
              <option value="ead">EAD</option>
              <option value="hibrido">Híbrido</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div class="ift-sep"></div>

          <!-- Publicado a partir de -->
          <div class="ift-field fixed" style="min-width:150px">
            <span class="ift-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <input class="ift-date" type="date" id="gc-filtro-data"
              title="Publicado a partir de"
              onchange="Cursos.renderTabela(); IFT.updateBadge()">
          </div>

          <div class="ift-sep"></div>

          <!-- Ordenação -->
          <div class="ift-field fixed" style="min-width:150px">
            <span class="ift-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 5 5 6"/><polyline points="3 12 4 11 5 12"/><polyline points="3 18 4 17 5 18"/></svg>
            </span>
            <select class="ift-select" id="gc-order" onchange="Cursos.renderTabela()">
              <option value="recente">Mais recentes</option>
              <option value="antigo">Mais antigos</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="carga-desc">Maior carga</option>
            </select>
          </div>

          <div class="ift-sep"></div>

          <!-- Limpar filtros -->
          <button class="ift-btn" onclick="IFT.reset()" title="Limpar filtros">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span id="ift-badge" class="ift-active-badge"></span>
          </button>

          <!-- Row de ações em lote (aparece quando há seleção) -->
          <div class="ift-lote" id="ift-lote-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span class="ift-lote-label" id="gc-sel-count"></span>
            <div class="ift-lote-sep"></div>
            <button class="ift-btn primary" id="gc-pub-lote" onclick="Cursos.publicarLote()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Publicar
            </button>
            <button class="ift-btn" id="gc-arq-lote" onclick="Cursos.arquivarLote()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/></svg>
              Arquivar
            </button>
            <button class="ift-btn danger" id="gc-del-lote" onclick="Cursos.excluirLote()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Excluir
            </button>
          </div>

        </div>

        <!-- Tabela principal -->
        <div class="card" style="margin-bottom:14px">
          <div class="card-head" style="padding:10px 16px">
            <div class="card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Cursos cadastrados
            </div>
            <span id="gc-result-count" style="font-size:12px;color:var(--text4)"></span>
          </div>
          <div class="tbl-wrap">
            <table id="gc-tabela">
              <thead>
                <tr>
                  <th style="width:32px;padding:8px 10px">
                    <input type="checkbox" id="gc-sel-all" onchange="Cursos.toggleSelAll(this)"
                      style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer">
                  </th>
                  <th>Curso</th>
                  <th>Categoria</th>
                  <th style="text-align:center">Carga</th>
                  <th style="text-align:center">Aulas</th>
                  <th style="text-align:center">Colaboradores</th>
                  <th style="text-align:center">Progresso</th>
                  <th>Status</th>
                  <th>Publicado</th>
                  <th>Atualizado</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody id="gc-tbody"></tbody>
            </table>
          </div>
          <div id="gc-empty" style="display:none;text-align:center;padding:48px 20px;color:var(--text4)">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;display:block;opacity:.4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <div style="font-size:14px;font-weight:600;color:var(--text2);margin-bottom:6px">Nenhum curso encontrado</div>
            <div style="font-size:12px">Tente ajustar os filtros ou crie um novo curso</div>
          </div>
        </div>



      </div>
      <!-- ═══ FIM GESTÃO DE CURSOS ══════════════════════════════════ -->



<!-- ═══ TURMAS ══════════════════════════════════════════════════ -->
      <div class="pg" id="pg-turmas">

        <!-- Page header -->
        <div class="ph">
          <div>
            <h2>Turmas</h2>
            <p>Grupos de alunos vinculados a um curso em período definido</p>
          </div>
          <button class="btn btn-primary" onclick="Turmas.abrirModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nova Turma
          </button>
        </div>

        <!-- Stats -->
        <div class="stats" id="tm-stats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px"></div>

        <!-- IFT -->
        <div class="ift" id="tm-toolbar" style="margin-bottom:14px">
          <!-- Busca -->
          <div class="ift-field" style="flex:2;min-width:200px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input class="ift-input" type="text" id="tm-busca" placeholder="Buscar por nome ou responsável..." oninput="Turmas.renderTabela()">
          </div>
          <div class="ift-sep"></div>
          <!-- Status chips -->
          <div class="ift-status-chips" style="gap:6px">
            <button class="ift-chip" data-tmstatus="" onclick="Turmas.setStatus(this,'')">Todos</button>
            <button class="ift-chip" data-tmstatus="aberta"        onclick="Turmas.setStatus(this,'aberta')">● Aberta</button>
            <button class="ift-chip" data-tmstatus="em_andamento"  onclick="Turmas.setStatus(this,'em_andamento')">▶ Em andamento</button>
            <button class="ift-chip" data-tmstatus="encerrada"     onclick="Turmas.setStatus(this,'encerrada')">■ Encerrada</button>
            <button class="ift-chip" data-tmstatus="cancelada"     onclick="Turmas.setStatus(this,'cancelada')">✕ Cancelada</button>
            <select id="tm-filtro-status" style="display:none"></select>
          </div>
          <div class="ift-sep"></div>
          <!-- Filtro curso -->
          <div class="ift-field fixed" style="min-width:170px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            <select class="ift-select" id="tm-filtro-curso" onchange="Turmas.renderTabela()">
              <option value="">Todos os cursos</option>
            </select>
          </div>
          <div class="ift-sep"></div>
          <!-- Filtro período -->
          <div class="ift-field fixed" style="min-width:150px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <input class="ift-date" type="date" id="tm-filtro-data" title="Início a partir de" onchange="Turmas.renderTabela()">
          </div>
          <div class="ift-sep"></div>
          <!-- Limpar -->
          <button class="ift-btn" onclick="Turmas.resetFiltros()" title="Limpar filtros">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Tabela -->
        <div class="card" style="margin-bottom:14px">
          <div class="card-head" style="padding:10px 16px">
            <div class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Turmas cadastradas
            </div>
            <span id="tm-count" style="font-size:12px;color:var(--text4)"></span>
          </div>
          <div class="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Curso vinculado</th>
                  <th style="text-align:center">Alunos</th>
                  <th style="text-align:center">Progresso</th>
                  <th>Responsável</th>
                  <th>Início</th>
                  <th>Encerramento</th>
                  <th>Status</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody id="tm-tbody"></tbody>
            </table>
          </div>
          <div id="tm-empty" style="display:none;text-align:center;padding:48px 20px;color:var(--text4)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div style="font-size:14px;font-weight:600;color:var(--text2);margin:12px 0 6px">Nenhuma turma encontrada</div>
            <div style="font-size:12px">Crie uma nova turma para começar</div>
          </div>
        </div>

      </div>
      <!-- ═══ FIM TURMAS ═══════════════════════════════════════════ -->

      <!-- ═══ MATERIAIS DE APOIO ════════════════════════════════════ -->
      <div class="pg" id="pg-materiais">

        <!-- Page header -->
        <div class="ph">
          <div>
            <h2>Materiais de Apoio</h2>
            <p>Central de conteúdos educacionais — PDFs, vídeos, links e documentos</p>
          </div>
          <button class="btn btn-primary" onclick="MatMod.abrirModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Novo Material
          </button>
        </div>

        <!-- Stats cards -->
        <div class="stats" id="mat-stats" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px"></div>

        <!-- IFT -->
        <div class="ift" id="mat-toolbar" style="margin-bottom:14px">

          <!-- Busca -->
          <div class="ift-field" style="flex:2;min-width:200px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input class="ift-input" type="text" id="mat-busca"
              placeholder="Buscar por nome, tags, responsável..."
              oninput="MatMod.renderTabela()">
          </div>
          <div class="ift-sep"></div>

          <!-- Tipo -->
          <div class="ift-field fixed" style="min-width:140px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></span>
            <select class="ift-select" id="mat-filtro-tipo" onchange="MatMod.renderTabela()">
              <option value="">Tipo</option>
              <option value="pdf">PDF</option>
              <option value="video">Vídeo</option>
              <option value="xlsx">Planilha</option>
              <option value="doc">Documento</option>
              <option value="imagem">Imagem</option>
              <option value="link">Link</option>
              <option value="zip">ZIP</option>
              <option value="pptx">Apresentação</option>
              <option value="quiz">Avaliação</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="ift-sep"></div>

          <!-- Curso -->
          <div class="ift-field fixed" style="min-width:160px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            <select class="ift-select" id="mat-filtro-curso" onchange="MatMod.renderTabela()">
              <option value="">Curso</option>
            </select>
          </div>
          <div class="ift-sep"></div>

          <!-- Status chips -->
          <div class="ift-status-chips">
            <button class="ift-chip" data-mstatus="" onclick="MatMod.setStatus(this,'')">Todos</button>
            <button class="ift-chip" data-mstatus="ativo"     onclick="MatMod.setStatus(this,'ativo')">● Ativo</button>
            <button class="ift-chip" data-mstatus="oculto"    onclick="MatMod.setStatus(this,'oculto')">◉ Oculto</button>
            <button class="ift-chip" data-mstatus="arquivado" onclick="MatMod.setStatus(this,'arquivado')">▣ Arquivado</button>
            <select id="mat-filtro-status" style="display:none"></select>
          </div>
          <div class="ift-sep"></div>

          <!-- Data -->
          <div class="ift-field fixed" style="min-width:150px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <input class="ift-date" type="date" id="mat-filtro-data"
              title="Adicionado a partir de" onchange="MatMod.renderTabela()">
          </div>
          <div class="ift-sep"></div>

          <!-- Ordenação -->
          <div class="ift-field fixed" style="min-width:140px">
            <span class="ift-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 5 5 6"/><polyline points="3 12 4 11 5 12"/><polyline points="3 18 4 17 5 18"/></svg></span>
            <select class="ift-select" id="mat-order" onchange="MatMod.renderTabela()">
              <option value="recente">Mais recentes</option>
              <option value="antigo">Mais antigos</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </div>
          <div class="ift-sep"></div>

          <!-- Limpar -->
          <button class="ift-btn" onclick="MatMod.resetFiltros()" title="Limpar filtros">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span id="mat-badge" class="ift-active-badge"></span>
          </button>
        </div>

        <!-- Tabela -->
        <div class="card" style="margin-bottom:14px">
          <div class="card-head" style="padding:10px 16px">
            <div class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Biblioteca de materiais
            </div>
            <span id="mat-count" style="font-size:12px;color:var(--text4)"></span>
          </div>
          <div class="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width:36px;padding:8px 10px">
                    <input type="checkbox" id="mat-sel-all" onchange="MatMod.toggleSelAll(this)"
                      style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer">
                  </th>
                  <th>Material</th>
                  <th>Tipo</th>
                  <th>Curso vinculado</th>
                  <th>Categoria</th>
                  <th>Tamanho</th>
                  <th>Status</th>
                  <th>Adicionado</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody id="mat-tbody"></tbody>
            </table>
          </div>
          <div id="mat-empty" style="display:none;text-align:center;padding:48px 20px;color:var(--text4)">
            <div style="margin:0 auto 12px;opacity:.4;display:block"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
            <div style="font-size:14px;font-weight:600;color:var(--text2);margin-bottom:6px">Nenhum material encontrado</div>
            <div style="font-size:12px">Clique em "+ Novo Material" para começar</div>
          </div>

          <!-- Row de lote -->
          <div class="ift-lote" id="mat-lote-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span class="ift-lote-label" id="mat-sel-count"></span>
            <div class="ift-lote-sep"></div>
            <button class="ift-btn primary" onclick="MatMod.ativarLote()">Ativar</button>
            <button class="ift-btn" onclick="MatMod.arquivarLote()">Arquivar</button>
            <button class="ift-btn danger" onclick="MatMod.excluirLote()">Excluir</button>
          </div>
        </div>

      </div>
      <!-- ═══ FIM MATERIAIS ════════════════════════════════════════ -->


      <!-- ═══ CONTROLE DE ACESSOS ═══════════════ -->
      <div class="pg" id="pg-acessos">
        <div class="ph">
          <div><h2>Controle de Acessos</h2><p>Restrinja cursos por setor, equipe ou colaborador</p></div>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div class="card-body">
            <div class="fg">
              <label>Selecione o curso para configurar restrições</label>
              <select id="ac-curso-sel"></select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body" id="ac-restricoes">
            <p style="color:var(--text3);font-size:.85rem">Selecione um curso acima.</p>
          </div>
        </div>
      </div>


      <!-- ═══ COLABORADORES ═════════════════════ -->
      <div class="pg" id="pg-colaboradores">
        <div class="ph">
          <div><h2>Colaboradores</h2><p>Gerencie pessoas, equipes e setores</p></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost" id="btn-novo-setor">+ Setor</button>
            <button class="btn btn-ghost" id="btn-nova-equipe">+ Equipe</button>
            <button class="btn btn-primary" id="btn-novo-colab">+ Colaborador</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start">
          <div class="card">
            <div class="card-head"><div class="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Colaboradores</div></div>
            <div class="tbl-wrap">
              <table>
                <thead><tr><th>Nome</th><th>Setor</th><th>Equipe</th><th>Status</th><th>Aulas</th><th></th></tr></thead>
                <tbody id="colab-tbody"></tbody>
              </table>
            </div>
          </div>

          <div>
            <div class="card">
              <div class="card-head"><div class="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Setores e Equipes</div></div>
              <div class="card-body" id="setores-equipes"></div>
            </div>
          </div>
        </div>
      </div>


      <!-- ═══ PUBLICAÇÃO ════════════════════════ -->
      <div class="pg" id="pg-publicacao">
        <div class="ph">
          <div><h2>Publicação</h2><p>Gerencie o status e visibilidade dos cursos</p></div>
        </div>
        <div id="pub-lista"></div>
      </div>

    </div><!-- /content -->
  </div><!-- /main -->
</div><!-- /app-wrap -->


<!-- ═══ MODAL: CURSO ══════════════════════════ -->
<div class="modal-bg" id="modal-curso">
  <div class="modal" style="max-width:640px">
    <div class="modal-head">
      <h3 id="mc-form-title">Novo Curso</h3>
      <button class="modal-close"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <form id="mc-form">
      <div class="form-row">
        <div class="fg full">
          <label>Título *</label>
          <input type="text" id="mc-titulo" placeholder="Nome do treinamento" required>
        </div>
        <div class="fg full">
          <label>Descrição</label>
          <textarea id="mc-desc" placeholder="Objetivo do curso..." rows="2"></textarea>
        </div>
        <div class="fg">
          <label>Emoji</label>
          <input type="text" id="mc-emoji" placeholder="<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>" maxlength="4">
        </div>
        <div class="fg">
          <label>Carga horária (h)</label>
          <input type="number" id="mc-carga" placeholder="8" min="1">
        </div>
        <div class="fg">
          <label>Status</label>
          <select id="mc-status">
            <option value="rascunho"> Rascunho</option>
            <option value="revisao"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;border:1.5px solid currentColor;flex-shrink:0"></span> Revisão</option>
            <option value="publicado"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0"></span> Publicado</option>
            <option value="arquivado"><span style="display:inline-block;width:7px;height:7px;border-radius:1px;background:currentColor;opacity:.6;flex-shrink:0"></span> Arquivado</option>
          </select>
        </div>
        <div class="fg">
          <label>Validade (vazio = sem validade)</label>
          <input type="date" id="mc-validade">
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar curso</button>
      </div>
    </form>
    <hr style="border:none;border-top:1px solid var(--border);margin:18px 0">
    <div id="mc-modulos"></div>
  </div>
</div>


<!-- ═══ MODAL: COLABORADOR ════════════════════ -->
<div class="modal-bg" id="modal-colab">
  <div class="modal">
    <div class="modal-head">
      <h3>Novo Colaborador</h3>
      <button class="modal-close"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <form id="colab-form">
      <div class="fg"><label>Nome completo *</label><input type="text" id="colab-nome" placeholder="Nome do colaborador" required></div>
      <div class="fg"><label>E-mail *</label><input type="email" id="colab-email" placeholder="email@empresa.com" required></div>
      <div class="fg"><label>Senha inicial *</label><input type="text" id="colab-senha" placeholder="senha123" required></div>
      <div class="form-row" style="margin-top:10px">
        <div class="fg"><label>Setor</label><select id="colab-setor"></select></div>
        <div class="fg"><label>Equipe</label><select id="colab-equipe"></select></div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Cadastrar</button>
      </div>
    </form>
  </div>
</div>


<!-- ═══ MODAL: EDITAR CURSO (tabs) ═══════════════════════════ -->
<div class="modal-bg" id="modal-edit-curso">
  <div class="modal" style="max-width:660px">
    <div class="modal-head">
      <div>
        <h3 id="mec-titulo">Editar Curso</h3>
        <div id="mec-subtitulo" style="font-size:11px;color:var(--text3);margin-top:2px"></div>
      </div>
      <button class="modal-close">✕</button>
    </div>

    <!-- Tabs -->
    <div class="mc-tabs">
      <button class="mc-tab active" onclick="CursoEdit.tab(0,this)">Dados Gerais</button>
      <button class="mc-tab" onclick="CursoEdit.tab(1,this)">Público</button>
      <button class="mc-tab" onclick="CursoEdit.tab(2,this)">Materiais</button>
      <button class="mc-tab" onclick="CursoEdit.tab(3,this)">Configurações</button>
      <button class="mc-tab" onclick="CursoEdit.tab(4,this)">Revisão</button>
    </div>

    <!-- Tab 0: Dados Gerais -->
    <div class="mc-pane active" id="mec-pane-0">
      <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="fg" style="grid-column:1/-1">
          <label>Nome do curso *</label>
          <input type="text" id="mec-nome" placeholder="Nome do treinamento">
        </div>
        <div class="fg">
          <label>Categoria</label>
          <select id="mec-categoria">
            <option value="">Selecione...</option>
            <option>Segurança do Trabalho</option><option>Elétrica</option>
            <option>Telecomunicações</option><option>Gestão e Liderança</option>
            <option>Atendimento ao Cliente</option><option>Tecnologia da Informação</option>
            <option>Administrativo</option><option>Operações</option>
            <option>Compliance</option><option>Outros</option>
          </select>
        </div>
        <div class="fg">
          <label>Formato</label>
          <select id="mec-formato">
            <option value="ead">EAD (Online)</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>
        <div class="fg">
          <label>Carga horária (h)</label>
          <input type="number" id="mec-carga" min="1">
        </div>
        <div class="fg">
          <label>Nível</label>
          <select id="mec-nivel">
            <option value="basico">Básico</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </div>
        <div class="fg" style="grid-column:1/-1">
          <label>Descrição</label>
          <textarea id="mec-descricao" rows="3" placeholder="Objetivo e conteúdo..."></textarea>
        </div>
        <div class="fg">
          <label>Status</label>
          <select id="mec-status">
            <option value="rascunho">Rascunho</option>
            <option value="revisao">Em Revisão</option>
            <option value="publicado">Publicado</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
        <div class="fg">
          <label>Validade (vazio = sem validade)</label>
          <input type="date" id="mec-validade">
        </div>
        <div class="fg">
          <label>Prazo de conclusão (dias)</label>
          <input type="number" id="mec-prazo" placeholder="Ex: 30">
        </div>
      </div>
    </div>

    <!-- Tab 1: Público -->
    <div class="mc-pane" id="mec-pane-1">
      <div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em">Perfis de acesso</div>
      <div id="mec-publico-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px"></div>
      <div class="fg">
        <label>Visibilidade</label>
        <select id="mec-visib">
          <option value="todos">Todos os colaboradores</option>
          <option value="restrito">Acesso restrito (por setor/equipe)</option>
        </select>
      </div>
      <div class="fg" style="margin-top:12px">
        <label>Observação sobre o público</label>
        <textarea id="mec-publico-obs" rows="2"></textarea>
      </div>
    </div>

    <!-- Tab 2: Materiais -->
    <div class="mc-pane" id="mec-pane-2">
      <div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em">
        Materiais do curso <span id="mec-mat-count" style="background:var(--blue-light);color:var(--blue);padding:1px 7px;border-radius:99px;font-size:10px;margin-left:6px">0</span>
      </div>
      <div id="mec-materiais-lista" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        <div style="color:var(--text4);font-size:12px;text-align:center;padding:20px">Nenhum material</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('mec-file-input').click()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload arquivo
        </button>
        <button class="btn btn-outline btn-sm" onclick="CursoEdit.addLinkMat()">+ Link externo</button>
        <input type="file" id="mec-file-input" style="display:none" multiple onchange="CursoEdit.uploadMat(this)">
      </div>
    </div>

    <!-- Tab 3: Configurações -->
    <div class="mc-pane" id="mec-pane-3">
      <div id="mec-config-body"></div>
    </div>

    <!-- Tab 4: Revisão -->
    <div class="mc-pane" id="mec-pane-4">
      <div id="mec-review-body" style="font-size:13px"></div>
    </div>

    <div class="modal-foot">
      <button class="btn btn-ghost modal-close">Cancelar</button>
      <button class="btn btn-primary" onclick="CursoEdit.salvar()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 0-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Salvar alterações
      </button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: TURMA (criar/editar) ════════════════════════════ -->
<div class="modal-bg" id="modal-turma">
  <div class="modal" style="max-width:600px">
    <div class="modal-head">
      <div>
        <h3 id="mt-titulo">Nova Turma</h3>
        <div id="mt-sub" style="font-size:11px;color:var(--text3);margin-top:2px"></div>
      </div>
      <button class="modal-close" onclick="document.getElementById('modal-turma').classList.remove('open')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>

    <!-- Tabs do modal -->
    <div class="mc-tabs">
      <button class="mc-tab active" onclick="Turmas.tabModal(0,this)">Dados</button>
      <button class="mc-tab" onclick="Turmas.tabModal(1,this)">Alunos</button>
      <button class="mc-tab" onclick="Turmas.tabModal(2,this)">Acesso</button>
    </div>

    <!-- Tab 0: Dados da turma -->
    <div class="mc-pane active" id="mt-pane-0">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="fg" style="grid-column:1/-1">
          <label>Nome da turma *</label>
          <input type="text" id="mt-nome" placeholder="Ex: Turma Janeiro 2025">
        </div>
        <div class="fg" style="grid-column:1/-1">
          <label>Curso vinculado *</label>
          <select id="mt-curso"></select>
        </div>
        <div class="fg" style="grid-column:1/-1">
          <label>Descrição</label>
          <textarea id="mt-desc" rows="2" placeholder="Objetivo ou observações da turma..."></textarea>
        </div>
        <div class="fg">
          <label>Responsável</label>
          <input type="text" id="mt-responsavel" placeholder="Nome do responsável">
        </div>
        <div class="fg">
          <label>Limite de participantes (0 = ilimitado)</label>
          <input type="number" id="mt-limite" min="0" value="0">
        </div>
        <div class="fg">
          <label>Data de início</label>
          <input type="date" id="mt-inicio">
        </div>
        <div class="fg">
          <label>Data de encerramento</label>
          <input type="date" id="mt-fim">
        </div>
        <div class="fg" style="grid-column:1/-1">
          <label>Status</label>
          <select id="mt-status">
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em andamento</option>
            <option value="encerrada">Encerrada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tab 1: Alunos -->
    <div class="mc-pane" id="mt-pane-1">
      <!-- Seleção rápida -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <button class="btn btn-ghost btn-sm" onclick="Turmas.selecionarPorSetor()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Por setor
        </button>
        <button class="btn btn-ghost btn-sm" onclick="Turmas.selecionarPorEquipe()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Por equipe
        </button>
        <button class="btn btn-ghost btn-sm" onclick="Turmas.selecionarTodos()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Selecionar todos
        </button>
        <button class="btn btn-danger btn-sm" onclick="Turmas.limparAlunos()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          Limpar seleção
        </button>
      </div>

      <!-- Busca de alunos -->
      <div style="position:relative;margin-bottom:10px">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="mt-aluno-busca" placeholder="Buscar aluno..."
          oninput="Turmas.filtrarAlunos()"
          style="width:100%;padding:7px 12px 7px 32px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:13px;outline:none;font-family:var(--font);color:var(--text)">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text4)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
      </div>

      <!-- Lista de alunos com checkboxes -->
      <div id="mt-alunos-lista" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm)">
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--text3)">
        <span id="mt-alunos-count" style="font-weight:600;color:var(--blue)">0</span> aluno(s) selecionado(s)
      </div>
    </div>

    <!-- Tab 2: Controle de acesso -->
    <div class="mc-pane" id="mt-pane-2">
      <div id="mt-config-body">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">Acesso automático ao criar</div>
            <div style="font-size:11px;color:var(--text4)">Libera o curso para os alunos ao salvar a turma</div>
          </div>
          <div id="mt-cfg-auto" class="toggle on" onclick="this.classList.toggle('on')" style="position:relative;width:40px;height:22px;background:var(--blue);border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
            <span style="position:absolute;top:3px;left:21px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">Bloquear após encerramento</div>
            <div style="font-size:11px;color:var(--text4)">Remove acesso dos alunos quando a turma encerrar</div>
          </div>
          <div id="mt-cfg-bloquear" class="toggle on" onclick="this.classList.toggle('on')" style="position:relative;width:40px;height:22px;background:var(--blue);border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
            <span style="position:absolute;top:3px;left:21px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">Permitir entrada após início</div>
            <div style="font-size:11px;color:var(--text4)">Novos alunos podem entrar mesmo após a data de início</div>
          </div>
          <div id="mt-cfg-entrada" class="toggle on" onclick="this.classList.toggle('on')" style="position:relative;width:40px;height:22px;background:var(--blue);border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
            <span style="position:absolute;top:3px;left:21px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
          </div>
        </div>
        <div style="padding:11px 0">
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px">Prazo de conclusão (dias)</div>
          <div style="font-size:11px;color:var(--text4);margin-bottom:8px">0 = sem prazo definido</div>
          <input type="number" id="mt-cfg-prazo" min="0" value="0"
            style="width:120px;padding:7px 11px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:13px;outline:none;font-family:var(--font)">
        </div>
      </div>
    </div>

    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-turma').classList.remove('open')">Cancelar</button>
      <button class="btn btn-primary" onclick="Turmas.salvar()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Salvar turma
      </button>
    </div>
  </div>
</div>


<!-- ═══ MODAL: DASHBOARD DA TURMA ══════════════════════════════ -->
<div class="modal-bg" id="modal-turma-dash">
  <div class="modal" style="max-width:700px;padding:0">
    <!-- Header colorido -->
    <div style="background:var(--blue);color:#fff;padding:20px 24px;border-radius:var(--radius) var(--radius) 0 0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;opacity:.75;margin-bottom:4px">Turma</div>
          <div id="td-nome" style="font-size:18px;font-weight:700;letter-spacing:-.3px"></div>
          <div id="td-curso" style="font-size:12px;opacity:.8;margin-top:4px"></div>
        </div>
        <button onclick="document.getElementById('modal-turma-dash').classList.remove('open')"
          style="background:rgba(255,255,255,.15);border:none;border-radius:var(--radius-sm);width:32px;height:32px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <!-- Mini stats -->
      <div style="display:flex;gap:24px;margin-top:16px">
        <div><div style="font-size:22px;font-weight:700" id="td-total">0</div><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.06em">Alunos</div></div>
        <div><div style="font-size:22px;font-weight:700" id="td-pct">0%</div><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.06em">Conclusão</div></div>
        <div><div style="font-size:22px;font-weight:700" id="td-concl">0</div><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.06em">Concluídos</div></div>
        <div><div style="font-size:22px;font-weight:700" id="td-pend">0</div><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.06em">Pendentes</div></div>
        <div><div style="font-size:22px;font-weight:700" id="td-encerramento"></div><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.06em">Encerramento</div></div>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:20px 24px">
      <!-- Barra de progresso -->
      <div style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:6px">
          <span>Progresso médio da turma</span>
          <span id="td-pct-label" style="font-weight:600;color:var(--blue)">0%</span>
        </div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
          <div id="td-prog-bar" style="height:100%;background:var(--blue);border-radius:4px;transition:width .4s;width:0%"></div>
        </div>
      </div>
      <!-- Lista de participantes -->
      <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        Participantes
      </div>
      <div id="td-participantes" style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:6px"></div>
    </div>
    <div style="padding:12px 24px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" onclick="Turmas.abrirGerenciarAlunos(Turmas._viewingId)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Gerenciar alunos
      </button>
      <button class="btn btn-ghost btn-sm" onclick="Turmas.abrirEdit(Turmas._viewingId);document.getElementById('modal-turma-dash').classList.remove('open')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Editar turma
      </button>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-turma-dash').classList.remove('open')">Fechar</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: MATERIAL (criar/editar) ═════════════════════════ -->
<div class="modal-bg" id="modal-material">
  <div class="modal" style="max-width:640px">
    <div class="modal-head">
      <div>
        <h3 id="mm-titulo">Novo Material</h3>
        <div id="mm-sub" style="font-size:11px;color:var(--text3);margin-top:2px"></div>
      </div>
      <button class="modal-close" onclick="document.getElementById('modal-material').classList.remove('open')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>

    <div class="mc-tabs">
      <button class="mc-tab active" onclick="MatMod.tabModal(0,this)">Dados</button>
      <button class="mc-tab" onclick="MatMod.tabModal(1,this)">Upload</button>
      <button class="mc-tab" onclick="MatMod.tabModal(2,this)">Configurações</button>
    </div>

    <!-- Tab 0: Dados -->
    <div class="mc-pane active" id="mm-pane-0">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="fg" style="grid-column:1/-1">
          <label>Nome do material *</label>
          <input type="text" id="mm-nome" placeholder="Ex: Apostila NR10 — Módulo 1">
        </div>
        <div class="fg" style="grid-column:1/-1">
          <label>Descrição curta</label>
          <textarea id="mm-desc" rows="2" placeholder="Descreva o conteúdo do material..."></textarea>
        </div>
        <div class="fg">
          <label>Tipo *</label>
          <select id="mm-tipo">
            <option value="">Selecione...</option>
            <option value="pdf">PDF</option>
            <option value="video">Vídeo</option>
            <option value="xlsx">Planilha Excel</option>
            <option value="doc">Documento Word</option>
            <option value="imagem">Imagem</option>
            <option value="link">Link externo</option>
            <option value="zip">Arquivo ZIP</option>
            <option value="pptx">Apresentação</option>
            <option value="quiz">Avaliação</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div class="fg">
          <label>Categoria</label>
          <select id="mm-categoria">
            <option value="">Selecione...</option>
            <option>Apostila</option>
            <option>Vídeo aula</option>
            <option>Material complementar</option>
            <option>Exercício</option>
            <option>Avaliação</option>
            <option>Certificado</option>
            <option>Referência técnica</option>
            <option>Normativa</option>
            <option>Outro</option>
          </select>
        </div>
        <div class="fg">
          <label>Curso vinculado</label>
          <select id="mm-curso"></select>
        </div>
        <div class="fg">
          <label>Módulo (opcional)</label>
          <select id="mm-modulo">
            <option value="">Selecione um módulo...</option>
          </select>
        </div>
        <div class="fg" style="grid-column:1/-1">
          <label>Tags (separe por vírgula)</label>
          <input type="text" id="mm-tags" placeholder="Ex: segurança, NR10, elétrica">
        </div>
        <div class="fg">
          <label>Responsável</label>
          <input type="text" id="mm-responsavel" placeholder="Nome do responsável">
        </div>
        <div class="fg">
          <label>Status</label>
          <select id="mm-status">
            <option value="ativo">Ativo</option>
            <option value="oculto">Oculto</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tab 1: Upload / URL -->
    <div class="mc-pane" id="mm-pane-1">
      <!-- Seletor de modo -->
      <div style="display:flex;gap:0;margin-bottom:16px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);overflow:hidden">
        <button id="mm-mode-file" onclick="MatMod.setUploadMode('file')"
          style="flex:1;padding:9px;font-size:13px;font-weight:600;font-family:var(--font);border:none;cursor:pointer;background:var(--blue);color:#fff;transition:all .12s">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload de arquivo
        </button>
        <button id="mm-mode-link" onclick="MatMod.setUploadMode('link')"
          style="flex:1;padding:9px;font-size:13px;font-weight:600;font-family:var(--font);border:none;cursor:pointer;background:var(--surface);color:var(--text3);transition:all .12s">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link externo
        </button>
      </div>

      <!-- Upload de arquivo -->
      <div id="mm-upload-section">
        <div id="mm-dropzone" style="border:2px dashed var(--border2);border-radius:var(--radius);padding:36px 20px;text-align:center;cursor:pointer;transition:all .15s;background:var(--bg)"
          onclick="document.getElementById('mm-file-input').click()"
          ondragover="MatMod.onDragOver(event)" ondrop="MatMod.onDrop(event)"
          ondragleave="MatMod.onDragLeave(event)">
          <input type="file" id="mm-file-input" style="display:none"
            accept=".pdf,.mp4,.webm,.xlsx,.xls,.doc,.docx,.pptx,.png,.jpg,.jpeg,.zip"
            onchange="MatMod.handleFile(this)">
          <div id="mm-dropzone-icon" style="color:var(--text4);margin-bottom:10px">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div id="mm-dropzone-text" style="font-size:14px;font-weight:600;color:var(--text2);margin-bottom:4px">Arraste o arquivo ou clique para selecionar</div>
          <div id="mm-dropzone-sub" style="font-size:12px;color:var(--text4)">PDF · MP4 · XLSX · DOC · PPTX · IMG · ZIP — máx. 100MB</div>
        </div>
        <div id="mm-file-preview" style="display:none;margin-top:12px"></div>
      </div>

      <!-- Link externo -->
      <div id="mm-link-section" style="display:none">
        <div class="fg">
          <label>URL do link *</label>
          <input type="url" id="mm-url" placeholder="https://...">
        </div>
        <div class="fg" style="margin-top:12px">
          <label>Texto de exibição</label>
          <input type="text" id="mm-url-texto" placeholder="Ex: Acesse o material">
        </div>
        <div style="margin-top:12px;padding:10px 12px;background:var(--blue-light);border-radius:var(--radius-sm);font-size:12px;color:var(--blue)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          O link será aberto em nova aba ao ser acessado pelo aluno.
        </div>
      </div>
    </div>

    <!-- Tab 2: Configurações -->
    <div class="mc-pane" id="mm-pane-2">
      <div id="mm-config-body">
        <!-- Gerado por JS -->
      </div>
    </div>

    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-material').classList.remove('open')">Cancelar</button>
      <button class="btn btn-primary" onclick="MatMod.salvar()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Salvar material
      </button>
    </div>
  </div>
</div>


<!-- ═══ MODAL: VISUALIZADOR DE MATERIAL ═══════════════════════ -->
<div class="modal-bg" id="modal-viewer">
  <div class="modal" style="max-width:780px;padding:0;overflow:hidden">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border)">
      <div>
        <div id="viewer-nome" style="font-size:15px;font-weight:600;color:var(--text)"></div>
        <div id="viewer-meta" style="font-size:11px;color:var(--text4);margin-top:2px"></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button id="viewer-dl-btn" class="btn btn-ghost btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar
        </button>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('modal-viewer').classList.remove('open')">Fechar</button>
      </div>
    </div>
    <!-- Área de conteúdo -->
    <div id="viewer-body" style="min-height:400px;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:24px">
    </div>
  </div>
</div>


<!-- ═══ MODAL: VINCULAR MATERIAL ═══════════════════════════════ -->
<div class="modal-bg" id="modal-vincular">
  <div class="modal" style="max-width:480px">
    <div class="modal-head">
      <h3>Vincular material a outro curso</h3>
      <button class="modal-close" onclick="document.getElementById('modal-vincular').classList.remove('open')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div id="mv-nome" style="margin-bottom:14px;padding:10px 14px;background:var(--bg);border-radius:var(--radius-sm);font-size:13px;color:var(--text3)"></div>
    <div class="fg">
      <label>Selecione o curso destino</label>
      <select id="mv-curso-sel"></select>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-vincular').classList.remove('open')">Cancelar</button>
      <button class="btn btn-primary" onclick="MatMod.confirmarVinculo()">Vincular</button>
    </div>
  </div>
</div>

<!-- TOASTS -->
<div class="toast-stack" id="toasts"></div>


<script>
/* ════════════════════════════════════════════════════
   SidebarNav — Controle da sidebar colapsável
   Grupos, mobile overlay, collapse desktop, tooltips
════════════════════════════════════════════════════ */
var SidebarNav = (() => {
  const sidebar  = () => document.getElementById('mainSidebar');
  const overlay  = () => document.getElementById('sbOverlay');
  const PREF_KEY = 'ead_sb_collapsed';

  /* ── Grupos colapsáveis ── */
  function toggleGroup(groupEl) {
    const isOpen = groupEl.classList.contains('open');
    groupEl.classList.toggle('open', !isOpen);
    const label = groupEl.querySelector('.sb-group-label');
    if (label) {
      localStorage.setItem('ead_sb_group_' + label.textContent.trim(), !isOpen ? '1' : '0');
    }
  }

  /* ── Collapse desktop (apenas ícones) ── */
  function toggleCollapse() {
    const sb = sidebar();
    sb.classList.toggle('collapsed');
    const collapsed = sb.classList.contains('collapsed');
    localStorage.setItem(PREF_KEY, collapsed ? '1' : '0');
    const main = document.querySelector('.main');
    if (main) main.style.marginLeft = collapsed ? '56px' : 'var(--sb-w)';
  }

  /* ── Mobile ── */
  function toggleMobile() {
    sidebar().classList.toggle('mobile-open');
    overlay().classList.toggle('visible');
    document.body.style.overflow = sidebar().classList.contains('mobile-open') ? 'hidden' : '';
  }
  function closeMobile() {
    sidebar().classList.remove('mobile-open');
    overlay().classList.remove('visible');
    document.body.style.overflow = '';
  }

  /* ── Restaura preferências salvas ── */
  function restorePrefs() {
    // Estado colapsado
    if (localStorage.getItem(PREF_KEY) === '1') {
      const sb = sidebar();
      if (sb) {
        sb.classList.add('collapsed');
        const main = document.querySelector('.main');
        if (main) main.style.marginLeft = '56px';
      }
    }
    // Estado dos grupos
    document.querySelectorAll('.sb-group').forEach(g => {
      const label = g.querySelector('.sb-group-label');
      if (!label) return;
      const saved = localStorage.getItem('ead_sb_group_' + label.textContent.trim());
      if (saved === '0') g.classList.remove('open');
      if (saved === '1') g.classList.add('open');
    });
    // Tooltips para collapsed
    document.querySelectorAll('.sb-item').forEach(el => {
      const lbl = el.querySelector('.sb-item-label');
      if (lbl) el.setAttribute('data-tip', lbl.textContent.trim());
    });
    document.querySelectorAll('.sb-group-head').forEach(el => {
      const lbl = el.querySelector('.sb-group-label');
      if (lbl) el.setAttribute('data-tip', lbl.textContent.trim());
    });
  }

  /* ── Eventos globais ── */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobile(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMobile(); });

  return { toggleGroup, toggleCollapse, toggleMobile, closeMobile, restorePrefs };
})();
</script>

<script>
/* ════════════════════════════════════════════════════════════
   Módulo: Gestão de Cursos (Cursos)
   Totalmente integrado com Storage — sem lógica duplicada
   Funcionalidades: stats, tabela, filtros, busca, ações em
   lote, modal de edição com tabs, atividades recentes
════════════════════════════════════════════════════════════ */

var Cursos = (() => {

  let selecionados = new Set();
  let cursoEditId  = null;
  let matEdit      = [];

  /* ── SVG helpers ───────────────────────────────────────── */
  const ico = (d, s=14) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;

  const SVGS = {
    eye:   ico('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    edit:  ico('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
    copy:  ico('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    folder:ico('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    lock:  ico('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    play:  ico('<polygon points="5 3 19 12 5 21 5 3"/>'),
    pause: ico('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
    arc:   ico('<path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>'),
    trash: ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>'),
    chev:  ico('<polyline points="6 9 12 15 18 9"/>'),
    save:  ico('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 0-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
    clock: ico('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    book:  ico('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    down:  ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  };

  /* ── Ponto de entrada (chamado pelo Admin.go) ─────────────── */
  function init() {
    renderStats();
    renderTabela();
    popularFiltroCategoria();
    selecionados.clear();
    atualizarBotoesLote();
    if (typeof IFT !== 'undefined') IFT.init();
  }

  /* ── Utils ────────────────────────────────────────────────── */
  function q(sel) { return document.querySelector(sel); }
  function x(s)   { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
  }
  function fmtBytes(b) {
    if (!b || isNaN(b)) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  function resolveStatus(c) {
    const agora = new Date();
    if (c.status === 'publicado' && c.validadeAte && new Date(c.validadeAte) < agora)
      return 'expirado';
    return c.status || 'rascunho';
  }

  const STATUS_CFG = {
    publicado: { cls:'badge-green', label:'● Publicado'  },
    rascunho:  { cls:'badge-gray',  label:'✎ Rascunho'   },
    revisao:   { cls:'badge-blue',  label:'◎ Revisão'     },
    arquivado: { cls:'badge-amber', label:'▣ Arquivado'  },
    expirado:  { cls:'badge-red',   label:'✕ Expirado'   },
  };

  function statusBadge(status) {
    const s = STATUS_CFG[status] || STATUS_CFG.rascunho;
    return `<span class="badge ${s.cls}" style="white-space:nowrap">${s.label}</span>`;
  }

  /* ── Stats cards ──────────────────────────────────────────── */
  function renderStats() {
    const lista = Storage.Cursos.listar();
    const agora = new Date();

    const total     = lista.length;
    const publicados = lista.filter(c => c.status === 'publicado' && !(c.validadeAte && new Date(c.validadeAte) < agora)).length;
    const rascunhos = lista.filter(c => (c.status || 'rascunho') === 'rascunho').length;
    const arquivados= lista.filter(c => c.status === 'arquivado').length;
    const expirados = lista.filter(c => c.status === 'publicado' && c.validadeAte && new Date(c.validadeAte) < agora).length;

    const statCard = (label, val, sub, valClass='') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${label}</div>
            <div class="stat-val ${valClass}">${val}</div>
          </div>
          <div class="stat-ico">${SVGS.book}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    const wrap = document.getElementById('gc-stats');
    if (wrap) wrap.innerHTML =
      statCard('Total de Cursos', total, 'cadastrados', '') +
      statCard('Publicados', publicados, 'disponíveis', 'blue') +
      statCard('Rascunho', rascunhos, 'em edição', '') +
      statCard('Arquivados', arquivados, 'desativados', '') +
      statCard('Expirados', expirados, 'fora do prazo', expirados > 0 ? 'red' : '');
  }

  /* ── Filtro de categoria ──────────────────────────────────── */
  function popularFiltroCategoria() {
    const sel = q('#gc-filtro-cat');
    if (!sel) return;
    const cats = [...new Set(Storage.Cursos.listar().map(c => c.categoria).filter(Boolean))].sort();
    const base = '<option value="">Todas as categorias</option>';
    sel.innerHTML = base + cats.map(c => `<option value="${x(c)}">${x(c)}</option>`).join('');
  }

  /* ── Tabela principal ─────────────────────────────────────── */
  function renderTabela() {
    const agora   = new Date();
    const busca   = (q('#gc-search')?.value || '').toLowerCase().trim();
    const fStatus = q('#gc-filtro-status')?.value || '';
    const fCat    = q('#gc-filtro-cat')?.value || '';
    const ordem   = q('#gc-order')?.value || 'recente';

    let lista = Storage.Cursos.listar();

    /* Filtra */
    const fFmt  = document.getElementById('gc-filtro-fmt')?.value  || '';
    const fData = document.getElementById('gc-filtro-data')?.value || '';

    if (busca) lista = lista.filter(c =>
      c.titulo?.toLowerCase().includes(busca) ||
      c.categoria?.toLowerCase().includes(busca) ||
      c.descricao?.toLowerCase().includes(busca)
    );
    if (fCat)    lista = lista.filter(c => c.categoria === fCat);
    if (fFmt)    lista = lista.filter(c => (c.formato || 'ead') === fFmt);
    if (fData)   lista = lista.filter(c => c.publicadoEm && c.publicadoEm.slice(0,10) >= fData);
    if (fStatus) {
      lista = lista.filter(c => {
        const st = resolveStatus(c);
        return st === fStatus;
      });
    }

    /* Ordena */
    lista.sort((a, b) => {
      if (ordem === 'az')         return (a.titulo||'').localeCompare(b.titulo||'');
      if (ordem === 'za')         return (b.titulo||'').localeCompare(a.titulo||'');
      if (ordem === 'antigo')     return new Date(a.criadoEm) - new Date(b.criadoEm);
      if (ordem === 'carga-desc') return (b.carga||0) - (a.carga||0);
      return new Date(b.criadoEm||0) - new Date(a.criadoEm||0); // recente
    });

    const tbody   = q('#gc-tbody');
    const empty   = q('#gc-empty');
    const counter = q('#gc-result-count');

    if (counter) counter.textContent = `${lista.length} ${lista.length === 1 ? 'curso' : 'cursos'}`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(c => {
      const status  = resolveStatus(c);
      const aulas   = Storage.Aulas.totalPorCurso(c.id);
      const mods    = Storage.Modulos.listarPorCurso(c.id).length;
      const mats    = Storage.Materiais.listarPorCurso(c.id).length;
      const rest    = Storage.Restricoes.porCurso(c.id);
      const libStr  = rest.length ? `${rest.length} restrição(ões)` : 'Todos';
      const prog    = calcProgresso(c.id);
      const sel     = selecionados.has(c.id);
      const thumbStyle = c.capa
        ? `background:url('${c.capa}') center/cover no-repeat`
        : 'background:var(--blue-light)';
      const thumbContent = c.capa ? '' : (c.titulo?.[0]?.toUpperCase() || '?');

      const valHtml = c.validadeAte
        ? (() => {
            const d = new Date(c.validadeAte);
            const diff = Math.ceil((d - agora) / 86400000);
            const cls = diff < 0 ? 'expirado-txt' : diff < 15 ? 'vencendo' : '';
            const txt = diff < 0 ? `Expirou ${fmtDate(c.validadeAte)}` : diff < 15 ? `Vence em ${diff}d` : fmtDate(c.validadeAte);
            return `<div class="gc-validade ${cls}">${txt}</div>`;
          })()
        : `<div class="gc-validade">Sem validade</div>`;

      const progHtml = `
        <div class="gc-prog-wrap">
          <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${prog}%"></div></div>
          <span class="gc-prog-lbl">${prog}%</span>
        </div>`;

      return `<tr class="${sel ? 'selected' : ''}" id="row-${c.id}">
        <td style="padding:8px 10px">
          <input type="checkbox" class="row-check" ${sel ? 'checked' : ''}
            onchange="Cursos.toggleSel('${c.id}',this.checked)">
        </td>
        <td>
          <div class="gc-curso-cell">
            <div class="gc-thumb" style="${thumbStyle}">${thumbContent}</div>
            <div style="min-width:0">
              <div class="gc-titulo">${x(c.titulo)}</div>
              <div class="gc-desc">${x(c.descricao) || '—'}</div>
              ${valHtml}
            </div>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text3)">${x(c.categoria || '—')}</td>
        <td style="text-align:center;font-size:12px">${c.carga ? c.carga + 'h' : '—'}</td>
        <td style="text-align:center">
          <span style="font-size:12px;font-weight:600">${aulas}</span>
          <div style="font-size:10px;color:var(--text4)">${mods} mód.</div>
        </td>
        <td style="text-align:center;font-size:12px;color:var(--text3)">${libStr}</td>
        <td style="min-width:90px">${progHtml}</td>
        <td>${statusBadge(status)}</td>
        <td style="font-size:11px;color:var(--text4)">${fmtDate(c.publicadoEm)}</td>
        <td style="font-size:11px;color:var(--text4)">${fmtDate(c.criadoEm)}</td>
        <td>
          <div class="gc-actions">
            <button class="gc-actions-btn" onclick="Cursos.toggleMenu(this)" title="Ações">
              Ações ${SVGS.chev}
            </button>
            <div class="gc-menu">
              <button onclick="Cursos.visualizar('${c.id}');Cursos.closeMenus()">${SVGS.eye} Visualizar</button>
              <button onclick="Cursos.abrirEdit('${c.id}');Cursos.closeMenus()">${SVGS.edit} Editar</button>
              <button onclick="Cursos.duplicarCurso('${c.id}');Cursos.closeMenus()">${SVGS.copy} Duplicar</button>
              <hr class="sep">
              <button onclick="Admin.go('materiais');Cursos.closeMenus()">${SVGS.folder} Gerenciar materiais</button>
              <button onclick="Admin.goAcessos('${c.id}');Cursos.closeMenus()">${SVGS.lock} Gerenciar acessos</button>
              <hr class="sep">
              ${status !== 'publicado'
                ? `<button onclick="Cursos.publicarCurso('${c.id}');Cursos.closeMenus()">${SVGS.play} Publicar</button>`
                : `<button onclick="Cursos.despublicarCurso('${c.id}');Cursos.closeMenus()">${SVGS.pause} Despublicar</button>`}
              <button onclick="Cursos.arquivarCurso('${c.id}');Cursos.closeMenus()">${SVGS.arc} Arquivar</button>
              <hr class="sep">
              <button class="danger" onclick="Cursos.excluirCurso('${c.id}');Cursos.closeMenus()">${SVGS.trash} Excluir</button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function calcProgresso(cursoId) {
    const mids = Storage.Modulos.listarPorCurso(cursoId).map(m => m.id);
    const aids = Storage.Aulas.listar().filter(a => mids.includes(a.moduloId)).map(a => a.id);
    if (!aids.length) return 0;
    const alunos = Storage.Alunos.listar().filter(a => a.ativo);
    if (!alunos.length) return 0;
    let total = 0;
    alunos.forEach(al => {
      const done = Storage.Progresso.concluidas(al.id).filter(id => aids.includes(id)).length;
      total += Math.round((done / aids.length) * 100);
    });
    return Math.round(total / alunos.length);
  }

  /* ── Menus dropdown ────────────────────────────────────────── */
  function toggleMenu(btn) {
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', closeMenus, { once: true }), 10);
    }
  }
  function closeMenus() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  /* ── Seleção em lote ─────────────────────────────────────── */
  function toggleSel(id, checked) {
    checked ? selecionados.add(id) : selecionados.delete(id);
    const row = document.getElementById('row-' + id);
    if (row) row.classList.toggle('selected', checked);
    atualizarBotoesLote();
  }

  function toggleSelAll(checkbox) {
    const lista = Storage.Cursos.listar();
    lista.forEach(c => {
      if (checkbox.checked) selecionados.add(c.id);
      else selecionados.delete(c.id);
    });
    document.querySelectorAll('.row-check').forEach(ch => ch.checked = checkbox.checked);
    document.querySelectorAll('#gc-tbody tr').forEach(r =>
      r.classList.toggle('selected', checkbox.checked)
    );
    atualizarBotoesLote();
  }

  function atualizarBotoesLote() {
    const n    = selecionados.size;
    const show = n > 0;
    // Atualiza o label de contagem
    const count = q('#gc-sel-count');
    if (count) count.textContent = `${n} curso${n !== 1 ? 's' : ''} selecionado${n !== 1 ? 's' : ''}`;
    // Exibe/oculta a row de lote dentro da IFT
    const loteRow = q('#ift-lote-row');
    if (loteRow) loteRow.classList.toggle('show', show);
  }

  /* ── Ações em lote ───────────────────────────────────────── */
  function publicarLote() {
    if (!selecionados.size || !confirm(`Publicar ${selecionados.size} curso(s)?`)) return;
    selecionados.forEach(id => Storage.Cursos.publicar(id));
    toast(`${selecionados.size} curso(s) publicado(s)!`, 's');
    selecionados.clear(); refresh();
  }
  function arquivarLote() {
    if (!selecionados.size || !confirm(`Arquivar ${selecionados.size} curso(s)?`)) return;
    selecionados.forEach(id => Storage.Cursos.arquivar(id));
    toast(`${selecionados.size} curso(s) arquivado(s).`, 'i');
    selecionados.clear(); refresh();
  }
  function excluirLote() {
    if (!selecionados.size || !confirm(`Excluir permanentemente ${selecionados.size} curso(s)?`)) return;
    selecionados.forEach(id => Storage.Cursos.excluir(id));
    toast(`${selecionados.size} curso(s) excluído(s).`, 'i');
    selecionados.clear(); refresh();
  }

  /* ── Ações individuais ───────────────────────────────────── */
  function visualizar(id) {
    const c = Storage.Cursos.obter(id);
    if (!c) return;
    const aulas = Storage.Aulas.totalPorCurso(id);
    const mods  = Storage.Modulos.listarPorCurso(id).length;
    const mats  = Storage.Materiais.listarPorCurso(id).length;
    const info  = [
      `Categoria: ${c.categoria || '—'}`,
      `Formato: ${c.formato || '—'}`,
      `Carga: ${c.carga || 0}h`,
      `Módulos: ${mods} | Aulas: ${aulas}`,
      `Materiais: ${mats}`,
      `Status: ${resolveStatus(c)}`,
      `Criado em: ${fmtDate(c.criadoEm)}`,
    ].join('\n');
    alert(`📚 ${c.titulo}\n\n${info}`);
  }

  function publicarCurso(id) {
    Storage.Cursos.publicar(id);
    toast('Curso publicado!', 's');
    logAtividade({ tipo:'publicou', cursoId:id });
    refresh();
  }
  function despublicarCurso(id) {
    Storage.Cursos.atualizar(id, { status:'rascunho', publicadoEm:null });
    toast('Curso despublicado.', 'i');
    refresh();
  }
  function arquivarCurso(id) {
    if (!confirm('Arquivar este curso?')) return;
    Storage.Cursos.arquivar(id);
    toast('Curso arquivado.', 'i');
    logAtividade({ tipo:'arquivou', cursoId:id });
    refresh();
  }
  function excluirCurso(id) {
    if (!confirm('Excluir permanentemente?')) return;
    Storage.Cursos.excluir(id);
    toast('Curso excluído.', 'i');
    refresh();
  }
  function duplicarCurso(id) {
    const novo = Storage.Cursos.duplicar(id);
    if (novo) {
      toast('Curso duplicado!', 's');
      logAtividade({ tipo:'duplicou', cursoId:novo.id });
      refresh();
    }
  }

  /* ── Exportar CSV ────────────────────────────────────────── */
  function exportar() {
    const lista = Storage.Cursos.listar();
    const rows = [['ID','Título','Categoria','Carga','Status','Publicado','Criado']];
    lista.forEach(c => rows.push([
      c.id, c.titulo, c.categoria||'', c.carga||0,
      resolveStatus(c), c.publicadoEm||'', c.criadoEm||''
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cursos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  /* ── Atividades recentes ─────────────────────────────────── */
  function logAtividade(ev) {
    try {
      const lista = JSON.parse(localStorage.getItem('ead_atividades') || '[]');
      lista.unshift({ ...ev, ts: new Date().toISOString() });
      localStorage.setItem('ead_atividades', JSON.stringify(lista.slice(0, 50)));
    } catch(e) {}
  }

  function renderAtividades() {
    const wrap = document.getElementById('gc-atividades');
    if (!wrap) return;

    // Combina atividades manuais + progresso dos alunos + criação de cursos
    const ativ = [];

    // Atividades manuais salvas
    try {
      const saved = JSON.parse(localStorage.getItem('ead_atividades') || '[]');
      saved.forEach(a => ativ.push(a));
    } catch(e) {}

    // Cursos criados recentemente (últimos 30d)
    Storage.Cursos.listar().forEach(c => {
      if (c.criadoEm) ativ.push({ tipo:'criou', cursoId:c.id, ts:c.criadoEm });
      if (c.publicadoEm) ativ.push({ tipo:'publicou', cursoId:c.id, ts:c.publicadoEm });
    });
    // Materiais
    Storage.Materiais.listar().forEach(m => {
      if (m.criadoEm) ativ.push({ tipo:'material', cursoId:m.cursoId, materialNome:m.nome, ts:m.criadoEm });
    });

    // Ordena por data desc e remove dups aproximados
    ativ.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    const top = ativ.slice(0, 10);

    if (!top.length) {
      wrap.innerHTML = '<div style="color:var(--text4);font-size:13px">Nenhuma atividade registrada.</div>';
      return;
    }

    const tipoLabel = {
      criou:     { label:'Curso criado',        cls:'badge-blue'  },
      publicou:  { label:'Curso publicado',     cls:'badge-green' },
      arquivou:  { label:'Curso arquivado',     cls:'badge-amber' },
      duplicou:  { label:'Curso duplicado',     cls:'badge-gray'  },
      material:  { label:'Material adicionado', cls:'badge-blue'  },
    };

    wrap.innerHTML = top.map(a => {
      const curso = a.cursoId ? Storage.Cursos.obter(a.cursoId) : null;
      const cfg   = tipoLabel[a.tipo] || { label: a.tipo, cls:'badge-gray' };
      const nome  = a.materialNome
        ? `${curso ? x(curso.titulo) + ' — ' : ''}${x(a.materialNome)}`
        : (curso ? x(curso.titulo) : '—');
      const diff  = Math.floor((Date.now() - new Date(a.ts)) / 60000);
      const tempo = diff < 1 ? 'Agora' : diff < 60 ? `${diff}min` : diff < 1440 ? `${Math.floor(diff/60)}h` : fmtDate(a.ts);

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
          <span class="badge ${cfg.cls}" style="white-space:nowrap;flex-shrink:0">${cfg.label}</span>
          <span style="flex:1;font-size:12px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nome}</span>
          <span style="font-size:11px;color:var(--text4);flex-shrink:0">${tempo}</span>
        </div>`;
    }).join('') + '<div style="padding-top:2px"></div>';
  }

  /* ── Modal de edição ─────────────────────────────────────── */
  function abrirEdit(id) {
    cursoEditId = id;
    const c = Storage.Cursos.obter(id);
    if (!c) return;

    matEdit = [...(Storage.Materiais.listarPorCurso(id) || [])];

    // Preenche campos — tab 0
    setVal('mec-nome', c.titulo);
    setVal('mec-categoria', c.categoria);
    setVal('mec-formato', c.formato || 'ead');
    setVal('mec-carga', c.carga);
    setVal('mec-nivel', c.nivel || 'basico');
    setVal('mec-descricao', c.descricao);
    setVal('mec-status', c.status || 'rascunho');
    setVal('mec-validade', c.validadeAte ? c.validadeAte.split('T')[0] : '');
    setVal('mec-prazo', c.prazo || '');

    // tab 1 — público
    const publico = c.publico || [];
    document.getElementById('mec-publico-chips').innerHTML = [
      'tecnicos','eletricistas','administrativo','operacional',
      'gestores','liderança','novos-colaboradores','todos','outros'
    ].map(v => {
      const sel = publico.includes(v);
      return `<span class="tag-chip ${sel?'selected':''}" data-val="${v}"
        onclick="this.classList.toggle('selected')"
        style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border:1.5px solid ${sel?'var(--blue)':'var(--border)'};border-radius:99px;font-size:12px;font-weight:500;color:${sel?'#fff':'var(--text3)'};cursor:pointer;background:${sel?'var(--blue)':'var(--surface)'};transition:all .12s">
        ${v.charAt(0).toUpperCase() + v.slice(1).replace('-',' ')}
      </span>`;
    }).join('');
    setVal('mec-visib', c.visib || 'todos');
    setVal('mec-publico-obs', c.publicoObs || '');

    // tab 2 — materiais
    renderMatEdit();

    // tab 3 — config
    renderConfigEdit(c.config || {});

    // Título do modal
    document.getElementById('mec-titulo').textContent = `Editar: ${c.titulo}`;
    document.getElementById('mec-subtitulo').textContent =
      `ID: ${id.slice(0,8)}… · Criado em ${fmtDate(c.criadoEm)}`;

    // Vai para tab 0
    CursoEdit.tab(0, document.querySelector('.mc-tab'));

    document.getElementById('modal-edit-curso').classList.add('open');
  }

  function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v ?? '';
  }

  function renderMatEdit() {
    const lista = document.getElementById('mec-materiais-lista');
    const count = document.getElementById('mec-mat-count');
    if (count) count.textContent = matEdit.length;
    if (!lista) return;
    if (!matEdit.length) {
      lista.innerHTML = '<div style="color:var(--text4);font-size:12px;text-align:center;padding:20px">Nenhum material</div>';
      return;
    }
    lista.innerHTML = matEdit.map((m, i) => {
      const ext = m.ext || (m.nome?.split('.').pop() || 'doc').toLowerCase();
      const labels = { pdf:'PDF', mp4:'VID', webm:'VID', xlsx:'XLS', xls:'XLS', doc:'DOC', docx:'DOC', link:'URL', quiz:'QUIZ' };
      const lbl = labels[ext] || ext.toUpperCase();
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="width:28px;height:28px;border-radius:5px;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${lbl}</div>
        <div style="flex:1;font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(m.nome)}</div>
        <div style="font-size:11px;color:var(--text4)">${m.tamanho || '—'}</div>
        <button onclick="Cursos._remMatEdit(${i})" style="background:none;border:none;cursor:pointer;color:var(--text4);padding:2px 4px" title="Remover">
          ${SVGS.trash}
        </button>
      </div>`;
    }).join('');
  }

  function _remMatEdit(i) {
    matEdit.splice(i, 1);
    renderMatEdit();
  }

  function renderConfigEdit(cfg) {
    const wrap = document.getElementById('mec-config-body');
    if (!wrap) return;

    const row = (id, label, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${label}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val?'on':''}" onclick="this.classList.toggle('on')" style="position:relative;width:40px;height:22px;background:${val?'var(--blue)':'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val?'21':'3'}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      row('cfg-obrigatorio',  'Curso Obrigatório',      'Notifica colaboradores e cobra conclusão', cfg.obrigatorio) +
      row('cfg-certificado',  'Certificado Automático', 'Emitir ao concluir 100%',                  cfg.certificado !== false) +
      row('cfg-avaliacao',    'Avaliação Obrigatória',  'Nota mínima para concluir',                cfg.avaliacao) +
      row('cfg-progresso',    'Controle de Progresso',  'Registrar aulas concluídas',               cfg.progresso !== false) +
      row('cfg-ocultar',      'Ocultar pós-conclusão',  'Não exibe para quem já concluiu',          cfg.ocultar) +
      row('cfg-sequencial',   'Acesso Sequencial',      'Deve concluir aulas na ordem',             cfg.sequencial);
  }

  /* ── CursoEdit (API pública para o modal) ─────────────────── */
  window.CursoEdit = {
    tab(idx, btn) {
      document.querySelectorAll('.mc-tab').forEach((t,i) => {
        t.classList.toggle('active', i === idx);
      });
      document.querySelectorAll('.mc-pane').forEach((p,i) => {
        p.classList.toggle('active', i === idx);
      });
      // Revisão
      if (idx === 4) renderReviewEdit();
    },

    uploadMat(input) {
      Array.from(input.files).forEach(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        matEdit.push({ id:'new_'+Date.now(), nome:f.name, ext, tipo:'file', tamanho:fmtBytes(f.size) });
      });
      renderMatEdit();
      input.value = '';
    },

    addLinkMat() {
      const url  = prompt('URL do link:');
      if (!url) return;
      const nome = prompt('Título do link:', url);
      matEdit.push({ id:'new_'+Date.now(), nome:nome||url, ext:'link', tipo:'link', tamanho:'' });
      renderMatEdit();
    },

    salvar() {
      if (!cursoEditId) return;
      const nome = document.getElementById('mec-nome')?.value.trim();
      if (!nome) { alert('Informe o nome do curso.'); return; }

      const publico = [...document.querySelectorAll('#mec-publico-chips .tag-chip.selected')]
        .map(el => el.dataset.val);

      const getToggle = id => document.getElementById(id)?.classList.contains('on') ?? false;

      const dados = {
        titulo:     nome,
        categoria:  document.getElementById('mec-categoria')?.value || '',
        formato:    document.getElementById('mec-formato')?.value || 'ead',
        carga:      parseInt(document.getElementById('mec-carga')?.value) || 0,
        nivel:      document.getElementById('mec-nivel')?.value || 'basico',
        descricao:  document.getElementById('mec-descricao')?.value.trim() || '',
        status:     document.getElementById('mec-status')?.value || 'rascunho',
        validadeAte:document.getElementById('mec-validade')?.value ? new Date(document.getElementById('mec-validade').value).toISOString() : null,
        prazo:      document.getElementById('mec-prazo')?.value || null,
        publico,
        publicoObs: document.getElementById('mec-publico-obs')?.value || '',
        visib:      document.getElementById('mec-visib')?.value || 'todos',
        config: {
          obrigatorio: getToggle('cfg-obrigatorio'),
          certificado: getToggle('cfg-certificado'),
          avaliacao:   getToggle('cfg-avaliacao'),
          progresso:   getToggle('cfg-progresso'),
          ocultar:     getToggle('cfg-ocultar'),
          sequencial:  getToggle('cfg-sequencial'),
        },
      };

      Storage.Cursos.atualizar(cursoEditId, dados);

      // Sincroniza materiais
      const antigos = Storage.Materiais.listarPorCurso(cursoEditId);
      const novosIds = new Set(matEdit.filter(m => !m.id?.toString().startsWith('new_')).map(m => m.id));
      antigos.forEach(m => { if (!novosIds.has(m.id)) Storage.Materiais.excluir(m.id); });
      matEdit.filter(m => m.id?.toString().startsWith('new_')).forEach(m => {
        Storage.Materiais.criar({ cursoId:cursoEditId, nome:m.nome, tipo:m.tipo||'doc', tamanho:m.tamanho||'', url:m.url||'#' });
      });

      logAtividade({ tipo:'editou', cursoId:cursoEditId });
      toast('Curso atualizado com sucesso!', 's');
      document.getElementById('modal-edit-curso').classList.remove('open');
      cursoEditId = null;
      refresh();
    },
  };

  function renderReviewEdit() {
    const wrap = document.getElementById('mec-review-body');
    if (!wrap) return;
    const c = Storage.Cursos.obter(cursoEditId);
    if (!c) return;
    const aulas = Storage.Aulas.totalPorCurso(cursoEditId);
    const mods  = Storage.Modulos.listarPorCurso(cursoEditId).length;

    const rv = (label, val) =>
      `<div style="display:flex;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
        <div style="width:150px;flex-shrink:0;color:var(--text3);font-weight:500">${label}</div>
        <div style="flex:1;color:var(--text)">${val}</div>
      </div>`;

    wrap.innerHTML =
      rv('Nome', x(document.getElementById('mec-nome')?.value || c.titulo)) +
      rv('Categoria', x(document.getElementById('mec-categoria')?.value || c.categoria || '—')) +
      rv('Formato', document.getElementById('mec-formato')?.value || c.formato || '—') +
      rv('Carga', (document.getElementById('mec-carga')?.value || c.carga || 0) + 'h') +
      rv('Status', statusBadge(document.getElementById('mec-status')?.value || c.status)) +
      rv('Módulos / Aulas', `${mods} módulos · ${aulas} aulas`) +
      rv('Materiais', matEdit.length + ' arquivo(s)') +
      rv('Validade', document.getElementById('mec-validade')?.value ? new Date(document.getElementById('mec-validade').value).toLocaleDateString('pt-BR') : 'Sem validade');
  }

  /* ── Refresh completo ─────────────────────────────────────── */
  function refresh() {
    renderStats();
    renderTabela();
    renderAtividades();
    popularFiltroCategoria();
    // Sincroniza com o dashboard
    if (typeof Admin !== 'undefined') {
      const el = document.getElementById('ds-cursos');
      if (el) el.textContent = Storage.Cursos.listar().length;
      const ep = document.getElementById('ds-publicados');
      if (ep) ep.textContent = Storage.Cursos.listar().filter(c=>c.status==='publicado').length;
    }
  }

  /* ── Toast (reutiliza o global) ──────────────────────────── */
  function toast(msg, tipo='i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'✅',e:'❌',i:'ℹ️'}[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  return {
    init, refresh,
    renderTabela, renderStats, renderAtividades,
    toggleSel, toggleSelAll,
    publicarLote, arquivarLote, excluirLote,
    publicarCurso, despublicarCurso, arquivarCurso,
    excluirCurso, duplicarCurso, visualizar,
    abrirEdit, _remMatEdit,
    toggleMenu, closeMenus,
    exportar,
  };
})();

</script>

<script>
/* ═══════════ IFT — Inline Filter Toolbar Controller ═══════════ */
var IFT = (() => {
  const CHIP_MAP = {
    '':'', 'publicado':'active-pub', 'rascunho':'active-ras',
    'revisao':'active-rev', 'arquivado':'active-arq', 'expirado':'active-exp',
  };
  function init() {
    const first = document.querySelector('.ift-chip');
    if (first) setStatus(first, '');
  }
  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip').forEach(c => {
      Object.values(CHIP_MAP).forEach(cls => { if (cls) c.classList.remove(cls); });
      c.style.borderColor = ''; c.style.color = '';
    });
    if (value && CHIP_MAP[value]) btn.classList.add(CHIP_MAP[value]);
    else { btn.style.borderColor = 'var(--border2)'; btn.style.color = 'var(--text2)'; }
    const sel = document.getElementById('gc-filtro-status');
    if (sel) sel.value = value;
    if (typeof Cursos !== 'undefined') Cursos.renderTabela();
    updateBadge();
  }
  function reset() {
    ['gc-search','gc-filtro-cat','gc-filtro-fmt','gc-filtro-data','gc-filtro-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const o = document.getElementById('gc-order');
    if (o) o.value = 'recente';
    document.querySelectorAll('.ift-chip').forEach(c => {
      Object.values(CHIP_MAP).forEach(cls => { if (cls) c.classList.remove(cls); });
      c.style.borderColor = ''; c.style.color = '';
    });
    if (typeof Cursos !== 'undefined') Cursos.renderTabela();
    updateBadge();
  }
  function updateBadge() {
    const badge = document.getElementById('ift-badge');
    if (!badge) return;
    let n = 0;
    ['gc-search','gc-filtro-status','gc-filtro-cat','gc-filtro-fmt','gc-filtro-data'].forEach(id => {
      const v = document.getElementById(id)?.value;
      if (v && v.trim()) n++;
    });
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
  }
  return { init, setStatus, reset, updateBadge };
})();
</script>

<script>
/* ════════════════════════════════════════════════════════════════
   Módulo: Turmas
   Integrado com Storage.Turmas, Storage.Cursos, Storage.Alunos,
   Storage.Progresso — sem lógica duplicada
   Funcionalidades: stats, tabela, filtros, modal criar/editar,
   dashboard da turma com progresso individual
════════════════════════════════════════════════════════════════ */

var Turmas = (() => {

  let editId = null;       // ID da turma sendo editada (null = nova)
  let alunosSel = new Set(); // alunos selecionados no modal
  _viewingId = null;       // exposto globalmente para o botão no modal-dash

  /* ── Utils ─────────────────────────────────────────────────── */
  const q   = sel => document.querySelector(sel);
  const x   = s   => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
  const uid = ()  => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const now = ()  => new Date().toISOString();

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
  }

  function getToggleOn(id) {
    const el = document.getElementById(id);
    return el ? el.classList.contains('on') : false;
  }
  function setToggle(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', !!val);
    const span = el.querySelector('span');
    if (span) span.style.left = val ? '21px' : '3px';
    el.style.background = val ? 'var(--blue)' : 'var(--border2)';
  }

  /* ── Status config ─────────────────────────────────────────── */
  const STATUS_CFG = {
    aberta:        { cls:'badge-green',  label:'● Aberta'       },
    em_andamento:  { cls:'badge-blue',   label:'▶ Em andamento' },
    encerrada:     { cls:'badge-gray',   label:'■ Encerrada'    },
    cancelada:     { cls:'badge-red',    label:'✕ Cancelada'    },
  };
  function statusBadge(s) {
    const cfg = STATUS_CFG[s] || { cls:'badge-gray', label: s };
    return `<span class="badge ${cfg.cls}" style="white-space:nowrap">${cfg.label}</span>`;
  }

  /* ── Chips de status da IFT ────────────────────────────────── */
  const CHIP_CLS = {
    '':           '',
    aberta:       'active-pub',
    em_andamento: 'active-rev',
    encerrada:    'active-ras',
    cancelada:    'active-exp',
  };

  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-tmstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
      c.style.borderColor = ''; c.style.color = '';
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = q('#tm-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
  }

  function resetFiltros() {
    ['tm-busca','tm-filtro-curso','tm-filtro-data','tm-filtro-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.ift-chip[data-tmstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
      c.style.borderColor = ''; c.style.color = '';
    });
    renderTabela();
  }

  /* ── Ponto de entrada ──────────────────────────────────────── */
  function init() {
    renderStats();
    renderTabela();
    popularFiltroCurso();
  }

  /* ── Stats cards ────────────────────────────────────────────── */
  function renderStats() {
    const lista = Storage.Turmas.listar();
    const total  = lista.length;
    const abertas = lista.filter(t => t.status === 'aberta').length;
    const andando = lista.filter(t => t.status === 'em_andamento').length;
    const encerr  = lista.filter(t => t.status === 'encerrada').length;

    const card = (label, val, sub, valCls='') => `
      <div class="stat">
        <div class="stat-top">
          <div><div class="stat-lbl">${label}</div><div class="stat-val ${valCls}">${val}</div></div>
          <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    const wrap = document.getElementById('tm-stats');
    if (wrap) wrap.innerHTML =
      card('Total de Turmas',   total,  'cadastradas') +
      card('Abertas',           abertas,'aguardando início','blue') +
      card('Em andamento',      andando,'em progresso','green') +
      card('Encerradas',        encerr, 'concluídas');
  }

  /* ── Popular filtro de cursos ───────────────────────────────── */
  function popularFiltroCurso() {
    const sel = q('#tm-filtro-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar().filter(c => c.status === 'publicado' || Storage.Turmas.porCurso(c.id).length > 0);
    sel.innerHTML = '<option value="">Todos os cursos</option>' +
      cursos.map(c => `<option value="${x(c.id)}">${x(c.titulo)}</option>`).join('');
  }

  /* ── Tabela ─────────────────────────────────────────────────── */
  function renderTabela() {
    const busca   = (q('#tm-busca')?.value || '').toLowerCase().trim();
    const fStatus = q('#tm-filtro-status')?.value || '';
    const fCurso  = q('#tm-filtro-curso')?.value  || '';
    const fData   = q('#tm-filtro-data')?.value   || '';

    let lista = Storage.Turmas.listar();

    if (busca)   lista = lista.filter(t =>
      t.nome?.toLowerCase().includes(busca) ||
      t.responsavel?.toLowerCase().includes(busca));
    if (fStatus) lista = lista.filter(t => t.status === fStatus);
    if (fCurso)  lista = lista.filter(t => t.cursoId === fCurso);
    if (fData)   lista = lista.filter(t => t.dataInicio && t.dataInicio.slice(0,10) >= fData);

    // Ordena: mais recente primeiro
    lista.sort((a, b) => new Date(b.criadoEm||0) - new Date(a.criadoEm||0));

    const tbody  = q('#tm-tbody');
    const empty  = q('#tm-empty');
    const count  = q('#tm-count');

    if (count) count.textContent = `${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(t => {
      const curso  = t.cursoId ? Storage.Cursos.obter(t.cursoId) : null;
      const stats  = Storage.Turmas.stats(t.id);
      const prog   = Storage.Turmas.progresso(t.id);
      const nAlunos = t.alunos?.length || 0;
      const limite  = t.limiteAlunos > 0
        ? `<div style="font-size:10px;color:var(--text4)">${nAlunos}/${t.limiteAlunos}</div>`
        : `<div style="font-size:10px;color:var(--text4)">ilimitado</div>`;

      return `<tr>
        <td>
          <div style="font-weight:600;font-size:13px;color:var(--text)">${x(t.nome)}</div>
          <div style="font-size:11px;color:var(--text4)">${t.descricao ? x(t.descricao).slice(0,50)+'…' : '—'}</div>
        </td>
        <td style="font-size:12px;color:var(--text3)">${curso ? x(curso.titulo) : '<span style="color:var(--text4)">—</span>'}</td>
        <td style="text-align:center">
          <span style="font-size:14px;font-weight:600">${nAlunos}</span>
          ${limite}
        </td>
        <td style="min-width:90px">
          <div class="gc-prog-wrap">
            <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${prog}%"></div></div>
            <span class="gc-prog-lbl">${prog}%</span>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text3)">${x(t.responsavel || '—')}</td>
        <td style="font-size:11px;color:var(--text4)">${fmtDate(t.dataInicio)}</td>
        <td style="font-size:11px;color:var(--text4)">${fmtDate(t.dataFim)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>
          <div class="gc-actions">
            <button class="gc-actions-btn" onclick="Turmas._menu(this)" title="Ações">
              Ações <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="gc-menu">
              <button onclick="Turmas.visualizar('${t.id}');Turmas._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Visualizar
              </button>
              <button onclick="Turmas.abrirEdit('${t.id}');Turmas._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button onclick="Turmas.abrirGerenciarAlunos('${t.id}');Turmas._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Gerenciar alunos
              </button>
              <hr class="sep">
              ${t.status !== 'encerrada' && t.status !== 'cancelada'
                ? `<button onclick="Turmas.encerrar('${t.id}');Turmas._closeMenus()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Encerrar turma
                  </button>`
                : ''}
              <hr class="sep">
              <button class="danger" onclick="Turmas.excluir('${t.id}');Turmas._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                Excluir
              </button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Menu dropdown ──────────────────────────────────────────── */
  function _menu(btn) {
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    _closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', _closeMenus, { once: true }), 10);
    }
  }
  function _closeMenus() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  /* ── Visualizar (dashboard da turma) ───────────────────────── */
  function visualizar(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    Turmas._viewingId = id;

    const curso  = t.cursoId ? Storage.Cursos.obter(t.cursoId) : null;
    const stats  = Storage.Turmas.stats(id);
    const prog   = Storage.Turmas.progresso(id);

    document.getElementById('td-nome').textContent = t.nome;
    document.getElementById('td-curso').textContent = curso ? curso.titulo : '—';
    document.getElementById('td-total').textContent = t.alunos?.length || 0;
    document.getElementById('td-pct').textContent = prog + '%';
    document.getElementById('td-pct-label').textContent = prog + '%';
    document.getElementById('td-concl').textContent = stats.concluidos;
    document.getElementById('td-pend').textContent = stats.pendentes;
    document.getElementById('td-encerramento').textContent = fmtDate(t.dataFim);
    document.getElementById('td-prog-bar').style.width = prog + '%';

    // Lista de participantes
    const wrapper = document.getElementById('td-participantes');
    if (!t.alunos?.length) {
      wrapper.innerHTML = '<div style="color:var(--text4);font-size:13px;padding:12px">Nenhum aluno vinculado</div>';
    } else {
      wrapper.innerHTML = t.alunos.map(alunoId => {
        const al   = Storage.Alunos.obter(alunoId);
        if (!al) return '';
        const pct  = t.cursoId ? Storage.Progresso.pctCurso(alunoId, t.cursoId) : 0;
        const done = t.cursoId ? Storage.Progresso.cursoConcluido(alunoId, t.cursoId) : false;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;border:1px solid var(--border)">
              ${(al.nome?.[0] || '?').toUpperCase()}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;color:var(--text)">${x(al.nome)}</div>
              <div style="font-size:11px;color:var(--text4)">${x(al.email)}</div>
            </div>
            <div style="min-width:100px">
              <div class="gc-prog-wrap">
                <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${pct}%"></div></div>
                <span class="gc-prog-lbl">${pct}%</span>
              </div>
            </div>
            ${done ? `<span class="badge badge-green" style="flex-shrink:0">✓ Concluído</span>` : ''}
          </div>`;
      }).join('');
    }

    document.getElementById('modal-turma-dash').classList.add('open');
  }

  /* ── Abrir modal nova turma ─────────────────────────────────── */
  function abrirModal() {
    editId = null;
    alunosSel.clear();

    document.getElementById('mt-titulo').textContent = 'Nova Turma';
    document.getElementById('mt-sub').textContent = '';

    // Reseta campos
    ['mt-nome','mt-desc','mt-responsavel','mt-inicio','mt-fim'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('mt-limite').value = '0';
    document.getElementById('mt-status').value = 'aberta';
    document.getElementById('mt-cfg-prazo').value = '0';
    setToggle('mt-cfg-auto', true);
    setToggle('mt-cfg-bloquear', true);
    setToggle('mt-cfg-entrada', true);

    // Popula select de cursos
    _popularSelectCursos();
    // Renderiza lista de alunos
    renderListaAlunos();

    // Vai para tab 0
    tabModal(0, document.querySelector('.mc-tab'));
    document.getElementById('modal-turma').classList.add('open');
  }

  /* ── Abrir editar turma ─────────────────────────────────────── */
  function abrirEdit(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    editId = id;
    alunosSel = new Set(t.alunos || []);

    document.getElementById('mt-titulo').textContent = 'Editar Turma';
    document.getElementById('mt-sub').textContent = `Criada em ${fmtDate(t.criadoEm)}`;

    document.getElementById('mt-nome').value       = t.nome || '';
    document.getElementById('mt-desc').value       = t.descricao || '';
    document.getElementById('mt-responsavel').value = t.responsavel || '';
    document.getElementById('mt-limite').value     = t.limiteAlunos || 0;
    document.getElementById('mt-status').value     = t.status || 'aberta';
    document.getElementById('mt-inicio').value     = t.dataInicio ? t.dataInicio.slice(0,10) : '';
    document.getElementById('mt-fim').value        = t.dataFim    ? t.dataFim.slice(0,10)    : '';
    document.getElementById('mt-cfg-prazo').value  = t.config?.prazoConclucaoDias || 0;

    const cfg = t.config || {};
    setToggle('mt-cfg-auto',     cfg.acessoAutomatico !== false);
    setToggle('mt-cfg-bloquear', cfg.bloquearAposEncerramento !== false);
    setToggle('mt-cfg-entrada',  cfg.permitirEntradaAposInicio !== false);

    _popularSelectCursos(t.cursoId);
    renderListaAlunos();
    tabModal(0, document.querySelector('.mc-tab'));
    document.getElementById('modal-turma').classList.add('open');
  }

  /* ── Abrir gerenciar alunos (atalho para aba 1) ─────────────── */
  function abrirGerenciarAlunos(id) {
    abrirEdit(id);
    setTimeout(() => {
      const tabs = document.querySelectorAll('.mc-tab');
      if (tabs[1]) tabModal(1, tabs[1]);
    }, 50);
  }

  /* ── Popula select de cursos no modal ──────────────────────── */
  function _popularSelectCursos(selectedId) {
    const sel = document.getElementById('mt-curso');
    if (!sel) return;
    const lista = Storage.Cursos.listar();
    sel.innerHTML = '<option value="">Selecione um curso...</option>' +
      lista.map(c =>
        `<option value="${x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${x(c.titulo)}</option>`
      ).join('');
  }

  /* ── Tabs do modal ──────────────────────────────────────────── */
  function tabModal(idx, btn) {
    document.querySelectorAll('.mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-turma .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
    if (idx === 1) renderListaAlunos();
  }

  /* ── Lista de alunos no modal ──────────────────────────────── */
  function renderListaAlunos(filtro) {
    const busca = (filtro || q('#mt-aluno-busca')?.value || '').toLowerCase().trim();
    let alunos  = Storage.Alunos.listar().filter(a => a.ativo);
    if (busca) alunos = alunos.filter(a =>
      a.nome?.toLowerCase().includes(busca) ||
      a.email?.toLowerCase().includes(busca)
    );

    const wrap = document.getElementById('mt-alunos-lista');
    if (!wrap) return;

    if (!alunos.length) {
      wrap.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text4);font-size:13px">Nenhum aluno encontrado</div>';
      _atualizarCountAlunos();
      return;
    }

    wrap.innerHTML = alunos.map(al => {
      const sel = alunosSel.has(al.id);
      const setor = al.setorId ? Storage.Setores.obter(al.setorId)?.nome || '' : '';
      const equipe = al.equipeId ? Storage.Equipes.obter(al.equipeId)?.nome || '' : '';
      return `
        <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;transition:background .1s;${sel?'background:var(--blue-light)':''}" 
          onmouseover="this.style.background='var(--blue-light)'" 
          onmouseout="this.style.background='${sel?'var(--blue-light)':''}'"
          onclick="Turmas._toggleAluno('${al.id}',this)">
          <input type="checkbox" ${sel ? 'checked' : ''} style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer" onclick="event.stopPropagation()">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">
            ${(al.nome?.[0]||'?').toUpperCase()}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;color:var(--text)">${x(al.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${x(al.email)}${setor ? ` · ${x(setor)}` : ''}${equipe ? ` · ${x(equipe)}` : ''}</div>
          </div>
        </label>`;
    }).join('');
    _atualizarCountAlunos();
  }

  function filtrarAlunos() {
    renderListaAlunos();
  }

  function _toggleAluno(id, label) {
    const chk = label.querySelector('input[type=checkbox]');
    if (alunosSel.has(id)) {
      alunosSel.delete(id);
      label.style.background = '';
      if (chk) chk.checked = false;
    } else {
      alunosSel.add(id);
      label.style.background = 'var(--blue-light)';
      if (chk) chk.checked = true;
    }
    _atualizarCountAlunos();
  }

  function _atualizarCountAlunos() {
    const el = document.getElementById('mt-alunos-count');
    if (el) el.textContent = alunosSel.size;
  }

  /* ── Seleções rápidas ───────────────────────────────────────── */
  function selecionarPorSetor() {
    const setores = Storage.Setores.listar();
    if (!setores.length) { _toast('Nenhum setor cadastrado.', 'i'); return; }
    const nomes = setores.map((s,i) => `${i+1}. ${s.nome}`).join('\n');
    const resp  = prompt(`Selecione o setor (número):\n${nomes}`);
    const idx   = parseInt(resp) - 1;
    if (isNaN(idx) || idx < 0 || idx >= setores.length) return;
    const ids = Storage.Alunos.porSetor(setores[idx].id).map(a => a.id);
    ids.forEach(id => alunosSel.add(id));
    renderListaAlunos();
    _toast(`${ids.length} aluno(s) do setor "${setores[idx].nome}" adicionados.`, 's');
  }

  function selecionarPorEquipe() {
    const equipes = Storage.Equipes.listar();
    if (!equipes.length) { _toast('Nenhuma equipe cadastrada.', 'i'); return; }
    const nomes = equipes.map((e,i) => `${i+1}. ${e.nome}`).join('\n');
    const resp  = prompt(`Selecione a equipe (número):\n${nomes}`);
    const idx   = parseInt(resp) - 1;
    if (isNaN(idx) || idx < 0 || idx >= equipes.length) return;
    const ids = Storage.Alunos.porEquipe(equipes[idx].id).map(a => a.id);
    ids.forEach(id => alunosSel.add(id));
    renderListaAlunos();
    _toast(`${ids.length} aluno(s) da equipe "${equipes[idx].nome}" adicionados.`, 's');
  }

  function selecionarTodos() {
    Storage.Alunos.listar().filter(a => a.ativo).forEach(a => alunosSel.add(a.id));
    renderListaAlunos();
  }

  function limparAlunos() {
    alunosSel.clear();
    renderListaAlunos();
  }

  /* ── Salvar turma ───────────────────────────────────────────── */
  function salvar() {
    const nome    = document.getElementById('mt-nome')?.value.trim();
    const cursoId = document.getElementById('mt-curso')?.value;

    if (!nome)    { alert('Informe o nome da turma.'); return; }
    if (!cursoId) { alert('Selecione um curso.'); return; }

    const dados = {
      nome,
      cursoId,
      descricao:   document.getElementById('mt-desc')?.value.trim() || '',
      responsavel: document.getElementById('mt-responsavel')?.value.trim() || '',
      limiteAlunos:parseInt(document.getElementById('mt-limite')?.value) || 0,
      status:      document.getElementById('mt-status')?.value || 'aberta',
      dataInicio:  document.getElementById('mt-inicio')?.value ? new Date(document.getElementById('mt-inicio').value).toISOString() : '',
      dataFim:     document.getElementById('mt-fim')?.value    ? new Date(document.getElementById('mt-fim').value).toISOString()    : '',
      alunos:      [...alunosSel],
      config: {
        acessoAutomatico:          getToggleOn('mt-cfg-auto'),
        bloquearAposEncerramento:  getToggleOn('mt-cfg-bloquear'),
        permitirEntradaAposInicio: getToggleOn('mt-cfg-entrada'),
        prazoConclucaoDias:        parseInt(document.getElementById('mt-cfg-prazo')?.value) || 0,
      },
    };

    if (editId) {
      Storage.Turmas.atualizar(editId, dados);
      _toast('Turma atualizada!', 's');
    } else {
      Storage.Turmas.criar(dados);
      _toast('Turma criada com sucesso!', 's');
    }

    document.getElementById('modal-turma').classList.remove('open');
    editId = null;
    alunosSel.clear();
    refresh();
  }

  /* ── Ações ──────────────────────────────────────────────────── */
  function encerrar(id) {
    const t = Storage.Turmas.obter(id);
    if (!t || !confirm(`Encerrar a turma "${t.nome}"?`)) return;
    Storage.Turmas.encerrar(id);
    _toast('Turma encerrada.', 'i');
    refresh();
  }

  function excluir(id) {
    const t = Storage.Turmas.obter(id);
    if (!t || !confirm(`Excluir permanentemente "${t.nome}"?`)) return;
    Storage.Turmas.excluir(id);
    _toast('Turma excluída.', 'i');
    refresh();
  }

  /* ── Refresh ────────────────────────────────────────────────── */
  function refresh() {
    renderStats();
    renderTabela();
    popularFiltroCurso();
  }

  /* ── Toast ──────────────────────────────────────────────────── */
  function _toast(msg, tipo='i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'✅',e:'❌',i:'ℹ️'}[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  return {
    init, refresh, renderTabela,
    setStatus, resetFiltros, filtrarAlunos,
    abrirModal, abrirEdit, abrirGerenciarAlunos,
    visualizar, encerrar, excluir, salvar,
    tabModal, renderListaAlunos,
    selecionarPorSetor, selecionarPorEquipe, selecionarTodos, limparAlunos,
    _menu, _closeMenus, _toggleAluno, _viewingId,
  };
})();

</script>

<script>
/* ════════════════════════════════════════════════════════════════
   Módulo: MatMod — Central de Materiais de Apoio
   Integrado com Storage.Materiais, Storage.Cursos, Storage.Modulos
   Funcionalidades: stats, tabela, IFT, modal criar/editar,
   viewer inline, vinculação entre cursos, ações em lote
════════════════════════════════════════════════════════════════ */

var MatMod = (() => {

  let editId     = null;
  let uploadMode = 'file';
  let fileAtual  = null;   // { nome, tamanho, tipo, url }
  let selecionados = new Set();
  let vincularId = null;

  /* ── Utils ─────────────────────────────────────────────────── */
  const q   = s => document.querySelector(s);
  const x   = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
  const now = ()  => new Date().toISOString();

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR',{ day:'2-digit', month:'2-digit', year:'2-digit' });
  }
  function fmtBytes(b) {
    if (!b || isNaN(+b)) return '—';
    const n = +b;
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
    return (n/1048576).toFixed(1) + ' MB';
  }

  /* ── Tipo config ─────────────────────────────────────────────── */
  const TIPO_CFG = {
    pdf:    { label:'PDF',          cor:'#fee2e2', txt:'#b91c1c', bg:'#fee2e2' },
    video:  { label:'Vídeo',        cor:'#fef3c7', txt:'#b45309', bg:'#fef3c7' },
    xlsx:   { label:'Planilha',     cor:'#d1fae5', txt:'#065f46', bg:'#d1fae5' },
    doc:    { label:'Documento',    cor:'#dbeafe', txt:'#1e40af', bg:'#dbeafe' },
    imagem: { label:'Imagem',       cor:'#ede9fe', txt:'#5b21b6', bg:'#ede9fe' },
    link:   { label:'Link',         cor:'#ede9fe', txt:'#7c3aed', bg:'#ede9fe' },
    zip:    { label:'ZIP',          cor:'#fef3c7', txt:'#92400e', bg:'#fef3c7' },
    pptx:   { label:'Apresentação', cor:'#fee2e2', txt:'#991b1b', bg:'#fee2e2' },
    quiz:   { label:'Avaliação',    cor:'#fef9c3', txt:'#713f12', bg:'#fef9c3' },
    outro:  { label:'Outro',        cor:'#f0f0f8', txt:'#5252a0', bg:'#f0f0f8' },
  };

  function tipoBadge(tipo) {
    const c = TIPO_CFG[tipo] || TIPO_CFG.outro;
    return `<span style="display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;background:${c.bg};color:${c.txt}">${c.label}</span>`;
  }

  const STATUS_CFG = {
    ativo:     { cls:'badge-green', label:'● Ativo'     },
    oculto:    { cls:'badge-amber', label:'◉ Oculto'    },
    arquivado: { cls:'badge-gray',  label:'▣ Arquivado' },
  };
  function statusBadge(s) {
    const c = STATUS_CFG[s] || STATUS_CFG.ativo;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  /* ── Chips de status ────────────────────────────────────────── */
  const CHIP_CLS = { '':'', ativo:'active-pub', oculto:'active-arq', arquivado:'active-ras' };

  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-mstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('mat-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _updateBadge();
  }

  function resetFiltros() {
    ['mat-busca','mat-filtro-tipo','mat-filtro-curso','mat-filtro-status','mat-filtro-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const ord = document.getElementById('mat-order');
    if (ord) ord.value = 'recente';
    document.querySelectorAll('.ift-chip[data-mstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela(); _updateBadge();
  }

  function _updateBadge() {
    const badge = document.getElementById('mat-badge');
    if (!badge) return;
    let n = 0;
    ['mat-busca','mat-filtro-tipo','mat-filtro-curso','mat-filtro-status','mat-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
  }

  /* ── Ponto de entrada ────────────────────────────────────────── */
  function init() {
    renderStats();
    renderTabela();
    popularFiltroCurso();
    selecionados.clear();
    _atualizarLote();
  }

  /* ── Stats ───────────────────────────────────────────────────── */
  function renderStats() {
    const st = Storage.Materiais.stats();
    const card = (label, val, sub, cls='') => `
      <div class="stat">
        <div class="stat-top">
          <div><div class="stat-lbl">${label}</div><div class="stat-val ${cls}">${val}</div></div>
          <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    const wrap = document.getElementById('mat-stats');
    if (wrap) wrap.innerHTML =
      card('Total',       st.total,      'na biblioteca') +
      card('PDFs',        st.pdf,        'documentos',     '') +
      card('Vídeos',      st.video,      'gravações',      '') +
      card('Ativos',      st.ativos,     'disponíveis',    'blue') +
      card('Arquivados',  st.arquivados, 'desativados',    '');
  }

  /* ── Popular filtro curso ────────────────────────────────────── */
  function popularFiltroCurso() {
    ['mat-filtro-curso'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cursos = Storage.Cursos.listar();
      sel.innerHTML = '<option value="">Curso</option>' +
        cursos.map(c => `<option value="${x(c.id)}">${x(c.titulo)}</option>`).join('');
    });
  }

  /* ── Tabela ──────────────────────────────────────────────────── */
  function renderTabela() {
    const busca   = (q('#mat-busca')?.value || '').toLowerCase().trim();
    const fTipo   = q('#mat-filtro-tipo')?.value   || '';
    const fCurso  = q('#mat-filtro-curso')?.value  || '';
    const fStatus = q('#mat-filtro-status')?.value || '';
    const fData   = q('#mat-filtro-data')?.value   || '';
    const ordem   = q('#mat-order')?.value         || 'recente';

    let lista = Storage.Materiais.listar();

    if (busca)   lista = lista.filter(m =>
      m.nome?.toLowerCase().includes(busca) ||
      m.tags?.toLowerCase().includes(busca) ||
      m.responsavel?.toLowerCase().includes(busca) ||
      m.categoria?.toLowerCase().includes(busca));
    if (fTipo)   lista = lista.filter(m => m.tipo === fTipo);
    if (fCurso)  lista = lista.filter(m => m.cursoId === fCurso || (m.cursosVinc||[]).includes(fCurso));
    if (fStatus) lista = lista.filter(m => (m.status||'ativo') === fStatus);
    if (fData)   lista = lista.filter(m => m.criadoEm && m.criadoEm.slice(0,10) >= fData);

    lista.sort((a, b) => {
      if (ordem === 'az')    return (a.nome||'').localeCompare(b.nome||'');
      if (ordem === 'za')    return (b.nome||'').localeCompare(a.nome||'');
      if (ordem === 'antigo')return new Date(a.criadoEm) - new Date(b.criadoEm);
      return new Date(b.criadoEm||0) - new Date(a.criadoEm||0);
    });

    const tbody  = q('#mat-tbody');
    const empty  = q('#mat-empty');
    const count  = q('#mat-count');

    if (count) count.textContent = `${lista.length} ${lista.length === 1 ? 'material' : 'materiais'}`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(m => {
      const curso  = m.cursoId ? Storage.Cursos.obter(m.cursoId) : null;
      const status = m.status || 'ativo';
      const vinc   = (m.cursosVinc||[]).length;
      const sel    = selecionados.has(m.id);

      return `<tr class="${sel ? 'selected' : ''}" id="mrow-${m.id}">
        <td style="padding:8px 10px">
          <input type="checkbox" class="row-check" ${sel ? 'checked' : ''}
            onchange="MatMod.toggleSel('${m.id}',this.checked)"
            style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer">
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${(TIPO_CFG[m.tipo]||TIPO_CFG.outro).bg};color:${(TIPO_CFG[m.tipo]||TIPO_CFG.outro).txt};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0">${(TIPO_CFG[m.tipo]||TIPO_CFG.outro).label.slice(0,3).toUpperCase()}</div>
            <div style="min-width:0">
              <div style="font-weight:600;font-size:13px;color:var(--text)">${x(m.nome)}</div>
              <div style="font-size:11px;color:var(--text4)">${m.descricao ? x(m.descricao).slice(0,55) : (m.tags ? '🏷 '+x(m.tags) : '—')}</div>
            </div>
          </div>
        </td>
        <td>${tipoBadge(m.tipo)}</td>
        <td style="font-size:12px">
          ${curso ? `<span style="color:var(--text2)">${x(curso.titulo)}</span>` : '<span style="color:var(--text4)">—</span>'}
          ${vinc > 0 ? `<div style="font-size:10px;color:var(--blue);margin-top:2px">+${vinc} curso${vinc>1?'s':''} vinculado${vinc>1?'s':''}</div>` : ''}
        </td>
        <td style="font-size:12px;color:var(--text3)">${x(m.categoria || '—')}</td>
        <td style="font-size:12px;color:var(--text4)">${m.tamanho || '—'}</td>
        <td>${statusBadge(status)}</td>
        <td style="font-size:11px;color:var(--text4)">${fmtDate(m.criadoEm)}</td>
        <td>
          <div class="gc-actions">
            <button class="gc-actions-btn" onclick="MatMod._menu(this)">
              Ações <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="gc-menu">
              <button onclick="MatMod.visualizar('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Visualizar
              </button>
              <button onclick="MatMod.abrirEdit('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button onclick="MatMod.abrirVincular('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Vincular a curso
              </button>
              <button onclick="MatMod.duplicar('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Duplicar
              </button>
              ${m.url && m.url !== '#simulado' ? `
              <button onclick="MatMod.baixar('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar
              </button>` : ''}
              <hr class="sep">
              <button onclick="MatMod.arquivar('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/></svg>
                Arquivar
              </button>
              <hr class="sep">
              <button class="danger" onclick="MatMod.excluir('${m.id}');MatMod._closeMenus()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                Excluir
              </button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Menu ──────────────────────────────────────────────────── */
  function _menu(btn) {
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    _closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', _closeMenus, { once: true }), 10);
    }
  }
  function _closeMenus() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  /* ── Seleção em lote ─────────────────────────────────────── */
  function toggleSel(id, checked) {
    checked ? selecionados.add(id) : selecionados.delete(id);
    const row = document.getElementById('mrow-' + id);
    if (row) row.classList.toggle('selected', checked);
    _atualizarLote();
  }

  function toggleSelAll(checkbox) {
    Storage.Materiais.listar().forEach(m => {
      checked => checkbox.checked ? selecionados.add(m.id) : selecionados.delete(m.id);
      checkbox.checked ? selecionados.add(m.id) : selecionados.delete(m.id);
    });
    document.querySelectorAll('.row-check').forEach(ch => ch.checked = checkbox.checked);
    document.querySelectorAll('#mat-tbody tr').forEach(r =>
      r.classList.toggle('selected', checkbox.checked)
    );
    _atualizarLote();
  }

  function _atualizarLote() {
    const n = selecionados.size;
    const count = document.getElementById('mat-sel-count');
    if (count) count.textContent = `${n} material(is) selecionado(s)`;
    const row = document.getElementById('mat-lote-row');
    if (row) row.classList.toggle('show', n > 0);
  }

  function ativarLote() {
    if (!selecionados.size) return;
    selecionados.forEach(id => Storage.Materiais.atualizar(id, { status:'ativo' }));
    _toast(`${selecionados.size} material(is) ativado(s).`, 's');
    selecionados.clear(); refresh();
  }

  function arquivarLote() {
    if (!selecionados.size || !confirm(`Arquivar ${selecionados.size} material(is)?`)) return;
    selecionados.forEach(id => Storage.Materiais.arquivar(id));
    _toast(`${selecionados.size} material(is) arquivado(s).`, 'i');
    selecionados.clear(); refresh();
  }

  function excluirLote() {
    if (!selecionados.size || !confirm(`Excluir permanentemente ${selecionados.size} material(is)?`)) return;
    selecionados.forEach(id => Storage.Materiais.excluir(id));
    _toast(`${selecionados.size} material(is) excluído(s).`, 'i');
    selecionados.clear(); refresh();
  }

  /* ── Ações individuais ───────────────────────────────────── */
  function arquivar(id) {
    Storage.Materiais.arquivar(id);
    _toast('Material arquivado.', 'i'); refresh();
  }
  function excluir(id) {
    if (!confirm('Excluir permanentemente?')) return;
    Storage.Materiais.excluir(id);
    _toast('Material excluído.', 'i'); refresh();
  }
  function duplicar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;
    Storage.Materiais.criar({ ...m, id:undefined, nome:'[Cópia] '+m.nome, criadoEm:undefined });
    _toast('Material duplicado!', 's'); refresh();
  }
  function baixar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m || !m.url || m.url === '#simulado') { _toast('URL não disponível.','e'); return; }
    const a = document.createElement('a');
    a.href = m.url; a.download = m.nome || 'material';
    a.target = '_blank'; a.click();
  }

  /* ── Visualizador ────────────────────────────────────────── */
  function visualizar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;
    document.getElementById('viewer-nome').textContent = m.nome || '—';
    document.getElementById('viewer-meta').textContent = [
      TIPO_CFG[m.tipo]?.label, m.tamanho, fmtDate(m.criadoEm)
    ].filter(Boolean).join(' · ');

    const dlBtn = document.getElementById('viewer-dl-btn');
    if (dlBtn) dlBtn.style.display = m.config?.permitirDownload !== false ? '' : 'none';

    const body = document.getElementById('viewer-body');
    body.innerHTML = '';

    if (m.tipo === 'video' && m.url && m.url !== '#simulado') {
      body.innerHTML = `<video controls style="max-width:100%;max-height:60vh;border-radius:var(--radius-sm)"><source src="${x(m.url)}">Seu navegador não suporta vídeo.</video>`;
    } else if (m.tipo === 'link' && m.url) {
      body.innerHTML = `
        <div style="text-align:center">
          <div style="font-size:36px;margin-bottom:16px">🔗</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px">${x(m.nome)}</div>
          <div style="font-size:12px;color:var(--text4);margin-bottom:20px">${x(m.url)}</div>
          <a href="${x(m.url)}" target="_blank" class="btn btn-primary">Abrir link externo</a>
        </div>`;
    } else if (m.tipo === 'pdf' && m.url && m.url !== '#simulado') {
      body.innerHTML = `<iframe src="${x(m.url)}" style="width:100%;height:500px;border:none;border-radius:var(--radius-sm)"></iframe>`;
    } else if (m.tipo === 'imagem' && m.url && m.url.startsWith('data:')) {
      body.innerHTML = `<img src="${x(m.url)}" style="max-width:100%;max-height:500px;border-radius:var(--radius-sm);object-fit:contain">`;
    } else {
      const tipo = TIPO_CFG[m.tipo] || TIPO_CFG.outro;
      body.innerHTML = `
        <div style="text-align:center;padding:24px">
          <div style="width:64px;height:64px;border-radius:12px;background:${tipo.bg};color:${tipo.txt};font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">${tipo.label.slice(0,3).toUpperCase()}</div>
          <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">${x(m.nome)}</div>
          <div style="font-size:12px;color:var(--text4);margin-bottom:20px">${x(m.descricao||'Sem descrição')}</div>
          ${m.url && m.url !== '#simulado' ? `<a href="${x(m.url)}" download="${x(m.nome)}" class="btn btn-primary">Baixar arquivo</a>` : '<span style="font-size:12px;color:var(--text4)">Arquivo simulado — sem URL real</span>'}
        </div>`;
    }

    document.getElementById('modal-viewer').classList.add('open');
  }

  /* ── Vincular a outro curso ──────────────────────────────── */
  function abrirVincular(id) {
    vincularId = id;
    const m = Storage.Materiais.obter(id);
    document.getElementById('mv-nome').textContent = m ? `Material: ${m.nome}` : '';
    const sel = document.getElementById('mv-curso-sel');
    const cursos = Storage.Cursos.listar().filter(c => c.id !== m?.cursoId);
    sel.innerHTML = '<option value="">Selecione um curso...</option>' +
      cursos.map(c => `<option value="${x(c.id)}">${x(c.titulo)}</option>`).join('');
    document.getElementById('modal-vincular').classList.add('open');
  }

  function confirmarVinculo() {
    const cursoId = document.getElementById('mv-curso-sel')?.value;
    if (!cursoId || !vincularId) { alert('Selecione um curso.'); return; }
    Storage.Materiais.vincular(vincularId, cursoId);
    const c = Storage.Cursos.obter(cursoId);
    _toast(`Material vinculado a "${c?.titulo||'curso'}"!`, 's');
    document.getElementById('modal-vincular').classList.remove('open');
    vincularId = null;
    refresh();
  }

  /* ── Modal criar/editar ──────────────────────────────────── */
  function abrirModal() {
    editId = null; fileAtual = null;
    uploadMode = 'file';

    document.getElementById('mm-titulo').textContent = 'Novo Material';
    document.getElementById('mm-sub').textContent = '';
    ['mm-nome','mm-desc','mm-tags','mm-responsavel','mm-url','mm-url-texto'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('mm-tipo').value = '';
    document.getElementById('mm-categoria').value = '';
    document.getElementById('mm-status').value = 'ativo';
    document.getElementById('mm-dropzone-text').textContent = 'Arraste o arquivo ou clique para selecionar';
    document.getElementById('mm-dropzone-sub').textContent = 'PDF · MP4 · XLSX · DOC · PPTX · IMG · ZIP — máx. 100MB';
    const prev = document.getElementById('mm-file-preview');
    if (prev) prev.style.display = 'none';

    _popularSelectCursoModal();
    _renderConfigModal({});
    setUploadMode('file');
    tabModal(0, document.querySelector('#modal-material .mc-tab'));
    document.getElementById('modal-material').classList.add('open');
  }

  function abrirEdit(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;
    editId = id; fileAtual = null;

    document.getElementById('mm-titulo').textContent = 'Editar Material';
    document.getElementById('mm-sub').textContent = `Criado em ${fmtDate(m.criadoEm)}`;

    const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
    sv('mm-nome', m.nome); sv('mm-desc', m.descricao); sv('mm-tags', m.tags);
    sv('mm-responsavel', m.responsavel); sv('mm-tipo', m.tipo);
    sv('mm-categoria', m.categoria); sv('mm-status', m.status||'ativo');
    sv('mm-url', m.url !== '#simulado' ? m.url : '');

    _popularSelectCursoModal(m.cursoId);
    _carregarModulos(m.cursoId, m.moduloId);
    _renderConfigModal(m.config || {});

    if (m.tipo === 'link') { setUploadMode('link'); }
    else {
      setUploadMode('file');
      if (m.nome) {
        document.getElementById('mm-dropzone-text').textContent = m.nome;
        document.getElementById('mm-dropzone-sub').textContent = m.tamanho || '';
      }
    }

    tabModal(0, document.querySelector('#modal-material .mc-tab'));
    document.getElementById('modal-material').classList.add('open');
  }

  function _popularSelectCursoModal(selectedId) {
    const sel = document.getElementById('mm-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar();
    sel.innerHTML = '<option value="">Sem curso vinculado</option>' +
      cursos.map(c => `<option value="${x(c.id)}" ${c.id === selectedId?'selected':''}>${x(c.titulo)}</option>`).join('');
    sel.onchange = () => _carregarModulos(sel.value);
    if (selectedId) _carregarModulos(selectedId);
  }

  function _carregarModulos(cursoId, selectedId) {
    const sel = document.getElementById('mm-modulo');
    if (!sel) return;
    const mods = cursoId ? Storage.Modulos.listarPorCurso(cursoId) : [];
    sel.innerHTML = '<option value="">Selecione um módulo...</option>' +
      mods.map(m => `<option value="${x(m.id)}" ${m.id === selectedId?'selected':''}>${x(m.titulo)}</option>`).join('');
  }

  function _renderConfigModal(cfg) {
    const wrap = document.getElementById('mm-config-body');
    if (!wrap) return;

    const togRow = (id, label, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${label}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val?'on':''}" onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val?'var(--blue)':'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val?21:3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      togRow('mmcfg-obrig',    'Material obrigatório',             'O aluno deve acessar para progredir',           cfg.obrigatorio) +
      togRow('mmcfg-dl',       'Permitir download',                'O aluno pode baixar o arquivo',                 cfg.permitirDownload !== false) +
      togRow('mmcfg-ocultar',  'Ocultar após conclusão',           'Desaparece para quem concluiu o curso',         cfg.ocultarAposConclusao) +
      togRow('mmcfg-turma',    'Exibir apenas para turma',         'Visível somente para turmas específicas',        cfg.apenasParaTurma) +
      togRow('mmcfg-compl',    'Material complementar',            'Indicado como recurso extra, não obrigatório',   cfg.complementar) +
      togRow('mmcfg-antes',    'Necessário antes da próxima aula', 'Bloqueia avanço até o aluno visualizar',        cfg.necessarioAntesDaProxima);
  }

  /* ── Upload ──────────────────────────────────────────────── */
  function setUploadMode(mode) {
    uploadMode = mode;
    const mFile = document.getElementById('mm-mode-file');
    const mLink = document.getElementById('mm-mode-link');
    const sFile = document.getElementById('mm-upload-section');
    const sLink = document.getElementById('mm-link-section');

    mFile.style.background = mode === 'file' ? 'var(--blue)' : 'var(--surface)';
    mFile.style.color      = mode === 'file' ? '#fff' : 'var(--text3)';
    mLink.style.background = mode === 'link' ? 'var(--blue)' : 'var(--surface)';
    mLink.style.color      = mode === 'link' ? '#fff' : 'var(--text3)';

    if (sFile) sFile.style.display = mode === 'file' ? 'block' : 'none';
    if (sLink) sLink.style.display = mode === 'link' ? 'block' : 'none';
  }

  function handleFile(input) {
    const file = input.files[0];
    if (!file) return;

    // Detecta tipo
    const ext = file.name.split('.').pop().toLowerCase();
    const tipoMap = {
      pdf:'pdf', mp4:'video', webm:'video', avi:'video',
      xlsx:'xlsx', xls:'xlsx', doc:'doc', docx:'doc',
      png:'imagem', jpg:'imagem', jpeg:'imagem', webp:'imagem',
      zip:'zip', rar:'zip', pptx:'pptx', ppt:'pptx', quiz:'quiz',
    };
    const tipo = tipoMap[ext] || 'outro';
    fileAtual = { nome: file.name, tamanho: fmtBytes(file.size), tipo, url: null };

    // Preenche campos automaticamente
    const nomeEl = document.getElementById('mm-nome');
    if (nomeEl && !nomeEl.value) nomeEl.value = file.name.replace(/\.[^.]+$/, '');
    const tipoEl = document.getElementById('mm-tipo');
    if (tipoEl && !tipoEl.value) tipoEl.value = tipo;

    // Preview da dropzone
    const dz = document.getElementById('mm-dropzone');
    const dt = document.getElementById('mm-dropzone-text');
    const ds = document.getElementById('mm-dropzone-sub');
    if (dt) dt.textContent = file.name;
    if (ds) ds.textContent = fmtBytes(file.size);
    if (dz) { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-light)'; }

    // Para imagens, carrega base64
    if (tipo === 'imagem') {
      const reader = new FileReader();
      reader.onload = e => { fileAtual.url = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      // Simula URL para demonstração
      fileAtual.url = URL.createObjectURL(file);
    }

    // Preview visual
    const prev = document.getElementById('mm-file-preview');
    if (prev) {
      const tipoCfg = TIPO_CFG[tipo] || TIPO_CFG.outro;
      prev.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm)">
          <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${tipoCfg.bg};color:${tipoCfg.txt};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800">${tipoCfg.label.slice(0,3).toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${x(file.name)}</div>
            <div style="font-size:11px;color:var(--text4)">${fmtBytes(file.size)}</div>
          </div>
        </div>`;
      prev.style.display = 'block';
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById('mm-dropzone');
    if (dz) { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-light)'; }
  }
  function onDragLeave(e) {
    const dz = document.getElementById('mm-dropzone');
    if (dz) { dz.style.borderColor = ''; dz.style.background = 'var(--bg)'; }
  }
  function onDrop(e) {
    e.preventDefault();
    onDragLeave(e);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = document.getElementById('mm-file-input');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    handleFile(input);
  }

  /* ── Salvar ──────────────────────────────────────────────── */
  function salvar() {
    const nome = document.getElementById('mm-nome')?.value.trim();
    const tipo = document.getElementById('mm-tipo')?.value;
    if (!nome) { alert('Informe o nome do material.'); return; }
    if (!tipo) { alert('Selecione o tipo do material.'); return; }

    const getTogOn = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      nome,
      descricao:    document.getElementById('mm-desc')?.value.trim() || '',
      tipo,
      categoria:    document.getElementById('mm-categoria')?.value || '',
      tags:         document.getElementById('mm-tags')?.value.trim() || '',
      cursoId:      document.getElementById('mm-curso')?.value || '',
      moduloId:     document.getElementById('mm-modulo')?.value || '',
      responsavel:  document.getElementById('mm-responsavel')?.value.trim() || '',
      status:       document.getElementById('mm-status')?.value || 'ativo',
      url:          uploadMode === 'link'
                      ? (document.getElementById('mm-url')?.value.trim() || '#')
                      : (fileAtual?.url || '#simulado'),
      tamanho:      uploadMode === 'file' && fileAtual ? fileAtual.tamanho : '',
      config: {
        obrigatorio:              getTogOn('mmcfg-obrig'),
        permitirDownload:         getTogOn('mmcfg-dl'),
        ocultarAposConclusao:     getTogOn('mmcfg-ocultar'),
        apenasParaTurma:          getTogOn('mmcfg-turma'),
        complementar:             getTogOn('mmcfg-compl'),
        necessarioAntesDaProxima: getTogOn('mmcfg-antes'),
      },
    };

    if (editId) {
      Storage.Materiais.atualizar(editId, dados);
      _toast('Material atualizado!', 's');
    } else {
      Storage.Materiais.criar(dados);
      _toast('Material cadastrado!', 's');
    }

    document.getElementById('modal-material').classList.remove('open');
    editId = null; fileAtual = null;
    refresh();
  }

  /* ── Tabs modal ──────────────────────────────────────────── */
  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-material .mc-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-material .mc-pane').forEach((p,i) => p.classList.toggle('active', i === idx));
  }

  /* ── Refresh ─────────────────────────────────────────────── */
  function refresh() {
    renderStats();
    renderTabela();
    popularFiltroCurso();
  }

  /* ── Toast ───────────────────────────────────────────────── */
  function _toast(msg, tipo='i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'✅',e:'❌',i:'ℹ️'}[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    s.appendChild(el); setTimeout(() => el.remove(), 3500);
  }

  return {
    init, refresh, renderTabela,
    setStatus, resetFiltros,
    abrirModal, abrirEdit,
    visualizar, arquivar, excluir, duplicar, baixar,
    abrirVincular, confirmarVinculo,
    toggleSel, toggleSelAll,
    ativarLote, arquivarLote, excluirLote,
    tabModal, setUploadMode,
    handleFile, onDragOver, onDragLeave, onDrop,
    salvar, _menu, _closeMenus,
  };
})();

</script>
<script src="src/js/storage.js"></script>
<script src="src/js/admin.js"></script>
</body>
</html>
