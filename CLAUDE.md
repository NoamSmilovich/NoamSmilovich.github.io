# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal academic website for Noam Smilovich, built on the [Academic Pages](https://academicpages.github.io/) Jekyll template (itself a detached fork of the Minimal Mistakes theme) and deployed via **GitHub Pages**. The repo is named `NoamSmilovich.github.io`, so pushing to `master` rebuilds and publishes the live site automatically — there is no separate deploy step.

Most files (`_layouts/`, `_includes/`, `_sass/`, `assets/`, `markdown_generator/`) are upstream theme machinery. The user-owned content and configuration live in `_config.yml`, `_data/`, `_pages/`, and the content collections (`_publications/`, `_talks/`, `_teaching/`, `_portfolio/`, `_posts/`). Note `_config.yml`'s `repository:` field and `README.md` still point at the upstream template — that's expected, not a bug.

## Running locally

```bash
bundle install                              # install Ruby gems (delete Gemfile.lock first if it errors)
bundle exec jekyll serve -l -H localhost    # build + serve at localhost:4000 with live reload
```

Live reload rebuilds on change for content/layouts, **but not `_config.yml`** — editing that file requires restarting the server.

Docker alternative (no local Ruby needed): `docker compose up` serves at `localhost:4000`. The repo also ships a VS Code DevContainer (`.devcontainer/`).

The theme's JavaScript is hand-bundled, not part of the Jekyll build. After editing anything under `assets/js/`, regenerate the minified bundle:

```bash
npm install
npm run build:js     # uglifies jquery + plugins + _main.js into assets/js/main.min.js
npm run watch:js     # rebuild on change
```

## Content model

Each entry in a collection is a Markdown file whose **YAML front matter is the data** — the body is optional prose. Collections are configured in `_config.yml` under `collections:` and `defaults:`. Filenames follow `YYYY-MM-DD-slug.md` and each entry sets its own `permalink`.

- `_publications/` — `category` (`books`/`manuscripts`/`conferences`, mapped to section titles via `publication_category` in `_config.yml`), `venue`, `date`, `paperurl`, `citation`.
- `_talks/` — `type`, `venue`, `date`, `location` (location drives the talk map, see below).
- `_teaching/` — `type`, `venue`, `date`, `location`.
- `_portfolio/` — `title`, `excerpt`, image fields.
- `_posts/` — standard Jekyll blog posts.

Top navigation is defined in `_data/navigation.yml`. Standalone pages live in `_pages/`. Downloadable assets (PDFs, CV, slides, bibtex) go in `files/` and are served at `/files/...`.

## Generation tooling (optional, run by hand)

These scripts produce content/data files; they are not part of the site build.

- **`markdown_generator/`** — converts a TSV of publications/talks into per-entry Markdown files. Run `python publications.py` / `python talks.py` from inside that folder (TSV column format documented in `markdown_generator/readme.md` and the `.ipynb` notebooks). `OrcidToBib`/`PubsFromBib` notebooks pull from ORCID/BibTeX instead.
- **`scripts/update_cv_json.sh`** → `scripts/cv_markdown_to_json.py` — regenerates `_data/cv.json` (JSON-Resume-style) by parsing `_pages/cv.md` sections plus author info from `_config.yml` and the content collections. Run this after editing the CV so the JSON view stays in sync. Note: `_pages/cv.md` currently embeds `files/CV_Noam_Smilovich.pdf` directly, so the JSON pipeline is only relevant if the JSON/Markdown CV views are wired up.
- **Talk map** — `talkmap.py` / `talkmap.ipynb` geocode `_talks/*` locations into an interactive map. The `.github/workflows/scrape_talks.yml` Action runs this automatically on any push touching `talks/`, `_talks/`, or `talkmap.ipynb`, then commits the result back. Avoid hand-editing `talkmap_out.ipynb`.
