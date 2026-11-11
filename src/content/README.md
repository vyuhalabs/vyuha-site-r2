# Content

Content collections, defined in `src/content.config.ts` and checked by `astro check`:

- `docs/model/` and `docs/guide/`: one Markdown file per section of the model page and the guide.
- `faq/`: one file per question of the FAQ.

Link to other pages relatively, e.g. `[the model](../model/)`: every page lives one directory below the site root, so the link keeps working under any `base`. Keep the merge rule exact wherever merges are mentioned: vyuha merges after review and verification, and the decision tier says whether a person approves first or may object.
