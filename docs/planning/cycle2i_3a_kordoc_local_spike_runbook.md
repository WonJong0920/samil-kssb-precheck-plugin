# Cycle 2I-3A 실행 Runbook — Kordoc Local Feasibility Spike

> **성격**: 이 문서는 **실행 절차서(Runbook) + evidence 기록 템플릿**이다. **사용자 승인 후 사용자 로컬 환경에서만** 수행한다.
> **이번 커밋은 문서만** 포함하며, **Kordoc 설치·MCP setup·OCR provider·실제 PDF 재실행은 하지 않았다.**
> 승인 조건·경계·근거는 `docs/planning/cycle2i_3a_kordoc_feasibility_spike_plan.md`(Approval Gate)와
> `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`(DEI 설계), 운영 원칙 `AGENTS.md`·`docs/operating_principles.md`를 따른다.

## 0. 이 Runbook과 계획 문서의 관계

- **계획 문서**(`cycle2i_3a_kordoc_feasibility_spike_plan.md`) = **왜/어떤 조건에서** 승인하는가(Approval Gate).
- **이 Runbook** = 승인 후 **무엇을 어떤 순서로 실행하고 무엇을 기록**하는가(Execution + Evidence).
- **실행 주체 = 사용자**(외부 앱/CLI 상태 변경은 사용자 직접 수행, 운영 원칙 D35/§2.4). Claude Code는 실행하지 않는다.
- 최종 도입 판단은 evidence를 보고 **사용자/ChatGPT**가 한다. Codex는 evidence 문서를 독립 검증한다.

## 1. 실행 전 승인 체크리스트 (모두 충족 + 사용자 승인 시에만 착수)

| # | 확인 항목 | 근거 | 통과 조건 | 결과(Y/N) |
|---|---|---|---|---|
| 1 | 사용자 명시적 승인 | 운영 원칙 §2.4 | 사용자가 로컬 spike 수행을 승인 | ☐ |
| 2 | 비민감 샘플만 사용 | 계획 §9 | 공개자료 또는 사용자 제공 비민감 자료만 | ☐ |
| 3 | 오프라인/무-egress 검증 가능 | 계획 §5.1, §6 | 네트워크 차단 실행·아웃바운드 관찰 가능 | ☐ |
| 4 | 라이선스 적합성 확인 가능 | 계획 §5.2, §7 | LICENSE·third-party 고지 확인 절차 준비 | ☐ |
| 5 | 재현성 기록 준비 | 계획 §5.6, §8 | 버전·명령·README 확인일 기록 양식 준비 | ☐ |
| 6 | OCR provider 미사용 | 계획 §5.7, §13 | 본 spike에서 OCR 실행 안 함(needs_ocr 식별만) | ☐ |
| 7 | repo 비노출 원칙 | 계획 §14 | `.mcp.json`·로컬 경로·계정·토큰 repo 커밋 금지 인지 | ☐ |
| 8 | Skill-first·경계 유지 | 계획 §4 | 인테이크 후보로만, 판정 생성·hard dependency 아님 | ☐ |

> 하나라도 N이면 **착수 보류**하고 계획 문서로 회귀한다.

## 2. 준비 (샘플·환경)

- **샘플 3종**(계획 §9, `docs/planning/sample_input_policy.md`의 일반화 유형 사용, 실제 기업·파일명 고정 금지):
  - **유형1** — KSSB형 텍스트 PDF(표·수치·페이지/섹션이 텍스트로 존재).
  - **유형2** — 일반 지속가능경영보고서(텍스트, 근거 부족·확인 불가 항목 다수).
  - **유형3** — 스캔/이미지형 PDF(텍스트 레이어 부재).
- 샘플은 **로컬 파일 경로**로만 참조(원격 URL·클라우드 fetch 금지). 경로는 evidence에 남길 때 `[REDACTED_LOCAL_PATH]`로 마스킹.
- 실행 환경 정보(OS 종류·Node 메이저 버전 등)는 **일반화해서만** 기록(계정·호스트명·절대경로 금지).

## 3. 설치·구성 절차 (사용자 로컬, 승인 후에만)

> 설치 자체는 공식 패키지 레지스트리 접근이 필요하다(1회성). **문서 파싱의 무-egress 검증(§4)은 설치와 분리**해 네트워크 차단 상태에서 수행한다.

1. **설치 출처 고정**: 공식 npm 레지스트리에서만 설치. 설치 명령·출처·시각을 evidence에 기록(placeholder):
   - 예시(템플릿): `npm install kordoc@<x.y.z 실제 설치 버전>` — **실제 설치 버전을 확정해 기록**(계획 §8: README는 v3.5.0까지 문서화, 정확한 설치 버전 미고정).
2. **MCP/CLI 구성은 사용자 로컬에만**: 클라이언트(Claude/Cursor 등) MCP 설정이나 CLI 구성은 **사용자 로컬 파일에만** 두고 **repo에 커밋하지 않는다**. 이 repo에 `.mcp.json`·클라이언트 설정·설치 스크립트를 생성/추가하지 않는다(계획 §14).
3. **도구 표면 확인**: 사용하려는 도구명(예: `parse_document`·`parse_table` 등)을 기록. README에 문서화된 도구와 일치하는지 확인.

## 4. 로컬 / offline / no-egress 확인 절차

1. **네트워크 차단 상태**에서 대표 파싱 명령을 실행한다(예: 시스템 네트워크 비활성 또는 방화벽 아웃바운드 차단).
2. 실행 동안 **아웃바운드 연결 시도**를 관찰한다(로컬 방화벽 로그/연결 모니터). 원격 다운로드(모델·폰트 등) 발생 시 **egress 위험**으로 기록하고 승인 보류.
3. 입력은 **로컬 파일만**. 원격 URL·클라우드 fetch를 쓰지 않는다.
4. 결과를 Y/N로 남긴다:
   - `오프라인에서 표/텍스트 추출 완료 여부` = Y/N
   - `실행 중 외부 연결 시도 여부` = Y/N (Y면 상세는 일반화해 기록, 로컬 경로/호스트 마스킹)

## 5. 라이선스 확인 절차

1. 공개 repo/패키지의 **LICENSE 파일**과 **third-party 고지**를 직접 확인해 라이선스 종류를 기록.
2. **README 표기만으로 결론짓지 않는다**(예: README상 MIT 표기는 참고). 코드/의존성 라이선스 정밀 검토는 별도.
3. 제출 패키징에 Kordoc 산출물/코드가 포함될 가능성의 라이선스 영향은 `docs/submission_packaging_policy.md`와 함께 판단.
4. 라이선스가 **부적합·불명확**하면 실패 기준(§7)으로 처리하고 fallback(§9).

## 6. 재현성 기록 방법 (버전·명령·README 확인일)

evidence 문서에 **반드시 명시**:
- **정확한 패키지 버전**(설치·실행 시점 실제 버전, 예: `kordoc@<x.y.z>`).
- **명령/도구 출처**: 사용한 CLI/MCP 도구명.
- **README/문서 확인일 + 확인처**(공개 repo 경로).
- 테스트한 artifact가 **공개 README와 일치하는지** 여부.
- (참고, 계획 §8) 현 시점 공개 정보: `kordoc`(Node.js 18+), PDF/HWP(X)/XLS(X)/DOCX→Markdown+표 재구성, README 확인일 **2026-07-02**(v3.5.0까지 문서화).

## 7. 샘플 문서 유형별 실행 절차

각 유형 공통: **오프라인 실행 → 결과 관찰 → evidence 기록**. 동일 입력을 **2회 실행해 결정성**(동일 산출물) 확인.

- **유형1 (KSSB형 텍스트 PDF)**
  1. 문서→Markdown/표 재구성 실행.
  2. **표 수치·구조 복원 품질**, 페이지/섹션 단서 확보 여부 관찰.
  3. baseline(즉석 텍스트 추출) 대비 개선 정도를 정성 평가.
- **유형2 (일반 지속가능경영보고서, 텍스트)**
  1. 문서→Markdown 변환.
  2. quote/location 확보 가능성, "확인 불가 → 요청자료(missing_info + customer_questions)" 전환 재료 품질 관찰.
- **유형3 (스캔/이미지형 PDF)**
  1. 변환 시도.
  2. Kordoc이 **`needs_ocr`(OCR 필요)를 식별**하는지, OCR 없이 어디까지 가능한지 관찰.
  3. **OCR은 실행하지 않는다**(§13 별도 게이트). 식별 가능 여부만 기록.

## 8. 성공 기준 / 실패 기준 (계획 §10 재확인)

**성공(도입 검토 진행 가능)**
- 오프라인·무-egress로 유형1·2에서 표/텍스트가 신뢰 가능하게 Markdown/표로 추출됨.
- 페이지/섹션/블록 단서가 DEI 필드로 매핑 가능(§10 관찰).
- 동일 입력 재현성 확보, 대용량에서 치명적 실패 없음.
- 라이선스·경계·재현성 기록 조건 충족.

**실패(보류/재검토 → fallback)**
- 외부 egress 발생, 또는 오프라인에서 핵심 기능 불가.
- 라이선스 부적합·불명확.
- 표/수치 복원이 baseline 즉석 추출 대비 유의미하게 낫지 않음.
- DEI↔evidence_anchor 매핑에서 위치/수치 손실이 큼.
- 결정성/대용량 불안정.

## 9. DEI → evidence_anchor 매핑 관찰 항목

Kordoc 출력을 Document Evidence Index(DEI, 계획 2I-3 §5) 필드로 채운 뒤 다음 **손실 여부**를 정성 관찰(schema 변경 없음):

| DEI 필드 | → findings `evidence_anchor` | 관찰 포인트 |
|---|---|---|
| `source_file` | `source_id`(source_documents 매핑) | 출처 식별 유지되는가 |
| `page_number` + `section_path` | `page_or_section` | 페이지/섹션 위치가 보존되는가 |
| `extracted_text_or_table_markdown` 발췌 | `quote` | 원문 인용이 실제 원문과 일치하는가(표 수치 포함) |
| 관련성 서술 | `relevance_note` | 근거-요구사항 연결이 표현되는가 |
| `needs_ocr`·`extraction_quality`·`warnings` | (validator/사람 검수 신호) | 저신뢰 구간이 "확인 불가→요청자료"로 전환 가능한가 |

- **경계 유지**: DEI는 **판정을 만들지 않는다.** `evidence_confidence`·`kssb_candidate_area`는 **재료 신호일 뿐**이며 최종 판정·근거 선택은 **Skill**이 수행(재판정 아님). schema화 여부는 spike 결과 후 별도 승인.

## 10. 실패 시 fallback (계획 §15)

- Kordoc 미도입/실패 시 **현행 경로 유지**: 제한 텍스트 추출 + "근거 부족/확인 불가 → `missing_info` + `customer_questions` + 요청자료".
- 표/수치 저신뢰 구간은 **정량 근거로 승격하지 않고** 위치 단서 + 요청자료로 **사람 검수** 유도.
- 인테이크 계층은 **pluggable** 유지 → 다른 도구/수동 텍스트 입력으로 대체 가능.

## 11. 로컬 경로·계정·토큰 Redaction 규칙

evidence 및 이 repo에 남기는 모든 기록에 적용:
- **금지**: 로컬 절대경로·계정명·호스트명·토큰·API key·비밀번호·개인키·`.mcp.json`/클라이언트 설정 경로.
- **치환 규칙**:
  - 로컬 경로 → `[REDACTED_LOCAL_PATH]`
  - 계정/사용자명 → `[REDACTED_ACCOUNT]`
  - 토큰/키 → `[REDACTED_TOKEN]`
  - 샘플 파일명(식별 가능) → 유형 라벨(`유형1/2/3`)로 일반화.
- 공개자료 출처는 남기되 **저작권 원문 장문 복붙 금지**(발췌 최소).
- evidence 파일은 커밋 전 위 토큰을 **재스캔**해 노출이 없는지 확인.

## 12. Evidence 기록 템플릿 (복사해 사용)

> 실제 실행 후 아래를 채워 `docs/samples/kordoc_spike_evidence_<YYYY-MM-DD>.md`로 저장(민감정보 제거).

```markdown
# Kordoc Local Spike Evidence — <YYYY-MM-DD>

## 환경 (일반화)
- OS 종류: <예: Windows / macOS / Linux>
- Node 메이저 버전: <예: 18.x>
- 실행자: 사용자(로컬)

## 재현성
- 패키지 버전: kordoc@<x.y.z>
- 사용 도구/명령: <parse_document / parse_table 등>
- 설치 출처: 공식 npm 레지스트리
- README 확인일 / 확인처: <YYYY-MM-DD> / <공개 repo 경로>
- 테스트 artifact ↔ 공개 README 일치 여부: Y/N

## 오프라인 / 무-egress
- 네트워크 차단 실행: Y/N
- 오프라인에서 표/텍스트 추출 완료: Y/N
- 실행 중 외부 연결 시도: Y/N  (Y면 상세: <일반화, 경로/호스트 마스킹>)

## 라이선스
- 라이선스 종류(LICENSE 확인): <예: MIT>
- third-party 고지 확인: Y/N
- 배포·제출 사용 적합성(정밀 검토): 적합 / 불명확 / 부적합

## 유형별 결과
| 유형 | 표/텍스트 추출 | 페이지/섹션 단서 | 결정성(2회 동일) | baseline 대비 | 비고 |
|---|---|---|---|---|---|
| 유형1 |  |  |  |  |  |
| 유형2 |  |  |  |  |  |
| 유형3(needs_ocr 식별) |  |  |  |  |  |

## DEI → evidence_anchor 매핑 손실 관찰
- source_id: <손실 여부>
- page_or_section: <손실 여부>
- quote(원문·표수치 일치): <손실 여부>
- relevance_note: <손실 여부>
- 저신뢰 구간 "확인 불가→요청자료" 전환 가능성: <서술>

## 종합 판단 (사용자/ChatGPT 결정 재료)
- 성공/실패: <성공 / 보류 / 실패>
- 근거 요약: <2~3줄>
- 권고: <도입 검토 진행 / 재검토 / fallback 유지>

## Redaction 확인
- 로컬 경로·계정·토큰·API key·MCP 설정 경로 노출 없음: Y/N
```

## 13. 실행 후 Codex Review 요청 포인트

evidence 문서 작성 후 Codex 독립 검증 시 확인할 점:
1. 오프라인·무-egress 검증이 실제로 수행·기록되었는가(외부 연결 시도 관찰 포함)?
2. 라이선스 확인이 README 표기 이상으로 근거를 갖췄는가?
3. 재현성 기록(정확한 버전·명령·README 확인일·public README 일치)이 완전한가?
4. DEI↔evidence_anchor 매핑 관찰이 **재판정/자동판정 계층으로 변질되지 않았는가**(판정 미생성 경계 유지)?
5. 성공/실패 판단이 baseline 대비 근거로 뒷받침되는가?
6. evidence에 로컬 경로·계정·토큰·`.mcp.json`/설정 경로 노출이 없는가(§11 redaction)?
7. 실패 fallback이 source-bound·사람 검수 경계와 정합하는가?

## 14. 이번 커밋 검증 / 미실행 사유

- **문서만** 변경(코드·테스트·schema·manifest·marketplace·MCP 설정 무변경). 회귀 리스크 없어 코드 테스트는 이번엔 미실행(직전 2I-3 커밋에서 검증기 26/26·렌더러 22/22·전달 33/33 PASS 확인됨).
- **Kordoc 설치·MCP setup·OCR provider·실제 PDF 재실행: 모두 미수행.** `.mcp.json`·로컬 경로·계정·토큰·API key repo 미포함. 명령은 placeholder 템플릿(`<x.y.z>` 등)으로만 기재.
