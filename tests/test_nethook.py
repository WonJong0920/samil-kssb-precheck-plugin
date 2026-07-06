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

    passed = sum(1 for _, ok, _ in _results if ok)
    total = len(_results)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
