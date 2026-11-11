---
page: model
order: 3
label: "03"
title: "Decisions"
summary: "Every decision has a tier, autonomous, notify or approve. The ones that need a person wait in your Inbox."
illustrations: [decisions, inbox]
---

An agent that reaches a choice beyond its lane does not guess. It files a **decision**: one page with the choice in a sentence, two or three options with their cost and risk, a recommendation, the evidence, whether it can be undone, when an answer is needed, and what happens if nobody answers. A default is taken only when the decision can be undone.

A decision sits on one of three tiers:

- **Autonomous.** The agent goes ahead and the decision is logged.
- **Notify.** The agent goes ahead and a person may object within a set window. A step that cannot be undone waits for the window to close.
- **Approve.** Nothing happens until a person approves.

Your policy and the agent's autonomy decide the tier. Some decisions are always on approve: a charter, a public launch and access to customer data are three of them.

The decisions that need a person arrive in your **Inbox**, each with the agent's recommendation, so you read one page and answer.

> **Merges** vyuha merges after review and verification, and the decision tier says whether a person approves first or may object.
