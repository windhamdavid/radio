(function(){

    // The only room. Must match the server's $MAIN_ROOM and the id of the pane
    // in index.html -- messages are routed into '#<room> #room_messages', so
    // all three have to agree.
    var ROOM = 'Lobby';

    // ***************************************************************************
    // Socket.io events
    // ***************************************************************************

    var socket = window.RADIO.socket;

    // Connection established
    socket.on('connected', function (data) {
        console.log(data);

        // Get users connected to mainroom
        socket.emit('getUsersInRoom', {'room':ROOM});
    });

    // Disconnected from server
    socket.on('disconnect', function (data) {
        var info = {'room':ROOM, 'username':'Daveo-bot', 'msg':'---- Lost connection ----'};
        addBotMessage(info);
    });
    
    // Reconnected to server
    socket.on('reconnect', function (data) {
        var info = {'room':ROOM, 'username':'Daveo-bot', 'msg':'---- Reconnected ----'};
        addBotMessage(info);
    });

    // subscriptionConfirmed / unsubscriptionConfirmed are gone with rooms. The
    // single pane is static markup, so there is no room UI left to build or
    // tear down at runtime.

    // User joins room
    socket.on('userJoinsRoom', function(data) {
        console.log("userJoinsRoom: %s", JSON.stringify(data));
        // Log join in conversation
        addMessage(data);
    
        // Add user to connected users list
        addUser(data);
    });

    // User leaves room
    socket.on('userLeavesRoom', function(data) {
        console.log("userLeavesRoom: %s", JSON.stringify(data));
        // Log leave in conversation
        addMessage(data);

        // Remove user from connected users list
        removeUser(data);
    });

    // Message received
    socket.on('newMessage', function (data) {
        console.log("newMessage: %s", JSON.stringify(data));
        addMessage(data);

        // Scroll down room messages
        var room_messages = '#'+data.room+' #room_messages';
        $(room_messages).animate({
            scrollTop: $(room_messages).height()
        }, 300);
    });

    // Users in room received
    socket.on('usersInRoom', function(data) {
        console.log('usersInRoom: %s', JSON.stringify(data));
        _.each(data.users, function(user) {
            addUser(user);
        });
    });

    // User nickname updated
    socket.on('userNicknameUpdated', function(data) {
        console.log("userNicknameUpdated: %s", JSON.stringify(data));
        updateNickname(data);

        msg = '----- ' + data.oldUsername + ' is now ' + data.newUsername + ' -----';
        var info = {'room':data.room, 'username':'Daveo-bot', 'msg':msg};
        addBotMessage(info);
    });

    // ***************************************************************************
    // Templates and helpers
    // ***************************************************************************
    
    var templates = {};
    var getTemplate = function(path, callback) {
        var source;
        var template;
 
        // Check first if we've the template cached
        if (_.has(templates, path)) {
            if (callback) callback(templates[path]);
        // If not we get and compile it
        } else {
            $.ajax({
                url: window.RADIO.url(path),
                success: function(data) {
                    source = data;
                    template = Handlebars.compile(source);
                    // Store compiled template in cache
                    templates[path] = template;
                    if (callback) callback(template);
                }
            });
        }
    }

    // Add message to room
    var addMessage = function(msg) {
        getTemplate('js/templates/message.handlebars', function(template) {
            var room_messages = '#'+msg.room+' #room_messages';
            $(room_messages).append(template(msg));
        });
    };
    
    // Robot Add message to room
    var addBotMessage = function(msg) {
        getTemplate('js/templates/message-bot.handlebars', function(template) {
            var room_messages = '#'+msg.room+' #room_messages';
            $(room_messages).append(template(msg));
        });
    };
    
    // Add user to connected users list
    var addUser = function(user) {
        getTemplate('js/templates/user.handlebars', function(template) {
            var room_users = '#'+user.room+' #room_users';
            // Add only if it doesn't exist in the room
            var user_badge = '#'+user.room+' #'+user.id;
            if (!($(user_badge).length)) {
                $(room_users).append(template(user));
            }
        });
    }

    // Remove user from connected users list
    var removeUser = function(user) {
        var user_badge = '#'+user.room+' #'+user.id;
        $(user_badge).remove();
    };

    // Get current room.
    //
    // This used to read the active tab's text. With the tab bar gone that
    // returned '', which the server rejects as an invalid room name -- posting
    // would have failed silently. There's one room, so name it directly.
    var getCurrentRoom = function() {
        return ROOM;
    };

    // Get message text from input field
    var getMessageText = function() {
        var text = $('#message_text').val();
        $('#message_text').val("");
        return text;
    };

    // Get nickname from input field
    var getNickname = function() {
        var nickname = $('#nickname').val();
        $('#nickname').val("");
        return nickname;
    };

    // Update nickname in badges
    var updateNickname = function(data) {
        var badges = '#'+data.room+' #'+data.id;
        $(badges).text(data.newUsername);
    };

    // ***************************************************************************
    // Events
    // ***************************************************************************

    // Send new message
    $('#b_send_message').click(function(eventObject) {
        eventObject.preventDefault();
        if ($('#message_text').val() != "") {
            socket.emit('newMessage', {'room':getCurrentRoom(), 'msg':getMessageText()});
        }
    });

    // Joining and leaving rooms is gone -- there is one room now, and the
    // server no longer accepts subscribe/unsubscribe, so it isn't just the UI
    // that's hidden.

})();

