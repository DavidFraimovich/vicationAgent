# Secrets

Do not commit files from this directory.

For the local Google Calendar connector:

1. Create a Google OAuth **Desktop app** client.
2. Download the JSON file.
3. Save it as:

```text
secrets/google-oauth-client.json
```

4. Run:

```bash
npm run google:auth
```

The resulting token is stored as:

```text
secrets/google-oauth-token.json
```

The agent never stores Google passwords or card details in this repository.
