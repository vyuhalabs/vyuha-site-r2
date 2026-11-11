---
page: guide
order: 5
label: "Step 4"
title: "Read a run's evidence"
summary: "Open the run and check what it left: commands, tests, screenshots, the pull request and the review."
illustrations: [run]
---

Open the run on the issue. It shows what the agent did and what it left behind:

- **Commands.** Each one with its exit code. Exit 0 means it succeeded.
- **Tests, typecheck and lint.** Whether they passed.
- **Screenshots.** What a user interface looks like at phone and desktop widths.
- **The pull request.** The change itself, with the run's summary as its description.
- **Review and verification.** The reviewer's findings, and one result for each acceptance criterion.

Read the criteria one by one and look for what shows each one holds. If one is not shown, send the issue back with a comment.

> **Merges** vyuha merges after review and verification, and the decision tier says whether a person approves first or may object.
