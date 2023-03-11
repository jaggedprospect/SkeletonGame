/**
SkeletonGame
@author jaggedprospect
@date March 2023
@version 0.0.1

===== CREDIT ===============================
  Animation/Movement Code by
	- Martin Himmel @
	https://dev.to/martyhimmel/moving-a-sprite-sheet-character-with-javascript-3adg#comments
	
	General Framework and "features.png" provided by
	- Dr. Michael Weeks
	
	Skeleton Spritesheet provided by
	- pipoya @
	https://pipoya.itch.io/pipoya-free-rpg-character-sprites-32x32
=============================================

Original code has been modified for specific uses in this program.
*/

// 2D ARRAY NOTE: rows equate to x-values, columns equate to y-values!

// === CONSTANTS ===
const WIDTH = 32; // default BLOCK width
const HEIGHT = 32; // default BLOCK height
const CYCLE_LOOP = [1, 2, 1, 0]; // frame column order for animation
const FRAME_LIMIT = 12;
const VELOCITY = 1; // movement speed

// directions (by spritesheet row)
const DOWN = 0;
const UP = 3;
const LEFT = 1;
const RIGHT = 2;

const ID_PLAYER = "player";
const ID_NPC = "npc";
const ID_ENEMY = "enemy";

// Error messages
const ERR_BLOCK = "Unknown value while reading mapLayout";
const ERR_UNDEFINED = "Undefined block in canvasMap";
const ERR_NOT_ENTITY = "Object is not an instance of class Entity";

const DEBUG = true;

// === CLASSES ===
class Block {
  constructor(x, y, z, img, frame) {
    this.x = x; // X coordinate
    this.y = y; // Y coordinate
    this.z = z; // Z index
    this.img = img; // sprite image
	  this.frame = frame;
  }
}

class Entity extends Block {
  constructor(x, y, z, w, h, img, frame) {
    super(x, y, z, img, frame);
    this.w = w; // hitbox width
    this.h = h; // hitbox height
  }

  //TODO: add collision class method
  //TODO: create a Hitbox class
}

class Sprite extends Entity {
  constructor(x, y, z, w, h, img, frame, id, alive = true) {
    super(x, y, z, w, h, img, frame);
    this.id = id; // sprite id
    this.alive = alive; // necessary?
  }

  isAlive() {
    return this.alive;
  }
}

class Item extends Entity {
  //? What differentiates an ITEM from an ENTITY...?
  constructor(x, y, z, w, h, img, frame) {
    super(x, y, z, w, h, img, frame);
  }
}

// start variable (for map use)
var S = -1;

// block map
var mapLayout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, S, 0, 1, 1, 0, 2, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 1],
  [1, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 5, 2, 1],
  [1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 2, 2, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 1, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// mapLayout dimensions
var mapDim = {col: mapLayout[0].length, row: mapLayout.length};

// canvas and context
var canvas;
var ctx;

// sprite coordinates
var spriteX;
var spriteY;

// frame variables for sprite
var currentLoopIndex = 0;
var frameCount = 0;
var direction = 0; // current direction

// sprite image
var spriteImage = new Image();
spriteImage.src = "res/skeleton-soldier.png";

// feature image
var featureImage = new Image();
featureImage.src = "res/features2.png";

// canvas map
var canvasMap = [];
var canvasMapRow = 15; // 480/32
var canvasMapCol = 20; // 640/32

// goal variables
var goalX;
var goalY;
var goalReached = false;

// This can be expanded for use with any feature...
// destroy tree
var touchingTree = false;
var treeInContact = null;

// key press array
var keyPresses = [];

// === TEMP VARIABLES ===
const BLOCK_W = 32;
const BLOCK_H = 32;

var drawHit = true;
var player;
var goal;
// ======================

// === KEY EVENT LISTENERS ===
// provided by Martin Himmel

//If key is pressed, set key index to true
window.addEventListener("keydown", keyDownListener, false);
function keyDownListener(event) {
  keyPresses[event.key] = true;
}

// If key is released, set key index to false
window.addEventListener("keyup", keyUpListener, false);
function keyUpListener(event) {
  keyPresses[event.key] = false;
}

/**
 * fillCanvasMap2()...Fill 2D array (canvasMap) using mapLayout.
 * 
 * @throws Error if mapLayout contains an unknown integer.
 */
function fillCanvasMap2() {
	/*
  * NOTE: As-is, we have to instantiate each object based on the value 
	* in mapLayout. This will get out of hand as there are more objects
	* added. In future, objects should be broken up into different maps
	* (e.g. block map, entity map, item map, etc.)
  * 
  * Additionally, we will have one texture resource. The current design
  * stores the texture image within an object. Future implementations
  * should only store frame data. 
  */

  // create 2D array
  for (let k = 0; k < mapDim.row; k++) canvasMap[k] = [];

  for (let r = 0; r < canvasMapRow; r++) {
    for (let c = 0; c < canvasMapCol; c++)
      canvasMap[r][c] = null;
  }

	for(r = 0; r < mapDim.row; r++){
		for(c = 0; c < mapDim.col; c++){
			x = c * BLOCK_W;
			y = r * BLOCK_H;
			switch(mapLayout[r][c]){
				case S: // player starting point
					player = new Sprite(x, y, 1, 4, 4, spriteImage, 0, ID_PLAYER, true);
					canvasMap[r][c] = new Block(x, y, 1, featureImage, 0);
					break;
        case 0:
          canvasMap[r][c] = new Block(x, y, 1, featureImage, mapLayout[r][c]);
          break;
				case 1: case 2: case 3: case 4: // a feature object
					canvasMap[r][c] = new Entity(x, y, 1, 4, 4, featureImage, mapLayout[r][c]);
					break;
				case 5: // goal object
					goal = new Item(x, y, 1, 8, 8, featureImage, mapLayout[r][c]);
          canvasMap[r][c] = goal;
					break;
				default:
          console.log("Found: " + mapLayout[r][c]);
					throw new Error(ERR_BLOCK);
			}
		}
  }

  // validate the canvasMap does not have undefined blocks
  validateCanvasMap();
}

/**
 * validateCanvasMap()...Checks canvasMap after initialization.
 * 
 * @throws Error if canvasMap element is not an instance of Block.
 */
function validateCanvasMap() {
  if (DEBUG) console.log("Validating canvasMap...");

  for (let x = 0; x < canvasMap.length; x++){
    if (DEBUG) console.log(canvasMap[x]);

    for (let y = 0; y < canvasMap[x].length; y++){
      val = canvasMap[x][y];
      if (!val instanceof Block) throw new Error(ERR_UNDEFINED);
    }
  }

  if (DEBUG) console.log("canvasMap is valid.")
}

//? Why does this exist???
// removeTree()...Remove tree feature from canvas
function removeTree() {
  for (let r = 0; r < canvasMapRow; r++) {
    for (let c = 0; c < canvasMapCol; c++) {
      if (c * WIDTH == treeInContact.x && r * HEIGHT == treeInContact.y) {
        console.log("This tree is being removed: ", treeInContact);
        // make tree invisible by setting frame to 0
        canvasMap[r][c].frame = 0;
      }
    }
  }
}

/**
 * drawLine()...Draw a line from one point to another.
 * 
 * @param {number} x1 - Start X coordinate.
 * @param {number} y1 - Start Y coordinate.
 * @param {number} x2 - End X coordinate.
 * @param {number} y2 - End Y coordinate.
 * @param {string} color - Stroke color. 
 */
function drawLine(x1, y1, x2, y2, color = 'black') {
  if (color) ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * drawOutline()...Draw a rectangular outline of an Entity. Calls drawLine().
 * 
 * @param {Entity} entity - Entity object to draw around.
 * @param {string} color - Stroke color.
 * 
 * @throws Error if passed object is not an instance of Entity.
 */
//* This draws entity outline, but not the hitbox being used for collisions!
function drawOutline(entity, color = 'green') {
  // if block isn't a Block object, throw error
  if (!entity instanceof Entity) throw new Error(ERR_NOT_ENTITY);

  // top-left -> top-right
  drawLine(entity.x, entity.y, entity.x+BLOCK_W, entity.y, color);
  // top-right -> bottom-right
  drawLine(entity.x+BLOCK_W, entity.y, entity.x+BLOCK_W, entity.y+BLOCK_H, color);
  // bottom-right -> bottom-left
  drawLine(entity.x+BLOCK_W, entity.y+BLOCK_H, entity.x, entity.y+BLOCK_H, color);
  // bottom-left -> top-left
  drawLine(entity.x, entity.y+BLOCK_H, entity.x, entity.y, color);
}

//! This is a temporary function. Could be combined with drawOutline() function.
function drawHitbox(entity, color = 'red'){
  var offX = entity.w / 2;
  var offY = entity.h / 2;

  // top-left -> top-right
  drawLine(entity.x+offX, entity.y+offY, entity.x+BLOCK_W-offX, entity.y+offY, color);
  // top-right -> bottom-right
  drawLine(entity.x+BLOCK_W-offX, entity.y+offY, entity.x+BLOCK_W-offX, entity.y+BLOCK_H-offY, color);
  // bottom-right -> bottom-left
  drawLine(entity.x+BLOCK_W-offX, entity.y+BLOCK_H-offY, entity.x+offX, entity.y+BLOCK_H-offY, color);
  // bottom-left -> top-left
  drawLine(entity.x+offX, entity.y+BLOCK_H-offY, entity.x+offX, entity.y+offY, color);
}
 
/**
 * drawSprite()...Draw the player sprite.
 * 
 * @param {number} frame - The spritesheet column to draw.
 * @param {number} direction - The spritesheet row to draw.
 */
function drawSprite(frame, direction) {
  let index = 0;

  // draw sprite
  ctx.drawImage(
    player.img,
    frame * BLOCK_W, 
    direction * BLOCK_H,
    BLOCK_W,
    BLOCK_H,
    player.x,
    player.y,
    BLOCK_W,
    BLOCK_H
  );

  // if in DEBUG mode, draw outline and hitbox
  if (DEBUG){
    drawOutline(player);
    drawHitbox(player);
  }
}

/**
 * drawFeatures()...Draw the game features.
 */
function drawFeatures(){
  // draw canvas features
  for (let r = 0; r < canvasMapRow; r++) {
    for (let c = 0; c < canvasMapCol; c++) {
      if (canvasMap[r][c].frame > 0) {
        var entity = canvasMap[r][c];
        ctx.drawImage(
          featureImage,
          entity.frame * WIDTH,
          0,
          WIDTH,
          HEIGHT,
          entity.x,
          entity.y,
          WIDTH,
          HEIGHT
        );

        if (DEBUG){
          drawOutline(entity);
          drawHitbox(entity);
        }
      }
    }
  }
}

//TODO: This needs to be refined. Consider passing Entity objects instead of coordinates.
/** rectIntersect()...Check for player collisions with objects.
 * 
 * @param {number} x1 - Object1 X coordinate.
 * @param {number} y1 - Object1 Y coordinate.
 * @param {number} w1 - Object1 width.
 * @param {number} h1 - Object1 height.
 * @param {number} x2 - Object2 X coordinate.
 * @param {number} y2 - Object2 Y coordinate.
 * @param {number} w2 - Object2 width.
 * @param {number} h2 - Object2 height.
 * @returns {boolean}
 */
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
  // check for collision (overlapping points)
  if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2)
    return false;

  return true;
}

/**
 * areColliding()...Detects if two Entity hitboxes are colliding.
 * 
 * @param {Entity} e1 
 * @param {Entity} e2 
 * @returns {boolean}
 */
function areColliding(e1, e2) {
  //* This is an iteration of the rectIntersect() function.
}

// unmove()...Cancel sprite movement.
function unmove(dX, dY) {
  player.x -= dX;
  player.y -= dY;
}

// move()...Move sprite and check for collisions.
function move(dX, dY, dir) {
  // canvas border collision detection
  if (player.x + dX > 0 && player.x + WIDTH + dX < canvas.width) player.x += dX;
  if (player.y + dY > 0 && player.y + HEIGHT + dY < canvas.height) player.y += dY;

  // canvas features collision detection
  for (let r = 0; r < canvasMap.length; r++) {
    for (let c = 0; c < canvasMap[r].length; c++) {
      if (canvasMap[r][c].frame > 0 && canvasMap[r][c].frame != 5) {
        // reduce sprite and feature collision coordinates by 4 pixels
        if (
          rectIntersect(
            player.x + 4,
            player.y + 4,
            WIDTH - 4,
            HEIGHT - 4,
            canvasMap[r][c].x + 4,
            canvasMap[r][c].y + 4,
            WIDTH - 4,
            HEIGHT - 4
          )
        ) {
          unmove(dX, dY);
          if (canvasMap[r][c].frame == 2) {
            console.log("You're touching a tree!");
            touchingTree = true;
            treeInContact = canvasMap[r][c];
            //console.log("This is the tree: ", treeInContact);
          } else {
            touchingTree = false;
            treeInContact = null;
          }
        }
      }
    }
  }

  // goal collision detection
  // reduce goal collision coordinates by 8 pixels <== MAKE THIS MORE ACCURATE
  if (
    rectIntersect(
      player.x + 4,
      player.y + 4,
      WIDTH + 4,
      HEIGHT + 4,
      goal.x + 8,
      goal.y + 8,
      WIDTH - 8,
      HEIGHT - 8
    ) &&
    goalReached == false
  ) {
    goalReached = true;
    win();
  }

  direction = dir;
}

// gameLoop()...Main game loop - Martin Himmel
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let hasMoved = false;

  // only one direction at a time
  if (keyPresses.w) {
    move(0, -VELOCITY, UP);
    hasMoved = true;
  } else if (keyPresses.s) {
    move(0, VELOCITY, DOWN);
    hasMoved = true;
  } else if (keyPresses.a) {
    move(-VELOCITY, 0, LEFT);
    hasMoved = true;
  } else if (keyPresses.d) {
    move(VELOCITY, 0, RIGHT);
    hasMoved = true;
  }

  // must also be facing the tree
  if (keyPresses.g && touchingTree) {
    if (treeInContact != null) {
      removeTree();
      console.log("This tree was removed: ", treeInContact);
      treeInContact = null;
    }
  }

  if (hasMoved) {
    frameCount++;
    if (frameCount >= FRAME_LIMIT) {
      frameCount = 0;
      currentLoopIndex++;
      if (currentLoopIndex >= CYCLE_LOOP.length) currentLoopIndex = 0;
    }
  } else currentLoopIndex = 0;

  //TODO: implemnt drawing based on z-index
  drawSprite(CYCLE_LOOP[currentLoopIndex], direction);
  drawFeatures();
  window.requestAnimationFrame(gameLoop);
}

// win()...Change background color of body
function win() {
  document.body.style.backgroundColor = "#0f6000";
  //window.alert("You found the Orb!");
}

// loadComplete()...Initial function called when loading body
function loadComplete() {
  if (DEBUG) console.log("=== DEBUG MODE ===");

  console.log("Load is complete.");
  canvas = document.getElementById("the-game");
  ctx = canvas.getContext("2d");
  fillCanvasMap2();
  window.requestAnimationFrame(gameLoop);
}