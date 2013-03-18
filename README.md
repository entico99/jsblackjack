jsblackjack
===========
Javascript based blackjack simulator.

completed components
===========
- planning to put something here soon

to do
===========
- bj game engine
  - basic working model
     - dealer play
     - detecting blackjack
     - finding winner
     - finishing play
     - starting new play
   
  - doubling down
  - splitting up (up to 3 times - 4 hands)
     - essentially creating second instance of play
     - follow basic working model
     - changing hand
- app structure
  - one event handler for ui
  - play object holding all relevant settings, hands, play variables
  - comunication inteface between graphics and bj game engines
- graphics engine - independent from game engine
  - dom element builder
  - css cards
