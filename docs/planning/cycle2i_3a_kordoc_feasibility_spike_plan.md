# Cycle 2I-3A 계획 — Kordoc Feasibility Spike / Approval Gate

> **성격**: 계획·승인 게이트 문서. **설치·실행이 아니다.** 이번 사이클은 Kordoc feasibility spike를 **어떤 조건에서 승인·수행할지**
> 정의한다. **하지 않는 것**: Kordoc 설치·MCP setup·npx/npm/pip install·OCR provider·외부 vision 호출·실제 PDF 재실행·
> plugin manifest/marketplace 변경·Kordoc을 본체 hard dependency로 고정·submission.zip. 운영 원칙은 `AGENTS.md`·`docs/operating_principles.md`.
> 이번 push는 **문서만** 포함하며 코드/설정 변경이 없다.

## 1. 작업 목적

문서 인테이크(PDF 표/수치/페이지·섹션 위치 복원, 이미지·스캔 OCR 필요 판단, quote/location 품질)를 개선하기 위한 **후보 도구
Kordoc**을, 본체에 붙이기 전에 **로컬 feasibility spike로 검증**할 수 있도록 **승인 조건·절차·검증 체크리스트·실패 fallback**을 고정한다.
Kordoc은 계속 **optional/pluggable intake 후보**이며 본체 dependency가 아니다.

## 2. 왜 지금 Kordoc을 바로 도입하지 않는가

- **외부 의존·실행 리스크**: Kordoc은 외부 npm 패키지(Node.js 런타임)이며 MCP/CLI 설치가 필요하다. 본체를 여기에 hard-couple하면
  Skill-first·결정성·무-의존 원칙과 제출 패키징이 흔들린다.
- **미검증 항목**: 오프라인/무-egress 동작, 라이선스 적합성, 두 샘플 유형 재현성, 대용량 안정성, DEI↔evidence_anchor 매핑 손실이
  **아직 검증되지 않았다.** 이 근거 없이 도입하면 데이터 유출·비결정성·경계 훼손 위험.
- **승인 필요**: 로컬 설치·MCP setup·OCR provider 사용은 **사용자 환경 상태를 바꾸므로** 사용자 직접 승인·수행 항목이다(운영 원칙 D35).

## 3. Kordoc의 기대 역할 (인테이크 계층, upstream)

- PDF·XLSX·DOCX·HWP(X) → **Markdown 변환 + 표(table) 재구성**으로 표 수치·구조 복원(baseline "표 수치 복원 실패" 대응).
- 페이지/섹션/블록 단서를 확보해 **Document Evidence Index(DEI)** 재료 → findings `evidence_anchor`(source_id/page_or_section/quote/relevance_note) 품질 향상.
- 스캔·이미지 블록은 **OCR 필요 표식**만 제공(OCR 실행은 별도 게이트).

## 4. Kordoc이 하지 말아야 할 역할 (경계)

- **판정 생성 금지**: Kordoc/DEI는 근거 후보·위치·품질 신호만 제공한다. `judgment_code`/`judgment_label` 결정은 **Skill이 수행**(재판정 아님).
- **본체 hard dependency 금지**: 인테이크 계층은 pluggable. Kordoc 부재 시에도 현행 경로(제한 텍스트 추출 + "확인 불가→요청자료")로 동작.
- **renderer/delivery 대체 금지**: renderer는 findings만 소비(재작성 없음), delivery는 사용자 요약/로그 분리만. Kordoc 결과가 이들에 직접 들어가지 않는다.
- **자동 외부 전송 금지**: 문서·데이터의 외부 egress 금지(민감자료 전제).

## 5. 사용자 승인 전 확인해야 할 조건 (Approval Gate)

아래를 **모두** 충족하고 사용자가 승인해야 spike를 로컬에서 수행한다.

1. **오프라인/무-egress**: 문서·데이터가 외부 서버로 나가지 않음(§6 방법).
2. **라이선스 적합성**: 배포·제출 맥락에서 사용 가능(§7 방법).
3. **결정성/대용량 안정성**: 동일 입력 재현, 대형 PDF 처리 안정.
4. **DEI↔evidence_anchor 매핑 손실 최소**(§12).
5. **Skill-first·경계 유지**: 내부 구성요소로만, 로컬 경로·MCP 설정 비노출.
6. **재현성 기록 가능**(§8).
7. **OCR provider 미사용**(별도 게이트 §13 전까지).

## 6. local / offline / no-egress 확인 방법

- **네트워크 차단 상태 실행**: spike는 오프라인(네트워크 비활성) 환경에서 대표 명령을 실행해 성공하는지 확인. 실행 중 아웃바운드 연결 시도 여부를 관찰(예: 로컬 방화벽/모니터로 연결 로그 확인).
- **입력 문서는 로컬 파일만** 사용. 원격 URL·클라우드 fetch를 쓰지 않는다.
- 임의 원격 다운로드(모델·폰트 등)가 발생하면 **egress 위험**으로 기록하고 승인 보류.
- 결과 기록에는 "오프라인에서 표/텍스트 추출이 완료되는가 / 외부 연결 시도가 있었는가"를 Y/N로 남긴다(로컬 경로·계정은 `[REDACTED]`).

## 7. license 확인 방법

- 공개 repo/패키지의 **LICENSE 파일과 third-party 고지**를 확인해 라이선스 종류(예: README상 MIT 표기)와 배포·제출 사용 가능성을 판단.
- README 표기는 참고이며 **코드/의존성 라이선스 정밀 검토는 별도**로 수행(README만으로 결론 금지).
- 제출 패키징에 Kordoc 산출물이나 코드가 포함될 경우의 라이선스 영향은 `docs/submission_packaging_policy.md`와 함께 판단.

## 8. package version / 명령 / README 확인일 기록 방법

spike evidence에 다음을 **반드시 명시**(재현성):
- **정확한 패키지 버전**(예: `kordoc@x.y.z` — 설치·실행 시점의 실제 버전).
- **명령/도구 출처**: 사용한 CLI/MCP 도구명(예: `parse_document`/`parse_table` 등).
- **README/문서 확인일**과 확인처(공개 repo 경로).
- 테스트한 artifact가 문서화된 **공개 README와 일치하는지** 여부.
- (참고) 현 시점 공개 정보: 패키지 `kordoc`(Node.js 18+), PDF/HWP(X)/XLS(X)/DOCX→Markdown+표 재구성·MCP 도구, README 확인일 **2026-07-02**(README는 v3.5.0까지 문서화, **정확한 설치 버전은 미고정**).

## 9. 샘플 문서 유형별 spike 시나리오

`docs/planning/sample_input_policy.md`의 2개 일반화 유형 + 스캔형을 별도 유형으로 다룬다(실제 기업명·파일명은 제품 문서에 고정하지 않음).

- **유형1 — KSSB형 텍스트 PDF**: 표·수치·페이지/섹션이 텍스트로 존재. 표 재구성·위치 단서 복원 품질 확인.
- **유형2 — 일반 지속가능경영보고서(텍스트)**: 근거 부족·확인 불가 항목이 많은 문서. quote/location 확보 + "확인 불가→요청자료" 전환 재료 품질.
- **유형3 — 스캔/이미지형 PDF**: 텍스트 레이어 부재. Kordoc이 **OCR 필요(needs_ocr)**를 식별하는지, OCR 없이 어디까지 가능한지 확인(OCR 실행은 §13 게이트 전까지 금지).
- 각 유형은 **비민감 공개자료 또는 사용자 제공 비민감 자료**만 사용.

## 10. 성공 기준 / 실패 기준

**성공(진행 가능)**
- 오프라인·무-egress로 유형1·2에서 표/텍스트가 신뢰 가능하게 Markdown/표로 추출됨.
- 페이지/섹션/블록 단서가 DEI 필드로 매핑 가능(§12).
- 동일 입력 재현성 확보, 대용량에서 치명적 실패 없음.
- 라이선스·경계·재현성 기록 조건 충족.

**실패(보류/재검토)**
- 외부 egress 발생, 또는 오프라인에서 핵심 기능 불가.
- 라이선스 부적합·불명확.
- 표/수치 복원이 baseline 즉석 추출 대비 유의미하게 낫지 않음.
- DEI↔evidence_anchor 매핑에서 위치/수치 손실이 큼.
- 결정성/대용량 불안정.
→ 실패 시 **fallback 전략(§14)**로 회귀.

## 11. 산출물로 남길 evidence

- 별도 evidence 문서(후속, 예: `docs/samples/kordoc_spike_evidence_YYYY-MM-DD.md`)에 §8 기록 요건 + 유형별 성공/실패 + 관찰(오프라인·egress·재현성·매핑 손실)을 남긴다.
- **로컬 절대경로·계정명·토큰·API key·MCP 설정 경로는 기록 금지**(필요 시 `[REDACTED]`). 공개자료 사용 시 출처는 남기되 저작권 원문 장문 복붙 금지.
- 도구 최종 판단(도입 여부)은 **사용자/ChatGPT**가 evidence를 보고 결정한다.

## 12. DEI / evidence_anchor 매핑 검증 방법

- Kordoc 출력(Markdown/표 + 페이지/섹션)을 §5(2I-3 계획)의 **Document Evidence Index** 필드로 채운 뒤,
  `source_file→source_id`, `page_number+section_path→page_or_section`, `extracted_text_or_table_markdown 발췌→quote`, 관련성→`relevance_note`로 매핑해 **손실 여부**를 정성 평가.
- **경계 확인**: DEI는 판정을 만들지 않으며 `evidence_confidence`/`kssb_candidate_area`는 재료 신호일 뿐임을 유지. Skill이 최종 판정.
- **schema 미변경**: 매핑은 개념 검증이며, findings schema/코드를 바꾸지 않는다. schema화 여부는 spike 결과 후 별도 승인.

## 13. OCR provider 별도 승인 게이트

- 스캔·이미지 PDF의 텍스트화(OCR)는 **본 spike 범위 밖**이며 **별도 사용자 승인** 전 사용 금지.
- OCR 승인 시에도 **로컬·오프라인·무-egress** provider를 우선하고, 외부 클라우드 OCR/vision provider는 데이터 유출 관점에서 별도 심사.
- 이번 사이클은 OCR을 수행하지 않고 "needs_ocr 식별 가능 여부"만 계획으로 다룬다.

## 14. MCP / client 설정·로컬 경로 repo 커밋 금지 원칙

- `.mcp.json`·클라이언트(Claude/Cursor 등) 설정·설치 명령·로컬 경로·계정·MCP 설정 경로를 **repo에 생성/수정/커밋하지 않는다**(사용자 로컬 소유).
- spike 관련 실행은 **사용자 로컬에서 사용자 승인 후**에만. repo에는 evidence 요약(민감정보 제거)만 남긴다.

## 15. fallback 전략

- Kordoc 미도입/실패 시: 현행 경로(제한 텍스트 추출 + "근거 부족/확인 불가 → missing_info + customer_questions + 요청자료") 유지.
- 표/수치 저신뢰 구간은 **정량 근거로 승격하지 않고** 위치 단서 + 요청자료로 사람 검수 유도(현 evidence_mapping·completion_checklist 원칙).
- 인테이크 계층은 pluggable 유지 → 다른 도구/수동 텍스트 입력으로 대체 가능.

## 16. Codex Review 요청 포인트

1. Kordoc을 optional/pluggable 후보로 유지하고 hard dependency로 고정하지 않은 것이 적절한가?
2. 승인 게이트(오프라인·무-egress·라이선스·재현성·경계) 조건이 충분·타당한가?
3. OCR provider를 별도 승인 게이트로 분리한 것이 적절한가?
4. MCP/설정·로컬 경로 repo 커밋 금지 원칙이 명확한가?
5. DEI↔evidence_anchor 매핑 검증이 재판정/자동판정 계층으로 변질되지 않게 설계됐는가?
6. 실패 fallback이 source-bound·사람 검수 경계와 정합하는가?

## 17. 다음 단계 제안

- (이번) 승인 게이트·spike 계획 확정 → Codex Review.
- (승인 시) 사용자 로컬에서 Kordoc feasibility spike 수행 → evidence 문서 작성(민감정보 제거) → 도입 여부 판단.
- 도입 판단 후에만 인테이크 계층 설계/구현(2I-3B 등)·DEI schema화 여부 검토.

## 18. 이번 작업 검증 / 미실행 사유

- **문서만** 변경(코드·테스트·manifest·marketplace·MCP 설정 무변경). 따라서 코드 테스트 실행은 필수가 아니며, 회귀 리스크가 없어 이번엔 실행하지 않았다(직전 2I-3 커밋에서 검증기 26/26·렌더러 22/22·전달 33/33 PASS 확인됨).
- Kordoc 설치·MCP setup·OCR·실제 PDF 재실행: **모두 미수행**. 로컬 경로·계정·토큰 노출 없음.
