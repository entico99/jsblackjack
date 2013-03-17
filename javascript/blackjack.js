var MYAPP = {};
    
/*    fiveBet = document.getElementById('fiveBet'),
    tenBet = document.getElementById('tenBet'),
    twentyfiveBet = document.getElementById('twentyfiveBet'),
    fiftyBet = document.getElementById('fiftyBet'),
    dealPlay = document.getElementById('deal'),
    drawPlay = document.getElementById('draw'),
    standPlay = document.getElementById('stand');*/
    
MYAPP.namespace = function (ns_string) {  //Stefanov, Stoyan (2010-09-09). JavaScript Patterns (Kindle Locations 2209-2214). O'Reilly Media. Kindle Edition. 
    "use strict";
    var parts = ns_string.split('.'),
        parent = MYAPP,
        i;  // strip redundant leading global 
    if (parts[0] === "MYAPP") {
        parts = parts.slice(1);
    }
    for (i = 0; i < parts.length; i += 1) {  // create a property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};


MYAPP.namespace('MYAPP.blackjack');
MYAPP.blackjack = (function () {
    "use strict";
    var mu              = MYAPP.utils, //for easier communitations with module @MYAPP.utils
        gameOptions     = {            //default options, need to work on adding more stuff here
            reshuffleThreshold  : 1,
            noOfSplits          : 1,
            noOfDecks           : 1,
            dealerDrawsOnSoft16 : true,
            dealerDrawsOnAll16  : false,
            dealerPeeksOnA      : false,
            dealerPeeksOnAor10  : false,
            dealerDoesntPeek    : false
        },
        hands           = {
            playerHands         : [],
            dealerHand          : {
                cards           : [],
                soft            : 0
            }
        },

        currentChips    = 1000,
        currentHand     = 0,
        shoe            = [],          //array of cards can contain multiple decks
        discards        = [],          //discarded cards pile
        canDeal         = false,       //phase of the game
        splits          = 0,
        

        getNewShoe      = null,
        //APIs
        initBlackjack   = null,        //init game
        betHandler      = null,        //event handler for user interaction
        playHandler     = null,
        screenHandler   = null;        //screen handler for updationg screen

    getNewShoe = function (noOfDecks) {  //takes @number of decks returns and array with cards from 2 decks
        var SUITS       = ["&spades;", "&hearts;", "&diams;", "&clubs;"], //constants
            RANKS       = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"],

            i, j, k,                     //variables
            newShoe     = [],            //array of shuffled decks to be returned, 
            suitsLength = SUITS.length,
            ranksLength = RANKS.length,
            noOfDecks   = gameOptions.noOfDecks;

        for (k = 0; k < noOfDecks; k += 1) {
            for (i = 0; i < suitsLength; i += 1) {
                for (j = 0; j < ranksLength; j += 1) { 
                    newShoe[j + (13 * i) + (52 * k)] = {
                        rank: RANKS[j],
                        suit: SUITS[i],
                        visible: false,
                        value: 0
                    };  //creates array of objects - cards visibility determines if card value will be added to hand and if card is visible on table
                }
            }
        }
        console.log(newShoe);
        newShoe = MYAPP.utils.reshuffleArray(newShoe);
        return newShoe;
    };


    function getCardValueBJ(rank) {  //returns number representing value of a card in BJ, A = 11
        if (rank === "J" || rank === "Q" || rank === "K") {
            return 10;
        } else if (rank === "A") {
            return 11;
        } else {
            return rank;
        }
    };
    
    function updateHandValue(hand) {  //this function will calculate highest not busted (if possible) hand value, update hand.value & hand.soft property and return hand
        var i;
        hand.value = 0;  //reset hand value and number of aces
        hand.soft = 0;

        for (i = 0; i < hand.cards.length; i += 1) {  
            if (card[i].visible) {
                hand.value += card[i].value;  //add all visible cards in cards array
                if (card[i].rank === "A") {  //add all aces valued 11 in property soft
                    hand.soft += 1;
                }
            }
        }
        while (hand.soft > 0) {  //while there are aces that count for 11
            if (hand.value > 21) {  //check if hand value is bust
                hand.value -= 10;  //reduce hand value by 10
                hand.soft -= 1; //reduce number of aces counted for 11
            }
        }
        return hand;
    };

    function dealerPlay() {  //call this function like that while (dealerDraw) { dealer.hand.push(drawCard(deck)); }
        hands.playerHands[currentHand].canDraw = false;
        hands.playerHands[currentHand].canSplit = false;
        hands.playerHands[currentHand].canDouble = false;
        hands.dealerHand.cards[0].visible = true;

        hands.dealerHand = updateHandValue(hands.dealerHand);
        if (gameRules.dealerDrawsOnSoft16) {  //dealer draws on soft 16s and stands on all 17s
            while (hands.dealerHand.value < 17 && hands.dealerHand.soft > 0) {
                hands.dealerHand = updateHandValue(draw(hands.dealerHand,true));
            }
        } else if (gameRules.dealerDrawsOnAll16) {  //dealer draws on all 16s and stands on all 17s
            while (hands.dealerHand.value < 17) {
                hands.dealerHand = updateHandValue(draw(hands.dealerHand,true));
            }
            
        } else {};
        getWinner(hand[currentHand]);
    };
    
    function getWinner(hand) {
        if (hand.value > hands.dealerHand.value) {
            currentChips += hand.bet;                //TODO announce player winner
        } else if (hands.dealerHand.value > hand.value) {
            currentChips -= hand.bet;                //TODO announce dealer winner
        } else {
                                                     //TODO announce push
        }

        endPlay();
    };

    
    function bet (hand, amount) {
        if (!hand.canBet) { 
            return null; 
        }
        else {
            if (amount === 0) {
                canDeal = false;
                hand.bet = 0;
                MYAPP.utils.removeListener(document.getElementById('playPanel'), "click", playHandler);
            } else {
                canDeal = true;
                hand.bet += amount;
                MYAPP.utils.addListener(document.getElementById('playPanel'), "click", playHandler);
            }
            return hand;
        }
    };
    function deal () {
        hands.playerHands[currentHand] = draw(hands.playerHands[currentHand],true);
        hands.dealerHand = draw(hands.dealerHand,false);
        hands.playerHands[currentHand] = draw(hands.playerHands[currentHand],true);
        hands.dealerHand = draw(hands.dealerHand,true);
    };
    function draw (hand,vis) {
        var card = null;
        card = shoe.shift(); //shoe is always shuffled, takes first card object from shoe
        card.visible = vis;
//console.log("Card drawn is " + card.suit + card.rank + " and card value  is " + card.value + ", this card is visible " + card.visible);
        hand = updateHandValue(hand.push(card));
        screenHandler("cards");
        return hand;
    };
    function stand () {
        
    };
    function endPlay () {
        canBet = true;
        canDeal = false;
        canDraw = false;
        canStand = false;
        canSplit = false;
        canDoubleDown = false;
    };
    //  functions with public interfaces
    betHandler = function (elem) {
        var elem = elem || window.event,
            src = elem.target || elem.srcElement;
        switch(src.getAttribute("alt")) {
        case "Bet Five":
            hands.playerHands[currentHand] = bet(hands.playerHands[currentHand],5);
            screenHandler("bet");
            break;
        case "Bet Ten":
            hands.playerHands[currentHand] = bet(hands.playerHands[currentHand],10);
            screenHandler("bet");
            break;
        case "Bet Twenty Five":
            hands.playerHands[currentHand] = bet(hands.playerHands[currentHand],25);
            screenHandler("bet");
            break;
        case "Bet Fifty":
            hands.playerHands[currentHand] = bet(hands.playerHands[currentHand],50);
            screenHandler("bet");
            break;
        case "Clear Bet":
            hands.playerHands[currentHand] = bet(hands.playerHands[currentHand],0);
            screenHandler("bet");
            break;
        default:
            break;
        }
    }
    playHandler = function (elem) {
        var elem = elem || window.event,
            src = elem.target || elem.srcElement,
            plHand = hands.playerHands[currentHand],
            dlHand = hands.dealerHand;

        hands.playerHands[currentHand].canBet = false;
        mu.removeListener(document.getElementById('rowOfChips'), "click", betHandler);
        switch(src.getAttribute("alt")) {
        case "deal":
            if (!hands.playerHands[currentHand].canDeal) {
                break;
            } else {
                console.log("Deal!");
                canDeal = false;
                deal();
                setTimeOut ((function () {
                    if (updateHandValue(hand[currentHand]).value === 21) {

                        dealerPlay();//dealer play
                    } else {
                        //display draw, split, dd buttons
                        hands.playerHands[currentHand].canDraw = true;
                        hands.playerHands[currentHand].canSplit = true;
                        hands.playerHands[currentHand].canDouble = true;
                    }
                }()),1000);
            };  
            break;
        case "draw":
            if (!hands.playerHands[currentHand].canDraw) {
                break;
            } else {
                canDraw = false;
                setTimeOut((function () {
                    if(updateHandValue(draw(plHand,true)).value > 21) {
                        dealerPlay();
                    } else {
                        candDraw = true;
                    }
                }()),1000);
                // screenHandler("div", "playercXcontainer");    
            };
            break;
        case "doubleDown":
            if (!hands.playerHands[currentHand].canDouble) {
                break;
            } else {
                canDouble = false;
                hands.playerHands[currentHand] = bet(hands.playerHands[currentHand],hands.playerHands[currentHand].bet)
                // screenHandler("div", "playPanel")
            }
            break;
        case "split":
            if (!hands.playerHands[currentHand].canSplit) {
                break;
            } else {
                canSplit = false;
                // do some splitting here
            }
            break;
        case "stand":

        }
     
    };

    function updateChildNode (oldChild, newChild, parent) {
        if (oldChild != null) {
            oldChild.parentNode.replaceChild(newChild, oldChild);
        } else {
            parent.appendChild(newChild);
        }
    };

    screenHandler = function (screenElem) {
        var i = null,
            j = null, 
            betAmount = null,
            cardsInHand = null,
            oldNode = null, 
            newNode = null,
            nodeContent = null,
            parent = null;
        switch (screenElem) {
        case "bet":

            betAmount = hands.playerHands[currentHand].bet;
            nodeContent = document.createTextNode(betAmount);
            newNode = document.createElement("div");
            newNode.appendChild(nodeContent);
            newNode.setAttribute("id", "currentBet" + currentHand);
            if(betAmount === 0) {
                newNode.setAttribute("class", "currentBetOff");
            } else {
                newNode.setAttribute("class", "currentBetOn");
            }

            for (i = splits; i >= 0; i -= 1) {  //using global variable splits to iterate through all hands
                oldNode = document.getElementById("currentBet" + i);
                if (i === currentHand) {  //if current hand, update it
                    updateChildNode(oldNode, newNode, document.getElementById("hand" + i));    
                } else {  //if not current hand switch off bet
                    oldNode.setAttribute("class", "currentBetOff");
                }
            }
        case "cards":
            //player cards, updating all hands
            
            for (i = splits; i >= 0; i -= 1 ) {
                cardsInHand = hands.playerHands[i].cards.length;
                for (j = 0; j < cardsInHand; j += 1) {
                    oldNode = document.getElementById("hand" + i + "card" + j);
                    nodeContent = hands.playerHands[i].cards[j].rank + " of " + hands.playerHands[i].cards[j].suit;
                    newNode = document.createElement("div");
                    newNode.appendChild(nodeContent);
                    newNode.setAttribute("class", "card" + j + "of" + cardsInHand);

                }
            }
            break;
        default:
            break;
        }
        /*var elemContent = document.createTextNode(domElementContent),
            elem = document.createElement(domElementType);
        elem.setAttribute("class", domElementClass);
        elem.appendChild(elemContent);
        elem.id = domElementID;
//console.log(document.getElementById(domElementID));
        if (document.getElementById(domElementID) != null) { //check if node with ID exists if yes replace if no create
            document.getElementById(domElementID).parentNode.replaceChild(elem, document.getElementById(domElementID));
        } else {
            document.getElementById(domElementParent).appendChild(elem);
        }*/
        
        //do some screen magic here
    };

    initBlackjack = function () {

        hands.playerHands[0] = {
            bet: 0,
            cards: [],
            value: 0,
            soft: 0,
            canBet: true,
            canDraw: false,
            canSplit: false,
            canDouble: false,
            player: "player"
        };
        hands.dealerHand = {
            cards: [],
            value: 0,
            soft: 0
        };
        shoe = getNewShoe();
        screenHandler("bet");
    };
    return {
        initBlackjack: initBlackjack,
        betHandler: betHandler,
        playHandler: playHandler
    };

}());

MYAPP.namespace('MYAPP.utils');
MYAPP.utils = (function () {
    "use strict";
    var addListener = null,
        removeListener = null,
        reshuffleArray = null,
        eventHandler = null;
 
    if (window.addEventListener) {
        addListener = function (el, type, fn) {
            el.addEventListener(type, fn, false);
        };
        removeListener = function (el, type, fn) {
            el.removeEventListener(type, fn, false);
        };
    } else if (document.attachEvent) { //IE
        addListener = function (el, type, fn) {
            el.attachEvent('on' + type, fn);
        };
        removeListener = function (el, type, fn) {
            el.detachEvent('on' + type, fn);
        };
    } else { //older browsers
        addListener = function (el, type, fn) {
            el['on' + type] = fn;
        };
        removeListener = function (el, type, fn) {
            el['on' + type] = null;
        };
    }
    reshuffleArray = function (arr) {
        console.log("Array shuffling called!, array to be reshuffled is " + arr);
        var i,
            arrLength = arr.length,
            reshuffledArr = [];
        for (i = arrLength; i > 0; i -= 1) {
            reshuffledArr[arrLength - i] = arr.splice(Math.floor(Math.random() * i), 1)[0];  //my own version of Fisher-Yates shuffling algorythm.
        }
        console.log("Reshuffled array is " + reshuffledArr);
        return reshuffledArr;
    };

    return {
        addListener: addListener, //addListener(element, event type, function to be executed)
        removeListener: removeListener, //removeListener(element, event type, function to be executed)
        reshuffleArray: reshuffleArray,
        eventHandler: eventHandler
    };
}());


function init (){  //initialising function to set up the game
    var mu = MYAPP.utils,
        mb = MYAPP.blackjack;    
    
    mb.initBlackjack();
    mu.addListener(document.getElementById('chipsContainer'), "click", mb.betHandler);

};

// TO DO
// add message box that player can not deal