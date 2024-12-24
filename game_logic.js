let frequency = 50, soc = 50, revenue = 0, cycleCount = 0, gameActive = false, fcrNToggled = false;
const maxOptions = 4, timeLimit = 180;
let fcrUpRemaining = maxOptions, fcrDownRemaining = maxOptions, ffrRemaining = maxOptions, timeRemaining = timeLimit;
let frequencyInterval, fcrNInterval;

const elements = ['frequencyArrow', 'frequencyValue', 'batterySoc', 'batteryLabel', 'status', 'timer', 'revenue', 'cycleCount', 'lossMessage', 'batteryWarning', 'fcrUpCount', 'fcrDownCount', 'ffrCount']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});
const buttons = ['fcrUp', 'fcrDown', 'ffr', 'charge', 'discharge', 'startGame', 'pauseGame', 'restartGame', 'fcrN']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});

const updateUI = () => {
    const arrowPos = Math.min(100, Math.max(0, ((frequency - 49.5) / 1) * 100));
    elements.frequencyArrow.style.left = `${arrowPos}%`;
    elements.frequencyValue.textContent = `${frequency.toFixed(2)} Hz`;
    elements.batterySoc.style.height = `${soc}%`;
    elements.batterySoc.style.background = soc > 90 || soc < 10 ? 'red' : 'blue';
    elements.batteryLabel.textContent = `${soc.toFixed(1)}% State of Charge`;
    elements.revenue.textContent = `Revenue: $${revenue}`;
    elements.cycleCount.textContent = `Battery Cycles: ${cycleCount}`;
    elements.fcrUpCount.textContent = fcrUpRemaining;
    elements.fcrDownCount.textContent = fcrDownRemaining;
    elements.ffrCount.textContent = ffrRemaining;

    if (soc < 40 || soc > 60 || !gameActive) {
        buttons.fcrN.disabled = true;
        if (fcrNToggled) toggleFcrN(false);
    } else {
        buttons.fcrN.disabled = false;
    }

    if (cycleCount > 40) {
        elements.batteryWarning.textContent = 'Battery life shortened due to excessive cycles!';
    } else {
        elements.batteryWarning.textContent = '';
    }

    if (soc < 10 || soc > 90 || frequency < 49.5 || frequency > 50.5) {
        endGame('BLACKOUT - You lose!');
    }
};

const performAction = (type, { freqImpact, socImpact, revenueImpact, decrement }) => {
    if (!gameActive || decrement <= 0) return;
    if (type === 'charge' || type === 'discharge') cycleCount++;
    else cycleCount += socImpact ? 1 : 0;
    frequency += freqImpact;
    soc = Math.min(100, Math.max(0, soc + socImpact));
    revenue += revenueImpact;
    if (fcrNToggled) toggleFcrN(false);
    updateUI();
};

const startFcrN = () => {
    fcrNInterval = setInterval(() => {
        if (!fcrNToggled || soc < 40 || soc > 60) return;
        frequency += (Math.random() - 0.5) * 0.05; // Small stabilizing effect
        soc = Math.max(0, soc - 0.1); // Slowly decreases SoC
        cycleCount += 0.5; // Increases cycle count symmetrically
        updateUI();
    }, 1000);
};

const toggleFcrN = (state) => {
    fcrNToggled = state;
    if (fcrNToggled) {
        buttons.fcrN.textContent = 'FCR-N ON';
        startFcrN();
    } else {
        clearInterval(fcrNInterval);
        buttons.fcrN.textContent = 'Toggle FCR-N';
    }
    updateUI();
};

const startGame = () => {
    gameActive = true;
    timeRemaining = timeLimit;
    buttons.startGame.disabled = true;
    buttons.pauseGame.disabled = false;
    elements.status.textContent = 'Status: Stable';

    const timer = setInterval(() => {
        if (--timeRemaining < 0 || !gameActive) {
            clearInterval(timer);
            if (frequency >= 49.5 && frequency <= 50.5) {
                endGame('Congratulations! You win!');
            } else {
                endGame('BLACKOUT - You lose!');
            }
        }
        const m = Math.floor(timeRemaining / 60), s = timeRemaining % 60;
        elements.timer.textContent = `Time Left: ${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);

    frequencyInterval = setInterval(() => {
        if (!gameActive) return clearInterval(frequencyInterval);
        frequency += (Math.random() - 0.5) * 0.1; // Slower random fluctuations
        updateUI();
    }, 1000);
};

const endGame = (msg) => {
    gameActive = false;
    clearInterval(frequencyInterval);
    clearInterval(fcrNInterval);
    elements.lossMessage.textContent = msg;
    buttons.startGame.disabled = false;
    buttons.pauseGame.disabled = true;
};

buttons.startGame.onclick = startGame;
buttons.pauseGame.onclick = () => (gameActive = false);
buttons.restartGame.onclick = () => {
    Object.assign(this, { frequency: 50, soc: 50, revenue: 0, cycleCount: 0, fcrUpRemaining: maxOptions, fcrDownRemaining: maxOptions, ffrRemaining: maxOptions });
    elements.lossMessage.textContent = '';
    updateUI();
    elements.timer.textContent = 'Time Left: 3:00';
};

buttons.fcrUp.onclick = () => performAction('fcrUp', { freqImpact: 0.2, socImpact: -2, revenueImpact: 50, decrement: --fcrUpRemaining });
buttons.fcrDown.onclick = () => performAction('fcrDown', { freqImpact: -0.2, socImpact: 2, revenueImpact: 50, decrement: --fcrDownRemaining });
buttons.ffr.onclick = () => performAction('ffr', { freqImpact: -(frequency - 50), socImpact: -5, revenueImpact: 100, decrement: --ffrRemaining });
buttons.charge.onclick = () => performAction('charge', { freqImpact: 0.1, socImpact: 5, revenueImpact: -20, decrement: 1 });
buttons.discharge.onclick = () => performAction('discharge', { freqImpact: -0.1, socImpact: -5, revenueImpact: 50, decrement: 1 });
buttons.fcrN.onclick = () => toggleFcrN(!fcrNToggled);
updateUI();
