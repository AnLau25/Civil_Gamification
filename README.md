# FE Arcade

Three browser games that drill FE Civil and FE Environmental exam questions, built for a
classroom pilot with civil and environmental engineering students.

Plain HTML, CSS and ES modules. No framework, no bundler, no build step. Push the folder to
GitHub Pages and it runs.

---

## The three games

| Page | Game | Loop |
|---|---|---|
| `excavator.html` | **Excavator Run** | Endless runner. Hit an obstacle, answer a timed question. Right keeps you going with a bigger streak multiplier, wrong ends the run. Three correct in a row earns a 50/50. |
| `dig.html` | **Gold Miner** | The arcade classic. The claw swings over the shaft, you drop it at the right moment and haul back gold, diamonds, rebar and boulders against a shift clock. Heavy loads reel in slowly, so choosing what to grab is the game. Questions on the payroll pay for the dynamite. |
| `defense.html` | **Watershed Defense** | Tower defense. Contaminants flow down a channel to the river intake. Six treatment units, each only effective against what it actually treats. Every unit has **two upgrade paths of three tiers**, and only one path can go past tier one, so each build is a real decision. Grant questions between waves fund the budget. |

Plus `index.html`, the menu, and `data.html` (accuracy by topic and CSV export).

The menu is designed for a laptop first: three game cards in a row and four smaller buttons under
them. **How to play**, **Leaderboard** and **About** are dialogs inside `index.html` rather than
separate pages, so opening one is instant. Each closes with the X, the **Main Menu** button, the
Escape key or a click outside the panel. The progress page carries the same **Main Menu** button at
the top and the bottom. Narrow windows still collapse to one column, but the proportions are chosen
for a desktop display; the three games themselves keep their full phone support.

### Where the questions appear

| Game | Question moments |
|---|---|
| Excavator Run | Every collision. One wrong answer ends the run. |
| Gold Miner | Payroll round before each shift (push your luck: each correct answer grows the pot, one wrong answer wipes whatever is unbanked), every mystery bag hauled up, and one overtime question when the whistle blows short of the quota. |
| Watershed Defense | Up to three grant questions after each wave, plus one consent-order question that is the only thing standing between the plant and a shutdown at zero water quality. |

### Upgrade trees, Bloons style

Every treatment unit in Watershed Defense has two upgrade paths of three tiers, and **only one
path may go past tier one**. That is the Bloons rule, and it turns each unit into a real choice
rather than a slider.

Every tier is a real process upgrade, so the shop doubles as a tour of the treatment train:

| Unit | Path A | Path B |
|---|---|---|
| Bar screen | Fine screen 6 mm → Micro screen 1 mm → Rotating drum screen | Chain and rake → Catenary rake → Climber screen |
| Grit chamber | Longer detention → Vortex grit chamber → Aerated grit chamber | Widened channel → Parallel trains → Grit classifier |
| Sedimentation basin | Lamella plates → Ballasted floc → Dissolved air flotation | Extended launder → Two-stage clarifier → Solids contact clarifier |
| Coagulation feed | Jar-tested dose → Polymer aid → Ferric chloride | Static mixer → Flash mix basin → Two-point dosing |
| Activated sludge | Extended aeration → Nitrification → Anoxic denitrification | Return activated sludge → Membrane bioreactor → Bioaugmentation |
| UV disinfection | Medium pressure lamps → Upstream filtration → Validated 40 mJ/cm2 | Second lamp bank → Longer contact channel → UV plus chlorine residual |

The whole tree lives in `UPGRADES` in `js/games/defense/config.js`. Each tier is a name, a cost,
a one-line explanation shown in the panel, and an `effect` object. Nothing else needs editing to
retune the game or to write a different tree.

The artwork changes with the tiers too, so a maxed clarifier looks different from a fresh one:
lamella plates appear in the tank, the ballast tank is bolted on, the DAF bubble curtain starts
running. That is all in `js/games/defense/machines.js`.

---

## Running it

### On the web (what students use)

```bash
git init
git add .
git commit -m "FE Arcade"
git branch -M main
git remote add origin https://github.com/<you>/fe-arcade.git
git push -u origin main
```

Settings → Pages → Source: `main` / root. The site appears at
`https://<you>.github.io/fe-arcade/`. Give students that link, it works on a phone browser
with nothing to install. The `.nojekyll` file is already there so Pages serves the folder as-is.

### Locally

The games use ES modules, which browsers refuse to load over `file://`. Start a tiny server:

```bash
python -m http.server 8000     # or: npm start
```

then open `http://localhost:8000`. On Windows, double click **`serve.bat`**.

Opening a page directly off the disk shows a panel explaining exactly this rather than a
blank screen, so nobody gets stuck.

---

## Project structure

```
fe-arcade/
├── index.html                  the menu, with the sheets inside it
├── excavator.html              game 1
├── dig.html                    game 2
├── defense.html                game 3
├── data.html                   progress and CSV export
│
├── css/
│   ├── base.css                design tokens, reset, typography
│   ├── layout.css              app shell, topbar, stage, doc pages
│   ├── components.css          buttons, fields, cards, HUD, leaderboard, toast
│   ├── quiz.css                the shared question modal
│   ├── pages.css               the light theme, the menu and the sheets
│   └── games/
│       ├── excavator.css
│       ├── dig.css
│       └── defense.css
│
├── js/
│   ├── core/                   shared engine, one concern per module
│   │   ├── app.js              the barrel every page imports from, plus boot()
│   │   ├── config.js           tunables and storage keys
│   │   ├── util.js             pure helpers, no DOM
│   │   ├── storage.js          the only module that touches localStorage
│   │   ├── player.js           anonymous participant identity
│   │   ├── bank.js             question bank: normalise, filter, topic labels
│   │   ├── history.js          per question performance
│   │   ├── picker.js           adaptive, non repeating question feeder
│   │   ├── telemetry.js        the research log and the CSV
│   │   ├── scores.js           leaderboard adapter, local now, Worker later
│   │   ├── quiz.js             the question modal
│   │   ├── ui.js               toasts, name prompt, topic chooser, end of run card
│   │   ├── audio.js            every sound, synthesised, no audio files
│   │   ├── canvas.js           Stage (DPR, resize, play band) and Loop
│   │   └── protocol-check.js   the file:// guard, deliberately a classic script
│   │
│   ├── data/
│   │   └── questions.js        THE QUESTION BANK, the only file you edit for content
│   │
│   ├── games/
│   │   ├── excavator/          config, obstacles, scenery, machine, main
│   │   ├── goldminer/          config, items, hook, render, screens, main
│   │   └── defense/            config, grid, world, machines, render, screens, main
│   │
│   └── pages/
│       ├── hub.js
│       └── progress.js
│
├── tools/
│   ├── validate-questions.mjs  schema and answer key check
│   └── smoke-test.mjs          headless browser test of every page
│
├── worker/                     optional Cloudflare Worker, shared leaderboard
│   ├── index.js
│   └── wrangler.toml
│
├── serve.bat / serve.sh        one click local server
└── package.json                dev scripts only, nothing is bundled
```

The split follows one rule: **a file does one thing, and nothing in `core/` knows about any
particular game.** A game module imports from `js/core/app.js` and never reaches sideways into
another game.

Inside each game the same three-way split repeats:

- `config.js` is data a designer changes: item values, unit stats, wave tables, level goals
- `world.js` / `hook.js` / `main.js` hold rules and state, and never draw
- `render.js` draws and never mutates state

That is why the graphics can be reworked without touching a line of game logic.

---

## Updating the questions

**`js/data/questions.js` is the only file you touch.** All three games read from it.

Open it, copy a block, paste it, change the text, save, reload. That is the whole workflow.

```js
{
  id: "GEO-08", topic: "geotech", exam: ["civil"], diff: 2, sec: 30,
  q: "A saturated clay has a unit weight of 20 kN/m3. What is the effective stress at 5 m depth?",
  opts: {
    A: "100 kPa",
    B: "51 kPa",
    C: "49 kPa",
    D: "149 kPa"
  },
  ans: "B",
  why: "Effective stress is total minus pore pressure: (20 - 9.81) x 5 = 51 kPa."
},
```

| Field | What it does |
|---|---|
| `id` | Any unique string. This is what lands in the exported research data, so keep ids stable once students have played. |
| `topic` | Must be a key in the `TOPICS` object at the top of the file. Add new keys there first. Drives the in-game topic filter and the accuracy report. |
| `exam` | `["civil"]`, `["env"]` or `["civil","env"]`. Drives the exam-track dropdown on every start screen. |
| `diff` | 1 recall, 2 one step, 3 multi step. Drives points earned and the difficulty tag. |
| `sec` | Seconds on the countdown. Keep runner-friendly items at 15 to 30. |
| `q` | Plain text stem. No LaTeX, no HTML. Write `^` for exponents and spell out Greek letters. **A question must never depend on a figure**, since none is shown. |
| `opts` | Exactly four, keyed A B C D. |
| `ans` | The correct letter. |
| `why` | The explanation shown after answering. This is where the learning happens, so explain the reasoning rather than restating the answer. |

Rules that keep the file working:

- It is JavaScript, not JSON. Every block ends with a comma except the last one.
- Use straight double quotes. A double quote inside a string is written `\"`.
- Check your edit before class:

```bash
node tools/validate-questions.mjs
```

That reports duplicate ids, answer keys that are not one of the options, undeclared topics,
missing fields, and an answer letter that appears so often students could guess their way through.

Current bank: **133 questions across 20 topics**, every answer key independently recomputed and
verified. Instructor-authored practice material, not NCEES content.

### Adding a topic

1. Add a display name in `TOPICS`, for example `seismic: "Seismic Design",`
2. Write questions with `topic: "seismic"`.

It appears automatically in the filter on all three start screens and in the accuracy report.

### Version bumping

When you change questions, bump `version` at the top of the file. It shows in About and is
stamped into the research data, so you can tell which bank a student saw.

---

## The research data

Every meaningful action is logged to `localStorage` on the student device. `data.html` shows
the student their own accuracy by topic and exports the raw log as CSV.

### CSV columns

| Column | Notes |
|---|---|
| `timestamp_iso` | UTC |
| `player_id` | Anonymous id generated on first visit, stable per device and browser |
| `alias` | Self-chosen leaderboard name |
| `section` | Optional course section code the student types once |
| `game` | `excavator`, `dig`, `defense` |
| `event` | `session`, `start`, `answer`, `end`, `level`, `wave`, `payroll`, `buy`, `build`, `tool` |
| `question_id` | Matches `id` in the bank |
| `topic`, `difficulty` | Copied from the question |
| `correct` | 1 or 0, on `answer` rows |
| `response_ms` | Time from the question appearing to the option being tapped |
| `chosen` | The letter picked, blank if the timer ran out |
| `timed_out` | 1 if the countdown expired |
| `score` | On `end`, `level`, `wave` and `payroll` rows |
| `detail` | Free text context: topic filter used, level, wave, streak, pot size, reason the run ended |

That gives per-question accuracy, response latency, topic-level mastery curves over the pilot,
persistence measures, and in-game choice data such as when a student banks the payroll pot
versus pushes it. It pairs with a Qualtrics experience survey rather than replacing it.

### Collecting it

For a 2 to 3 week pilot: students open `data.html`, tap **Download CSV**, and upload the file
to a Canvas assignment or a Qualtrics file-upload question at the same sitting as the survey.
The alias and section code are the join key. No server needed.

### Two things to disclose in the methods section

1. **The picker is adaptive.** A question missed last time returns with weight 3.2, an unseen
   one with 2.0, and one answered correctly three times running with 0.35. In-game accuracy
   therefore rises partly by design. See `js/core/picker.js`.
2. **The quiz modal is identical in all three games** by construction, so any difference
   between games is attributable to the game wrapper rather than the question presentation.

### Ethics

Nothing leaves the device unless the student exports it. Get IRB review before collecting,
say in the consent language that gameplay is logged, and keep aliases non-identifying.

---

## Optional: a shared online leaderboard

Scores currently live in each browser, so the board shows only that student. To make it a real
class board, deploy the Worker in `worker/`. Cloudflare is used deliberately: the free tier
covers a class many times over, there is no server to keep alive, and nothing accrues between
semesters.

```bash
npm install -g wrangler
wrangler login
cd worker
wrangler kv namespace create SCORES     # paste the id into wrangler.toml
wrangler deploy
```

Then set the deployed URL as `apiBase` in `js/core/config.js`:

```js
export const CONFIG = {
  apiBase: 'https://fe-arcade.<you>.workers.dev',
  classCode: 'CEG3011-FA26',
  ...
};
```

Nothing else changes. The games already call the adapter, and it falls back to local storage
whenever the network fails, so a dead connection never blocks play. Change `classCode` per
section or per semester to keep boards separate.

<details>
<summary>Why the games do not need changing</summary>

`js/core/scores.js` is a promise based adapter. Every call already goes through it, and it
resolves from `localStorage` while `apiBase` is empty. Filling `apiBase` in switches the same
calls to the Worker, with a local fallback on any network error.

</details>

## Testing

```bash
npm install          # playwright, only needed for the browser test
npm run validate     # question bank schema and answer keys
npm test             # drives every page headless at 390x844 and 1280x800
npm run test:shots   # the same, writing screenshots to .shots/
```

The smoke test serves the folder over HTTP, then for each page checks there are no console
errors, that the layout never causes page scroll, that the quiz card fits the viewport, and
that each game can actually be played: the excavator triggers a question on collision, the
claw hauls a load into the cart, and Watershed Defense builds units by tapping the canvas and
clears a wave into the grant round.

---

## Sound

Every sound is synthesised in the browser with the Web Audio API. There are no audio files, so
nothing to host, nothing to license, and nothing extra to download over mobile data.

- The speaker button in the top bar cycles **off → effects → effects and music**.
- Defaults are effects on, music off, because a student opening this in a lecture should not
  start a soundtrack. The choice is remembered per device.
- Each game has its own tempo and register, generated from a minor pentatonic, so the three
  do not sound like the same track. Audio only starts after a tap, which is what browsers require.
- To use real tracks instead, replace `startMusic` in `js/core/audio.js` with an `<audio>`
  element. Everything else, including the toggle, keeps working.

## Colours

Four roles, so nothing competes:

| Role | Colour | Used for |
|---|---|---|
| Indigo | `#5b57f0` | Selection, tabs, focus, the menu's primary button |
| Green | `#12a150` | In-game actions and anything correct |
| Amber | `#f2b01e` | Score, streaks, rewards |
| Red | `#ef4444` | Failure |

Each game also owns an accent, so a menu card, its badge and the game agree:
`--g-exc` orange, `--g-dig` amber, `--g-def` teal.

**Two surface families share one set of token names.** `css/base.css` defines the dark set that
dresses the three game pages. `css/pages.css` overrides the same names with a light set inside
`body.docpage`, which is the menu and the progress page. That is the whole light theme: every
shared component in `components.css` follows the tokens, so only a handful of rules that
hardcode white on dark need the patches at the bottom of `pages.css`.

Contaminant and unit colours inside Watershed Defense sit outside this palette on purpose,
because a player has to tell seven contaminants apart at a glance.

## Mobile notes

Built phone-first and tested at 390 x 844 as well as desktop.

- Viewport locked with `100dvh`, no page scroll, no pull-to-refresh, no pinch or double-tap zoom
- Safe-area insets respected, so nothing hides under a notch or a home bar
- Every control clears a 46 px touch target, inputs are 16 px so iOS does not zoom on focus
- `Stage.band` sizes side-on scenes from the width, so the excavator is not half the screen on
  a tall phone
- Gold Miner narrows the swing arc on a tall screen to the cone that actually reaches the floor
  of the shaft, and only buries items where the claw can get to them
- Watershed Defense works out its grid from the real screen shape, caps the channel at three
  lanes so a wave never drags, and measures its own build palette so the wave bar and the
  upgrade panel always stack clear of it
- Play pauses when the tab or the screen goes away
- `defense.html#debug` exposes `window.__defense` for balancing and screenshots. It is opt in
  through the hash, so nothing is exposed in normal play.
