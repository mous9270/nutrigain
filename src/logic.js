import { CARDS, CATEGORIES } from "./cards.js"

const TURN_TIME = 15000 // ms per bidding turn
const REVEAL_TIME = 6000 // ms the round result stays on screen
const TOTAL_ROUNDS = 7
const LINEUP_SIZE = 6
const START_MONEY = 50

function getCard(id) {
  return CARDS.find((c) => c.id === id)
}

function setup(allPlayerIds) {
  const deck = CARDS.map((c) => c.id)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  const game = {
    phase: "auction", // auction -> select -> rounds -> over
    playerIds: allPlayerIds,
    now: 0, // mirrored Rune.gameTime() so clients can render countdowns

    // auction state
    deck,
    currentCardIndex: 0,
    starterIndex: 0, // alternates each card
    turnPlayerId: allPlayerIds[0],
    turnDeadline: 0, // 0 = clock not started yet (set on first update tick)
    highestBid: 0,
    highestBidderId: null,
    lastAuction: null, // { cardId, winnerId, amount } | { cardId, unsold: true }

    // rounds state
    round: 0,
    category: null,
    usedCategories: [],
    roundStage: null, // "choose" | "roll" | "reveal"
    lineupReady: {},
    rolls: {},
    reveal: null, // { category, players: {id: {roll, cardId, value}}, winnerId, until }
    revealReady: {},
    results: null, // { [playerId]: "WON" | "LOST" | "TIE" }

    players: {},
  }

  for (const playerId of allPlayerIds) {
    game.players[playerId] = {
      money: START_MONEY,
      cards: [],
      selected: [], // current lineup (card ids, ordered by pick)
      confirmed: false,
      score: 0,
    }
  }

  return game
}

function otherPlayer(allPlayerIds, playerId) {
  return allPlayerIds.find((id) => id !== playerId)
}

// ---------- auction ----------

function auctionShouldEnd(game) {
  const cardsOver = game.currentCardIndex >= game.deck.length
  const moneyOver = Object.values(game.players).some((p) => p.money <= 0)
  return cardsOver || moneyOver
}

function nextCard(game, allPlayerIds) {
  game.currentCardIndex++
  if (auctionShouldEnd(game)) {
    startSelect(game)
    return
  }
  game.starterIndex = 1 - game.starterIndex
  game.highestBid = 0
  game.highestBidderId = null
  game.turnPlayerId = allPlayerIds[game.starterIndex]
  game.turnDeadline = Rune.gameTime() + TURN_TIME
}

function doPass(game, allPlayerIds, playerId) {
  const cardId = game.deck[game.currentCardIndex]

  if (game.highestBidderId && game.highestBidderId !== playerId) {
    // Opponent holds the highest bid -> they win the card and pay
    const winnerId = game.highestBidderId
    const amount = game.highestBid
    game.players[winnerId].money -= amount
    game.players[winnerId].cards.push(cardId)
    game.lastAuction = { cardId, winnerId, amount }
    nextCard(game, allPlayerIds)
  } else if (!game.highestBidderId) {
    if (playerId === allPlayerIds[game.starterIndex]) {
      // Starter passed with no bids -> give the other player one turn
      game.turnPlayerId = otherPlayer(allPlayerIds, playerId)
      game.turnDeadline = Rune.gameTime() + TURN_TIME
    } else {
      // Both passed -> card goes unsold
      game.lastAuction = { cardId, unsold: true }
      nextCard(game, allPlayerIds)
    }
  }
}

function doBid(game, allPlayerIds, playerId, amount) {
  if (!Number.isInteger(amount)) throw Rune.invalidAction()
  if (amount <= game.highestBid) throw Rune.invalidAction()
  if (amount > game.players[playerId].money) throw Rune.invalidAction()

  game.highestBid = amount
  game.highestBidderId = playerId
  game.turnPlayerId = otherPlayer(allPlayerIds, playerId)
  game.turnDeadline = Rune.gameTime() + TURN_TIME
}

// ---------- select ----------

function startSelect(game) {
  game.phase = "select"
  for (const id of game.playerIds) {
    const p = game.players[id]
    if (p.cards.length <= LINEUP_SIZE) {
      // Fewer than (or exactly) 6 cards: no real choice -> take them all
      p.selected = [...p.cards]
      p.confirmed = true
    } else {
      p.selected = []
      p.confirmed = false
    }
  }
  if (game.playerIds.every((id) => game.players[id].confirmed)) {
    startRounds(game)
  }
}

// ---------- rounds ----------

function startRounds(game) {
  game.phase = "rounds"
  game.round = 0
  startRound(game)
}

function startRound(game) {
  game.round++
  const available = CATEGORIES.filter((c) => !game.usedCategories.includes(c))
  game.category = available[Math.floor(Math.random() * available.length)]
  game.usedCategories.push(game.category)

  game.rolls = {}
  game.reveal = null
  game.revealReady = {}

  // Players owning more than 6 cards may re-pick their lineup for this
  // category; everyone else is auto-ready.
  game.lineupReady = {}
  for (const id of game.playerIds) {
    game.lineupReady[id] = game.players[id].cards.length <= LINEUP_SIZE
  }
  game.roundStage = game.playerIds.every((id) => game.lineupReady[id])
    ? "roll"
    : "choose"
}

function resolveRound(game) {
  const reveal = {
    category: game.category,
    players: {},
    winnerId: null,
    until: Rune.gameTime() + REVEAL_TIME,
  }
  const values = {}
  for (const id of game.playerIds) {
    const lineup = game.players[id].selected
    const roll = game.rolls[id]
    if (lineup.length === 0) {
      reveal.players[id] = { roll, cardId: null, value: 0 }
      values[id] = 0
    } else {
      const cardId = lineup[(roll - 1) % lineup.length]
      const value = getCard(cardId)[game.category]
      reveal.players[id] = { roll, cardId, value }
      values[id] = value
    }
  }

  const [a, b] = game.playerIds
  if (values[a] > values[b]) reveal.winnerId = a
  else if (values[b] > values[a]) reveal.winnerId = b
  if (reveal.winnerId) game.players[reveal.winnerId].score++

  game.reveal = reveal
  game.revealReady = {}
  game.roundStage = "reveal"
}

function advanceAfterReveal(game) {
  if (game.round >= TOTAL_ROUNDS) {
    endGame(game)
  } else {
    startRound(game)
  }
}

function endGame(game) {
  const [a, b] = game.playerIds
  const scoreA = game.players[a].score
  const scoreB = game.players[b].score
  const results = {}
  if (scoreA === scoreB) {
    results[a] = "TIE"
    results[b] = "TIE"
  } else {
    results[a] = scoreA > scoreB ? "WON" : "LOST"
    results[b] = scoreB > scoreA ? "WON" : "LOST"
  }
  game.results = results
  game.phase = "over"
  Rune.gameOver({ players: results })
}

// ---------- toggling a card in a 6-card lineup ----------

function toggleCard(player, cardId) {
  if (!player.cards.includes(cardId)) throw Rune.invalidAction()
  const idx = player.selected.indexOf(cardId)
  if (idx >= 0) {
    player.selected.splice(idx, 1)
  } else {
    if (player.selected.length >= LINEUP_SIZE) throw Rune.invalidAction()
    player.selected.push(cardId)
  }
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 2,
  updatesPerSecond: 2, // drives the auction timer and reveal auto-advance
  setup,
  update: ({ game, allPlayerIds }) => {
    game.now = Rune.gameTime()
    if (game.phase === "auction") {
      if (game.turnDeadline === 0) {
        // first tick: start the clock
        game.turnDeadline = game.now + TURN_TIME
        return
      }
      if (game.now >= game.turnDeadline) {
        // time's up -> auto-pass for the current turn player
        doPass(game, allPlayerIds, game.turnPlayerId)
      }
    } else if (game.phase === "rounds" && game.roundStage === "reveal") {
      if (game.now >= game.reveal.until) {
        advanceAfterReveal(game)
      }
    }
  },
  actions: {
    // --- auction ---
    bid(amount, { game, playerId, allPlayerIds }) {
      if (game.phase !== "auction") throw Rune.invalidAction()
      if (playerId !== game.turnPlayerId) throw Rune.invalidAction()
      doBid(game, allPlayerIds, playerId, amount)
    },
    pass(_, { game, playerId, allPlayerIds }) {
      if (game.phase !== "auction") throw Rune.invalidAction()
      if (playerId !== game.turnPlayerId) throw Rune.invalidAction()
      doPass(game, allPlayerIds, playerId)
    },

    // --- select ---
    toggleSelect(cardId, { game, playerId }) {
      if (game.phase !== "select") throw Rune.invalidAction()
      const p = game.players[playerId]
      if (p.confirmed) throw Rune.invalidAction()
      toggleCard(p, cardId)
    },
    confirmSelect(_, { game, playerId }) {
      if (game.phase !== "select") throw Rune.invalidAction()
      const p = game.players[playerId]
      if (p.confirmed) throw Rune.invalidAction()
      if (p.selected.length !== LINEUP_SIZE) throw Rune.invalidAction()
      p.confirmed = true
      if (game.playerIds.every((id) => game.players[id].confirmed)) {
        startRounds(game)
      }
    },

    // --- rounds: optional lineup re-pick for players with >6 cards ---
    toggleLineup(cardId, { game, playerId }) {
      if (game.phase !== "rounds" || game.roundStage !== "choose")
        throw Rune.invalidAction()
      if (game.lineupReady[playerId]) throw Rune.invalidAction()
      toggleCard(game.players[playerId], cardId)
    },
    confirmLineup(_, { game, playerId }) {
      if (game.phase !== "rounds" || game.roundStage !== "choose")
        throw Rune.invalidAction()
      if (game.lineupReady[playerId]) throw Rune.invalidAction()
      if (game.players[playerId].selected.length !== LINEUP_SIZE)
        throw Rune.invalidAction()
      game.lineupReady[playerId] = true
      if (game.playerIds.every((id) => game.lineupReady[id])) {
        game.roundStage = "roll"
      }
    },

    // --- rounds: dice + reveal ---
    rollDice(_, { game, playerId }) {
      if (game.phase !== "rounds" || game.roundStage !== "roll")
        throw Rune.invalidAction()
      if (game.rolls[playerId]) throw Rune.invalidAction()
      game.rolls[playerId] = 1 + Math.floor(Math.random() * 6)
      if (game.playerIds.every((id) => game.rolls[id])) {
        resolveRound(game)
      }
    },
    readyNext(_, { game, playerId }) {
      if (game.phase !== "rounds" || game.roundStage !== "reveal")
        throw Rune.invalidAction()
      game.revealReady[playerId] = true
      if (game.playerIds.every((id) => game.revealReady[id])) {
        advanceAfterReveal(game)
      }
    },
  },
})
