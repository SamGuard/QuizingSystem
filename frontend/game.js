
class Game {

    // ------------------
    // *** GAME SETUP ***
    // ------------------

    constructor(isHost, conn, roomCode, playerNumber, playerName) {
        this.score = 0;
        this.playerNumber = playerNumber;
        this.isHost = isHost;
        this.playerName = playerName;
        this.conn = conn;
        this.roomCode = roomCode;
        this.setup();
    }

    setup(){
        //make a game canvas using jquery in the game canvas container.
        $("#gameMenu").hide();
        $('#gameCanvasContainer').show();// Game canvas goes in here
        $('#gameEndScreen').hide();

        this.setupCanvas(window.innerWidth * HORZ_FILL_FACTOR, window.innerHeight * VERT_FILL_FACTOR);
        
        
    }

    reset(){
        this.setup(this.isHost, this.conn, this.roomCode, this.playerNumber);
    }

    // Function to start the game
    start() {
    }

    // Sets all the needed properties of the canvas
    async setupCanvas(width, height) {
        var canvas = $('#gameCanvas')[0];
        this.ctx = canvas.getContext("2d");
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;

        this.ctx.fillStyle = "#F0F8FF";
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.imageSmoothingEnabled = false;
        let f = new FontFace('the8bit', 'url(assets/font/SuperLegendBoy-4w8Y.ttf)');
        f.load().then(function() {
            conHandler.game.ctx.font = "4px the8bit";
        });
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