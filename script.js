class classSudoku {
    constructor(holes) {
        this.N = 9;
        this.SRN = 3; 
        this.holes = holes;
        this.matriz = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.gabarito_final = [];
    }

    gerar_tudo() {
        this.fillDiagonal();
        this.fillResto(0, this.SRN);
        
        this.gabarito_final = this.matriz.map(row => [...row]);
        
        this.tirarNumeros();
        return { grid: this.matriz, solution: this.gabarito_final };
    }

    fillDiagonal() {
        for (let i = 0; i < this.N; i = i + this.SRN) {
            this.fillBox(i, i);
        }
    }

    naoUsadoBox(rowStart, colStart, num) {
        for (let i = 0; i < this.SRN; i++) {
            for (let j = 0; j < this.SRN; j++) {
                if (this.matriz[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    }

    fillBox(rowStart, colStart) {
        let num;
        for (let i = 0; i < this.SRN; i++) {
            for (let j = 0; j < this.SRN; j++) {
                do {
                    num = Math.floor(Math.random() * this.N) + 1;
                } while (!this.naoUsadoBox(rowStart, colStart, num));
                this.matriz[rowStart + i][colStart + j] = num;
            }
        }
    }

    checkSafe(i, j, num) {
        return (
            this.naoUsadoRow(i, num) &&
            this.naoUsadoCol(j, num) &&
            this.naoUsadoBox(i - (i % this.SRN), j - (j % this.SRN), num)
        );
    }

    naoUsadoRow(i, num) {
        for (let j = 0; j < this.N; j++) {
            if (this.matriz[i][j] === num) return false;
        }
        return true;
    }

    naoUsadoCol(j, num) {
        for (let i = 0; i < this.N; i++) {
            if (this.matriz[i][j] === num) return false;
        }
        return true;
    }

    fillResto(i, j) {
        if (j >= this.N && i < this.N - 1) {
            i = i + 1;
            j = 0;
        }
        if (i >= this.N && j >= this.N) return true;

        if (i < this.SRN) {
            if (j < this.SRN) j = this.SRN;
        } else if (i < this.N - this.SRN) {
            if (j === Math.floor(i / this.SRN) * this.SRN) j = j + this.SRN;
        } else {
            if (j === this.N - this.SRN) {
                i = i + 1;
                j = 0;
                if (i >= this.N) return true;
            }
        }

        for (let num = 1; num <= this.N; num++) {
            if (this.checkSafe(i, j, num)) {
                this.matriz[i][j] = num;
                if (this.fillResto(i, j + 1)) return true;
                this.matriz[i][j] = 0;
            }
        }
        return false;
    }

    tirarNumeros() {
        let count = this.holes;
        while (count !== 0) {
            let cellId = Math.floor(Math.random() * (this.N * this.N));
            let i = Math.floor(cellId / this.N);
            let j = cellId % 9;
            if (this.matriz[i][j] !== 0) {
                count--;
                this.matriz[i][j] = 0;
            }
        }
    }
}

var gridAtual = [];
let gabarito = [];
var grid_copia = []; 
let selectCell = null;

const bElement = document.getElementById('sudoku-board');
const pElement = document.getElementById('number-palette');
const diffSelect = document.getElementById('difficulty');
const msg = document.getElementById('feedback-msg');

function carregaJogo() {
    let lvl = diffSelect.value;
    let h = 40; 

    if (lvl == 'easy') {
        h = 35;
    } else if (lvl == 'medium') {
        h = 48;
    } else if (lvl == 'hard') {
        h = 58;
    }

    var game = new classSudoku(h);
    let result = game.gerar_tudo();
    
    gridAtual = result.grid;
    gabarito = result.solution;
    
    grid_copia = JSON.parse(JSON.stringify(gridAtual)); 
    
    msg.textContent = '';
    selectCell = null;
    desenhaGrid();
}

function desenhaGrid() {
    bElement.innerHTML = '';
    
    gridAtual = JSON.parse(JSON.stringify(grid_copia));

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let valor = gridAtual[r][c];
            var divCell = document.createElement('div');
            divCell.classList.add('cell');
            divCell.dataset.row = r;
            divCell.dataset.col = c;
            
            if (valor !== 0) {
                divCell.classList.add('initial');
                divCell.appendChild(criaImg(valor));
                divCell.dataset.value = valor;
            } else {
                divCell.addEventListener('click', () => fSelect(divCell));
            }
            bElement.appendChild(divCell);
        }
    }
}

function criaImg(n) {
    let i = document.createElement('img');
    i.src = `imagens/${n}.png`;
    i.alt = `Sinal ${n}`;
    return i;
}

function fSelect(c) {
    if (c.classList.contains('initial')) return;
    if (selectCell != null) selectCell.classList.remove('selected');
    selectCell = c;
    selectCell.classList.add('selected');
}

function botaNumero(n) {
    if (selectCell == null || selectCell.classList.contains('initial')) {
        return;
    }
    
    let row = parseInt(selectCell.dataset.row);
    let col = parseInt(selectCell.dataset.col);
    
    selectCell.innerHTML = '';
    selectCell.appendChild(criaImg(n));
    selectCell.dataset.value = n;
    gridAtual[row][col] = n;
    
    selectCell.classList.remove('error', 'correct');
    
    if (n === gabarito[row][col]) {
        selectCell.classList.add('correct');
    } else {
        selectCell.classList.add('error');
    }
    
    verificaVitoria();
}

function deletar() {
    if (selectCell && !selectCell.classList.contains('initial')) {
        selectCell.innerHTML = '';
        delete selectCell.dataset.value;
        
        var row = parseInt(selectCell.dataset.row);
        var col = parseInt(selectCell.dataset.col);
        gridAtual[row][col] = 0;
        
        selectCell.classList.remove('error', 'correct');
        msg.textContent = '';
    }
}

function verificaVitoria() {
    let divCells = document.querySelectorAll('.cell');
    let win = true;

    for (let c of divCells) {
        let r = parseInt(c.dataset.row);
        let col = parseInt(c.dataset.col);
        let v = parseInt(c.dataset.value);

        if (!v || v !== gabarito[r][col]) {
            win = false;
            break;
        }
    }

    if (win == true) {
        msg.textContent = "Parabéns! Você resolveu o Sudoku em Libras!";
        msg.className = 'success-text';
    } else {
        msg.textContent = "";
    }
}

function startPaleta() {
    pElement.innerHTML = '';
    for (var x = 1; x <= 9; x++) {
        let b = document.createElement('div');
        b.classList.add('palette-btn');
        b.appendChild(criaImg(x));
        
        let valorFixo = x; 
        b.addEventListener('click', () => botaNumero(valorFixo));
        pElement.appendChild(b);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        botaNumero(parseInt(e.key));
    } else if (e.key == 'Backspace' || e.key == 'Delete') {
        deletar();
    }
});

document.getElementById('btn-erase').addEventListener('click', deletar);
document.getElementById('btn-new').addEventListener('click', carregaJogo);
document.getElementById('btn-reset').addEventListener('click', () => {
    desenhaGrid();
    msg.textContent = '';
});

diffSelect.addEventListener('change', carregaJogo);

startPaleta();
carregaJogo();
