let frequency = 50, soc = 50, revenue = 0, cycleCount = 0, gameActive = false, fcrNToggled = false; spotPrice = 0.0555; wholesalePrice = 0.02775;
let currentSpotPrice = 0.0555;        // EUR/MWh
let currentWholesalePrice = 0.02775;   // EUR/MWh
const MWhPerPress = 0.05;        // 50 kW per discharge / charge button press
const maxOptions = 4, timeLimit = 180;
let fcrUpRemaining = maxOptions, fcrDownRemaining = maxOptions, ffrRemaining = maxOptions, timeRemaining = timeLimit; let timerInterval = null;
let frequencyInterval, fcrNInterval;

/****************************************************
 * ENVIRONMENT VARIABLES
 ****************************************************/
let timeOfDayMinutes = 0;    // 0 = midnight (00:00)
let environmentInterval = null;

// We’ll calculate that 24 hours (1440 minutes) pass in 180 real seconds.
// That means each real second = 8 in-game minutes (1440 / 180).
const minutesPerSecond = 1440 / timeLimit; // = 8


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
    elements.revenue.textContent = `Revenue: EUR ${revenue.toFixed(2)}`;
    elements.cycleCount.textContent = `Battery Cycles: ${cycleCount.toFixed(1)}`;
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
    if (frequency < 49.5 || frequency > 50.5 || soc < 10 || soc > 90 || cycleCount > 30) {
        gameActive = false;
        clearInterval(frequencyInterval);
        clearInterval(fcrNInterval);
        stopEnvironment();
        elements.lossMessage.textContent = 'You failed! Game over!';
    }
    else if (timeRemaining <= 0) {
        gameActive = false;
        clearInterval(frequencyInterval);
        clearInterval(fcrNInterval);
        stopEnvironment();
        if (revenue < 50) {
            elements.lossMessage.textContent = 'You failed! Game over!';
        } else {    
            elements.lossMessage.textContent = 'You did it!';
        }
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
    // Increment the cycle count for any of these actions
    cycleCount++;
    updateUI();
};

// For temperature, we'll do piecewise linear from -10 at 00:00 to +15 at 12:00,
// then down to -8 at 24:00 (i.e., 00:00 next day).
function getTemperature(tMinutes) {
    // tMinutes ranges from 0 -> 1440
    // Segment 1: 0 to 720 minutes (midnight to noon)
    // from -10°C up to +15°C
    if (tMinutes <= 720) {
      // slope = (15 - (-10)) / 720 = 25/720
      const slope = 25 / 720;
      const temp = -10 + slope * tMinutes;
      return temp;
    } else {
      // Segment 2: 720 to 1440 (noon to midnight)
      // from +15°C down to -8°C
      // slope = (-8 - 15) / (1440 - 720) = -23 / 720
      const slope = -23 / 720;
      const temp = 15 + slope * (tMinutes - 720);
      return temp;
    }
  }
  
  // For baseline spot price, piecewise by time of day (t in minutes):
  // 00:00 to 06:00  => .0555 EUR/KwH
  // 06:00 to 09:00  => 0.011 EUR/KwH (morning spike)
  // 09:00 to 21:00  => 0.2 EUR/KwH  (daytime moderate)
  // 21:00 to 24:00  => 0.0084 EUR/KwH
  function getBaseSpotPrice(tMinutes) {
    if (tMinutes < 360) {          // < 06:00
      return 0.0555;
    } else if (tMinutes < 540) {   // < 09:00
      return 0.011;
    } else if (tMinutes < 1260) {  // < 21:00
      return 0.2;
    } else {
      return 0.0084;
    }
  }
  
  // For random wind (1 to 15 m/s)
  function getRandomWind() {
    return 1 + Math.random() * 14; // 1..15
  }
  
  // For random sun conditions
  function getRandomSunCondition() {
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy"];
    const idx = Math.floor(Math.random() * conditions.length);
    return conditions[idx];
  }

 /****************************************************
 * UPDATE ENVIRONMENT
 ****************************************************/
  function updateEnvironment() {
    // 1) Advance time of day
    timeOfDayMinutes += minutesPerSecond;
    if (timeOfDayMinutes >= 1440) {
      timeOfDayMinutes -= 1440; // wrap or stop if you prefer
    }
  
    // Format HH:MM
    const hh = Math.floor(timeOfDayMinutes / 60);
    const mm = Math.floor(timeOfDayMinutes % 60);
    const hhString = hh.toString().padStart(2, "0");
    const mmString = mm.toString().padStart(2, "0");
    document.getElementById("timeOfDay").textContent = `Time: ${hhString}:${mmString}`;
  
    // 2) Temperature
    const temperature = getTemperature(timeOfDayMinutes);
    document.getElementById("temperature").textContent =
      `Temperature: ${temperature.toFixed(1)}°C`;
  
    // 3) Wind
    const wind = getRandomWind();
    document.getElementById("wind").textContent =
      `Wind: ${wind.toFixed(1)} m/s`;
  
    // 4) Sun condition
    const sun = getRandomSunCondition();
    document.getElementById("sun").textContent = `Sun: ${sun}`;
  
    // 5) Spot Price
    let spotPrice = getBaseSpotPrice(timeOfDayMinutes);
  
    // Basic weather/demand factor
    let weatherFactor = 1.0;
    if (temperature < 0)  weatherFactor += 0.05;
    if (wind < 5)         weatherFactor += 0.10;
    if (sun === "Cloudy") weatherFactor += 0.10;
  
    spotPrice *= weatherFactor;
    document.getElementById("spotPrice").textContent =
      `Spot Price: €${spotPrice.toFixed(2)}/kWh`;
  
    // 6) Wholesale Price
    const wholesalePrice = 0.5 * spotPrice;
    document.getElementById("wholesalePrice").textContent =
      `Wholesale Price: €${wholesalePrice.toFixed(2)}/kWh`;

    currentSpotPrice = spotPrice;
    currentWholesalePrice = wholesalePrice;
  }
  
  /****************************************************
   * START & STOP ENVIRONMENT
   ****************************************************/
  function startEnvironment() {
    // If an interval is already running, clear it to avoid duplicates
    clearInterval(environmentInterval);
  
    // Run immediately once so the UI updates as soon as we start
    updateEnvironment();
  
    // Then update environment every second
    environmentInterval = setInterval(updateEnvironment, 1000);
  }
  
  function stopEnvironment() {
    clearInterval(environmentInterval);
    environmentInterval = null;
    // Optionally reset timeOfDayMinutes or anything else
  }

const startFcrN = () => {
    // Clear any existing interval before starting a new one
    clearInterval(fcrNInterval);
  
    fcrNInterval = setInterval(() => {
      // 1. Check if FCR-N is toggled on and SoC is in the acceptable range
      if (!fcrNToggled || soc < 40 || soc > 60) {
        fcrNToggle.disabled = true;
        if (fcrNToggled) toggleFcrN(false);
        return;
      }
      fcrNToggle.disabled = false;
  
      // 2. Calculate frequency deviation from 50 Hz
      const deviation = frequency - 50.0;  
      // A small band around 50 Hz => smaller power commands.
  
      // 3. Convert frequency deviation to a power command (in MW).
      //    For a 1 MW battery: +/- 0.2 Hz => +/- 1 MW.
      let powerCommand = (deviation / 0.2);
      if (powerCommand > 1) powerCommand = 1;
      if (powerCommand < -1) powerCommand = -1;
  
      // 4. Approximate SoC changes for a 1-second interval at 'powerCommand' MW.
      //    Using a bigger factor for gameplay: 0.3% SoC per MW-second.
      const socChangePerMWPerSecond = 0.3;
      let socChange = powerCommand * socChangePerMWPerSecond;
      soc = Math.max(0, Math.min(100, soc + socChange));
  
      // 5. Shallow cycle usage: increment cycleCount slightly if power command is meaningful
      if (Math.abs(powerCommand) > 0.05) {
        cycleCount += 0.1; 
      }
  
      // 6. Reward a small revenue each second based on power provided.
      //    e.g., basePayment * absolute power command
      const basePaymentPerSecond = 10;
      revenue += basePaymentPerSecond * Math.abs(powerCommand);
  
      // 7. Apply a small frequency feedback
      const frequencyResponseFactor = 0.02;
      // Negative powerCommand => frequency goes up
      // Positive powerCommand => frequency goes down
      frequency -= powerCommand * frequencyResponseFactor;
  
      // 8. Random noise in the grid frequency
      frequency += (Math.random() - 0.5) * 0.02;
  
      // 9. Update UI
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

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = (timeRemaining % 60).toString().padStart(2, "0");
    elements.timer.textContent = `Time Left: ${minutes}:${seconds}`;
  }

function setTimer(action) {
    switch (action) {
      case "start":
        // Only start if not already counting down
        if (!timerInterval) {
          gameActive = true;
          timerInterval = setInterval(() => {
            if (!gameActive) return; // if paused or game ended
  
            timeRemaining--;
            updateTimerDisplay();
  
            if (timeRemaining <= 0) {
              // End the game if timer is up
              clearInterval(timerInterval);
              timerInterval = null;
              timeRemaining = 0;
              updateTimerDisplay();
              gameActive = false;
              checkGameOver();
              // Or do any "winning" logic here
            }
          }, 1000);
        }
        break;
  
      case "pause":
        // Pause the countdown
        gameActive = false;
        break;
  
      case "reset":
        // Reset the timer
        gameActive = false;
        clearInterval(timerInterval);
        timerInterval = null;
        timeRemaining = timeLimit;
        updateTimerDisplay();
        break;
  
      default:
        console.warn(`Unknown timer action: ${action}`);
        break;
    }
  }

buttons.startGame.onclick = () => {
    gameActive = true;
    elements.lossMessage.textContent = '';
    // Start the environment
    startEnvironment();
    frequencyInterval = setInterval(() => {
        frequency += (Math.random() - 0.5) * 0.1;
        updateUI();
    }, 1000);
    setTimer("start");
    updateUI();
};

buttons.pauseGame.onclick = () => {
    gameActive = false;
    clearInterval(frequencyInterval);
    clearInterval(fcrNInterval);
    // Pause environment updates
    stopEnvironment(); 
    setTimer("pause");
    updateUI();
};

buttons.restartGame.onclick = () => {
    gameActive = false;
    clearInterval(frequencyInterval);
    clearInterval(fcrNInterval);
    stopEnvironment();
    frequency = 50;
    soc = 50;
    revenue = 0;
    cycleCount = 0;
    fcrUpRemaining = maxOptions;
    fcrDownRemaining = maxOptions;
    ffrRemaining = maxOptions;
    setTimer("reset");
    fcrNToggled = false;
    elements.lossMessage.textContent = '';
    updateUI();
};

buttons.charge.onclick = () => {
    // cost = (MWhPerPress) * (currentSpotPrice)
    const cost = MWhPerPress * currentSpotPrice; 
    // freqImpact = +0.1, socImpact = +5, revenueImpact = -cost
    performAction('charge', {
      freqImpact: 0.1,
      socImpact: 5,
      revenueImpact: -cost
    });
  };
  buttons.discharge.onclick = () => {
    // revenue = (MWhPerPress) * (currentWholesalePrice)
    const income = MWhPerPress * currentWholesalePrice;
    // freqImpact = -0.1, socImpact = -5, revenueImpact = +income
    performAction('discharge', {
      freqImpact: -0.1,
      socImpact: -5,
      revenueImpact: income
    });
  };
buttons.fcrUp.onclick = () => performAction('fcrUp', { freqImpact: 0.2, socImpact: -10, revenueImpact: 30 });
buttons.fcrDown.onclick = () => performAction('fcrDown', { freqImpact: -0.2, socImpact: 10, revenueImpact: -30 });
buttons.ffr.onclick = () => performAction('ffr', { freqImpact: 0.3, socImpact: -15, revenueImpact: 50 });

updateUI();