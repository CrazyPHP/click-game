document.addEventListener('DOMContentLoaded', function (){
    // get user from storage
    window.user = getCurrentUser();
    // start game engine
    window.game = new Game(window.user);
});
