"""nethook.cjs 테스트(Cycle 2N-2, AVR-04).

외부 네트워크에 접속하지 않는다:
- block 모드는 비-loopback 시도를 **패킷 발신 전에**(원본 connect 호출 전) throw하므로
  원격 주소 테스트도 실제 트래픽을 발생시키지 않는다.
- monitor(관측) 테스트는 loopback(127.0.0.1)만 사용한다.

Node가 없으면 skip으로 기록한다(과도한 skip은 구현 불완전으로 보고).
종료 코드: 모든 점검 PASS(또는 명시 skip)면 0, 실패가 있으면 1.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HOOK = REPO / "src" / "intake" / "runners" / "nethook.cjs"

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


def run_node(code: str, mode: str = "block", timeout: int = 30) -> tuple[int, str]:
    """인라인 스크립트를 훅 preload로 실행. 출력(stdout+stderr) 결합 반환."""
    import os
    env = dict(os.environ)
    env["NETHOOK_MODE"] = mode
    script = Path(tempfile.mkdtemp(prefix="nethook-test-")) / "t.cjs"
    script.write_text(code, encoding="utf-8")
    proc = subprocess.run(
        ["node", "--require", str(HOOK), str(script)],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        env=env, timeout=timeout)
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def main() -> int:
    if not shutil.which("node"):
        print("[SKIP] Node.js 미가용 — nethook 실행형 테스트 전체 skip(최종 보고에 명시)")
        print("\n0/0 checks passed (skipped)")
        return 0

    # 1. block: 원격 net.connect가 패킷 발신 전에 차단됨(NETHOOK_BLOCKED throw)
    rc, out = run_node(
        "try { require('net').connect(53, '8.8.8.8'); console.log('NOT_BLOCKED'); }"
        "catch (e) { console.log('THROWN ' + e.message); }")
    check("block: 원격 net.connect 차단", "THROWN" in out and "NETHOOK_BLOCKED" in out
          and "NOT_BLOCKED" not in out)
    check("block: 요약에 egressAttempts=1", "egressAttempts=1" in out)

    # 2. block: dns.lookup 차단(해석 시도 자체 차단 — 네트워크 미발생)
    rc, out = run_node(
        "try { require('dns').lookup('example.com', ()=>{}); console.log('NOT_BLOCKED'); }"
        "catch (e) { console.log('THROWN ' + e.message); }")
    check("block: dns.lookup 차단", "THROWN" in out and "dns.lookup" in out)

    # 3. block: http.request 차단
    rc, out = run_node(
        "try { require('http').request('http://93.184.216.34/'); console.log('NOT_BLOCKED'); }"
        "catch (e) { console.log('THROWN ' + e.message); }")
    check("block: http.request 차단", "THROWN" in out and "NETHOOK_BLOCKED" in out)

    # 4. block: tls.connect 차단
    rc, out = run_node(
        "try { require('tls').connect(443, '93.184.216.34'); console.log('NOT_BLOCKED'); }"
        "catch (e) { console.log('THROWN ' + e.message); }")
    check("block: tls.connect 차단", "THROWN" in out and "NETHOOK_BLOCKED" in out)

    # 5. block: loopback은 허용(연결 실패해도 차단 아님 — egress 0)
    rc, out = run_node(
        "const s = require('net').connect(9, '127.0.0.1');"
        "s.on('error', ()=>{}); setTimeout(()=>process.exit(0), 300);")
    check("block: loopback 허용(egressAttempts=0)", "egressAttempts=0" in out)

    # 6. monitor(제어검증): loopback 시도를 관측만(observedTotal>=1, 차단 없음)
    rc, out = run_node(
        "const s = require('net').connect(9, '127.0.0.1');"
        "s.on('error', ()=>{}); setTimeout(()=>process.exit(0), 300);",
        mode="monitor")
    check("monitor: 시도 관측(observedTotal>=1)", "observedTotal=1" in out or "observedTotal=2" in out)

    # 7. worker_threads 전파: 훅 로드 후 생성된 worker에서도 원격 차단
    rc, out = run_node(
        "const { Worker } = require('worker_threads');\n"
        "const code = `const { parentPort } = require('worker_threads');\n"
        "let r; try { require('net').connect(53, '8.8.8.8'); r='WORKER_NOT_BLOCKED'; }\n"
        "catch (e) { r='WORKER_BLOCKED:' + e.message; }\n"
        "parentPort.postMessage({ r, hooked: !!global.__NETHOOK__ });`;\n"
        "const w = new Worker(code, { eval: true });\n"
        "w.on('message', m => { console.log(JSON.stringify(m)); w.terminate(); });\n"
        "setTimeout(()=>process.exit(0), 3000);")
    check("worker 전파: 원격 차단", "WORKER_BLOCKED" in out and "NETHOOK_BLOCKED" in out)
    check("worker 전파: 훅 활성(hookActive)", '"hooked":true' in out)
    check("worker 전파: workersCreated>=1 요약", "workersCreated=1" in out or "workersCreated=2" in out)

    # 8. 요약 형식: runner의 provenance 파서와 정합
    rc, out = run_node("process.exit(0);")
    check("요약 라인 형식([NETHOOK-SUMMARY] + egressAttempts)",
          "[NETHOOK-SUMMARY]" in out and "egressAttempts=0" in out)
    sys.path.insert(0, str(REPO / "src" / "intake" / "runners"))
    import hwp_assisted_runner as R  # noqa: E402
    prov = R.build_run_provenance(out)
    check("runner 파서 정합(no_egress_verified=true)", prov["no_egress_verified"] is True)

    # ---- 2N-3A (C2N3-MAJ-01): 누락됐던 outbound call form 커버리지 ----
    # 모든 원격 시도는 원본 호출 전에 throw되므로 외부 트래픽이 발생하지 않는다.

    # 9. net/tls option object의 host/hostname/servername 형태 차단
    rc, out = run_node(
        "function probe(label, fn) {\n"
        "  try { fn(); console.log(label + ':NOT_BLOCKED'); }\n"
        "  catch (e) { console.log(label + ':' + (e.message.indexOf('NETHOOK_BLOCKED')>=0 ? 'BLOCKED' : 'OTHER:'+e.message)); }\n"
        "}\n"
        "const net = require('net'); const tls = require('tls');\n"
        "probe('net-host',       () => net.connect({ host: '8.8.8.8', port: 53 }));\n"
        "probe('net-hostname',   () => net.connect({ hostname: '8.8.8.8', port: 53 }));\n"
        "probe('tls-hostname',   () => tls.connect({ hostname: '8.8.8.8', port: 443 }));\n"
        "probe('tls-servername', () => tls.connect({ servername: 'example.com', port: 443 }));\n")
    for label in ("net-host", "net-hostname", "tls-hostname", "tls-servername"):
        check(f"option object 차단: {label}", f"{label}:BLOCKED" in out)
    check("option object 4형태 egress 집계", "egressAttempts=4" in out)

    # 10. http/https: options.hostname 및 URL 객체 형태 차단
    rc, out = run_node(
        "function probe(label, fn) {\n"
        "  try { fn(); console.log(label + ':NOT_BLOCKED'); }\n"
        "  catch (e) { console.log(label + ':' + (e.message.indexOf('NETHOOK_BLOCKED')>=0 ? 'BLOCKED' : 'OTHER')); }\n"
        "}\n"
        "const http = require('http'); const https = require('https');\n"
        "probe('http-hostname', () => http.request({ hostname: '93.184.216.34', port: 80 }));\n"
        "probe('http-url-obj',  () => http.request(new URL('http://93.184.216.34/')));\n"
        "probe('https-hostname',() => https.request({ hostname: '93.184.216.34', port: 443 }));\n")
    for label in ("http-hostname", "http-url-obj", "https-hostname"):
        check(f"http(s) 형태 차단: {label}", f"{label}:BLOCKED" in out)

    # 11. DNS resolve-family: callback·promises·Resolver 차단
    rc, out = run_node(
        "function probe(label, fn) {\n"
        "  try { fn(); console.log(label + ':NOT_BLOCKED'); }\n"
        "  catch (e) { console.log(label + ':' + (e.message.indexOf('NETHOOK_BLOCKED')>=0 ? 'BLOCKED' : 'OTHER')); }\n"
        "}\n"
        "const dns = require('dns');\n"
        "probe('cb-resolveMx',    () => dns.resolveMx('example.com', ()=>{}));\n"
        "probe('cb-resolveTxt',   () => dns.resolveTxt('example.com', ()=>{}));\n"
        "probe('cb-reverse',      () => dns.reverse('8.8.8.8', ()=>{}));\n"
        "probe('p-resolve4',      () => dns.promises.resolve4('example.com'));\n"
        "probe('p-resolveSrv',    () => dns.promises.resolveSrv('example.com'));\n"
        "probe('resolver-cb',     () => new dns.Resolver().resolve4('example.com', ()=>{}));\n"
        "probe('resolver-prom',   () => new dns.promises.Resolver().resolve6('example.com'));\n")
    for label in ("cb-resolveMx", "cb-resolveTxt", "cb-reverse", "p-resolve4",
                  "p-resolveSrv", "resolver-cb", "resolver-prom"):
        check(f"DNS 차단: {label}", f"{label}:BLOCKED" in out)

    # 12. 로컬 IPC(path)·host 부재 option은 계속 허용(loopback 취급, egress 0)
    rc, out = run_node(
        "const net = require('net');\n"
        "try { const s = net.connect({ path: '\\\\\\\\.\\\\pipe\\\\kssb-test-pipe' }); s.on('error', ()=>{}); } catch (e) { console.log('IPC_THROWN:' + e.message); }\n"
        "try { const s2 = net.connect({ host: '127.0.0.1', port: 9 }); s2.on('error', ()=>{}); } catch (e) { console.log('LOOP_THROWN:' + e.message); }\n"
        "setTimeout(()=>process.exit(0), 300);")
    check("로컬 IPC(path)·loopback object 허용(차단 없음)",
          "IPC_THROWN" not in out and "LOOP_THROWN" not in out)
    check("허용 형태 egress 0", "egressAttempts=0" in out)

    passed = sum(1 for _, ok, _ in _results if ok)
    total = len(_results)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


def test_nethook_standalone():
    """pytest 수집용 래퍼(C2N3-MIN-01) — standalone 실행(python tests/test_nethook.py)도 계속 지원."""
    assert main() == 0


if __name__ == "__main__":
    raise SystemExit(main())
