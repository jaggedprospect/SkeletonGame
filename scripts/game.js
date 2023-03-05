/*
Animation and Collision Program
Nate Heppard, February 2020

===== CREDIT ===============================
**  Animation/Movement Code by
	- Martin Himmel @
	https://dev.to/martyhimmel/moving-a-sprite-sheet-character-with-javascript-3adg#comments
	
	General Framework and "features.png" provided by
	- Dr. Michael Weeks
	
	Skeleton Spritesheet provided by
	- pipoya @
	https://pipoya.itch.io/pipoya-free-rpg-character-sprites-32x32
=============================================

** Most Original code has been modified for specific uses in this program.
*/

// 2D ARRAY NOTE: rows equate to x-values, columns equate to y-values!

// === CONSTANTS ===
const WIDTH = 32;	// default entity width
const HEIGHT = 32;	// default entity height
const CYCLE_LOOP = [1,2,1,0]; // frame column order for animation
const FRAME_LIMIT = 12;
const VELOCITY = 1;	// movement speed

// directions (by spritesheet row)
const DOWN = 0;
const UP = 3;
const LEFT = 1;
const RIGHT = 2;

const ID_PLAYER = "player"
const ID_NPC = "npc"
const ID_ENEMY = "enemy"

// === CLASSES ===
class Block {
	constructor(x, y, z, img) {
		this.x = x;		// X coordinate
		this.y = y;		// Y coordinate
		this.z = z;		// Z index
		this.img = img; // sprite image
	}

	getCenter() {
		// TODO: add logic to calculate center point
	}
}

class Entity extends Block {
	constructor(x, y, z, w, h, img) {
		super(x, y, z, img);
		this.w = w;		// hitbox width
		this.h = h; 	// hitbox height
	}
}

class Sprite extends Entity {
	constructor(x, y, z, w, h, img, id, alive = true) {
		super(x, y, z, w, h, img);
		this.id = id;	// sprite id
		this.alive = alive; // necessary?
	}

	isAlive() {
		return this.alive;
	}
}

class Item extends Entity {
	// Not sure how an Item is different right now...
	constructor(x, y, z, w, h, img) {
		super(x, y, z, w, h, img);
	}
}

// start variable (for map use)
var S = -1;

// map layout
var mapLayout = [
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
	[1,0,S,0,1,1,0,2,0,0,0,1,1,0,0,0,0,0,0,1],
	[1,0,0,0,1,1,0,0,0,2,2,1,1,2,2,1,1,1,1,1],
	[1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,2,2,2,1],
	[1,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2,5,2,1],
	[1,1,1,0,0,1,0,0,0,0,0,2,0,0,0,0,2,2,2,1],
	[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,1],
	[1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1],
	[1,0,0,1,1,0,0,1,2,0,0,0,0,0,0,1,1,0,0,1],
	[1,0,0,0,0,0,2,1,0,0,0,0,0,0,0,1,0,0,0,1],
	[1,0,2,0,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// feature image
var featureImage = new Image();
featureImage.src = "res/features2.png";

// sprite image
var spriteImage = new Image();
spriteImage.src = "res/skeleton-soldier.png";

// canvas and context
var canvas;
var ctx;

// sprite coordinates
var spriteX;
var spriteY;

// frame variables
var currentLoopIndex = 0;
var frameCount = 0;
var direction = 0;	// current direction

// key press array
var keyPresses=[];

// canvas map
var canvasMap = [];
var canvasMapRow = 15;	// 480/32
var canvasMapCol = 20;	// 640/32

// goal variables
var goalX;
var goalY;
var goalReached = false;

// **This can be expanded for use with any feature**
// destroy tree
var touchingTree = false;
var treeInContact = null;

/**
	If key is pressed, set key index to true
	- Martin Himmel
*/
window.addEventListener('keydown', keyDownListener, false);
function keyDownListener(event){
	keyPresses[event.key] = true;
}

/**
	If key is released, set key index to false
	- Martin Himmel
*/ 
window.addEventListener('keyup', keyUpListener, false);
function keyUpListener(event){
	keyPresses[event.key] = false;
}

/**
	Initialize array of points on canvas
*/
function initCanvasMap(){
	// create 2D array 
	for(let k =0; k < canvasMapRow; k++)
		canvasMap[k] = [];
		
	// passage wall at [r][10]
	// border walls at [r][0], [r][20], [0][c], [15][c]
	for(let r = 0; r < canvasMapRow; r++){
		for(let c = 0; c < canvasMapCol; c++)
			canvasMap[r][c] = {x: c*32, y: r*32, frame: 0};
	} 
}

/**
	Fill 2D array (canvasMap) using mapLayout
*/
function fillCanvasMap2(){
	for(r = 0; r < canvasMapRow; r++){
		for(c = 0; c < canvasMapCol; c++){
			if(mapLayout[r][c] == -1){
				spriteX = c*WIDTH;
				spriteY = r*HEIGHT
				canvasMap[r][c].frame = 0;
			}else{
				if(mapLayout[r][c] == 5){
					goalX = c*WIDTH;
					goalY = r*HEIGHT;
				}
				
				canvasMap[r][c].frame = mapLayout[r][c];
			}
		}
	}
}

/**
	Remove tree feature from canvas
*/
function removeTree(){	
	for(let r = 0; r < canvasMapRow; r++){
		for(let c = 0; c < canvasMapCol; c++){
			if(c*WIDTH == treeInContact.x && r*HEIGHT == treeInContact.y){
				console.log("This tree is being removed: ", treeInContact);
				// make tree invisible by setting frame to 0
				canvasMap[r][c].frame = 0;
			}
		}
	} 
}

/**
	Draw objects and sprite
	(Original) - Martin Himmel
*/
function draw(frameX, frameY, canvasX, canvasY){
	let index = 0;
	
	// draw sprite
	ctx.drawImage(spriteImage, frameX*WIDTH, frameY*HEIGHT, WIDTH, HEIGHT, 
		canvasX, canvasY, WIDTH, HEIGHT);
		
	
	// draw canvas features
	for(let r = 0; r < canvasMapRow; r++){
		for(let c = 0; c < canvasMapCol; c++){
			if(canvasMap[r][c].frame > 0){
				ctx.drawImage(featureImage, canvasMap[r][c].frame*WIDTH, 0, WIDTH, HEIGHT, 
					canvasMap[r][c].x, canvasMap[r][c].y, WIDTH, HEIGHT);
			}
		}
	}
}

/**
	Check for player collisions with objects
*/
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2){
	// check for collision (overlapping points)
	if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2)
		return false;

	return true;
}

/**
	Cancel sprite movement
*/
function unmove(dX, dY){
	spriteX -= dX;
	spriteY -= dY;
}

/**
	Move sprite and check for collisions
	(Original) - Martin Himmel
*/
function move(dX, dY, dir){
	// canvas border collision detection
	if(spriteX + dX > 0 && spriteX + WIDTH + dX < canvas.width)
		spriteX += dX;
	
	if(spriteY + dY > 0 && spriteY + HEIGHT + dY < canvas.height)
		spriteY += dY;
	
	// canvas features collision detection
	for(let r =0; r < canvasMapRow; r++){
		for(let c = 0; c < canvasMapCol; c++){
			if(canvasMap[r][c].frame > 0 && canvasMap[r][c].frame != 5){
				// reduce sprite and feature collision coordinates by 4 pixels
				if(rectIntersect(spriteX+4, spriteY+4, WIDTH-4, HEIGHT-4, canvasMap[r][c].x+4, canvasMap[r][c].y+4, WIDTH-4, HEIGHT-4)){
					unmove(dX, dY);
					
					if(canvasMap[r][c].frame == 2){
						console.log("You're touching a tree!");
						touchingTree = true;
						treeInContact = canvasMap[r][c];
						//console.log("This is the tree: ", treeInContact);
					}else{
						touchingTree = false;
						treeInContact = null;
					}
				}
			}
		}
	}

	// goal collision detection
	// reduce goal collision coordinates by 8 pixels <== MAKE THIS MORE ACCURATE
	if((rectIntersect(spriteX+4, spriteY+4, WIDTH+4, HEIGHT+4, goalX+8, goalY+8, WIDTH-8, HEIGHT-8)) && goalReached == false){
		goalReached = true;
		win();
	}
		
	direction = dir;
}

/**
	Main game loop
	- Martin Himmel
*/
function gameLoop(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	let hasMoved = false;
	
	// only one direction at a time
	if(keyPresses.w){
		move(0, -VELOCITY, UP);
		hasMoved = true;
	}else if(keyPresses.s){
		move(0, VELOCITY, DOWN);
		hasMoved = true;
	}else if(keyPresses.a){
		move(-VELOCITY, 0, LEFT);
		hasMoved = true;
	}else if(keyPresses.d){
		move(VELOCITY, 0, RIGHT);
		hasMoved = true;
	}
	
	// must also be facing the tree
	if(keyPresses.g && touchingTree){
		if(treeInContact != null){
			removeTree();
			console.log("This tree was removed: ", treeInContact);
			treeInContact = null;
		}
	}
	
	if(hasMoved){
		frameCount++;
		
		if(frameCount >= FRAME_LIMIT){
			frameCount = 0;
			currentLoopIndex++;
			
			if(currentLoopIndex >= CYCLE_LOOP.length)
				currentLoopIndex = 0;
		}
	}else
		currentLoopIndex = 0;
	
	draw(CYCLE_LOOP[currentLoopIndex], direction, spriteX, spriteY);
	window.requestAnimationFrame(gameLoop);
}

/**
	Change background color of body
*/
function win(){
  document.bgColor = "#0f6000";
  //window.alert("You found the Orb!");
}

/**
	Initial function called when loading body
	(Original) - Dr. Michael Weeks
*/
function loadComplete() {
	console.log("Load is complete."); 
	canvas = document.getElementById("the-game");
	ctx = canvas.getContext("2d");
	initCanvasMap();
	//fillCanvasMap();
	fillCanvasMap2();
	window.requestAnimationFrame(gameLoop);
}