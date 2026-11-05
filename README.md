# Yugi

Yugi is a browser-based Yu-Gi-Oh! duel-table prototype. It brings account sign-in, deck building, and a two-player room flow together with an interactive game board.

Portfolio index: [rdimitrov](https://github.com/rdimitrovv2922-lab/rdimitrov)

> **Status:** Active prototype. The account, deck-building, room, and board flows are implemented. Players currently manage card effects themselves; the app does not automate the complete Yu-Gi-Oh! ruleset. There is no hosted demo yet.

## Features

- Register and sign in with locally stored accounts.
- Search a bundled card catalog and preview card details.
- Build, validate, save, load, and delete Main, Extra, and Side Decks.
- Create or join a two-player room with a short room code.
- Track turns, phases, Life Points, and card locations on the duel board.
- Save users, decks, rooms, and room game state in SQLite.

## Tech stack

- **Frontend:** HTML, CSS, and browser JavaScript modules
- **Backend:** Node.js built-in HTTP server and JSON API
- **Storage:** SQLite through Node.js `node:sqlite`
- **Dependencies:** No third-party npm packages

## Run locally

### Requirements

- Node.js 22.13.0 or newer

### Start the app

```bash
git clone https://github.com/rdimitrovv2922-lab/Yugi-app.git
cd Yugi-app
npm start
```

Open [http://localhost:3000](http://localhost:3000), register an account, and build a deck. To try the room flow, open a second browser session, register a second account, then create a room in one session and join it with the room code in the other.

The app creates `server/data/local.sqlite` on first launch. The database is local and ignored by Git.

## Project layout

```text
client/                 Browser pages, styles, game UI, and shared rules
server/auth/            Account and session handling
server/cards/           Card catalog loading and API formatting
server/decks/           Deck persistence and validation
server/game/             Multiplayer game-state creation and visibility
server/routes/           Account, card, deck, and room API routes
server/storage/          SQLite schema and migrations
server/data/cards.json   Bundled card catalog
```

## Development notes

This project is being developed as a portfolio application. The current focus is on completing and refining the core flows before a public deployment. Room updates use periodic HTTP polling, and card effects are not automatically resolved.

Card names, artwork, and related marks belong to their respective owners. This is an unofficial fan project and is not affiliated with or endorsed by Konami.
