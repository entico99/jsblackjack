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
    var //mu              = utils, //for easier communitations with module @MYAPP.utils
        //ms              = MYAPP.screenOps,  //for easier access to screen operating module
        gameOptions     = {        //default options, need to work on adding more stuff here
            blackjackPayout     : 1.5,
            reshuffleThreshold  : 1,
            noOfSplits          : 1,
            noOfDecks           : 1,
            dealerDrawsOnSoft17 : true,
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
        splits          = 0,
        
        getNewShoe      = null,
        deal            = null,
        draw            = null,
        bet             = null,
        //APIs
        initBlackjack   = null,        //init game
        eventHandler    = null,
        betHandler      = null,        //event handler for user interaction
        playHandler     = null,
        screenHandler   = null,        //screen handler for updationg screen
        updateChildNode = null,
        placeBet        = null,
        checkBlackjack  = null,
        checkWinner     = null,
        checkHiddenCard = null;


    getNewShoe = function () {  //takes @number of decks returns and array with cards from 2 decks
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
//console.log(hand.cards[0].rank);
        for (i = 0; i < hand.cards.length; i += 1) {  
            if (hand.cards[i].visible) {
                hand.value += hand.cards[i].value;  //add all visible cards in cards array
                if (hand.cards[i].rank === "A") {  //add all aces valued 11 in property soft
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

    stand = function () {  //call this function like that while (dealerDraw) { dealer.hand.push(drawCard(deck)); }
        
        hands.dealerHand.cards[0].visible = true;
        hands.dealerHand = updateHandValue(hands.dealerHand);
        if (gameRules.dealerDrawsOnSoft17) {  //dealer draws on soft 17s
            while (hands.dealerHand.value <= 17 && hands.dealerHand.soft > 0) {
                hands.dealerHand = updateHandValue(draw(hands.dealerHand,true));
            }
        } else if (gameRules.dealerDrawsOnAll16) {  //dealer draws on all 16s and stands on all 17s
            while (hands.dealerHand.value < 17) {
                hands.dealerHand = updateHandValue(draw(hands.dealerHand,true));
            }
        }
        checkWinner();
    };
    
    checkWinner = function(hand) {
        if (hand.value > hands.dealerHand.value) {
            currentChips += hand.bet;                //TODO announce player winner
            console.log("player won")
        } else if (hands.dealerHand.value > hand.value) {
            currentChips -= hand.bet;                //TODO announce dealer winner
            console.log("dealer won")
        } else {
                                                     //TODO announce push
        }

        endPlay();
    };
    checkHiddenCard = function () {
        var card = hands.dealerHand.cards[0];

        card.visibility = true;
        card.value = getCardValueBJ(card);
        card.visibility = false;
        return card.value;
    }
    checkBlackjack = function (hand) {
        var dealerCard = hands.dealerHand.cards[1].value,
            playerHandBlackjack = false,
            dealerHandBlackjack = false;

        if (hand.value === 21 && hand.cards.length === 2) {
            playerHandBlackjack = true;
        }

        if (checkHiddenCard() + dealerCard === 21 && hands.dealerHand.cards.length === 2) {
            if (gameRules.dealerPeeksOnA && dealerCard === 11) {
                dealerHandBlackjack = true;    
            } else if (gameRules.dealerPeeksOnAor10 && (dealerCard === 11 || dealerCard === 10)) {
                dealerHandBlackjack = true;    
            }
        }

        if (playerHandBlackjack && !dealerHandBlackjack) {
            currentChips += hands.playerHands[currentHand].bet * gameOptions.blackjackPayout;  //TODO announce winner, end game
            console.log("player BJ!")
        } else if (!playerHandBlackjack && dealerHandBlackjack) {
            currentChips -= hands.playerHands[currentHand].bet;                                //TODO announce winner, end game
            console.log("dealer BJ!")
        } else if (playerHandBlackjack & dealerHandBlackjack) {
                                                                                               //TODO announce push
        }

    }

    deal = function () {
        var p1 = draw(true),
            p2 = draw(true),
            d1 = draw(false),
            d2 = draw(true);
        hands.playerHands[currentHand].cards = [p1, p2];
        hands.dealerHand.cards = [d1, d2];
    };

    draw = function (vis) {
        var card = shoe.shift(); //shoe is always shuffled, takes first card object from shoe
            card.visible = vis;
            card.value = getCardValueBJ(card.rank);
            return card;
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

    placeBet = function (hand,amount) {    
        if (amount === 0) {
            hand.canDeal = false;
            hand.bet = 0;
        } else {
            hand.canDeal = true;
            hand.bet += amount;
        }
        screenHandler("bet", hands.playerHands[currentHand].bet);
        return hand;
    };

    //  functions with public interfaces
    betHandler = function (newBet, callback) {  //in case I want to do something before placing a bet
        var hand = hands.playerHands[currentHand];
        if (!hand.canBet || hand.canDraw || hand.canSplit || hand.canDouble) {
            console.log("can not bet now");
            return null; 
        } else {
            callback(hand,newBet);    
        };
    };
    
    
    playHandler = function (playEvent) {
        var playerHand = hands.playerHands[currentHand];
        switch (playEvent) {
        case "deal":
            if (playerHand.canDeal) {
                deal();
                playerHand.canDeal = false;
                updateHandValue(hands.playerHands[currentHand]);
                updateHandValue(hands.dealerHand);
                checkBlackjack(hands.playerHands[currentHand]);
            }
            break;
        case "draw":
            hand.playerHands[currentHand] = draw(hand.playerHands[currentHand], true);
            updateHandValue(hands.playerHands[currentHand]);
            break;
        case "stand":
            stand();
        }
    }
    eventHandler = function (elem) {
        var elem = elem || window.event,
            src = elem.target || elem.srcElement,
            bet = null;
        switch (src.getAttribute("alt")) {
        case "Bet Five":
            betHandler(5, placeBet);
            break;
        case "Bet Ten":
            betHandler(10, placeBet);
            break;
        case "Bet Twenty Five":
            betHandler(25, placeBet);
            break;
        case "Bet Fifty":
            betHandler(50, placeBet);
            break;
        case "Clear Bet":
            betHandler(0, placeBet);
            break; 
        case "Deal":
            playHandler("deal");
            break; 
        case "Draw":
            playHandler("draw");
            break; 
        case "Stand":
            console.log("stand");
            break; 
        case "Split":
            console.log("split");
            break; 
        case "Double Down":
            console.log("doubleDown");
            break; 
        case "reset":
            initBlackjack();
            break;
        default:
            break; 

        }
    };


    
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

    initBlackjack = function () {

        hands.playerHands[0] = {
            bet: 0,
            cards: [],
            value: 0,
            soft: 0,
            canDeal: true,
            /*canBet: true,

            canDraw: false,
            canSplit: false,
            canDouble: false,*/
            player: "player"
        };
        hands.dealerHand = {
            cards: [],
            value: 0,
            soft: 0,
            player: "dealer"
        };
        shoe = getNewShoe();
    };
    return {
        initBlackjack: initBlackjack,
        eventHandler: eventHandler,
        playHandler: playHandler
    };

}());
MYAPP.namespace('MYAPP.screenOps')
MYAPP.screenOps = (function () {
    "use strict";
    var updateChildNode      = null,
        prepareNode          = null,
 

    updateChildNode = function (oldChild, newChild, parent) {
        var parentElem = document.getElementById(parent);
        if (oldChild != null) {
            oldChild.parentNode.replaceChild(newChild, oldChild);
        } else {
            parentElem.appendChild(newChild);
        }
    };
    prepareNode = function (elem) {
        var 
            newNode = document.createElement(elem.elemType);
        newNode.setAttribute("id", elem.elemID);
        newNode.setAttribute("class", elem.elemClass);
        newNode.appendChild(elem.elemContent);
        updateChildNode(document.getElementById(elem.elemID), newNode, elem.elemParentID);
    };
    
    return {
        prepareNode: prepareNode
    };
}());
MYAPP.namespace('MYAPP.utils');
MYAPP.utils = (function () {
    "use strict";
    var addListener = null,
        removeListener = null,
        reshuffleArray = null;
 
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
        reshuffleArray: reshuffleArray
    };
}());


function init (){  //initialising function to set up the game
    var mu = MYAPP.utils,
        mb = MYAPP.blackjack;    
    
    mb.initBlackjack();
    mu.addListener(document, "click", mb.eventHandler);

};

// TO DO
// think about function deal, there are couple of options
// 1) write function drawHandler which will callback draw function and pass it screenHandler as an argument
// 2) deal will call playHandler with argument draw and play Handler will call draw with callback screenHandler
//    this option will require another argument which hands is being drawn, for playHandler, it must interpret hand and call draw on correct hand. 

/*screenHandler = function (elem, elemCont) {  // this method holds screen elements definitions, 
                                                 //when called it picks up definition, 
                                                 //loads it to variable screenElement and calls 
                                                 //DOM node creator function for element to be placed on the page
        var screenElement,
            BET = {
                elemType: "div",
                elemParentID: "player" + currentHand + "Hand",
                elemID: "player" + currentHand + "bet",
                elemClass: "player" + currentHand + "bet",
                elemContent: document.createTextNode(elemCont)
            },
            CARD = {
                elemType: "div",
                elemParentID: elemCont.player + (elemCont.cards.length - 1) + "card",
                elemID: elemCont.player + elemCont.cards.length + card,
                elemClass: elemCont.player + elemCont.cards.length + card,
                elemContent: elemCont.cards[elemCont.cards.length - 1].rank + elemCont.cards[elemCont.cards.length - 1].suit
            }

        switch (elem) {
        case "bet":
            screenElement = BET;
            break;
        case "draw":
            screenElement = CARD;
        default:
            break;
        }
        MYAPP.screenOps.prepareNode(screenElement);
    }; */