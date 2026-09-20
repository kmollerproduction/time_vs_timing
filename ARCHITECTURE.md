# Architecture

The game is a dependency-free static site. `index.html` loads classic scripts in dependency order so it also works when opened directly with `file://` (ES modules are intentionally avoided because browsers often restrict them for local files).

## Modules

- `js/config.js` owns defaults plus session-to-session browser persistence. Generator calibration thresholds live under `config.generator`.
- `js/market.js` is the independent regime-based market generator. It creates completed history/future paths, normalizes future log returns to the exact target endpoint, rejects paths outside configurable guardrails, and exposes `TimeMarket.debugMarket(count)`.
- `js/finance.js` is the sole financial authority. It owns holdings, monthly calculation order, proportional deductions, allocation changes, leverage purchase and closure. It has no UI dependencies.
- `js/events.js` is the event registry. Each definition supplies an id, trigger month, dynamic copy, and portfolio effect.
- `js/replay.js` runs live-compatible deterministic simulations from a market path and decision log. Buy & Hold and every counterfactual use the same financial engine.
- `js/controller.js` owns the single game-state object and active-time/month-boundary loop. UI actions call controller methods rather than modifying holdings.
- `js/graph.js` renders only market-index data. It receives state and never calculates portfolio values.
- `js/app.js` renders the admin, start, game, manual decision, event, result, and optional debug views.
- `js/tests.js` contains developer validations A–Q. Run them in the browser with `TimeMarket.runTests()` or with `node scripts/run-tests.js`.

## Game state and UI

`GameController.state` contains the market path/history, current month, holdings, Buy & Hold holdings, active clock, current screen, pending event, structured decision log, and results. The UI is a projection of this state. A pause request is fulfilled only after the current visual month has completed.

## Extending the game

Add an event by appending a definition in `js/events.js`; its `apply` function should call financial transaction helpers or return a copied portfolio. Add new financial rules only in `js/finance.js`. A replacement market generator only needs to return `{ returns, indexes, stats }`. Theme and layout changes belong in `css/style.css`; graph styling belongs in `js/graph.js`.

## Counterfactuals

The decision log records initial allocation, every manual allocation, and each event answer at its month boundary. `Replay.simulate` reruns the same monthly path. Each event counterfactual flips only that answer; the manual-strategy counterfactual removes all ordinary allocation choices and starts at the Buy & Hold allocation while retaining adviser choices. Effects can interact and therefore are not forced to sum to the overall difference.

The Year 2 transfer is decided after month 24. Its lower insurance fee is active immediately after the decision, and its half-market-exposure rule applies to month 25, the first future month unknown to the player.
