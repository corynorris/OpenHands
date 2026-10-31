# Diagnose malformed LLM authorization headers

The 2026-10-13 DeepSeek failure was one extra edge space in both the active LLM settings and the saved `deepseek-flash` profile. LiteLLM logged 20 occurrences of `Illegal header value`; other responses continued working. Trimming the confirmed whitespace through the running Agent Server API produced `valid: true`, and no new header errors were found in the subsequent log window.

Do not assume every instance has that cause. Check whether the affected key has edge whitespace, control characters, non-ASCII characters, or an accidentally pasted `Bearer` prefix. Report only boolean checks, lengths, and invalid-character positions/codepoints. Never print tokens, plaintext settings, raw headers, raw API validation errors, unfiltered journal output, or environment files.

## Find and inspect the actual credential

- Discover the current settings/profile/provider layout and schemas rather than assuming the old storage structure. Last observed files were `~/.openhands/settings.json`, `~/.openhands/profiles/deepseek-flash.json`, `~/.openhands/secrets.json`, and provider/profile directories.
- Authenticate local API requests with the existing session key read privately from the launcher configuration or service environment. `~/.openhands/agent-canvas/session-api-key.txt` may not exist when configuration supplies the key. Do not generate a replacement key during diagnostics.
- Prefer supported API secret-exposure behavior when available. If inspecting encrypted stored fields directly is necessary, read the deployed SDK's cipher implementation and resolve the actual `OH_SECRET_KEY`, including any environment override. The observed implementation used Fernet with `base64(sha256(secret_key))`; that is an observed implementation, not a permanent encryption contract. Do not log decryption exceptions with secret data.
- Compare the affected profile and active settings internally. Existing conversations and automations can retain older LLM configuration; changing defaults alone does not prove those instances are repaired.

## Correct and verify

Back up affected encrypted files privately. Modify only a confirmed malformed credential, through the running service's API when available; direct edits can race cached settings writers. Never strip meaningful characters or replace a key based only on an error message.

The observed API supported:

- `POST /api/profiles/{name}` with `{ "llm": <complete profile config>, "include_secrets": true }`.
- `PATCH /api/settings` with `{ "agent_settings_diff": { "llm": { "api_key": <clean key> } } }`.
- `POST /api/profiles/{name}/validate` with `{ "llm": <profile config> }`.

Check the live OpenAPI document before using these shapes. Avoid inadvertently saving redacted secret placeholders or ciphertext as plaintext. Preserve profile fields and use the service's current encryption/persistence rules. Re-read the saved values safely to confirm the corrected credential and encryption at rest. Validate with the supported provider test, print only success/status fields, and check redacted logs for recurrence. If old conversations remain affected, identify their supported model/profile update or restart path before modifying them; preserve conversation history.
