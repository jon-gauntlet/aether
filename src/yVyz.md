# Wayne meeting 12-28

- be prepared for a presentation on findings if requested

- Wayne is looking to "fill in the gaps" of my approach / knowledge / deliverables

- Maybe meet Wednesday to practice being interviewed / giving presentation on what I've done


## LLMs
- Use "theory of mind" -- give Cursor LLM "pointers" to the information they need, and reference with consistent names
  + context
  + first, pointers, resources, context, etc. Then second part of the prompt is the actual question/prompt

- Reasoning models ("chain of thought") - ex, `01`, save the time of followup prompts
  + craft one prompt carefully and get good output

- Phrases with `@Web` are available to have it do more exhaustive searching
  + How can I make it spend the time to reason about all the content in @codebases and in @web to give the most-tailored, highest-quality responses?
    - Asked in telegram

- q: "Retrieval-Augmented Generation"
  + 'LLMs like that structure'
    - 2-stager: fetch ingredients, make recipe

- Use wording that is more outcome-oriented, information/meaning-dense langauge

- provide "mental scaffolding" because the LLM is essentially a brand-new mind every time you open the window

### Trade-offs
- `To prevent lack of knowledge, and to facilitate leveling-up on any of these AppSec skills: After doing LLM-led problem-solving, set aside time to do solo-study in order to ~self-quiz~ to ensure you can actually do the same problem-solving independently`
  + be very critical about what you *don't know*
  + LLM, quiz me on these areas

- Self-study to fill in the gaps as needed
  + presentation / interview?
  + actually doing the job


## ADHD
  + ☀️
    + open scratchpad & braindump
    + refine into bulleted checklist
    + ["workflowy"](https://workflowy.com/)
        - zoom in on task in question
        - add a timer (pomodoro?)
        - visualize end-state (MVP)

    + rule: don't do anything else until reaching end-state!
        - if other things come to you, put it in the brandump quickly and return to task
    + get 2 blocks in to get momentum, this will set the day off right

  + 🔑 focus your mind on the end-state

  + work with `stakes`

  + set your day up for `bursts`

  + exercise, lifestyle, etc is meant to optimize `state` to facilitate `bursts`

  🔗: 'recursive outlining and speedrunning'
---


## High-value assistance
- Business Logic Bugs section
- Validating findings of scanners and/or LLM
- Prompt engineering -- specifically Cursor
- Unit tests
  + LLM can generate



## Business Logic Bugs Exercise
- The app only has so many entry points (routes)
  + This app honors the defaults from `ActiveAdmin`
  + Ex. `/admin/recipients`
    - This app is highly-generated -- ActiveAdmin boilerplate

+ check routing, controllers, models, views
  - routing and views are auto-generated (activeadmin)
  - controller is auto-generated (graphQL)
  - the only thing needed to investigate is the Model (for Recipients)
    + in the Model, we see custom logic for the fake data generation, but it's not a security issue because `user.recipients` doesn't go outside of bounds

- Basically, rule out stuff that doesn't need to be audited. Then for actual custom logic, we can select text and ask questions about it
  + recipients Model: line 38: is this vulnerable to SQL injection?


- a lot of the assessment is not about just finding the thing, but where you were looking, and why you think it's all good
  + ensure that what's being reported is real and actionable