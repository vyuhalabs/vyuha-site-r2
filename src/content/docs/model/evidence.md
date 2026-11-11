---
page: model
order: 4
label: "04"
title: "Evidence"
summary: "Every run leaves evidence that a person or a reviewer agent checks, and an agent saying it is done is not evidence."
illustrations: [run]
---

A run leaves a record you can open: the commands it ran with their exit codes, the results of the tests and the typecheck, screenshots, and the pull request. A claim that a command passed is checked against the record of the commands the agent actually ran.

Each kind of work names the evidence it needs, and an issue cannot be finished without it.

After the build, the change goes to **review**. A reviewer agent approves it or sends it back with findings. Then it goes to **verification**, where each acceptance criterion is checked on its own, by a person or an agent. Only a finding marked must fix, or a criterion that fails, sends the work back to its owner.

The **audit trail** keeps who did what, when and why, for every run and every decision.

> **Merges** vyuha merges after review and verification, and the decision tier says whether a person approves first or may object.
