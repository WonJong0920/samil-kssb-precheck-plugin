# 제출 패키징 체크리스트 (Submission Packaging Checklist)

> **성격**: 계획 문서. 이번 사이클에서 submission.zip을 생성하지 않는다. 실제 패키징 시 이 체크리스트로 점검한다.
> **최우선 필수**: Codex Cycle 1 리뷰의 Minor 지적 — 최종 submission.zip에 **원본 무편집 AI 대화 로그** 포함.

## 1. 구조 / 매니페스트
- [ ] `src/.codex-plugin/plugin.json` 유효(JSON 파싱, `name` kebab-case, `version`, `description`, `skills: ./skills/`).
- [ ] `skills` 경로가 실제 `src/skills/samil-kssb-precheck/`와 일치.
- [ ] `src/skills/samil-kssb-precheck/SKILL.md` + 보조문서 7종 존재.
- [ ] plugin root(`src/`) 구조가 해커톤 제출 규격과 정합.
- [ ] zip 내부 파일 목록(매니페스트)을 별도로 기록.

## 2. 문서
- [ ] `README.md`(한국어 중심, 삼일 고지·제품 경계 포함).
- [ ] `docs/` 설계·계획·완료 보고 문서 포함.
- [ ] 제품 문서에 삼일 비공식·감사/인증/준수 대체 아님 고지 유지.

## 3. 샘플 / 식별정보
- [ ] 제품 문서에 **고정 고객사명·파일명·URL 없음**(2개 일반화 유형으로만 지칭).
- [ ] (샘플 출력 포함 시) 대표 문서에 고객 식별정보 노출 여부 검토.
- [ ] **무단 PDF 원본 미포함**(저작권 확인 안 된 자료 제외).

## 4. 로그(원본 제출 요건 — 필수)
- [ ] `logs/`에 **원본 무편집 AI 대화 로그**(Claude Code·Codex·ChatGPT) 포함.
- [ ] 로그가 발췌·편집·요약본이 아닌 **원본**임을 확인.
- [ ] 로그 포함 방식 확정: (a) repo 커밋 / (b) git 제외 + zip에만 번들 — 민감내용 여부로 결정.
- [ ] 참고 형식: `logs/claude-code/*.jsonl`, `logs/codex/*.jsonl`(기존 엔진 형식 참고).

## 5. 보안 / 비밀
- [ ] API 키·토큰·자격증명 없음.
- [ ] 내부 절대경로·사용자명 등 민감정보 노출 최소화.
- [ ] plugin/cache/sandbox 내부 경로가 사용자-facing 문서·출력에 노출되지 않음.

## 6. 결정성 / 품질
- [ ] 대표 문서 산출이 결정적(동일 입력=동일 출력) 원칙 위배 없음.
- [ ] DOCX 생성 시 Word 정상 열림(XML sanitizer 적용 확인) — 해당 사이클에서.
- [ ] 금지표현 스캔 통과, 고지문·경계문 존재.

## 7. 규격 / 크기
- [ ] 해커톤 제출물 규격(디렉터리·필수 파일) 정합.
- [ ] zip 크기·불필요 파일(`__pycache__`, 임시파일, `log-hooks/` 등) 제외 확인.

## 8. 최종 확인
- [ ] Codex 최종 검증 대기 상태로 정리.
- [ ] 완료 보고서에 패키징 결과 기록.
