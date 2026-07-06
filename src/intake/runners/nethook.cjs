// Samil KSSB Precheck - no-egress hook (Cycle 2N-2, source-only).
//
// Gate A / Gate D evidence에서 검증된 방식의 재작성판(AVR-04 사양):
//  - dns.lookup/resolve*, net.Socket.connect(+connect_ex 계열), tls.connect,
//    http(s).request/get 을 인터셉트한다.
//  - block 모드(기본): 비-loopback 시도를 "기록 후 throw" — 패킷이 나가기 전에 차단된다.
//    (따라서 차단 테스트는 실제 외부 네트워크 접속을 발생시키지 않는다.)
//  - monitor 모드: 기록만 한다(차단 제어검증용).
//  - worker_threads.Worker 를 패치해 워커 스레드에도 훅이 preload 되도록 전파한다.
//  - 종료 시 [NETHOOK-SUMMARY] 한 줄을 출력한다. runner는 이 요약의 존재와
//    egressAttempts=0 을 관측한 실행에만 no_egress_verified=true 를 기록한다.
//
// 사용: node --require <this file> <script...>   (env NETHOOK_MODE=block|monitor)
'use strict';
const dns = require('dns');
const net = require('net');
const tls = require('tls');
const http = require('http');
const https = require('https');

const MODE = process.env.NETHOOK_MODE || 'block';
let observedTotal = 0;
let egressAttempts = 0;
const egressLog = [];

function isLoopback(host) {
  if (host === undefined || host === null || host === '') return true;
  const h = String(host).toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' ||
         h === '0.0.0.0' || h.startsWith('127.');
}

function note(host, port, kind) {
  observedTotal++;
  const lb = isLoopback(host);
  if (!lb) { egressAttempts++; egressLog.push(kind + ' ' + host + ':' + port); }
  return lb;
}

function maybeBlock(host, port, kind) {
  const lb = note(host, port, kind);
  if (!lb && MODE === 'block') {
    throw new Error('NETHOOK_BLOCKED ' + kind + ' ' + host + ':' + port);
  }
}

// ---- DNS (C2N3-MAJ-01: callback + promises + Resolver 전 resolve-family) -------
// coverage claim과 patch 범위를 일치시킨다: 아래 목록이 차단 대상의 전부이며,
// dgram(UDP 직접 사용)·child_process·native addon의 raw syscall은 이 훅의 범위 밖(한계 — README).
const DNS_RESOLVE_FAMILY = [
  'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCname', 'resolveCaa',
  'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa',
  'resolveSrv', 'resolveTxt', 'reverse',
];

function patchDnsFunctions(target, label) {
  if (!target) return;
  if (typeof target.lookup === 'function') {
    const _lookup = target.lookup;
    target.lookup = function (hostname) {
      maybeBlock(hostname, 0, label + '.lookup');
      return _lookup.apply(this, arguments);
    };
  }
  for (const m of DNS_RESOLVE_FAMILY) {
    if (typeof target[m] === 'function') {
      const orig = target[m];
      target[m] = function (h) { maybeBlock(h, 0, label + '.' + m); return orig.apply(this, arguments); };
    }
  }
}

patchDnsFunctions(dns, 'dns');                       // callback API
patchDnsFunctions(dns.promises, 'dns.promises');     // promises API
if (dns.Resolver && dns.Resolver.prototype) {
  patchDnsFunctions(dns.Resolver.prototype, 'dns.Resolver');
}
if (dns.promises && dns.promises.Resolver && dns.promises.Resolver.prototype) {
  patchDnsFunctions(dns.promises.Resolver.prototype, 'dns.promises.Resolver');
}

// ---- host/port 추출(C2N3-MAJ-01: host/hostname/servername/URL/path-IPC 일관 처리) ----
// 반환: [host, port]. 로컬 IPC(path/pipe)는 host='localhost'로 정규화해 허용한다
// (원격 호스트명에는 경로 구분자가 올 수 없으므로 안전 — 판단 불가 형태는 그대로 두어 차단(fail-closed)).
function looksLikeIpcPath(s) {
  return typeof s === 'string' && (s.indexOf('/') !== -1 || s.indexOf('\\') !== -1);
}

function extractHostPort(args) {
  let a0 = args[0];
  if (Array.isArray(a0)) a0 = a0[0];
  if (a0 && typeof a0 === 'object') {
    const host = a0.hostname || a0.host || a0.servername;
    if (host !== undefined && host !== null && host !== '') return [host, a0.port];
    if (a0.path) return ['localhost', a0.port];      // 로컬 IPC(named pipe/unix socket)
    return [undefined, a0.port];                      // host 부재 → 기본 loopback 취급
  }
  if (typeof a0 === 'number' || (typeof a0 === 'string' && /^\d+$/.test(a0))) {
    return [args[1], a0];               // (port, host)
  }
  if (looksLikeIpcPath(a0)) return ['localhost', undefined];  // connect(path) 형태
  return [a0, args[1]];
}

// ---- net / tls ----------------------------------------------------------------
const _connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function () {
  const [host, port] = extractHostPort(arguments);
  maybeBlock(host === undefined ? 'localhost' : host, port, 'net.connect');
  return _connect.apply(this, arguments);
};

const _tls = tls.connect;
tls.connect = function () {
  const [host, port] = extractHostPort(arguments);
  maybeBlock(host === undefined ? 'localhost' : host, port, 'tls.connect');
  return _tls.apply(this, arguments);
};

// ---- http / https --------------------------------------------------------------
for (const [mod, name] of [[http, 'http'], [https, 'https']]) {
  for (const fn of ['request', 'get']) {
    const orig = mod[fn];
    mod[fn] = function (a) {
      let host, port;
      if (typeof a === 'string') {
        try { const u = new URL(a); host = u.hostname; port = u.port; } catch (e) {}
      } else if (a && typeof a === 'object') {
        // URL 인스턴스 포함(hostname 우선 — host는 포트를 포함할 수 있음)
        host = a.hostname || a.host || a.servername; port = a.port;
      }
      maybeBlock(host, port, name + '.' + fn);
      return orig.apply(this, arguments);
    };
  }
}

// ---- worker_threads 전파 ---------------------------------------------------------
let workersCreated = 0;
try {
  const wt = require('worker_threads');
  if (wt && wt.Worker && !wt.__NETHOOK_PATCHED__) {
    const OrigWorker = wt.Worker;
    const hookPath = __filename;
    class HookedWorker extends OrigWorker {
      constructor(filename, options) {
        options = Object.assign({}, options || {});
        const ex = (options.execArgv || process.execArgv || []).slice();
        ex.push('--require', hookPath);
        options.execArgv = ex;
        options.env = Object.assign({ NETHOOK_MODE: MODE }, options.env || process.env);
        workersCreated++;
        super(filename, options);
      }
    }
    wt.Worker = HookedWorker;
    wt.__NETHOOK_PATCHED__ = true;
  }
} catch (e) { /* worker_threads 미가용 환경 */ }

// ---- 요약/프로브 ------------------------------------------------------------------
process.on('exit', function () {
  console.log('[NETHOOK-SUMMARY] mode=' + MODE +
    ' observedTotal=' + observedTotal +
    ' egressAttempts=' + egressAttempts +
    ' workersCreated=' + workersCreated +
    (egressLog.length ? ' log=' + JSON.stringify(egressLog.slice(0, 5)) : ''));
});

global.__NETHOOK__ = {
  get mode() { return MODE; },
  get observedTotal() { return observedTotal; },
  get egressAttempts() { return egressAttempts; },
  get workersCreated() { return workersCreated; },
};
