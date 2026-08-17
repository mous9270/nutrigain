import "./styles.css"
import { CARDS, CATEGORIES, CATEGORY_LABELS } from "./cards.js"

const TOTAL_ROUNDS = 7
const LINEUP_SIZE = 6

const EMOJI = {
  1: "🍌",
  2: "🍎",
  3: "🥭",
  4: "🍊",
  5: "🍈",
  6: "🍑",
  7: "🍇",
  8: "🍒",
  9: "🍉",
  10: "🍍",
  11: "🥬",
  12: "🥕",
  13: "🥔",
  14: "🥦",
  15: "🍅",
  16: "🍠",
  17: "🥒",
  18: "🫛",
  19: "🌰",
  20: "🌸",
}
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]

const cardById = (id) => CARDS.find((c) => c.id === id)

// ---------------------------------------------------------------------------
// Build the DOM ONCE. onChange only updates text/classes on existing nodes.
// ---------------------------------------------------------------------------

const app = document.getElementById("app")

app.innerHTML = `
  <header id="topbar">
    <div class="pbox" id="meBox">
      <span class="pname" id="meName">You</span>
      <span class="pmoney" id="meMoney"></span>
    </div>
    <div class="vs">vs</div>
    <div class="pbox" id="oppBox">
      <span class="pname" id="oppName">Opponent</span>
      <span class="pmoney" id="oppMoney"></span>
    </div>
  </header>

  <section id="auctionScreen" class="screen hidden">
    <div class="counter" id="cardCounter"></div>
    <div class="bigcard">
      <div class="bigcard-top">
        <span class="bigcard-emoji" id="cardEmoji"></span>
        <div>
          <div class="bigcard-name" id="cardName"></div>
          <div class="bigcard-type" id="cardType"></div>
        </div>
      </div>
      <div class="nutrients" id="nutrients"></div>
    </div>
    <div class="bidinfo" id="bidInfo"></div>
    <div class="turnbar" id="turnBar">
      <span id="turnText"></span>
      <span class="timer" id="timer"></span>
    </div>
    <div class="controls" id="bidControls">
      <button class="step" id="bidMinus">−</button>
      <span class="bidvalue" id="bidValue">1</span>
      <button class="step" id="bidPlus">+</button>
      <button class="primary" id="bidBtn">Bid</button>
      <button class="secondary" id="passBtn">Pass</button>
    </div>
  </section>

  <section id="selectScreen" class="screen hidden">
    <h2 class="title">Pick your lineup</h2>
    <div class="counter" id="selectCount"></div>
    <div class="grid" id="selectGrid"></div>
    <button class="primary wide" id="confirmBtn">Confirm lineup</button>
    <div class="waiting hidden" id="selectWait">
      ⏳ Waiting for opponent…
    </div>
  </section>

  <section id="roundsScreen" class="screen hidden">
    <div class="roundhead">
      <span id="roundInfo"></span>
      <span id="scoreInfo"></span>
    </div>
    <div class="category" id="categoryBanner"></div>

    <div id="chooseArea" class="hidden">
      <div class="hint">You own extra cards — pick 6 for this category</div>
      <div class="counter" id="chooseCount"></div>
      <div class="grid" id="chooseGrid"></div>
      <button class="primary wide" id="lineupConfirmBtn">Lock lineup</button>
    </div>
    <div id="chooseWait" class="waiting hidden">
      ⏳ Opponent is picking their lineup…
    </div>

    <div id="rollArea" class="hidden">
      <div class="lineup" id="lineupRow"></div>
      <div class="dicezone">
        <span class="die" id="myDie">🎲</span>
        <button class="primary" id="rollBtn">Roll dice</button>
        <span class="waiting hidden" id="rollWait">⏳ Opponent rolling…</span>
      </div>
    </div>

    <div id="revealArea" class="hidden">
      <div class="duel">
        <div class="duel-card" id="duelMe">
          <div class="duel-die" data-die></div>
          <div class="duel-emoji" data-emoji></div>
          <div class="duel-name" data-name></div>
          <div class="duel-value" data-value></div>
        </div>
        <div class="duel-vs">⚡</div>
        <div class="duel-card" id="duelOpp">
          <div class="duel-die" data-die></div>
          <div class="duel-emoji" data-emoji></div>
          <div class="duel-name" data-name></div>
          <div class="duel-value" data-value></div>
        </div>
      </div>
      <div class="result" id="revealResult"></div>
      <button class="primary wide" id="nextBtn">Next</button>
    </div>
  </section>

  <section id="overScreen" class="screen hidden">
    <div class="over-banner" id="overBanner"></div>
    <div class="over-score" id="overScore"></div>
  </section>

  <div id="toast" class="toast hidden"></div>
`

const $ = (id) => document.getElementById(id)

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text
}
function show(el, visible) {
  el.classList.toggle("hidden", !visible)
}

// Nutrient rows for the auction card — built once, values updated per card
$("nutrients").innerHTML = CATEGORIES.map(
  (cat) => `
    <div class="nutrient">
      <span class="nut-label">${CATEGORY_LABELS[cat]}</span>
      <span class="nut-value" data-cat="${cat}"></span>
    </div>`
).join("")
const nutrientEls = {}
for (const cat of CATEGORIES) {
  nutrientEls[cat] = $("nutrients").querySelector(`[data-cat="${cat}"]`)
}

function miniCardHTML(card, num) {
  return `
    <button class="mini" data-id="${card.id}">
      ${num != null ? `<span class="mini-num">${num}</span>` : ""}
      <span class="mini-emoji">${EMOJI[card.id]}</span>
      <span class="mini-name">${card.name}</span>
      <span class="mini-val" data-val></span>
    </button>`
}

// ---------------------------------------------------------------------------
// Client-side state (view only)
// ---------------------------------------------------------------------------

let latest = null // last onChange payload, used by click handlers
let bidAmount = 1
let bidCtxKey = "" // resets bidAmount when card or highest bid changes
let toastKey = ""
let toastTimer = null
let builtSelectGrid = false
let builtChooseGrid = false
let lineupKey = ""

function viewIds(game, yourPlayerId) {
  // Spectators (no yourPlayerId) watch from player 0's seat
  const me =
    yourPlayerId && game.players[yourPlayerId]
      ? yourPlayerId
      : game.playerIds[0]
  const opp = game.playerIds.find((id) => id !== me)
  return { me, opp, isPlayer: me === yourPlayerId }
}

function nameOf(ctx, playerId, fallback) {
  return ctx.players?.[playerId]?.displayName || fallback
}

// ---------------------------------------------------------------------------
// Event listeners — attached ONCE
// ---------------------------------------------------------------------------

function updateBidLabel() {
  setText($("bidValue"), String(bidAmount))
  setText($("bidBtn"), `Bid $${bidAmount}`)
}

$("bidMinus").addEventListener("click", () => {
  if (!latest) return
  const minBid = latest.game.highestBid + 1
  bidAmount = Math.max(minBid, bidAmount - 1)
  updateBidLabel()
})
$("bidPlus").addEventListener("click", () => {
  if (!latest) return
  const { me } = viewIds(latest.game, latest.yourPlayerId)
  const maxBid = latest.game.players[me].money
  bidAmount = Math.min(maxBid, bidAmount + 1)
  updateBidLabel()
})
$("bidBtn").addEventListener("click", () => {
  Rune.actions.bid(bidAmount)
})
$("passBtn").addEventListener("click", () => {
  Rune.actions.pass()
})

$("selectGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]")
  if (btn) Rune.actions.toggleSelect(Number(btn.dataset.id))
})
$("confirmBtn").addEventListener("click", () => {
  Rune.actions.confirmSelect()
})

$("chooseGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]")
  if (btn) Rune.actions.toggleLineup(Number(btn.dataset.id))
})
$("lineupConfirmBtn").addEventListener("click", () => {
  Rune.actions.confirmLineup()
})

$("rollBtn").addEventListener("click", () => {
  $("myDie").classList.add("rolling")
  Rune.actions.rollDice()
})
$("nextBtn").addEventListener("click", () => {
  Rune.actions.readyNext()
})

// ---------------------------------------------------------------------------
// Render helpers per phase
// ---------------------------------------------------------------------------

function renderTopbar(ctx, game, me, opp) {
  setText($("meName"), `${nameOf(ctx, me, "You")} ⭐`)
  setText($("oppName"), nameOf(ctx, opp, "Opponent"))
  setText(
    $("meMoney"),
    `$${game.players[me].money} · ${game.players[me].cards.length} 🃏`
  )
  setText(
    $("oppMoney"),
    `$${game.players[opp].money} · ${game.players[opp].cards.length} 🃏`
  )
}

function renderAuction(ctx, game, me, opp, isPlayer) {
  const cardId = game.deck[game.currentCardIndex]
  const card = cardById(cardId)
  if (!card) return

  setText(
    $("cardCounter"),
    `Card ${game.currentCardIndex + 1} of ${game.deck.length}`
  )
  setText($("cardEmoji"), EMOJI[card.id])
  setText($("cardName"), card.name)
  setText($("cardType"), card.type === "fruit" ? "🍓 Fruit" : "🥗 Vegetable")
  for (const cat of CATEGORIES) {
    setText(nutrientEls[cat], String(card[cat]))
  }

  if (game.highestBidderId) {
    const holder =
      game.highestBidderId === me
        ? "you"
        : nameOf(ctx, game.highestBidderId, "opponent")
    setText($("bidInfo"), `💰 Highest bid: $${game.highestBid} (${holder})`)
    $("bidInfo").classList.toggle("mine", game.highestBidderId === me)
  } else {
    setText($("bidInfo"), "💰 No bids yet")
    $("bidInfo").classList.remove("mine")
  }

  const myTurn = isPlayer && game.turnPlayerId === me
  const secsLeft = Math.max(0, Math.ceil((game.turnDeadline - game.now) / 1000))
  setText(
    $("turnText"),
    myTurn
      ? "👉 Your turn"
      : `${nameOf(ctx, game.turnPlayerId, "Opponent")}'s turn`
  )
  setText($("timer"), `⏱ ${secsLeft}s`)
  $("turnBar").classList.toggle("myturn", myTurn)
  $("timer").classList.toggle("urgent", secsLeft <= 5)

  // Clamp the pending bid to [highestBid+1, my money]; reset when the
  // card or the highest bid changes so a raise never goes stale.
  const minBid = game.highestBid + 1
  const maxBid = game.players[me].money
  const ctxKey = `${game.currentCardIndex}|${game.highestBid}`
  if (ctxKey !== bidCtxKey) {
    bidCtxKey = ctxKey
    bidAmount = minBid
  }
  bidAmount = Math.min(Math.max(bidAmount, minBid), Math.max(maxBid, minBid))
  updateBidLabel()

  const canBid = myTurn && minBid <= maxBid
  $("bidBtn").disabled = !canBid
  $("bidMinus").disabled = !canBid
  $("bidPlus").disabled = !canBid
  $("passBtn").disabled = !myTurn
}

function renderSelect(game, me, isPlayer) {
  const p = game.players[me]

  if (!builtSelectGrid) {
    $("selectGrid").innerHTML = p.cards
      .map((id) => miniCardHTML(cardById(id)))
      .join("")
    builtSelectGrid = true
  }

  const picking = isPlayer && !p.confirmed
  show($("selectGrid"), !p.confirmed)
  show($("selectCount"), !p.confirmed)
  show($("confirmBtn"), picking)
  show($("selectWait"), p.confirmed)

  if (!p.confirmed) {
    setText($("selectCount"), `${p.selected.length} / ${LINEUP_SIZE} selected`)
    $("confirmBtn").disabled = p.selected.length !== LINEUP_SIZE
    for (const btn of $("selectGrid").children) {
      btn.classList.toggle("sel", p.selected.includes(Number(btn.dataset.id)))
    }
  }
}

function renderRounds(ctx, game, me, opp, isPlayer) {
  setText($("roundInfo"), `Round ${game.round} / ${TOTAL_ROUNDS}`)
  setText(
    $("scoreInfo"),
    `⭐ ${game.players[me].score} — ${game.players[opp].score}`
  )
  setText($("categoryBanner"), `🔍 ${CATEGORY_LABELS[game.category]}`)

  const stage = game.roundStage
  const iPick = stage === "choose" && !game.lineupReady[me]
  show($("chooseArea"), iPick)
  show($("chooseWait"), stage === "choose" && !iPick)
  show($("rollArea"), stage === "roll")
  show($("revealArea"), stage === "reveal")

  if (stage === "choose") {
    if (iPick) renderChoose(game, me, isPlayer)
  } else if (stage === "roll") {
    renderRoll(game, me, opp, isPlayer)
  } else if (stage === "reveal") {
    renderReveal(ctx, game, me, opp, isPlayer)
  }
}

function renderChoose(game, me, isPlayer) {
  const p = game.players[me]

  if (!builtChooseGrid) {
    $("chooseGrid").innerHTML = p.cards
      .map((id) => miniCardHTML(cardById(id)))
      .join("")
    builtChooseGrid = true
  }
  for (const btn of $("chooseGrid").children) {
    const id = Number(btn.dataset.id)
    btn.classList.toggle("sel", p.selected.includes(id))
    setText(
      btn.querySelector("[data-val]"),
      String(cardById(id)[game.category])
    )
  }
  setText($("chooseCount"), `${p.selected.length} / ${LINEUP_SIZE} selected`)
  $("lineupConfirmBtn").disabled =
    !isPlayer || p.selected.length !== LINEUP_SIZE
}

function renderRoll(game, me, opp, isPlayer) {
  const lineup = game.players[me].selected
  const key = `${lineup.join(",")}|${game.category}`
  if (key !== lineupKey) {
    lineupKey = key
    $("lineupRow").innerHTML = lineup
      .map((id, i) => miniCardHTML(cardById(id), i + 1))
      .join("")
    for (const btn of $("lineupRow").children) {
      const id = Number(btn.dataset.id)
      setText(
        btn.querySelector("[data-val]"),
        String(cardById(id)[game.category])
      )
      btn.disabled = true
    }
  }

  const myRoll = game.rolls[me]
  if (myRoll) {
    $("myDie").classList.remove("rolling")
    setText($("myDie"), DICE_FACES[myRoll - 1])
    $("myDie").classList.add("rolled")
  } else {
    setText($("myDie"), "🎲")
    $("myDie").classList.remove("rolled")
  }
  show($("rollBtn"), isPlayer && !myRoll)
  show($("rollWait"), Boolean(myRoll) && !game.rolls[opp])
}

function renderDuelCard(el, rv, winner) {
  const card = rv.cardId ? cardById(rv.cardId) : null
  setText(el.querySelector("[data-die]"), DICE_FACES[rv.roll - 1] || "—")
  setText(el.querySelector("[data-emoji]"), card ? EMOJI[card.id] : "🚫")
  setText(el.querySelector("[data-name]"), card ? card.name : "No card")
  setText(el.querySelector("[data-value]"), String(rv.value))
  el.classList.toggle("winner", winner)
}

function renderReveal(ctx, game, me, opp, isPlayer) {
  const rv = game.reveal
  renderDuelCard($("duelMe"), rv.players[me], rv.winnerId === me)
  renderDuelCard($("duelOpp"), rv.players[opp], rv.winnerId === opp)

  let result
  if (rv.winnerId === me) result = "🎉 You win the round! +1 point"
  else if (rv.winnerId === opp)
    result = `${nameOf(ctx, opp, "Opponent")} wins the round +1`
  else result = "🤝 Tie — no points"
  setText($("revealResult"), result)

  const secs = Math.max(0, Math.ceil((rv.until - game.now) / 1000))
  const ready = game.revealReady[me]
  const last = game.round >= TOTAL_ROUNDS
  setText(
    $("nextBtn"),
    ready ? "⏳ Waiting…" : `${last ? "Finish" : "Next round"} (${secs}s)`
  )
  $("nextBtn").disabled = !isPlayer || Boolean(ready)
}

function renderOver(game, me, opp) {
  const r = game.results?.[me]
  setText(
    $("overBanner"),
    r === "WON"
      ? "🏆 You win!"
      : r === "LOST"
        ? "😢 You lost"
        : "🤝 It's a tie!"
  )
  setText(
    $("overScore"),
    `Final score  ${game.players[me].score} — ${game.players[opp].score}`
  )
}

function renderToast(game) {
  const key = JSON.stringify(game.lastAuction)
  if (key === toastKey) return
  toastKey = key
  if (!game.lastAuction) return

  const card = cardById(game.lastAuction.cardId)
  let text
  if (game.lastAuction.unsold) {
    text = `${EMOJI[card.id]} ${card.name} unsold`
  } else {
    const winner =
      latest &&
      game.lastAuction.winnerId === viewIds(game, latest.yourPlayerId).me
        ? "You"
        : nameOf(latest, game.lastAuction.winnerId, "Opponent")
    text = `${EMOJI[card.id]} ${winner} won ${card.name} for $${game.lastAuction.amount}`
  }
  setText($("toast"), text)
  show($("toast"), true)
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => show($("toast"), false), 2500)
}

// ---------------------------------------------------------------------------
// Main render loop
// ---------------------------------------------------------------------------

Rune.initClient({
  onChange: (ctx) => {
    latest = ctx
    const { game, yourPlayerId } = ctx
    const { me, opp, isPlayer } = viewIds(game, yourPlayerId)

    renderTopbar(ctx, game, me, opp)
    renderToast(game)

    show($("auctionScreen"), game.phase === "auction")
    show($("selectScreen"), game.phase === "select")
    show($("roundsScreen"), game.phase === "rounds")
    show($("overScreen"), game.phase === "over")

    if (game.phase === "auction") renderAuction(ctx, game, me, opp, isPlayer)
    else if (game.phase === "select") renderSelect(game, me, isPlayer)
    else if (game.phase === "rounds") renderRounds(ctx, game, me, opp, isPlayer)
    else if (game.phase === "over") renderOver(game, me, opp)
  },
})
