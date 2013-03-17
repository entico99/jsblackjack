var MYAPP = {},
    
    fiveBet = document.getElementById('fiveBet'),
    tenBet = document.getElementById('tenBet'),
    twentyfiveBet = document.getElementById('twentyfiveBet'),
    fiftyBet = document.getElementById('fiftyBet'),
    dealPlay = document.getElementById('deal'),
    drawPlay = document.getElementById('draw'),
    standPlay = document.getElementById('stand');
    
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
            dealerDrawsOnAll16  : false
        },

        dealerHand      = null,
        hands           = [],          //array of hands, up to @noOfSplits hands can be played
        shoe            = [],          //array of cards can contain multiple decks
        discards        = [],          //discarded cards pile
        canDeal         = false,       //phase of the game

        initBlackjack   = null,        //init game
        eventHandler    = null,
        getNewShoe      = null,        //functions
        drawCard        = null,
        getCardValueBJ  = null,
        getHandValue    = null,
        dealerDraw      = null,        //TODO
        getWinner       = null,        //TODO

    getNewShoe = function (noOfDecks) {  //takes @number of decks returns and array with cards from 2 decks
        var SUITS       = ["spades", "hearts", "diamonds", "clubs"], //constants
            RANKS       = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"],

            i, j, k,                     //variables
            newShoe     = [],            //array of shuffled decks to be returned, 
            suitsLength = SUITS.length,
            ranksLength = RANKS.length;

        for (k = 0; k < noOfDecks; k += 1) {
            for (i = 0; i < suitsLength; i += 1) {
                for (j = 0; j < ranksLength; j += 1) { 
                    newShoe[j + (13 * i) + (52 * k)] = {
                        rank: ranks[j],
                        suit: suits[i],
                        visibility: false,
                        value: 0
                    };  //creates array of objects - cards visibility determines if card value will be added to hand and if card is visible on table
                }
            }
        }
        newShoe = mu.reshuffleArray(newShoe);
        return newShoe;
    };

    drawCard = function (hand) { //using blackjack variable @shoe
        var card = shoe.shift(); //shoe is always shuffled, takes first card object from shoe
        
        card.value = getCardValueBJ(card.rank);
        if (card.rank === "A") {
            hand.soft += 1;  //if pulled crad is ace add 11 ace count
        }
        hand.cards.push(card);  //add card object to cards array
        return hand;
    };
    
    getCardValueBJ = function (rank) {  //returns number representing value of a card in BJ, A = 11
        if (rank === "J" || rank === "Q" || rank === "K") {
            return 10;
        } else if (rank === "A") {
            return 11;
        } else {
            return rank;
        }
    };
    getHandValue = function (hand) {
        
    };
    dealerDraw = function () {  //call this function like that while (dealerDraw) { dealer.hand.push(drawCard(deck)); }
        var dealerHand = getPlayerHandValue(dealer.hand);
        if (gameRules.dealerDrawsOnSoft16) {  //dealer draws on soft 16s and stands on all 17s
            if (dealer.soft && getPlayerHandValue(dealer.hand) < 17) {
                return true;
            } else {
                return false;
            }
        } else if (gameRules.dealerDrawsOnAll16) {  //dealer draws on all 16s and stands on all 17s
            if (getPlayerHandValue(dealer.hand) < 17) {
                return true;
            }
            return true;
        } else {
            return false;
        }
    };
    
    getWinner = function (player, dealer) {
        var playerHand = getPlayerHandValue(player.hand),
            dealerHand = getPlayerHandValue(dealer.hand);
    
        if (playerHand > dealerHand) {
            return player; //return player
        } else if (dealerHand > playerHand) {
            return dealer;//return dealer
        } else {
            return push; //define object push
        }
    };
    //  functions operation in public
    function bet (hand, am) {
        if (am === 0) {
            canDeal = false;
            hand.bet = 0;
        } else {
            canDeal = true;
            hand.bet += am;
        }
        return hand;
    };
    function deal () {
        hands[0].cards.push(draw(hands[0],true));
        dealerHand.cards.push(draw(dealerHand,false));
        hands[0].cards.push(draw(hands[0],true));
        dealerHand.cards.push(draw(dealerHand,true));
    };
    function draw (hand,vis) {
        hand.value = getHandValue(drawCard(hand));
        if (hand.value < 21) {
            return hand;
        } else {
            stand(hand);
        };
    };
    function stand (hand) {
        
    };
    eventHandler = function (elem) {
        var elem = elem || window.event,
            src = elem.target || elem.srcElement;
            
        if (src.id === "fiveBet") {
            hands[0] = bet(hands[0],5);
            console.log(hands[0].bet);
        } else if (src.id === "tenBet") {
            hands[0] = bet(hands[0],10);
            console.log(hands[0].bet);
        } else if (src.id === "twentyfiveBet") {
            hands[0] = bet(hands[0],25);
            console.log(hands[0].bet);
        } else if (src.id === "fiftyBet") {
            hands[0] = bet(hands[0],50);
            console.log(hands[0].bet);
        } else if (src.id === "currentBet") { 
            hands[0] = bet(hands[0],0);
            console.log(hands[0].bet);
        } else if (src.id === "deal") {
            if (canDeal) {
                deal();
            }
        } else {};
    };
    
    initBlackjack = function () {
        //add event listeners
        hands[0] = {
            bet: 0,
            cards: [],
            value: 0,
            player: "player"
        };
        dealerHand = {
            cards: [],
            value: 0
        };
    };
    return {
        initBlackjack: initBlackjack,
        eventHandler: eventHandler
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
        var i,
            arrLength = arr.length,
            reshuffledArr = [];
        for (i = arrLength; i > 0; i -= 1) {
            reshuffledArr[arrLength - i] = arr.splice(Math.floor(Math.random() * i), 1)[0];  //my own version of Fisher-Yates shuffling algorythm.
        }
        return reshuffledArr;
    };
    

    
    return {
        addListener: addListener, //addListener(element, event type, function to be executed)
        removeListener: removeListener, //removeListener(element, event type, function to be executed)
        reshuffleArray: reshuffleArray,
        eventHandler: eventHandler
    };
}());


function init (){
    var mu = MYAPP.utils,
        mb = MYAPP.blackjack;    
    //initialising function to set up the game
    mb.initBlackjack();
    mu.addListener(document.getElementById('gameContainer'), "click", mb.eventHandler);

    // Get the element, add a click listener...
    //document.getElementById("rowOfChips").addEventListener("click",function(e) {
	// e.target is the clicked element!
	// If it was a list item
	
};

// TO DO
// think what other "module functions" I may need
// figure out flow control and game "Engine"