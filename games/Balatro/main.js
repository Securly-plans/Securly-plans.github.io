// Card and Deck logic
const suits = ['♠', '♥', '♦', '♣'];
const values = [
  { name: 'A', rank: 14 }, { name: '2', rank: 2 }, { name: '3', rank: 3 }, { name: '4', rank: 4 }, { name: '5', rank: 5 },
  { name: '6', rank: 6 }, { name: '7', rank: 7 }, { name: '8', rank: 8 }, { name: '9', rank: 9 }, { name: '10', rank: 10 },
  { name: 'J', rank: 11 }, { name: 'Q', rank: 12 }, { name: 'K', rank: 13 }
];

let deck = [];
let hand = [];
let score = 0;
let handPlayed = false;

function createDeck() {
  deck = [];
  for (let s of suits) {
    for (let v of values) {
      deck.push({ suit: s, value: v.name, rank: v.rank });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawHand() {
  if (deck.length < 5) {
    createDeck();
    shuffleDeck();
  }
  hand = deck.splice(0, 5);
  handPlayed = false;
  renderHand();
  updateScore();
}

function renderHand() {
  const handDiv = document.getElementById('hand');
  handDiv.innerHTML = '';
  hand.forEach((card, i) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `<div>${card.value}</div><div>${card.suit}</div>`;
    handDiv.appendChild(cardDiv);
  });
}

function evaluateHand() {
  // Simple poker hand evaluation (pair, two pair, three of a kind, straight, flush, full house, four of a kind, straight flush)
  const ranks = hand.map(card => card.rank).sort((a,b)=>a-b);
  const suitsArr = hand.map(card => card.suit);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const valuesCount = Object.values(counts).sort((a,b)=>b-a);
  const flush = suitsArr.every(s => s === suitsArr[0]);
  const straight = ranks.every((r, i, arr) => i === 0 || r === arr[i-1] + 1);

  if (straight && flush) return { name: 'Straight Flush', points: 100 };
  if (valuesCount[0] === 4) return { name: 'Four of a Kind', points: 80 };
  if (valuesCount[0] === 3 && valuesCount[1] === 2) return { name: 'Full House', points: 60 };
  if (flush) return { name: 'Flush', points: 50 };
  if (straight) return { name: 'Straight', points: 40 };
  if (valuesCount[0] === 3) return { name: 'Three of a Kind', points: 30 };
  if (valuesCount[0] === 2 && valuesCount[1] === 2) return { name: 'Two Pair', points: 20 };
  if (valuesCount[0] === 2) return { name: 'Pair', points: 10 };
  return { name: 'High Card', points: 5 };
}

function updateScore(bonus=0) {
  const scoreDiv = document.getElementById('score');
  scoreDiv.innerHTML = `Score: ${score}${bonus ? ' (+'+bonus+')' : ''}`;
}

function playHand() {
  if (handPlayed) return;
  const result = evaluateHand();
  score += result.points;
  updateScore(result.points);
  document.getElementById('score').innerHTML += `<br/><b>${result.name}</b>`;
  handPlayed = true;
}

function discardHand() {
  if (handPlayed) return;
  drawHand();
}

function renderShop() {
  // Simple shop: one "Joker" available per round for points
  const shopDiv = document.getElementById('shop');
  shopDiv.innerHTML = `<b>Shop</b><br>
    <button id="buyJoker" ${score < 30 ? 'disabled' : ''}>Buy Joker (+2x points, 30 points)</button>`;
  document.getElementById('buyJoker').onclick = () => {
    if (score >= 30) {
      score -= 30;
      playHand = function() {
        if (handPlayed) return;
        const result = evaluateHand();
        score += result.points * 2;
        updateScore(result.points * 2);
        document.getElementById('score').innerHTML += `<br/><b>${result.name} (Joker x2!)</b>`;
        handPlayed = true;
      }
      renderShop();
    }
  }
}

document.getElementById('draw').onclick = drawHand;
document.getElementById('play').onclick = playHand;
document.getElementById('discard').onclick = discardHand;

createDeck();
shuffleDeck();
drawHand();
renderShop();
