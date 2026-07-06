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

// ---- DNS --------------------------------------------------------------------
const _lookup = dns.lookup;
dns.lookup = function (hostname) { maybeBlock(hostname, 0, 'dns.lookup'); return _lookup.apply(this, arguments); };
for (const m of ['resolve', 'resolve4', 'resolve6', 'resolveAny']) {
  if (typeof dns[m] === 'function') {
    const orig = dns[m];
    dns[m] = function (h) { maybeBlock(h, 0, 'dns.' + m); return orig.apply(this, arguments); };
  }
}
if (dns.promises) {
  const _pl = dns.promises.lookup;
  dns.promises.lookup = function (h) { maybeBlock(h, 0, 'dns.promises.lookup'); return _pl.apply(this, arguments); };
}

// ---- host/port 추출(Node가 정규화 args 배열 [options, cb]을 넘기는 형태 포함) ----
function extractHostPort(args) {
  let a0 = args[0];
  if (Array.isArray(a0)) a0 = a0[0];
  if (a0 && typeof a0 === 'object') return [a0.host || a0.servername, a0.port];
  if (typeof a0 === 'number' || (typeof a0 === 'string' && /^\d+$/.test(a0))) {
    return [args[1], a0];               // (port, host)
  }
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
        host = a.host || a.hostname; port = a.port;
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
