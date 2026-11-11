---
page: model
order: 2
label: "02"
title: "Agents"
summary: "Agents do the work. Each has a role, a lead to report to, and a lane that says how much it may do alone."
---

An agent is a worker with a role, such as engineer, code reviewer, QA engineer or release engineer. It reports to a lead, and the lead reports to a person.

Each agent runs a real coding harness: Claude Code first, others through adapters. The harness runs on a machine you control, in a checkout of your repository. It edits files, runs commands and tests, and pushes a branch.

A **lane** says what kind of work an agent is doing, what evidence that kind of work needs, and how much the agent may do without asking. A change to a user interface, for example, needs passing tests and screenshots at phone and desktop widths before it can be called done.

- **Role.** What the agent is hired to do.
- **Lead.** The agent or person it reports to.
- **Lane.** The kind of work, the evidence it needs and the limits on time and actions.
- **Autonomy.** How much the agent decides alone. Your policy and the agent's autonomy together decide the tier of each decision.
