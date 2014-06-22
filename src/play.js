Game.Play = function (game) { };

var play = {
    levelIndex: +localStorage.levelIndex || 0,
};

Game.Play.prototype = {
    create: function () {
	play.level = Game.levels[play.levelIndex];

	game.stage.backgroundColor = play.level.backgroundColor;

	play.startTime = game.time.now;

	game.physics.startSystem(Phaser.Physics.Arcade);
	play.cursors = game.input.keyboard.createCursorKeys();

	play.restartKey = game.input.keyboard.addKey(Phaser.Keyboard.R);
	play.restartKey.onDown.add(this.endGame, this);

	play.player = game.add.sprite(Game.w / 2, Game.h / 2, 'purple');
	play.player.imageWidth = 18;
	play.player.initialWidth = play.level.initialPlayerWidth;
	play.player.scale.setTo(play.player.initialWidth / play.player.imageWidth, play.player.initialWidth / play.player.imageWidth);
	play.player.anchor.setTo(0.5, 0.5);
	game.physics.arcade.enable(play.player);
	play.player.acceleration = play.level.acceleration;
	play.player.body.drag.setTo(play.level.drag, play.level.drag);
	play.player.body.maxVelocity.setTo(play.level.maxVelocity, play.level.maxVelocity);
	play.player.body.collideWorldBounds = true;

	play.enemies = game.add.group();
	play.enemies.enableBody = true;
	play.enemiesCreated = 0;

	play.scoreText = game.add.text(10, 10, '', { font: '20px Arial', fill: '#aaa' });
	play.levelText = game.add.text(Game.w - 5, 5, '', { font: '12px Arial', fill: '#aaa' });
	play.levelText.anchor.x = 1;
    },
    
    update: function () {
	game.physics.arcade.overlap(play.player, play.enemies, this.eat, null, this);
	game.physics.arcade.overlap(play.enemies, play.enemies, this.eat, null, this);

	play.enemies.forEachAlive(this.enemyBoundary, this);

	if (game.time.now - play.startTime > play.level.enemySpawnRate * play.enemiesCreated) {
	    this.generateEnemy(play.level.enemySpeed);
	}

	if (!play.player.alive) {
	    this.endGame();
	}

	this.controls();

	play.scoreText.text = this.calcScore() + ' / ' + play.level.scoreGoal;
	play.levelText.text = (play.levelIndex + 1) + ' / ' + Game.levels.length;

	if (this.calcScore() >= play.level.scoreGoal) {
	    console.log('winner!');
	    play.scoreText.fill = '#caf';
	    play.scoreText.fontSize = 21;
	}
    },

    generateEnemy: function (velocity) {
	var x, y, widths, width, theta, vel, enemy;
	vel = {};
	widths = play.level.getEnemyWidths();

	width = widths[Math.rand(widths.length)];

	switch (play.level.getSpawnSide()) {
	case 'left':
	    x = 0 - Math.ceil(width / 2);
	    y = Math.rand(Game.h);
	    break;
	case 'right':
	    x = Game.w + Math.ceil(width / 2);
	    y = Math.rand(Game.h);
	    break;
	case 'top':
	    x = Math.rand(Game.w);
	    y = 0 - Math.ceil(width / 2);
	    break;
	case 'bottom':
	    x = Math.rand(Game.w);
	    y = Game.h + Math.ceil(width / 2);
	    break;
	}

	theta = Math.atan((Game.h / 2 - y) / (Game.w / 2 - x)); // theta = angle to center

	if (x > Game.w / 2) {
	    theta += Math.PI; 
	}

	theta += Math.random() * (Math.PI / 3) - Math.PI / 6;  // theta +- 30 degrees

	vel.x = velocity * Math.cos(theta);
	vel.y = velocity * Math.sin(theta);

	enemy = play.enemies.create(x, y, play.level.enemyColor);
	enemy.imageWidth = 18;
	enemy.scale.setTo(width / enemy.imageWidth, width / enemy.imageWidth);
	enemy.anchor.setTo(0.5, 0.5);
	enemy.body.velocity = vel;
	
	play.enemiesCreated++;
    },

    enemyBoundary: function (enemy) {
	if (enemy.x - enemy.width / 2 < 0) { // left boundary
	    if (play.level.hardBoundaries.left) {
		enemy.body.velocity.x = Math.abs(enemy.body.velocity.x);
	    }
	}
	else if (enemy.x + enemy.width / 2 > Game.w) { // right boundary
	    if (play.level.hardBoundaries.right) {
		enemy.body.velocity.x = -Math.abs(enemy.body.velocity.x);
	    }
	}

	if (enemy.y - enemy.height / 2 < 0) { // top boundary
	    if (play.level.hardBoundaries.top) {
		enemy.body.velocity.y = Math.abs(enemy.body.velocity.y);
	    }
	}
	else if (enemy.y + enemy.height / 2 > Game.h) { // bottom boundary
	    if (play.level.hardBoundaries.bottom) {
		enemy.body.velocity.y = -Math.abs(enemy.body.velocity.y);
	    }
	}
    },

    eat: function (obj1, obj2) {
	var eater, food, newEaterWidth;

	eater = obj1.area() >= obj2.area() ? obj1 : obj2;
	food = obj1 === eater ? obj2 : obj1;

	if (eater !== food) {
	    newEaterWidth = Math.sqrt(eater.area() + food.area() / 2);
	    
	    // velocity is changed to conserve momentum as if mass was conserved
	    eater.body.velocity.x = (eater.area() * eater.body.velocity.x + food.area() * food.body.velocity.x) / (eater.area() + food.area());
	    eater.body.velocity.y = (eater.area() * eater.body.velocity.y + food.area() * food.body.velocity.y) / (eater.area() + food.area());

	    eater.scale.setTo(newEaterWidth / eater.imageWidth, newEaterWidth / eater.imageWidth);

	    food.kill();

	    if (eater === play.player) {
		if (play.player.width > Game.w || play.player.height > Game.h) {
		    player.kill();
		}
	    }
	}
    },

    controls: function () {
	if (play.cursors.left.isDown) {
	    if (!play.cursors.right.isDown) {
		play.player.body.acceleration.x = -play.player.acceleration;
	    }
	}
	else if (play.cursors.right.isDown) {
	    play.player.body.acceleration.x = play.player.acceleration;
	}
	else {
	    play.player.body.acceleration.x = 0;
	}

	if (play.cursors.up.isDown) {
	    if (!play.cursors.down.isDown) {
		play.player.body.acceleration.y = -play.player.acceleration;
	    }
	}
	else if (play.cursors.down.isDown) {
	    play.player.body.acceleration.y = play.player.acceleration;
	}
	else {
	    play.player.body.acceleration.y = 0;
	}
    },
    
    calcScore: function () {
	var area, initial, divisor;

	area = play.player.area();
	initial = Math.pow(play.player.initialWidth, 2);
	divisor = 18;

	return Math.ceil((area - initial) / divisor);
    },

    endGame: function () {
	if (this.calcScore() >= play.level.scoreGoal) {
	    play.levelIndex++;
	    localStorage.levelIndex = play.levelIndex;
	}
	game.state.start('End');
    },
};
