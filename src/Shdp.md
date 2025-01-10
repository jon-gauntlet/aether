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

  + show your work - show your reasoning, how did you find them (LLM okay but verify -- both technically and logically, independently)

- end goal: devsecops
  + reduce security risk in a smart way while not reducing dev speed as much as possible
  + make sure we're covered in terms of winning business by staying compliant as well
  + startup: no fancy boxes and toys, build it ourselves out of open-source where possible
  + quick wins, best practices, integrated into pipeline


In your assessment writeup, describe your methodology

" We looked at where there was custom code"
" We did a code review, focused on the models that would be performing SQL queries
" Tried to ensure the `content` field is merely being saved" 
" Where in the pipeline is santizing being performed, or not"

(ask the LLM what it thinks, then ask it what resources I could use to verify independently, then perform your own analysis)

---

### Wayne found something
- Your methodology
- What you found
- How you knew it was real


Recipients screen 
When you're composing an email...
The email needs Recipients (/admin/recipients)

These Recipients are related to a User
Say select two recipients and start composing

Look at the code: app/admin/emails.rb
- `def create_resource()`
  + email.email_recipients.create!
  + how do we know that the recipient_ids are assigned to the User?
    - in theory someone can send emails to people not in the User's recipients, bypassing the UI

+ authorization logic needs to be at the lowest level possible


---
## More on the ADHD method, specifically:
the link I wil receive 

Break it down, outline, plan work until it's decomposing
- microbatches of work



Execute!

Get in the flow of going through each section
It's time to `speedrun`
- keep momentum going
- don't obsess over perfection 
---



