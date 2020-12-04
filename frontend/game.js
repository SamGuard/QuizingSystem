
class Game {

    // ------------------
    // *** GAME SETUP ***
    // ------------------

    constructor(isHost, conn, teamCode, playerNumber, playerName) {
        this.score = 0;
        this.playerNumber = playerNumber;
        this.isHost = isHost;
        this.playerName = playerName;
        this.conn = conn;
        this.teamCode = teamCode;
        this.setup();
    }

    setup(){
        $("#gameMenu").hide();
        $('#gameEndScreen').hide();        
    }
    update() {
    }
    
    endGame(){
    }

    pull(mess) {
        
    }

    push() {
    
    }
}