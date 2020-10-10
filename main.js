$(document).ready(function() {
    $.event.special.tap.emitTapOnTaphold = false;
});

function isMobile() {
    return ((window.innerWidth <= 800) && (window.innerHeight <= 600)); // could make more robust
}

"use strict";
window.addEventListener('load', main);

let MSGame = (function() {

    // private constants
    const STATE_HIDDEN = "hidden";
    const STATE_SHOWN = "shown";
    const STATE_MARKED = "marked";

    function array2d(rows, cols, val) {
        const res = [];
        for (let row = 0; row < rows; row++) {
            res[row] = [];
            for (let col = 0; col < cols; col++)
                res[row][col] = val(row, col);
        }
        return res;
    }

    // returns random integer in range [min, max]
    function rndInt(min, max) {
        [min, max] = [Math.ceil(min), Math.floor(max)]
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
            this.arr = array2d(
                rows,
                cols,
                () => ({
                    mine: false,
                    cellState: STATE_HIDDEN,
                    count: 0
                }));
        }

        count(row, col) {
            const c = (r, c) =>
                (this.validCoord(r, c) && this.arr[r][c].mine ? 1 : 0);
            let res = 0;
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++)
                    res += c(row + dr, col + dc);
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
                    if (this.arr[r][c].cellState == STATE_MARKED)
                        this.arr[r][c].cellState = STATE_HIDDEN;
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
                if (this.nuncovered === 0)
                    this.sprinkleMines(row, col);
                // if cell is not hidden, ignore this move
                if (this.arr[row][col].cellState !== STATE_HIDDEN) return false;
                // floodfill all 0-count cells
                const ff = (r, c) => {
                    if (!this.validCoord(r, c)) return;
                    if (this.arr[r][c].cellState !== STATE_HIDDEN) return;
                    this.arr[r][c].cellState = STATE_SHOWN;
                    this.nuncovered++;
                    if (this.arr[r][c].count !== 0) return;
                    ff(r - 1, c - 1);
                    ff(r - 1, c);
                    ff(r - 1, c + 1);
                    ff(r, c - 1);;
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
                this.arr[row][col].cellState = this.arr[row][col].cellState == STATE_MARKED ?
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
            let done = this.exploded ||
                this.nuncovered === this.rows * this.cols - this.mines;
            return {
                done: done,
                exploded: this.exploded,
                rows: this.rows,
                cols: this.cols,
                nmarked: this.nmarked,
                nuncovered: this.nuncovered,
                nmines: this.mines
            }
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
                    unlockCell(cell.getAttribute("id"), game);
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


function cell_click_cb(game, id) {
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

function cell_taphold_cd(game, id) {
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
                $(`#${i}`).on("tap", () => {
                    (cell_click_cb(game, i))
                });
                $(`#${i}`).on("taphold", () => {
                    (cell_taphold_cd(game, i))
                });
            } else {
                $(`#${i}`).on("contextmenu", () => {
                    (cell_taphold_cd(game, i))
                    return false;
                });
                $(`#${i}`).on("click", () => {
                    (cell_click_cb(game, i))
                });
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
        $(`#${id}`).on("tap", () => {
            (cell_click_cb(game, id))
        });
    } else {
        $(`#${id}`).on("click", () => {
            (cell_click_cb(game, id))
        });
    }
}



function main() {
    let game = new MSGame();

    document.querySelectorAll(".menuButton").forEach((button) => {
        let [rows, cols] = button.getAttribute("data-size").split("x").map(s => Number(s));
        button.addEventListener("click", button_cb.bind(null, game, rows, cols));
    });

    prepare_dom(game);

    button_cb(game, game.rows, game.cols);

}