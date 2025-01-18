import * as Cookies from "./cookies.js";

    // Configuration du canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Taille du canvas
    canvas.width = 1200;
    canvas.height = 500;

    const BACKGROUND_LAYERS = {
        SUN: { speed: 0, name: 'sun', src: 'pictures/bg_sun.png'},
        TOWN: { speed: 1, name: 'Town', src: 'pictures/bg_town.png'},
        CLOUDS: { speed: 2, name: 'Clouds', src: 'pictures/bg_clouds.png'},
        ROAD: { speed: 2.5, name: 'Road', src: 'pictures/bg_road.png'},
        FRONT: { speed: 4, name: 'Front', src: 'pictures/bg_front.png'}
    };


    const MUSIC = new Audio();
    const bg_elements = [];
    const LETTERS = [];

    const LETTER_DATA = {
      SIZE: 64,
      FRAMES: 4,
      XINIT: canvas.width,
      TYPE: {MALUS:0, BONUS:1}
    }

    const GROUND_LEVELS = {
      UP: 300,
      DOWN: 350
    }

    const GAME_SPEED = {
      START: 1.2,
      MAX: 3,
      INCREMENT: 0.2,
      TIMER: Date.now(),
      DELAY: 20000
    }

    const FLY_LEVEL = {
      MIN: 0,
      MAX: 180,
      VARIATION: 60
    }

    const ANIMATION_DELAY = {
      ROLL: 500,
      PLAYER_FRAME: 140,
      PLAYER_MOVE: 20,
      LETTER_FRAME: 100,
    }

    const PLAYER_FRAMES = {
      ROLL: generateFrames('pictures/runner_roll', 3),
      RUN: generateFrames('pictures/runner', 2),
      JUMP: generateFrames('pictures/runner_jump', 2),
      DIE: 'pictures/runner_dead.png'
    }

    const GAME_OVER = {
      SRC: ['pictures/end_screen.png'],
      TIMER: Date.now(),
      DELTA: 20,
      WIDTH: 256,
      HEIGHT: 384,
      CURRENT_FRAME: 0,
      X: (1200 - 256) / 2,
      y: 500,
      picture : new Image(),
      MAX_Y: (500 - 384) / 2,
      MIN_Y: ((500 - 384) / 2) + 15,
      MAX_FRAME: 6,
      STOPPED: false,
      UP: false,
      DOWN: false
    }

    const BONUS = {
      A: {src: 'pictures/A_letter.png', value: 500},
      B: {src: 'pictures/B_letter.png', value: 200},
      C: {src: 'pictures/C_letter.png', value: 100},
      D: {src: 'pictures/D_letter.png', value: 50},
      E: {src: 'pictures/E_letter.png', value: 25},
    }

    const MALUS = {
      F: {src: 'pictures/F_letter.png', value: -200},
      FX: {src: 'pictures/FX_letter.png', value: -50},
    }

    const HEART = {
      FULL: 'pictures/heart_full.png',
      EMPTY: 'pictures/heart_empty.png'
    }

    const GAME_EVENT = {
      TIMER : {flash: Date.now(), score: Date.now(), life: Date.now(), blink: Date.now()},
      DELTA: {flash: 20, score: 50, life: 500, blink: 350},
      VALUE: {flash: 10, score: 0, life: 3, blink: 0, record: 0},
      RUNNING: {flash: false, game: false, blink: false},
      INIT: {flash: 10, life: 3, score: 0, blink: 0}
    }

    const LETTER_POSITION = {
      LOW: -1,
      MID: 0,
      HIGH: 1
    }

    const BUFFERED_ACTION = {
      NONE: 0,
      JUMP: 1,
      ROLL: 2,
      MOVE_UP: 3,
      MOVE_DOWN: 4
    }

    const PLACES = {
      DOWN: 0,
      UP: 1
    }

    const OBSTACLE_DIM = {
      MIN: 1,
      MAX: 3,
      VARIATION: 1
    }

    const OBSTACLE_TYPES = [
      { fn: generateForceMove1, p: 0.15 },
      { fn: generateForceMove2, p: 0.15 },
      { fn: generateForceJump, p: 0.25 },
      { fn: generateJumpOrRoll, p: 0.25 },
      { fn: generateRandomBonus, p: 0.2 },
    ];


    const FORCES = {
      VELOCITY: 0,
      GRAVITY:0.28,
      SACCADE: 0.01,
      LIFT: -7
    }

    let bufferActionState = BUFFERED_ACTION.NONE;

    const player = {
      x: 360,
      y:300,
      size: 64,
      picture: new Image(),
      frame: 0,
      frame_timer: Date.now(),
      move_timer: Date.now(),
      roll_timer: Date.now(),
      lift: FORCES.LIFT,
      gravity: FORCES.GRAVITY,
      saccade: FORCES.SACCADE,
      velocity: FORCES.VELOCITY,
      place: PLACES.UP,
      moveSpeed: 4,
      isJumping: false,
      jumping: false,
      moving: false,
      isMoving: false,
      isRolling: false,
    };

    function selectRandomFunction() {
      const random = Math.random();
      let cumulativeProbability = 0;

      for (const fctn of OBSTACLE_TYPES) {
        cumulativeProbability += fctn.p;
        if (random < cumulativeProbability) {
          return fctn.fn;
        }
      }
    }

    function updateScore(){
      if(isTimmingOver(GAME_EVENT.TIMER.score, GAME_EVENT.DELTA.score)){
        GAME_EVENT.TIMER.score = Date.now();
        GAME_EVENT.VALUE.score ++;
      }
    }

    function updateScoreWithValue(value){
      GAME_EVENT.VALUE.score += value;
    }

    function drawScore() {
            ctx.fillStyle = "rgb(51,63,88)";
            ctx.font = "20px Arial";
            ctx.fillText(`Score: ${GAME_EVENT.VALUE.score}`, 10, 20);
            ctx.fillText(`Record: ${GAME_EVENT.VALUE.record}`, 10, 40);
    }

    function checkAnimation(){
      if(GAME_EVENT.RUNNING.flash){
        drawFlash();
        updateFlash();
      }
    }

    function isGameOver(){
      return GAME_EVENT.VALUE.life === 0;
    }

    function setGameOver(){
      GAME_EVENT.RUNNING.game = false;
    }

    function updateFlash(){
      if(!isTimmingOver(GAME_EVENT.TIMER.flash, GAME_EVENT.DELTA.flash)){
        return 0;
      }
      GAME_EVENT.TIMER.flash = Date.now();
      if(GAME_EVENT.VALUE.flash > 0){
        GAME_EVENT.VALUE.flash --;
      } else if (GAME_EVENT.VALUE.flash == 0) {
        GAME_EVENT.VALUE.flash = GAME_EVENT.INIT.flash;
        GAME_EVENT.RUNNING.flash = false;
      }
    }

    function drawFlash(){
      ctx.fillStyle = `rgb(74,122,150, ${GAME_EVENT.VALUE.flash/10})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function updateSpeed(speed){
      if(isTimmingOver(GAME_SPEED.TIMER, GAME_SPEED.DELAY)){
        GAME_SPEED.TIMER = Date.now();
        let newSpeed = speed + GAME_SPEED.INCREMENT;
        speed = Math.min(GAME_SPEED.MAX, newSpeed);
      }
      return speed;
    }

    function looseLife(){
      if(isTimmingOver(GAME_EVENT.TIMER.life, GAME_EVENT.DELTA.life)){
        GAME_EVENT.TIMER.life = Date.now();
        GAME_EVENT.VALUE.life--;
      }
      if(isGameOver()){
        setGameOver();
      }
    }

    function resetLife(){
      GAME_EVENT.VALUE.life = GAME_EVENT.INIT.life;
    }

    function drawLifes(){
      let initPos = canvas.width - (GAME_EVENT.INIT.life * 50);
      for(let i = 0; i < GAME_EVENT.INIT.life - GAME_EVENT.VALUE.life; i++){
        let x = initPos + 50*i;
        let heart = new Image();
        heart.src = HEART.EMPTY;
        ctx.drawImage(heart, x, canvas.height - 42, 32, 32);
      }
      for(let i = GAME_EVENT.INIT.life - GAME_EVENT.VALUE.life; i < GAME_EVENT.INIT.life; i++){
        let x = initPos + 50*i;
        let heart = new Image();
        heart.src = HEART.FULL;
        ctx.drawImage(heart, x, canvas.height - 42, 32, 32);
      }
    }

    function generateFrames(basePath, frameCount) {
      return Array.from({ length: frameCount }, (_, i) => `${basePath}${i + 1}.png`);
    }

    function generateRandomNumber(lowValue, highValue, step){
      let scale = (highValue - lowValue) / step;
      let seed = Math.random();
      let variation = Math.round(scale*seed);
      return lowValue + (variation*step);
    }

    function getRandomObjectValue(object) {
      const keys = Object.keys(object);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      return object[randomKey];
    }


    function updateObstacles(speed){
      if(LETTERS.length == 0){
        spawnObstacle();
      }
      if(LETTERS[LETTERS.length - 1].x < canvas.width / 2){
        spawnObstacle();
      }
      LETTERS.forEach(obstacle => {
          obstacle.x -= speed*2.5;
        });
      if(LETTERS[0].x < - 64){
        LETTERS.shift();
      }
      for (let i = LETTERS.length - 1; i >= 0; i--) {
        if (LETTERS[i].scored == true) {
          LETTERS.splice(i, 1);
        }
      }
    }

    function spawnObstacle(){
      const randomSpawn = selectRandomFunction();
      randomSpawn();
    }

    function generateForceMove1(){
      let randomLayer = getRandomObjectValue(PLACES);
      let randomNumber = generateRandomNumber(1, 4, 1);
      for(let i = 0; i < randomNumber; i++){
        LETTERS.push(generateLetter(randomLayer, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN, canvas.width + (70 * i)));
        LETTERS.push(generateLetter(randomLayer, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN + FLY_LEVEL.VARIATION, canvas.width + (70 * i)));
        LETTERS.push(generateLetter(randomLayer, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN + FLY_LEVEL.VARIATION*2, canvas.width + (70 * i)));
        LETTERS.push(generateLetter(randomLayer, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MAX, canvas.width + (70 * i)));
      }
    }

    function generateForceMove2(){
      let randomLayer = getRandomObjectValue(PLACES);
      let randomFlyLevel = generateRandomNumber(FLY_LEVEL.MIN, FLY_LEVEL.MAX, FLY_LEVEL.VARIATION);
      for(let i = 0; i < 4; i++){
        LETTERS.push(generateLetter(randomLayer, LETTER_DATA.TYPE.MALUS, randomFlyLevel, canvas.width + (i* LETTER_DATA.SIZE) + 10));
      }
    }

    function generateForceJump(){
      LETTERS.push(generateLetter(PLACES.UP, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN, canvas.width));
      LETTERS.push(generateLetter(PLACES.DOWN, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN, canvas.width));
    }

    function generateJumpOrRoll(){
      LETTERS.push(generateLetter(PLACES.UP, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN + FLY_LEVEL.VARIATION, canvas.width));
      LETTERS.push(generateLetter(PLACES.DOWN, LETTER_DATA.TYPE.MALUS, FLY_LEVEL.MIN + FLY_LEVEL.VARIATION, canvas.width));
    }

    function generateRandomBonus(){
      let randomLayer = getRandomObjectValue(PLACES);
      let randomFlyLevel = generateRandomNumber(FLY_LEVEL.MIN, FLY_LEVEL.MAX, FLY_LEVEL.VARIATION);
      LETTERS.push(generateLetter(randomLayer, LETTER_DATA.TYPE.BONUS, randomFlyLevel, canvas.width));
    }

    function getGroundLevel(position){
      if(position === PLACES.UP){
        return GROUND_LEVELS.UP;
      }
      return GROUND_LEVELS.DOWN;
    }

    function checkSquareCollision(square1, square2){
      return(!(square1.y + square1.h < square2.y || square1.y > square2.y + square2.h || square1.x + square1.w < square2.x || square2.x + square2.w < square1.x));
    }

    function checkCollision(){
      LETTERS.forEach(letter => {
        if(letter.place === player.place && !player.isMoving){
          if(checkSquareCollision(getPlayerHitbox(), getLetterHitbox(letter))){
            GAME_EVENT.VALUE.score += letter.score;
            letter.scored = true;
            if(letter.type === LETTER_DATA.TYPE.MALUS){
              GAME_EVENT.RUNNING.flash = true;
              looseLife();
            }
          }
        }
      });
    }

    function getPlayerHitbox(){
      let hitbox = {
        x: player.x + 16,
        y: player.y,
        w: player.size/2,
        h: player.size
      }
      if(player.isRolling){
        hitbox.y = player.y + (player.size/2),
        hitbox.h = player.size/2
      }
      return hitbox;
    }

    function getLetterHitbox(letter){
      let hitbox = {
        x:letter.x,
        y:letter.y - letter.flying_level,
        w:letter.size,
        h:letter.size
      }
      return hitbox;
    }

    function generateLetter(layer, type, flyLevel, xvalue){
      let letter = {
        x: xvalue,
        y: getGroundLevel(layer),
        size: LETTER_DATA.SIZE,
        place: layer,
        type: type,
        frame: 0,
        flying_level: flyLevel,
        y_variation: LETTER_POSITION.MID,
        frame_count: 0,
        frame_timer: Date.now(),
        picture: new Image(),
        scored: false
      };
      if(type === LETTER_DATA.TYPE.BONUS){
        let randomLetter = getRandomObjectValue(BONUS)
        letter.picture.src = randomLetter.src;
        letter.score = randomLetter.value;
      }
      if(type === LETTER_DATA.TYPE.MALUS){
        let randomLetter = getRandomObjectValue(MALUS)
        letter.picture.src = randomLetter.src;
        letter.score = randomLetter.value;
      }
      return letter;
    }

    function spawnObstacleGroup(layer, type, height, width){
      let dim = height * width;
      if(dim == 1){
        let flylevel = generateRandomNumber(FLY_LEVEL.MIN, FLY_LEVEL.MAX, FLY_LEVEL.VARIATION);
        LETTERS.push(generateLetter(layer, type, flylevel, canvas.width));
      }
    }

    function drawLayer(layer, speed){
      if(player.place === layer){
        animatePlayer(speed);
      }
      LETTERS.forEach(letter => {
        if(letter.place === layer){
          drawLetterShadow(letter);
        }
      });
      LETTERS.forEach(letter => {
        if(letter.place === layer){
          animateLetter(letter);
          let y = (letter.y + letter.y_variation) - letter.flying_level;
          ctx.drawImage(letter.picture, letter.x, y, letter.size, letter.size);
        }
      });
    }

    function animateLetter(letter){
      if(isTimmingOver(letter.frame_timer, ANIMATION_DELAY.LETTER_FRAME)){
        letter.frame_timer = Date.now();
        switch(letter.frame_count){
          case 0, 2:
            letter.y_variation = LETTER_POSITION.MID;
            break;
          case 1:
            letter.y_variation = LETTER_POSITION.HIGH;
            break;
          case 3:
            letter.y_variation = LETTER_POSITION.LOW;
            break;
          default:
            letter.y_variation = LETTER_POSITION.MID;
            break;
        }
        letter.frame_count = (letter.frame_count + 1)%LETTER_DATA.FRAMES;
      }
    }

    function setBgElements() {
      for (let key in BACKGROUND_LAYERS) {
        let layer = BACKGROUND_LAYERS[key];
        let element = {
          picture: new Image(),
          speed: layer.speed,
          name: layer.name,
          x: 0
        };
        element.picture.src = layer.src;
        bg_elements.push(element);
      }
    }

    function jump(){
      if(player.gravity > 0 && player.jumping){
          player.gravity -= player.saccade;
      } else if(player.gravity < FORCES.GRAVITY && !player.jumping){
          player.gravity += player.saccade;
      }
      if(player.gravity < 0){
          player.jumping = false;
      }
      if(player.place === PLACES.DOWN && player.y > GROUND_LEVELS.DOWN){
        player.isJumping = false;
        player.velocity = FORCES.VELOCITY;
        player.gravity = FORCES.GRAVITY;
        player.y = GROUND_LEVELS.DOWN - 1;
      }
      if(player.place === PLACES.UP && player.y > GROUND_LEVELS.UP){
        player.isJumping = false;
        player.velocity = FORCES.VELOCITY;
        player.gravity = FORCES.GRAVITY;
        player.y = GROUND_LEVELS.UP - 1;
      }
      player.velocity += player.gravity;
      player.y += player.velocity;
    }

    function move(){
      if(player.place == 0){
        if(player.y < GROUND_LEVELS.DOWN && isTimmingOver(player.move_timer, ANIMATION_DELAY.PLAYER_MOVE)){
          player.y += player.moveSpeed;
          player.move_timer = Date.now();
        }
        if(player.y > GROUND_LEVELS.DOWN){
          player.y = GROUND_LEVELS.DOWN;
          player.isMoving = false
        }
      }
      if(player.place == 1){
        if(player.y > GROUND_LEVELS.UP && isTimmingOver(player.move_timer, ANIMATION_DELAY.PLAYER_MOVE)){
          player.y -= player.moveSpeed;
          player.move_timer = Date.now();
        }
        if(player.y < GROUND_LEVELS.UP){
          player.y = GROUND_LEVELS.UP;
          player.isMoving = false
        }
      }
    }

    function setPlayerFrame(speed, animation, frames){
      if(isTimmingOver(player.frame_timer, ANIMATION_DELAY.PLAYER_FRAME/speed)){
        player.frame_timer = Date.now();
        let current_frame = player.frame;
        let next_frame = (current_frame + 1)%frames;
        player.picture.src = animation[current_frame];
        player.frame = next_frame;
      }
    }

    function calculateRadius(proportion, ground){
      return (player.size/proportion) - (player.size/(proportion*3)*(ground - player.y))/100
    }

    function drawLetterShadow(letter){
      ctx.beginPath();
      if(letter.place == 0){
        ctx.ellipse(letter.x + (letter.size/2), GROUND_LEVELS.DOWN + letter.size, letter.size/1.5, letter.size/4.5, 0, 0, 2 * Math.PI);
      }
      if(letter.place == 1){
        ctx.ellipse(letter.x + (letter.size/2), GROUND_LEVELS.UP + letter.size, letter.size/1.5, letter.size/4.5, 0, 0, 2 * Math.PI);
      }
      ctx.fillStyle = "rgb(0,0,0,0.2)";
      ctx.fill();
    }

    function animatePlayerShadow(){
      ctx.beginPath();
      if(!player.isMoving && !player.isJumping){
        if(player.place == 0){
        ctx.ellipse(player.x + (player.size/2), GROUND_LEVELS.DOWN + player.size, player.size/1.5, player.size/4.5, 0, 0, 2 * Math.PI);
        }
        if(player.place == 1){
          ctx.ellipse(player.x + (player.size/2), GROUND_LEVELS.UP + player.size, player.size/1.5, player.size/4.5, 0, 0, 2 * Math.PI);
        }
      } else if(!player.isJumping){
        ctx.ellipse(player.x + (player.size/2), player.y + player.size, player.size/1.5, player.size/4.5, 0, 0, 2 * Math.PI);
      } else if(player.isJumping){
        if(player.place == 0){
        ctx.ellipse(player.x + (player.size/2), GROUND_LEVELS.DOWN + player.size, calculateRadius(1.5, GROUND_LEVELS.DOWN), calculateRadius(4.5, GROUND_LEVELS.DOWN), 0, 0, 2 * Math.PI);
        }
        if(player.place == 1){
          ctx.ellipse(player.x + (player.size/2), GROUND_LEVELS.UP + player.size,calculateRadius(1.5, GROUND_LEVELS.UP), calculateRadius(4.5, GROUND_LEVELS.UP), 0, 0, 2 * Math.PI);
        }
      }
      ctx.fillStyle = "rgb(0,0,0,0.2)";
      ctx.fill();
    }

    function roll(){
      if(isTimmingOver(player.roll_timer, ANIMATION_DELAY.ROLL)){
        player.isRolling = false;
        player.frame = 0;
      }
    }

    function isPlayerGrounded(){
      if (player.place === PLACES.UP){
        return player.y > GROUND_LEVELS.UP - 1;
      }
      if (player.place === PLACES.DOWN){
        return player.y > GROUND_LEVELS.DOWN - 1;
      }
    }


    function animatePlayer(speed){
      if(!player.isJumping && !player.isRolling){
        setPlayerFrame(speed, PLAYER_FRAMES.RUN, 2);
      }
      if(player.isJumping && !player.isMoving){
        jump();
        setPlayerFrame(speed, PLAYER_FRAMES.JUMP, 2);
      }
      if(player.isMoving && !player.isJumping && !player.isRolling){
        move();
      }
      if(player.isRolling){
        roll();
        setPlayerFrame(speed, PLAYER_FRAMES.ROLL, 3);
      }
      if(bufferActionState != BUFFERED_ACTION.NONE){
        checkBuffer();
      }
      if(isGameOver()){
        player.picture.src = PLAYER_FRAMES.DIE;
      }
      animatePlayerShadow();
      ctx.drawImage(player.picture, player.x, player.y, player.size, player.size);
    }

    function isTimmingOver(start, duration){
      return start + duration < Date.now();
    }

    function drawRunning(speed){
      ctx.clearRect(0,0, canvas.width, canvas.height);
      bg_elements.forEach(element => {
        if(element.name === BACKGROUND_LAYERS.FRONT.name){
          updateObstacles(speed);
          drawLayer(PLACES.UP, speed);
          drawLayer(PLACES.DOWN, speed);
        }
        ctx.drawImage(element.picture, element.x, 0, canvas.width, canvas.height);
        ctx.drawImage(element.picture, canvas.width + element.x - 1, 0, canvas.width, canvas.height);
        element.x -= element.speed * speed;
        if (element.x <= -canvas.width) {
          element.x = 0;
        }
      });
    }

    function animateRunning(speed){
      drawRunning(speed);
      checkCollision();
      checkAnimation();
      updateScore();
      drawScore();
      drawLifes();
      let newSpeed = updateSpeed(speed);
      if(GAME_EVENT.RUNNING.game){
        requestAnimationFrame(() => animateRunning(newSpeed));
      } else {
        refreshHighscore();
        requestAnimationFrame(() => animateDeath(speed));
      }
    }

    function animateDeath(speed){
      ctx.clearRect(0,0, canvas.width, canvas.height);
      let updatedSpeed = speed;
      if(isPlayerGrounded() && speed > 0){
        updatedSpeed = Math.max(updatedSpeed - 0.01, 0);
      }
      drawRunning(updatedSpeed);
      checkAnimation();
      drawLifes();
      if(isPlayerGrounded()){
        bg_elements[2].x -= bg_elements[2].speed / 3;
      }
      if(isPlayerGrounded() && speed === 0){
        updateGameOver();
        drawGameOver();
      }
      if(GAME_EVENT.RUNNING.game){
        requestAnimationFrame(() => animateRunning(GAME_SPEED.START));
      } else {
        requestAnimationFrame(() => animateDeath(updatedSpeed));
      }
    }

    function drawGameOver(){
      ctx.drawImage(GAME_OVER.picture, GAME_OVER.X, GAME_OVER.y, GAME_OVER.WIDTH, GAME_OVER.HEIGHT);
      let text = `score : ${GAME_EVENT.VALUE.score}`;
      ctx.fillStyle = "rgb(238,134,149)";
      ctx.font = "30px Arial";
      ctx.fillText(text, getCenterTextXPosition(0, canvas.width, text), GAME_OVER.y + (GAME_OVER.HEIGHT - 100));
    }

    function updateGameOver(){
      if(GAME_OVER.y > GAME_OVER.MAX_Y && !GAME_OVER.STOPPED){
        GAME_OVER.y -= 6;
        if(GAME_OVER.y <= GAME_OVER.MAX_Y){
          GAME_OVER.DOWN = true;
          GAME_OVER.STOPPED = true;
          GAME_EVENT.RUNNING.blink = true;
        }
      }
      if(GAME_OVER.STOPPED){
        animateGameOver();
      }
      if(GAME_EVENT.RUNNING.blink){
        updateBlink();
        drawBlink();
      }
    }

    function animateGameOver(){
      if(isTimmingOver(GAME_OVER.TIMER, GAME_OVER.DELTA)){
        GAME_OVER.TIMER = Date.now();
        if(GAME_OVER.DOWN){
          GAME_OVER.y ++;
          if(GAME_OVER.y > GAME_OVER.MIN_Y){
            GAME_OVER.DOWN = false;
            GAME_OVER.UP = true;
          }
        } else if(GAME_OVER.UP){
          GAME_OVER.y --;
          if(GAME_OVER.y < GAME_OVER.MAX_Y){
            GAME_OVER.DOWN = true;
            GAME_OVER.UP = false;
          }
        }
      }
    }

    function drawBlink(){
      if(GAME_EVENT.VALUE.blink){
        ctx.fillStyle = 'rgb(74,122,150)';
        ctx.font = "bold 20px Arial";
        let text = 'press R to restart'
        let x = getCenterTextXPosition(0, canvas.width, text)
        ctx.fillText(text, x, canvas.height - 20);
      }
    }

    function getCenterTextXPosition(xstart, size, text){
      let textLenght = ctx.measureText(text).width;
      let position = xstart + ((size - textLenght)/2);
      return position;
    }

    function updateBlink(){
      if(isTimmingOver(GAME_EVENT.TIMER.blink, GAME_EVENT.DELTA.blink)){
        GAME_EVENT.TIMER.blink = Date.now();
        GAME_EVENT.VALUE.blink = (GAME_EVENT.VALUE.blink + 1) % 2;
      }
    }

    function resetScore(){
      GAME_EVENT.VALUE.score = GAME_EVENT.INIT.score;
    }

    function resetLetters(){
      LETTERS.length = 0;
    }

    function resetGameOverInfo(){
      GAME_OVER.STOPPED = false;
      GAME_OVER.DOWN = true;
      GAME_OVER.UP = false;
      GAME_EVENT.RUNNING.blink = false;
      GAME_OVER.y = canvas.height;
    }

    function restart(){
      resetScore();
      resetLife();
      resetLetters();
      resetGameOverInfo();
      GAME_SPEED.TIMER = Date.now();
      GAME_EVENT.RUNNING.game = true;

    }

    function startAnimationWhenReady(speed) {
      let loadedImages = 0;

      bg_elements.forEach(element => {
        element.picture.onload = () => {
          loadedImages++;
          // Démarrer l'animation seulement lorsque toutes les images sont chargées
          if (loadedImages === bg_elements.length) {
            GAME_EVENT.RUNNING.game = true;
            animateRunning(speed);
          }
        };
      });
    }

    function checkBuffer(){
      if(actionAvaible()){
        checkCollision();
        switch(bufferActionState){
          case BUFFERED_ACTION.JUMP:
            setJump();
            break;
          case BUFFERED_ACTION.ROLL:
            setRoll();
            break;
          case BUFFERED_ACTION.MOVE_DOWN:
            setMove(PLACES.DOWN);
            break;
          case BUFFERED_ACTION.MOVE_UP:
            setMove(PLACES.UP);
            break;
        }
        bufferActionState = BUFFERED_ACTION.NONE;
      }
    }

    function actionAvaible(){
      return !player.isJumping && !player.isMoving && !player.isRolling;
    }

    function setJump(){
      player.velocity = player.lift;
      player.jumping = true;
      player.isJumping = true;
    }

    function setRoll(){
      player.roll_timer = Date.now();
      player.isRolling = true;
    }

    function setMove(place){
      player.isMoving = true;
      player.place = place;
    }

    window.onload = ()=> {
      setBgElements();
      preloadFrames(PLAYER_FRAMES.ROLL);
      preloadFrames(PLAYER_FRAMES.RUN);
      preloadFrames(PLAYER_FRAMES.JUMP);
      preloadFrames(GAME_OVER.SRC);
      GAME_OVER.picture.src = GAME_OVER.SRC;
      startAnimationWhenReady(GAME_SPEED.START);
    }

    document.addEventListener('DOMContentLoaded', () => {
      startMusic();
    });

    function preloadFrames(animation) {
      const promises = animation.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = () => reject(`Erreur lors du chargement de l'image : ${src}`);
        });
      });

      return Promise.all(promises);
    }

    function startMusic(){
      MUSIC.loop = true;
      MUSIC.autoplay = true;
      MUSIC.volume = 0.3;
      MUSIC.src = 'sound/Moon.mp3'
      MUSIC.addEventListener("loadeddata", () => MUSIC.play());
      MUSIC.load();
    }

    function refreshHighscore(){
      GAME_EVENT.VALUE.record = Cookies.getOrCreateCookie("snake-score", GAME_EVENT.VALUE.record, 365);
      if(GAME_EVENT.VALUE.score > GAME_EVENT.VALUE.record){
        GAME_EVENT.VALUE.record = GAME_EVENT.VALUE.score;
        Cookies.setCookie("third-year-run-score", GAME_EVENT.VALUE.score, 365);
        return true;
      }
      return false;
    }


    

    window.addEventListener("keydown", (e) => {
      if(!isGameOver()){
        if (e.which === 90) {
          if(actionAvaible()){
            setJump();
          } else {
            bufferActionState = BUFFERED_ACTION.JUMP;
          }
        }
        if (e.which === 83 ) {
          if(actionAvaible()){
            setRoll();
          } else {
            bufferActionState = BUFFERED_ACTION.ROLL;
          }
        }
        if(e.which === 68 && player.place == PLACES.UP){
          if(actionAvaible()){
            setMove(PLACES.DOWN);
          } else {
            bufferActionState = BUFFERED_ACTION.MOVE_DOWN;
          }
        }
        if(e.which === 81 && player.place == PLACES.DOWN){
          if(actionAvaible()){
            setMove(PLACES.UP);
          } else {
            bufferActionState = BUFFERED_ACTION.MOVE_UP;
          }
        }
      }
      if(isGameOver()){
        if(e.which === 82){
          restart();
        }
      }
    });