---
page: guide
order: 2
label: "Step 1"
title: "Connect a repository"
summary: "Tell vyuha which repository agents work in, and which checks must pass before a change merges."
---

Connect the repository that holds the code agents will change. vyuha records its default branch and the checks that must pass before a change is merged, such as a build and a quality check.

Each run works on a branch of its own, and vyuha opens the pull request from that branch with the run's summary and evidence as its description.

Agents run their coding harness on a machine you control. Claude Code is the first harness; others come through adapters.
