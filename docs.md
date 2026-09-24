#Asset Handler (handling all assets/emojis)
    badges()
    - Returns object containing all badges and their emojis

    cards()
    - Returns object containing all cards and their IDs

    gif(name)
    >Name: name of gif
    - Returns link to requested gif

#Card Handler (handling cards & their emojis)
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
    
#Data Handler (database stuff)
    userGet(ID)
    >ID: ID of the user
    - Returns "userStats" object
    
    sort(parameter)
    >parameter: parameter which to sort by (for example "xp")
    - Returns array of userStats object sorted by parameter, descending
    
    userSave(ID, saveStats)
    >ID: ID of the user 
    >saveStats: userStats object to be saved
    - Overwrites userStats object in database with saveStats, saving the users data
    
    devGet(ID)
    >ID: ID to check for
    - Checks if an ID is in the userdata object (database)
    
    devGlobal()
    - Returns userdata object
    
#Error Handler (displaying errors to users)
    error(interaction, e_text)
    >interaction: Discord Interaction to **edit**
    >e_text: Text to display in embed => eror message
    
#XP Handler (leveling, badges)
    leveling(userStats, reward)
    >userStats: userStats object
    >reward: amount to increase users XP by
    - Increases users XP by "reward" 
    - Increases users Level by one, if conditions are met 
    
    achievements(userStats, pre, won, gameID, reward, bet, additional)
    >userStats: userStats object
    >pre: users money before playing the game
    >won: if user won the game (boolean)
    >gameID: ID of the game the user was playing
    >reward: reward the user received 
    >bet: how much the user has bet
    >additional: custom field, used to trigger certain badges
    - Assigns badges to user if conditions are met
    
