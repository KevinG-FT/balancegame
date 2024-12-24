let frequency = 50, soc = 50, revenue = 0, cycleCount = 0, gameActive = false, fcrNToggled = false;
const maxOptions = 4, timeLimit = 180;
let fcrUpRemaining = maxOptions, fcrDownRemaining = maxOptions, ffrRemaining = maxOptions, timeRemaining = timeLimit;
let frequencyInterval, fcrNInterval;

const elements = ['frequencyArrow', 'frequencyValue', 'batterySoc', 'batteryLabel', 'status', 'timer', 'revenue', 'cycleCount', 'lossMessage', 'batteryWarning', 'fcrUpCount', 'fcrDownCount', 'ffrCount']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});
const buttons = ['fcrUp', 'fcrDown', 'ffr', 'charge', 'discharge', 'startGame', 'pauseGame', 'restartGame']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});

const fcrNToggle = document.getElementById('fcrNToggle');

if (fcrNToggle) {
    fcrNToggle.onclick = () => toggleFcrN(!fcrNToggled);
} else {
    console.error('Element with id "fcrNToggle" not found.');
}

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
        fcrNToggle.disabled = true;
        if (fcrNToggled) toggleFcrN(false);
    } else {
        fcrNToggle.disabled = false;
    }

    checkGameOver();
};

const checkGameOver = () => {
    if (frequency < 49.5 || frequency > 50.5 || soc < 10 || soc > 90) {
        gameActive = false;
        clearInterval(frequencyInterval);
        clearInterval(fcrNInterval);
        elements.lossMessage.textContent = 'Game Over!';
    }
};

const performAction = (action, { freqImpact, socImpact, revenueImpact }) => {
    if (action === 'fcrUp' && fcrUpRemaining > 0) {
        fcrUpRemaining--;
    } else if (action === 'fcrDown' && fcrDownRemaining > 0) {
        fcrDownRemaining--;
    } else if (action === 'ffr' && ffrRemaining > 0) {
        ffrRemaining--;
    } else if (action !== 'charge' && action !== 'discharge') {
        return; // Do nothing if no remaining actions
    }

    frequency += freqImpact;
    soc = Math.min(100, Math.max(0, soc + socImpact));
    revenue += revenueImpact;
    updateUI();
};

const startFcrN = () => {
    fcrNInterval = setInterval(() => {
        if (!fcrNToggled || soc < 40 || soc > 60) {
            fcrNToggle.disabled = true;
            if (fcrNToggled) toggleFcrN(false);
            return;
        }
        fcrNToggle.disabled = false;
        frequency += (Math.random() - 0.5) * 0.05;
        soc = Math.max(0, soc - 0.1);
        cycleCount += 0.5;
        revenue += 10;
        updateUI();
    }, 1000);
};

const toggleFcrN = (state) => {
    fcrNToggled = state;
    if (fcrNToggled) {
        startFcrN();
    } else {
        clearInterval(fcrNInterval);
    }
};

buttons.startGame.onclick = () => {
    gameActive = true;
    elements.lossMessage.textContent = '';
    frequencyInterval = setInterval(() => {
        frequency += (Math.random() - 0.5) * 0.1;
        updateUI();
    }, 1000);
    updateUI();
};

buttons.pauseGame.onclick = () => {
    gameActive = false;
    clearInterval(frequencyInterval);
    clearInterval(fcrNInterval);
    updateUI();
};

buttons.restartGame.onclick = () => {
    gameActive = false;
    clearInterval(frequencyInterval);
    clearInterval(fcrNInterval);
    frequency = 50;
    soc = 50;
    revenue = 0;
    cycleCount = 0;
    fcrUpRemaining = maxOptions;
    fcrDownRemaining = maxOptions;
    ffrRemaining = maxOptions;
    timeRemaining = timeLimit;
    fcrNToggled = false;
    elements.lossMessage.textContent = '';
    updateUI();
};

buttons.charge.onclick = () => performAction('charge', { freqImpact: 0.1, socImpact: 5, revenueImpact: -20 });
buttons.discharge.onclick = () => performAction('discharge', { freqImpact: -0.1, socImpact: -5, revenueImpact: 20 });
buttons.fcrUp.onclick = () => performAction('fcrUp', { freqImpact: -0.2, socImpact: -10, revenueImpact: 30 });
buttons.fcrDown.onclick = () => performAction('fcrDown', { freqImpact: 0.2, socImpact: 10, revenueImpact: -30 });
buttons.ffr.onclick = () => performAction('ffr', { freqImpact: 0.3, socImpact: -15, revenueImpact: 50 });

updateUI();