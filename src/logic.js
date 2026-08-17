import { CARDS } from "./cards.js"

const TURN_TIME = 15000 // ms per bidding turn

function setup(allPlayerIds) {
  const deck = CARDS.map((c) => c.id)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  const game = {
    phase: "auction",
    deck,
    currentCardIndex: 0,
    starterIndex: 0, // alternates each card
    turnPlayerId: allPlayerIds[0],
    turnDeadline: 0, // set on first update tick
    highestBid: 0,
    highestBidderId: null,
    lastAuction: null, // { cardId, winnerId, amount } | { cardId, unsold: true }
    players: {},
  }

  for (const playerId of allPlayerIds) {
    game.players[playerId] = { money: 50, cards: [], selected: [], score: 0 }
  }

  return game
}

function otherPlayer(game, allPlayerIds, playerId) {
  return allPlayerIds.find((id) => id !== playerId)
}

function auctionShouldEnd(game) {
  const cardsOver = game.currentCardIndex >= game.deck.length
  const moneyOver = Object.values(game.players).some((p) => p.money <= 0)
  return cardsOver || moneyOver
}

function nextCard(game, allPlayerIds) {
  game.currentCardIndex++
  game.starterIndex = 1 - game.starterIndex
  game.highestBid = 0
  game.highestBidderId = null
  game.turnPlayerId = allPlayerIds[game.starterIndex]
  game.turnDeadline = Rune.gameTime() + TURN_TIME

  if (auctionShouldEnd(game)) {
    game.phase = "select" // next step implements this
  }
}

function doPass(game, allPlayerIds, playerId) {
  const cardId = game.deck[game.currentCardIndex]

  if (game.highestBidderId && game.highestBidderId !== playerId) {
    // Opponent holds highest bid -> they win the card
    const winnerId = game.highestBidderId
    const amount = game.highestBid
    game.players[winnerId].money -= amount
    game.players[winnerId].cards.push(cardId)
    game.lastAuction = { cardId, winnerId, amount }
    nextCard(game, allPlayerIds)
  } else if (!game.highestBidderId) {
    const other = otherPlayer(game, allPlayerIds, playerId)
    if (game.turnPlayerId === allPlayerIds[game.starterIndex]) {
      // Starter passed with no bids -> give the other player a chance
      game.turnPlayerId = other
      game.turnDeadline = Rune.gameTime() + TURN_TIME
    } else {
      // Both passed -> card unsold
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
  game.turnPlayerId = otherPlayer(game, allPlayerIds, playerId)
  game.turnDeadline = Rune.gameTime() + TURN_TIME
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 2,
  updatesPerSecond: 2, // gives us ticks to enforce the timer
  setup,
  update: ({ game, allPlayerIds }) => {
    game.now = Rune.gameTime()
    if (game.phase !== "auction") return
    if (game.turnDeadline === 0) {
      // first tick: start the clock
      game.turnDeadline = Rune.gameTime() + TURN_TIME
      return
    }
    if (Rune.gameTime() >= game.turnDeadline) {
      // time's up -> auto-pass for the current turn player
      doPass(game, allPlayerIds, game.turnPlayerId)
    }
  },
  actions: {
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
  },
})
