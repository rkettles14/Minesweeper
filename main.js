$(document).ready(function() {
  $.event.special.tap.emitTapOnTaphold = false;
});

function isMobile() {
  //the following code is taken from http://detectmobilebrowsers.com/
  let check = false;
  (function(a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

("use strict");
window.addEventListener("load", main);

let MSGame = (function() {
  // private constants
  const STATE_HIDDEN = "hidden";
  const STATE_SHOWN = "shown";
  const STATE_MARKED = "marked";

  function array2d(rows, cols, val) {
    const res = [];
    for (let row = 0; row < rows; row++) {
      res[row] = [];
      for (let col = 0; col < cols; col++) res[row][col] = val(row, col);
    }
    return res;
  }

  // returns random integer in range [min, max]
  function rndInt(min, max) {
    [min, max] = [Math.ceil(min), Math.floor(max)];
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  class _MSGame {
    constructor() {
      this.init(8, 10, 10); // easy
    }

    validCoord(row, col) {
      return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    init(rows, cols, nmines) {
      this.rows = rows;
      this.cols = cols;
      this.mines = nmines;
      this.nmarked = 0;
      this.nuncovered = 0;
      this.exploded = false;
      // create an array
      this.arr = array2d(rows, cols, () => ({
        mine: false,
        cellState: STATE_HIDDEN,
        prevCellState: STATE_HIDDEN,
        count: 0
      }));
    }

    count(row, col) {
      const c = (r, c) =>
        this.validCoord(r, c) && this.arr[r][c].mine ? 1 : 0;
      let res = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) res += c(row + dr, col + dc);
      return res;
    }
    sprinkleMines(row, col) {
      // prepare a list of allowed coordinates for mine placement
      let allowed = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (Math.abs(row - r) > 2 || Math.abs(col - c) > 2)
            allowed.push([r, c]);
        }
      }
      this.mines = Math.min(this.mines, allowed.length);
      for (let i = 0; i < this.mines; i++) {
        let j = rndInt(i, allowed.length - 1);
        [allowed[i], allowed[j]] = [allowed[j], allowed[i]];
        let [r, c] = allowed[i];
        this.arr[r][c].mine = true;
      }
      // erase any marks (in case user placed them) and update counts
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.arr[r][c].cellState == STATE_MARKED){
            this.arr[r][c].cellState = STATE_HIDDEN;
            this.arr[r][c].prevCellState = STATE_MARKED;
          }
          this.arr[r][c].count = this.count(r, c);
        }
      }
      let mines = [];
      let counts = [];
      for (let row = 0; row < this.rows; row++) {
        let s = "";
        for (let col = 0; col < this.cols; col++) {
          s += this.arr[row][col].mine ? "B" : ".";
        }
        s += "  |  ";
        for (let col = 0; col < this.cols; col++) {
          s += this.arr[row][col].count.toString();
        }
        mines[row] = s;
      }
      console.log("Mines and counts after sprinkling:");
      console.log(mines.join("\n"), "\n");
    }

    // puts a flag on a cell
    // this is the 'right-click' or 'long-tap' functionality
    uncover(row, col) {
      console.log("uncover", row, col);
      // if coordinates invalid, refuse this request
      if (!this.validCoord(row, col)) return false;
      // if this is the very first move, populate the mines, but make
      // sure the current cell does not get a mine
      if (this.nuncovered === 0) this.sprinkleMines(row, col);
      // if cell is not hidden, ignore this move
      if (this.arr[row][col].cellState !== STATE_HIDDEN) return false;
      // floodfill all 0-count cells
      const ff = (r, c) => {
        if (!this.validCoord(r, c)) return;
        if (this.arr[r][c].cellState !== STATE_HIDDEN) return;
        this.arr[r][c].cellState = STATE_SHOWN;
        this.arr[r][c].prevCellState = STATE_HIDDEN;
        this.nuncovered++;
        if (this.arr[r][c].count !== 0) return;
        ff(r - 1, c - 1);
        ff(r - 1, c);
        ff(r - 1, c + 1);
        ff(r, c - 1);
        ff(r, c + 1);
        ff(r + 1, c - 1);
        ff(r + 1, c);
        ff(r + 1, c + 1);
      };
      ff(row, col);
      // have we hit a mine?
      if (this.arr[row][col].mine) {
        this.exploded = true;
      }
      return true;
    }
    // uncovers a cell at a given coordinate
    // this is the 'left-click' functionality
    mark(row, col) {
      console.log("mark", row, col);
      // if coordinates invalid, refuse this request
      if (!this.validCoord(row, col)) return false;
      // if cell already uncovered, refuse this
      console.log("marking previous cellState=", this.arr[row][col].cellState);
      if (this.arr[row][col].cellState === STATE_SHOWN) return false;
      // accept the move and flip the marked gameStatus
      this.nmarked += this.arr[row][col].cellState == STATE_MARKED ? -1 : 1;
      this.arr[row][col].cellState =
        this.arr[row][col].cellState == STATE_MARKED
          ? STATE_HIDDEN
          : STATE_MARKED;
      this.arr[row][col].prevCellState =
        this.arr[row][col].cellState == STATE_MARKED
          ? STATE_HIDDEN
          : STATE_MARKED;
      return true;
    }
    // returns array of strings representing the rendering of the board
    //      "H" = hidden cell - no bomb
    //      "F" = hidden cell with a mark / flag
    //      "M" = uncovered mine (game should be over now)
    // '0'..'9' = number of mines in adjacent cells
    getRendering() {
      const res = [];
      for (let row = 0; row < this.rows; row++) {
        let s = "";
        for (let col = 0; col < this.cols; col++) {
          let a = this.arr[row][col];
          if (this.exploded && a.mine) s += "M";
          else if (a.cellState === STATE_HIDDEN) s += "H";
          else if (a.cellState === STATE_MARKED) s += "F";
          else if (a.mine) s += "M";
          else s += a.count.toString();
        }
        res[row] = s;
      }
      return res;
    }
    getGameStatus() {
      let done =
        this.exploded || this.nuncovered === this.rows * this.cols - this.mines;
      return {
        done: done,
        exploded: this.exploded,
        rows: this.rows,
        cols: this.cols,
        nmarked: this.nmarked,
        nuncovered: this.nuncovered,
        nmines: this.mines
      };
    }
  }

  return _MSGame;
})();

/**
 * - hides unnecessary cards by setting their display: none
 * - adds "flipped" class to cards that were flipped
 *
 */
function render(game) {
  const grid = document.querySelector(".grid");
  grid.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;
  for (let i = 0; i < grid.children.length; i++) {
    const cell = grid.children[i];
    const id = Number(cell.getAttribute("data-cellId"));
    if (id >= game.rows * game.cols) {
      cell.style.display = "none";
    } else {
      cell.style.display = "block";
      cell.style.backgroundImage = "none";
      if (game) {
        const col = id % game.cols;
        const row = Math.floor(id / game.cols);
        if (game.arr[row][col].cellState == "shown") {
          lockCell(cell.getAttribute("id"), game); //fix this for marking
          cell.classList.add("shown");
          cell.classList.add("image");
          if (game.arr[row][col].count == 0) {
            cell.style.backgroundImage = "none";
          } else if (game.arr[row][col].count == 1) {
            cell.style.backgroundImage = "url('one.svg')";
          } else if (game.arr[row][col].count == 2) {
            cell.style.backgroundImage = "url('two.svg')";
          } else if (game.arr[row][col].count == 3) {
            cell.style.backgroundImage = "url('three.svg')";
          } else if (game.arr[row][col].count == 4) {
            cell.style.backgroundImage = "url('four.svg')";
          } else if (game.arr[row][col].count == 5) {
            cell.style.backgroundImage = "url('five.svg')";
          } else if (game.arr[row][col].count == 6) {
            cell.style.backgroundImage = "url('six.svg')";
          } else if (game.arr[row][col].count == 7) {
            cell.style.backgroundImage = "url('seven.svg')";
          } else if (game.arr[row][col].count == 8) {
            cell.style.backgroundImage = "url('eight.svg')";
          } else if (game.arr[row][col].count == 9) {
            cell.style.backgroundImage = "url('nine.svg')";
          }
        } else if (game.arr[row][col].cellState == "hidden") {
          if (game.arr[row][col].prevCellState == "marked") {
            unlockCell(cell.getAttribute("id"), game);
          }
          cell.classList.remove("shown");
          cell.classList.remove("bomb");
        }
        if (game.arr[row][col].cellState == "marked") {
          lockCell(cell.getAttribute("id"), game);
          cell.style.backgroundImage = "url('flag.svg')";
          cell.classList.add("image");
          cell.classList.remove("shown");
          cell.classList.remove("bomb");
        }
        if (game.exploded && game.arr[row][col].mine) {
          cell.style.backgroundImage = "url('bomb.svg')";
          cell.classList.add("image");
          cell.classList.add("bomb");
        }
      }
    }
  }
}

/**
 * callback for the top button
 */
function button_cb(game, rows, cols) {
  game.rows = rows;
  game.cols = cols;
  game.init(game.rows, game.cols, game.mines);
  console.log(game.getRendering().join("\n"));
  render(game);
}

function cell_click_cb(event) {
  const game = event.data.game;
  const id = event.data.id;
  const col = id % game.cols;
  const row = Math.floor(id / game.cols);
  game.uncover(row, col);
  //s.moves++;
  render(game);
  console.log(game.getRendering().join("\n"));
  console.log(game.getGameStatus());
  // check if we won and activate overlay if we did
  // if (s.onoff.reduce((res, l) => res && !l, true)) {
  //     document.querySelector("#overlay").classList.toggle("active");
  // }
  // clickSound.play();
}

function cell_taphold_cd(event) {
  const game = event.data.game;
  const id = event.data.id;
  const col = id % game.cols;
  const row = Math.floor(id / game.cols);
  game.mark(row, col);
  render(game);
  console.log(game.getRendering().join("\n"));
  console.log(game.getGameStatus());
}

/**
 * @param {MSGame} game
 */
function prepare_dom(game) {
  const grid = document.querySelector(".grid");
  const nCells = 20 * 24; // max grid size
  for (let i = 0; i < nCells; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("data-cellId", i);
    cell.setAttribute("id", i);
    // cell.addEventListener("click", () => {
    //     cell_click_cb(game, i);
    // });
    grid.appendChild(cell);
  }
  $(document).ready(function() {
    for (let i = 0; i < nCells; i++) {
      if (isMobile()) {
        $(`#${i}`).on("tap", { game: game, id: i }, cell_click_cb);
        $(`#${i}`).on("taphold", { game: game, id: i }, cell_taphold_cd);
      } else {
        $(`#${i}`).on("contextmenu", { game: game, id: i }, cell_taphold_cd);
        $(`#${i}`).on("contextmenu", () => {
          return false;
        });
        $(`#${i}`).on("click", { game: game, id: i }, cell_click_cb);
      } //TODO maybe make this less janky
    }
  });
}

function lockCell(id, game) {
  if (isMobile()) {
    $(`#${id}`).off("tap");
  } else {
    $(`#${id}`).off("click");
  }
}

function unlockCell(id, game) {
  if (isMobile()) {
    $(`#${id}`).on("tap", { game: game, id: id }, cell_click_cb);
  } else {
    $(`#${id}`).on("click", { game: game, id: id }, cell_click_cb);
  }
}

function main() {
  let game = new MSGame();

  document.querySelectorAll(".menuButton").forEach(button => {
    let [rows, cols] = button
      .getAttribute("data-size")
      .split("x")
      .map(s => Number(s));
    button.addEventListener("click", button_cb.bind(null, game, rows, cols));
  });

  prepare_dom(game);

  button_cb(game, game.rows, game.cols);
}
