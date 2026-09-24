#Dev commands
    set UID, key, value
    >UID: ID of the user 
    >key: which attribute to change (for example "chips")
    >value: what value to set attribute to
    - Sets attribute of userStats object to value
    - entering "all" for UID changes that attribute for *all* users in the userdata object (database)

    get UID
    >UID: ID of the user
    - Logs userStats object to the console

    backup
    - writes the entire database to a new file called
    - backup_*date*, date being the current date

    errors
    - Logs past errors to console, + amount
