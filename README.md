# App Gallery

Independent Android apps by Liquid Synthetics. Public showcase for **mail-brandonai/app-gallery**, designed for GitHub Pages at `https://mail-brandonai.github.io/app-gallery/` once Pages is enabled.

## Local development

Node 22+, no install or dependencies required:

```sh
npm test
npm run build
# Serve dist/ with your preferred static server.
```

`site/` contains the complete static site, images and app catalog. `scripts/build.mjs` copies it to `dist/`. All URLs are relative, including the JSON catalog, so project-path hosting works. The initial gallery has Daylight; scene artwork is explicitly labelled as illustration, not a device screenshot. No analytics, external fonts, account system or browser-side authenticated GitHub requests.

The deployment workflow builds, tests and publishes on main changes, manual dispatch, and release changes. **One-time setup:** Repository Settings → Pages → Build and deployment → Source → GitHub Actions. Then run **Publish gallery**. The connector used to prepare this repo cannot change Pages settings.

## App entries

`site/data/apps.json` holds app metadata. The current Daylight detail page is authored in HTML; new apps need corresponding detail markup and routing as well as a catalog entry. Shared styles, filtering, artwork hosting, release discovery and installation guidance are reusable. Do not add fictional apps, testimonials, download counts, or device screenshots.

## APK publishing

App source can remain private. This public repository contains the website and published release binaries, not private source or signing material.

1. Build and verify a **release-signed APK**, maintaining the same permanent signing certificate and increasing the Android version code for updates. Keep keystores and passwords outside this repository.
2. Name the artifact `daylight.apk` and create its SHA-256 file:

```sh
shasum -a 256 daylight.apk > daylight.apk.sha256
```

3. Publish a release with the app-specific prefix, e.g. `daylight-v0.1.0`:

```sh
gh release create daylight-v0.1.0 daylight.apk daylight.apk.sha256 \
  --repo mail-brandonai/app-gallery \
  --title 'Daylight 0.1.0' --notes-file release-notes.md
```

The build discovers public, non-draft, non-prerelease releases with each app's `releasePrefix`, selects the most recently published eligible APK, and writes its versioned URL, size and GitHub-provided SHA-256 digest into the deployed catalog. It never uses the repository-global `/releases/latest` link for a multi-app gallery. A published release without a matching uploaded APK does not enable downloads. Removing all eligible releases clears download metadata on the next deployment. APK content/signature must be verified before publication; release discovery does not itself certify signing.

Local builds use the checked-in catalog without remote discovery. CI fetches release metadata with its repository-scoped read token at build time; no token appears in the website. GitHub API errors fail a deployment rather than advertising stale release metadata. Publishing via another workflow's `GITHUB_TOKEN` does not trigger a release workflow automatically; explicitly dispatch the gallery workflow or use a properly scoped GitHub App token for that future integration.

Daylight has **no signed public APK release yet**, so its download control currently explains that the release is in preparation. No debug APK is advertised as a production build.

Website images are optimized SVG illustrations served by Pages. `scripts/create-art.py` reproduces them without external dependencies. Real screenshots can replace the illustrations when captured from a release build, with the labels updated to match.
