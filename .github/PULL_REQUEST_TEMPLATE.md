## Summary

<!-- What does this PR do and why? Link related issues with "Closes #N". -->

## Changes

- 

## Test Plan

- [ ] Ran `mvn test` in `apps/api/` — all tests pass
- [ ] Tested the affected flow manually on device/emulator
- [ ] No new secrets or credentials introduced (gitleaks pre-commit hook passed)
- [ ] API changes are reflected in `docs/api-reference.md` if applicable

## Security Checklist

- [ ] No secrets, API keys, or credentials in this diff
- [ ] Input validation added at any new API boundary
- [ ] Auth/authorisation checked for any new endpoints
- [ ] Money values stored and computed as integer cents (no floats)
