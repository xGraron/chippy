##Handlers

#Asset Handler
    badges()
    - Returns object containing all badges and their emojis

    cards()
    - Returns object containing all cards and their IDs

    gif(name)
    >Name: name of gif
    - Returns link to requested gif

#Card Handler
    create(UID, size, template)
    >UID: Discord ID of user associated with the deck
    >size: amount of template decks to be shuffled into one finished deck (default 1)
    >template: which template to pick from (standard, short)
    - Creates a new deck & saves it
    
    draw(ID)
    >ID: Deck ID of the deck from which to draw from
    - Returns a random card from the deck and removes
    
    burn(ID, amount)
    >ID: Deck ID of the deck of which to burn a card
    >amount: Amount of cards to burn (default 1)
    - Removes a random card from the Deck, does not return the card
    
    remove(ID)
    >ID: Deck ID of the deck to remove
    - Deletes the .json file of a deck
    
