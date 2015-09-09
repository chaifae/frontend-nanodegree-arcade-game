// Declaring all the reusable variables
var blockWidth = 101, blockHeight = 83, leftEdge = 0, rightEdge = 404,
topEdge = -45, bottomEdge = 370, startX = 202, startY = 370;

// List of possible player sprites
playerSprites = ['images/char-boy.png',
                 'images/char-cat-girl.png',
                 'images/char-horn-girl.png',
                 'images/char-pink-girl.png',
                 'images/char-princess-girl.png'];

// Score starts at 0
var score = 0;

// Random Number from a range function from Francisc's answer with very slight change
// http://stackoverflow.com/questions/4959975/generate-random-value-between-two-numbers-in-javascript
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Draws the score in the top left corner
function drawScore() {
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);
}

// Class that stores hitbox information for collisions.
var Rect = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};

// Collision detecting function, checks to see if any borders are overlapping/touching
// and returns true if they are. Main part of function found on MDN website
// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
Rect.prototype.intersects = function(rect) {
    return this.x < rect.x + rect.width &&
        this.x + this.width > rect.x &&
        this.y < rect.y + rect.height &&
        this.y + this.height > rect.y;
};

// Power Up class for the stars. They don't do any powerup things, just add more to the score.
var PowerUp = function() {
    this.sprite = 'images/Star.png';

    this.collisionRect = new Rect(11, 62, 79, 50);
};

// Because the powerups are randomly scattered, a seperate function was needed for "initializing"
// them, to randomly generate the positions, and check to make sure multiple stars wont share the
// same square.
PowerUp.prototype.initialize = function() {
    while (true) {
        this.x = randomNumber(0, 4) * blockWidth;
        this.y = randomNumber(1, 4) * blockHeight - 10;

        var foundInList = false;
        for (var powerUp of allPowerUps) {
            if (this != powerUp && this.x === powerUp.x && this.y === powerUp.y) {
                foundInList = true;
                break;
            } 
        }
        if (!foundInList) {
            break;
        }
    }
};


// Actually draws the stars to the canvas.
PowerUp.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    var actualRect = this.getActualRect();
};

// This returns a Rect object with the hitbox information
PowerUp.prototype.getActualRect = function() {
    return new Rect(this.x + this.collisionRect.x, this.y + this.collisionRect.y,
        this.collisionRect.width, this.collisionRect.height);
};


// Enemies our player must avoid
var Enemy = function() {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';

    // This makes sure the randomly generated enemies will stay in the
    // predetermined "lanes"
    var lanes = [50, 133, 216];
    var lane = lanes[Math.floor(Math.random()*lanes.length)];

    this.x = -blockWidth;
    this.y = lane;
    this.speed = 50 + (randomNumber(0, 2) * 25);
    this.collisionRect = new Rect(2, 78, 97, 63);
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    var actualRect = this.getActualRect();
};

// This returns a Rect object with the hitbox information
Enemy.prototype.getActualRect = function() {
    return new Rect(this.x + this.collisionRect.x, this.y + this.collisionRect.y,
        this.collisionRect.width, this.collisionRect.height);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
    this.sprite = 'images/char-boy.png';
    this.x = startX;
    this.y = startY;

    this.collisionRect = new Rect(18, 73, 66, 69);
};

// Update checks to see if the player has collided with anything
// on the game board and reacts based on what was hit
Player.prototype.update = function() {
    var playerCol = this.getActualRect();
    if (allEnemies !== null) {
        for (var enemy of allEnemies) {
            if (enemy === null) {
                continue;
            }
            var enemyCol = enemy.getActualRect();
            if (playerCol.intersects(enemyCol)) {
                this.reset('lose');
                return;
            }
        }
    }
    for (var powerUp of allPowerUps) {
        if (powerUp === null) {
            continue;
        }
        var powerUpCol = powerUp.getActualRect();
        if (playerCol.intersects(powerUpCol)) {
            allPowerUps.splice(allPowerUps.indexOf(powerUp), 1);
            score += 5;
        }
    }
};

// Actually draws the player to the canvas
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    var actualRect = this.getActualRect();
};

// This returns a Rect object with the hitbox information
Player.prototype.getActualRect = function() {
    return new Rect(this.x + this.collisionRect.x, this.y + this.collisionRect.y,
        this.collisionRect.width, this.collisionRect.height);
};

// Reset takes a type input, either 'win' or 'lose'
// 'win' puts the player back at start and generates three new stars
// 'lose' resets the score to 0
Player.prototype.reset = function(type) {
    if (type === 'win') {
        this.sprite = playerSprites[Math.floor(Math.random()*playerSprites.length)];
        score += 10;
        allPowerUps = [new PowerUp(), new PowerUp(), new PowerUp()];
        allPowerUps.forEach(function(powerUp) {
            powerUp.initialize();
        });
    }

    if (type === 'lose') {
        score = 0;
    }

    this.x = startX;
    this.y = startY;
};

// Input handling moves the character the direction of the key pressed
// but does not allow movement outside the game board.
Player.prototype.handleInput = function(key) {
    if (key === 'left' && this.x > leftEdge) {
        this.x = this.x - blockWidth;
    }
    if (key === 'right' && this.x < rightEdge) {
        this.x = this.x + blockWidth;
    }
    if (key === 'up' && this.y > topEdge) {
        this.y = this.y - blockHeight;
    }
    if (key === 'down' && this.y < bottomEdge) {
        this.y = this.y + blockHeight;
    }
    if (key === 'up' && this.y === topEdge) {
        this.reset('win');
    }
};


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
var player = new Player();

// At random intervals, generate a new enemy
setInterval(function() {allEnemies.push(new Enemy());}, randomNumber(1.5, 3) * 1000);

// Start the game with three stars
var allPowerUps = [new PowerUp(), new PowerUp(), new PowerUp()];
allPowerUps.forEach(function(powerUp) {
    powerUp.initialize();
});

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
