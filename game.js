//Alexnader Chao Assignment 2
//UCID: 30046585

//From Pavols Game Engine
let MSGame = (function(){

  // private constants
  const STATE_HIDDEN = "hidden";
  const STATE_SHOWN = "shown";
  const STATE_MARKED = "marked";

  function array2d( nrows, ncols, val) {
    const res = [];
    for( let row = 0 ; row < nrows ; row ++) {
      res[row] = [];
      for( let col = 0 ; col < ncols ; col ++)
        res[row][col] = val(row,col);
    }
    return res;
  }

  // returns random integer in range [min, max]
  function rndInt(min, max) {
    [min,max] = [Math.ceil(min), Math.floor(max)]
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  class _MSGame {
    constructor() {
      this.init(8,10,10); // easy
    }

    validCoord(row, col) {
      return row >= 0 && row < this.nrows && col >= 0 && col < this.ncols;
    }

    init(nrows, ncols, nmines) {
      this.nrows = nrows;
      this.ncols = ncols;
      this.nmines = nmines;
      this.nmarked = 0;
      this.nuncovered = 0;
      this.exploded = false;
      // create an array
      this.arr = array2d(
        nrows, ncols,
        () => ({mine: false, state: STATE_HIDDEN, count: 0}));
    }

    count(row,col) {
      const c = (r,c) =>
            (this.validCoord(r,c) && this.arr[r][c].mine ? 1 : 0);
      let res = 0;
      for( let dr = -1 ; dr <= 1 ; dr ++ )
        for( let dc = -1 ; dc <= 1 ; dc ++ )
          res += c(row+dr,col+dc);
      return res;
    }
    sprinkleMines(row, col) {
        // prepare a list of allowed coordinates for mine placement
      let allowed = [];
      for(let r = 0 ; r < this.nrows ; r ++ ) {
        for( let c = 0 ; c < this.ncols ; c ++ ) {
          if(Math.abs(row-r) > 2 || Math.abs(col-c) > 2)
            allowed.push([r,c]);
        }
      }
      this.nmines = Math.min(this.nmines, allowed.length);
      for( let i = 0 ; i < this.nmines ; i ++ ) {
        let j = rndInt(i, allowed.length-1);
        [allowed[i], allowed[j]] = [allowed[j], allowed[i]];
        let [r,c] = allowed[i];
        this.arr[r][c].mine = true;
      }
      // erase any marks (in case user placed them) and update counts
      for(let r = 0 ; r < this.nrows ; r ++ ) {
        for( let c = 0 ; c < this.ncols ; c ++ ) {
          if(this.arr[r][c].state == STATE_MARKED)
            this.arr[r][c].state = STATE_HIDDEN;
          this.arr[r][c].count = this.count(r,c);
        }
      }
      let mines = []; let counts = [];
      for(let row = 0 ; row < this.nrows ; row ++ ) {
        let s = "";
        for( let col = 0 ; col < this.ncols ; col ++ ) {
          s += this.arr[row][col].mine ? "B" : ".";
        }
        s += "  |  ";
        for( let col = 0 ; col < this.ncols ; col ++ ) {
          s += this.arr[row][col].count.toString();
        }
        mines[row] = s;
      }
      console.log("Mines and counts after sprinkling:");
      console.log(mines.join("\n"), "\n");
    }
    // uncovers a cell at a given coordinate
    // this is the 'left-click' functionality
    uncover(row, col) {
      console.log("uncover", row, col);
      // if coordinates invalid, refuse this request
      if( ! this.validCoord(row,col)) return false;
      // if this is the very first move, populate the mines, but make
      // sure the current cell does not get a mine
      if( this.nuncovered === 0)
        this.sprinkleMines(row, col);
      // if cell is not hidden, ignore this move
      if( this.arr[row][col].state !== STATE_HIDDEN) return false;
      // floodfill all 0-count cells
      const ff = (r,c) => {
        if( ! this.validCoord(r,c)) return;
        if( this.arr[r][c].state !== STATE_HIDDEN) return;
        this.arr[r][c].state = STATE_SHOWN;
        this.nuncovered ++;
        if( this.arr[r][c].count !== 0) return;
        ff(r-1,c-1);ff(r-1,c);ff(r-1,c+1);
        ff(r  ,c-1);         ;ff(r  ,c+1);
        ff(r+1,c-1);ff(r+1,c);ff(r+1,c+1);
      };
      ff(row,col);
      // have we hit a mine?
      if( this.arr[row][col].mine) {
        this.exploded = true;
      }
      return true;
    }
    // puts a flag on a cell
    // this is the 'right-click' or 'long-tap' functionality
    mark(row, col) {
      console.log("mark", row, col);
      // if coordinates invalid, refuse this request
      if( ! this.validCoord(row,col)) return false;
      // if cell already uncovered, refuse this
      console.log("marking previous state=", this.arr[row][col].state);
      if( this.arr[row][col].state === STATE_SHOWN) return false;
      // accept the move and flip the marked status
      this.nmarked += this.arr[row][col].state == STATE_MARKED ? -1 : 1;
      this.arr[row][col].state = this.arr[row][col].state == STATE_MARKED ?
        STATE_HIDDEN : STATE_MARKED;
      return true;
    }
    // returns array of strings representing the rendering of the board
    //      "H" = hidden cell - no bomb
    //      "F" = hidden cell with a mark / flag
    //      "M" = uncovered mine (game should be over now)
    // '0'..'9' = number of mines in adjacent cells
    getRendering() {
      const res = [];
      for( let row = 0 ; row < this.nrows ; row ++) {
        let s = "";
        for( let col = 0 ; col < this.ncols ; col ++ ) {
          let a = this.arr[row][col];
          if( this.exploded && a.mine) s += "M";
          else if( a.state === STATE_HIDDEN) s += "H";
          else if( a.state === STATE_MARKED) s += "F";
          else if( a.mine) s += "M";
          else s += a.count.toString();
        }
        res[row] = s;
      }
      return res;
    }
    getStatus() {
      let done = this.exploded ||
          this.nuncovered === this.nrows * this.ncols - this.nmines;
      return {
        done: done,
        exploded: this.exploded,
        nrows: this.nrows,
        ncols: this.ncols,
        nmarked: this.nmarked,
        nuncovered: this.nuncovered,
        nmines: this.nmines
      }
    }
  }

  return _MSGame;

})();

let game =  new MSGame();

let container = document.getElementById('btnContainer');
const small = document.getElementById('smallButton');
const med = document.getElementById('medButton');
const large = document.getElementById('largeButton');
let array=[[]];

//Timer code from Emmanuels tutorial help
let t = 0;
let timer = null;

function stop(){
  if(timer){
    window.clearInterval(timer);
    timer = 0;
    t = 0;
    document.getElementById("stat1").innerHTML = "Timer: ";
  }
}

function start(){
  timer = setInterval(function(){
    t++;
    document.getElementById("stat1").innerHTML = ('000' + t).substr(-3);
  }, 1000);
}

make();

//base Idea of generating the grid of button depending size from Emmanuels tutorial help
//Function that makes the grid depending on the size.
function make(ncols = 10, nrows = 8, bomb = 10){
  const nbuttons = nrows*ncols
  let buttonSize = container.clientWidth / ncols;
  
  stop();  

  start();

  

  array.forEach(button => {
    button.forEach(elem => {
      elem.remove();
    })
  });

  container.style.gridTemplateColumns = `repeat(${ncols}, ${buttonSize}px)`;
  container.style.gridTemplateRows = `repeat(${nrows}, ${buttonSize}px)`;
  
  array = [...Array(nrows)].map(x=>Array(ncols).fill(0)); 
  
  //Dynamic button creation
  for(let i = 0; i < nrows; i++){

    for(let j = 0; j < ncols; j++){
      let button = document.createElement('button');
      button.classList.add("btn");
      button.dataset.key = `${i},${j}`;
      button.classList.add("greenbut");
      array[i][j] = button;
      button.addEventListener('click', function(e){
        if(e.target){
          let coord = e.target.dataset.key;
          const[row, col] =coord.split(",").map(el =>{
            return Number.parseInt(el, 10);
          });
          game.uncover(row,col);
          updater();
          
        }  
      });

      button.addEventListener('contextmenu', function(e){
        if(e.target){
          let coord = e.target.dataset.key;
          const[row, col] =coord.split(",").map(el =>{
            return Number.parseInt(el, 10);
          });
          game.mark(row,col);
          updater();
          
        }  
      });

    container.append(button);
  }
  }
  game.init(nrows, ncols,bomb);
}

//Update the UI grid when called
function updater(){
  const update = game.getRendering();
  update.forEach((updateRow, indexRow) => {
    let testing = updateRow.split("")
    testing.forEach((letter, indexCol) => {
      const button = array[indexRow][indexCol];
      switch(letter){
        case "H":
          break;
        case "0":
          button.classList.replace("greenbut","uncover");
          break;
        case "M":
          button.classList.replace("greenbut", "mine");
          break;
        case "F":
          button.classList.replace("greenbut", "flag");
          break;
        default:
          button.innerHTML = letter;
          button.classList.replace("greenbut", "uncover");
      }
    }
    );
  });
  game.getStatus();
  const status = game.getStatus();
  let statusHead = document.getElementById("gamestatus");
  if(status.done && status.exploded){
    statusHead.innerHTML = "You Lose";
    statusHead.classList.add("lose");
  } 
  else if(status.exploded){
    statusHead.innerHTML = "You Win";
    statusHead.classList.add("win");
  }
  
}

//Check if the size is going to be changed
small.addEventListener('click',function(e){
  make(10,8,10);  
  stop();
  start();
});

med.addEventListener('click',function(e){
  make(18,14,40);
  stop();
  start();
});

large.addEventListener('click',function(e){
  make(24,20,99);
  stop();
  start();
});

