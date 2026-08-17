import "./styles.css"
import { CARDS } from "./cards.js"

const app = document.getElementById("app") ?? document.body

// Build UI once
app.innerHTML = `
  <div style="font-family:monospace;padding:10px">
    <h3 id="phase"></h3>
    <p id="money"></p>
    <div id="auctionBox">
      <p id="cardName"></p>
      <p id="highBid"></p>
      <p id="turnInfo"></p>
      <div id="controls">
        <input id="bid" type="number" min="1" value="1" style="width:60px">
        <button id="bidBtn">Bid</button>
        <button id="passBtn">Pass</button>
      </div>
    </div>
    <pre id="last" style="font-size:10px"></pre>
  </div>`

const $ = (id) => document.getElementById(id)

// Attach listeners ONCE — they survive every state update
$("bidBtn").addEventListener("click", () => {
  Rune.actions.bid(parseInt($("bid").value, 10))
})
$("passBtn").addEventListener("click", () => {
  Rune.actions.pass()
})

Rune.initClient({
  onChange: ({ game, yourPlayerId }) => {
    const me = game.players[yourPlayerId]
    $("phase").textContent = `Phase: ${game.phase}`
    $("money").textContent = `My money: $${me.money} | My cards: ${me.cards.length}`
    $("last").textContent = JSON.stringify(game.lastAuction)

    if (game.phase !== "auction") {
      $("auctionBox").style.display = "none"
      return
    }

    const card = CARDS.find((c) => c.id === game.deck[game.currentCardIndex])
    const myTurn = game.turnPlayerId === yourPlayerId
    const secsLeft = Math.max(0, Math.ceil((game.turnDeadline - (game.now ?? 0)) / 1000))

    $("cardName").innerHTML = `Auction: <b>${card ? card.name : "-"}</b>`
    $("highBid").textContent = `Highest bid: $${game.highestBid} ${game.highestBidderId === yourPlayerId ? "(you)"
        : game.highestBidderId ? "(opponent)" : ""
      }`
    $("turnInfo").textContent = `⏱ ${secsLeft}s — ${myTurn ? "YOUR TURN" : "opponent's turn"}`
    $("controls").style.display = myTurn ? "block" : "none"

    // Keep the input's minimum valid, but don't stomp what the user typed
    const minBid = game.highestBid + 1
    $("bid").min = minBid
    if (parseInt($("bid").value, 10) < minBid || $("bid").value === "") {
      $("bid").value = minBid
    }
  },
})
