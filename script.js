class SudokuGenerator {
    constructor(holes) {
        this.N = 9;
        this.SRN = 3; // Raiz quadrada de 9
        this.holes = holes; // Quantidade de células vazias
        this.grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.solution = [];
    }

    generate() {
        this.fillDiagonal();
        this.fillRemaining(0, this.SRN);
        
        // Salva o gabarito completo antes de apagar os buracos
        this.solution = this.grid.map(row => [...row]);
        
        this.removeDigits();
        return { grid: this.grid, solution: this.solution };
    }

    fillDiagonal() {
        for (let i = 0; i < this.N; i = i + this.SRN) {
            this.fillBox(i, i);
        }
    }

    unUsedInBox(rowStart, colStart, num) {
        for (let i = 0; i < this.SRN; i++) {
            for (let j = 0; j < this.SRN; j++) {
                if (this.grid[rowStart + i][colStart + j] === num) return false;
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
                } while (!this.unUsedInBox(rowStart, colStart, num));
                this.grid[rowStart + i][colStart + j] = num;
            }
        }
    }

    checkIfSafe(i, j, num) {
        return (
            this.unUsedInRow(i, num) &&
            this.unUsedInCol(j, num) &&
            this.unUsedInBox(i - (i % this.SRN), j - (j % this.SRN), num)
        );
    }

    unUsedInRow(i, num) {
        for (let j = 0; j < this.N; j++) {
            if (this.grid[i][j] === num) return false;
        }
        return true;
    }

    unUsedInCol(j, num) {
        for (let i = 0; i < this.N; i++) {
            if (this.grid[i][j] === num) return false;
        }
        return true;
    }

    fillRemaining(i, j) {
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
            if (this.checkIfSafe(i, j, num)) {
                this.grid[i][j] = num;
                if (this.fillRemaining(i, j + 1)) return true;
                this.grid[i][j] = 0;
            }
        }
        return false;
    }

    removeDigits() {
        let count = this.holes;
        while (count !== 0) {
            let cellId = Math.floor(Math.random() * (this.N * this.N));
            let i = Math.floor(cellId / this.N);
            let j = cellId % 9;
            if (this.grid[i][j] !== 0) {
                count--;
                this.grid[i][j] = 0;
            }
        }
    }
}

// Variáveis de Estado
let currentGrid = [];
let currentSolution = [];
let currentInitialGrid = []; // Guarda o estado limpo da rodada para o botão "Reiniciar"
let selectedCell = null;

const boardElement = document.getElementById('sudoku-board');
const paletteElement = document.getElementById('number-palette');
const difficultySelect = document.getElementById('difficulty');
const feedbackMsg = document.getElementById('feedback-msg');

function loadGame() {
    const level = difficultySelect.value;
    let holes = 40; // Padrão

    // Define a quantidade de células vazias baseada na dificuldade
    if (level === 'easy') holes = 35;       // Restam 46 dicas
    else if (level === 'medium') holes = 48; // Restam 33 dicas
    else if (level === 'hard') holes = 58;   // Restam apenas 23 dicas

    const sudoku = new SudokuGenerator(holes);
    const puzzle = sudoku.generate();
    
    currentGrid = puzzle.grid;
    currentSolution = puzzle.solution;
    
    // Salva uma cópia profunda para poder reiniciar o mesmo tabuleiro
    currentInitialGrid = JSON.parse(JSON.stringify(currentGrid)); 
    
    feedbackMsg.textContent = '';
    selectedCell = null;
    drawBoard();
}

// Desenha o tabuleiro na tela
function drawBoard() {
    boardElement.innerHTML = '';
    
    // Se estivermos apenas reiniciando, restaura o grid para o estado inicial
    currentGrid = JSON.parse(JSON.stringify(currentInitialGrid));

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cellValue = currentGrid[r][c];
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            if (cellValue !== 0) {
                cell.classList.add('initial');
                cell.appendChild(createImage(cellValue));
                cell.dataset.value = cellValue;
            } else {
                cell.addEventListener('click', () => selectCell(cell));
            }
            boardElement.appendChild(cell);
        }
    }
}

function createImage(number) {
    const img = document.createElement('img');
    img.src = `imagens/${number}.png`;
    img.alt = `Sinal ${number}`;
    return img;
}

function selectCell(cell) {
    if (cell.classList.contains('initial')) return;
    if (selectedCell) selectedCell.classList.remove('selected');
    selectedCell = cell;
    selectedCell.classList.add('selected');
}

function fillCell(number) {
    if (!selectedCell || selectedCell.classList.contains('initial')) return;
    
    const r = parseInt(selectedCell.dataset.row);
    const c = parseInt(selectedCell.dataset.col);
    
    selectedCell.innerHTML = '';
    selectedCell.appendChild(createImage(number));
    selectedCell.dataset.value = number;
    currentGrid[r][c] = number;
    
    selectedCell.classList.remove('error', 'correct');
    if (number === currentSolution[r][c]) {
        selectedCell.classList.add('correct');
    } else {
        selectedCell.classList.add('error');
    }
    
    checkWinCondition();
}

function eraseCell() {
    if (selectedCell && !selectedCell.classList.contains('initial')) {
        selectedCell.innerHTML = '';
        delete selectedCell.dataset.value;
        
        const r = parseInt(selectedCell.dataset.row);
        const c = parseInt(selectedCell.dataset.col);
        currentGrid[r][c] = 0;
        
        selectedCell.classList.remove('error', 'correct');
        feedbackMsg.textContent = '';
    }
}

function checkWinCondition() {
    const cells = document.querySelectorAll('.cell');
    let isCompleteAndCorrect = true;

    for (let cell of cells) {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const val = parseInt(cell.dataset.value);

        if (!val || val !== currentSolution[r][c]) {
            isCompleteAndCorrect = false;
            break;
        }
    }

    if (isCompleteAndCorrect) {
        feedbackMsg.textContent = "Parabéns! Você resolveu o Sudoku em Libras!";
        feedbackMsg.className = 'success-text';
    } else {
        feedbackMsg.textContent = "";
    }
}

function initPalette() {
    paletteElement.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('div');
        btn.classList.add('palette-btn');
        btn.appendChild(createImage(i));
        
        btn.addEventListener('click', () => fillCell(i));
        paletteElement.appendChild(btn);
    }
}

// Eventos de Teclado
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        fillCell(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseCell();
    }
});

// Botões de Ação
document.getElementById('btn-erase').addEventListener('click', eraseCell);
document.getElementById('btn-new').addEventListener('click', loadGame);
document.getElementById('btn-reset').addEventListener('click', () => {
    drawBoard();
    feedbackMsg.textContent = '';
});

// Troca de dificuldade aciona um novo jogo automaticamente
difficultySelect.addEventListener('change', loadGame);

initPalette();
loadGame();