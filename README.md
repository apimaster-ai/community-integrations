# APIMaster Community Integrations

Open-source projects that work with [APIMaster](https://apimaster.ai) or any
OpenAI-compatible endpoint — ours, and the ones other people build.

This repository holds the data and the page behind the Community Integrations listing:

| File | What it is |
| --- | --- |
| `integrations.json` | The listing. One entry per project, credited to its author, linking to their repo |
| `index.html` | The page that renders it. Static, no build step, no third-party requests |
| `refresh-stars.js` | Updates star counts once a day (`.github/workflows/refresh-stars.yml`) |

## Get your project listed

[Open a submission](https://github.com/apimaster-ai/community-integrations/issues/new?template=submit.yml).
New projects are welcome; star count is not a criterion.

What we check:

- a public repository with a license and a README that works
- real calls to an OpenAI-compatible endpoint (APIMaster or any other)
- a commit in the last six months

We write nothing about your project that you did not write yourself, and we change or
remove a listing the same day you ask.

### Referral codes

If you want one, say so in the submission. It is optional and has no effect on whether
we list you. If you use it, please mark it as a referral link in your README.

## Preview the page locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

The page fetches `integrations.json`, so it needs to be served over HTTP rather than
opened as a file.

## License

MIT for the code. Project descriptions belong to their authors.
