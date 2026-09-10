# IELTS Vocabulary Memory

[简体中文](./README.zh-CN.md) | English

A chapter-based IELTS vocabulary learning platform built from *IELTS Vocabulary
Bible* materials. It uses spaced repetition inspired by the Ebbinghaus
forgetting curve to schedule reviews before words fade from memory.

## Live demo

**[Open IELTS Vocabulary Memory](https://c1iytlv1up6.feishuapp.com/app/app_17duh13vydd)**

The public demo can be opened without signing in. Anonymous progress is stored
locally in the current browser. Signed-in users can keep their progress in the
cloud.

## Features

- 22 themed chapters with approximately 1,300 vocabulary entries
- Chapter-by-chapter study flow
- British English text-to-speech pronunciation
- Meanings, phonetics, examples, translations, and memory cues
- Active-recall cards that reveal definitions on demand
- Four self-assessment choices: Again, Hard, Good, and Easy
- Review intervals based on an Ebbinghaus-style schedule:
  immediately, 8 hours, 1 day, 2 days, 4 days, 7 days, 15 days, and 30 days
- Due-review queue, mastery count, learning streak, and overall progress
- Responsive interface for desktop and mobile browsers, including WeChat
- Local progress for anonymous visitors and database persistence for signed-in
  users

## Tech stack

- React 19, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- NestJS and Drizzle ORM
- PostgreSQL-compatible Miaoda application database
- Feishu/Lark Miaoda full-stack hosting

## Download and run locally

### Requirements

- Node.js 22 or later
- npm 10 or later
- A Miaoda full-stack application environment for platform APIs and database
  features

### Installation

```bash
git clone https://github.com/zilingtang2003-imeeks/ielts-vocabulary-memory.git
cd ielts-vocabulary-memory
npm install
npm run dev
```

The project was generated for the Miaoda full-stack runtime. Local platform
integration requires a valid Miaoda development environment. The front-end and
server type checks can be run independently:

```bash
npm run type:check:client
npm run type:check:server
npm run eslint
```

On Windows, the provided shell-based `npm run dev` and `npm run build` scripts
are best run through Git Bash or WSL.

## Project structure

```text
client/                         React application
server/modules/learning/       Learning API and spaced-repetition logic
server/database/               Generated database schema
shared/                         Shared client/server types
migration.sql                   Learning-progress table migration
```

## Progress and privacy

- Anonymous mode stores progress in browser `localStorage`; it stays on that
  browser and may be removed when site data is cleared.
- Signed-in mode stores progress in the application database by user identity.
- Do not add `.env.local`, tokens, credentials, or production data to commits.

## Using the app

1. Open the dashboard and choose a chapter.
2. Read the word and try to recall its meaning before revealing the answer.
3. Review the definition, example, and memory cue.
4. Rate your recall as Again, Hard, Good, or Easy.
5. Return when the word appears in the due-review queue.

## License and content notice

No open-source license has been granted yet. Source code is publicly viewable,
but reuse, redistribution, and commercial use require the repository owner's
permission. Vocabulary content derived from third-party learning materials may
be subject to the original publisher's rights; use it for personal learning and
obtain permission before redistribution.
