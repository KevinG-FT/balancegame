 /*****************************************************
     * GLOBAL VARIABLES
     *****************************************************/
 let frequency = 50,
 soc = 50,
 revenue = 0,
 cycleCount = 0,
 gameActive = false,
 fcrNToggled = false,
 spotPrice = 0.0555,
 wholesalePrice = 0.02775,
 currentSpotPrice = 0.0555,
 currentWholesalePrice = 0.02775;

// FCR-D Up/Down, N States
const FCRD_UP_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
const FCRD_DOWN_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
let fcrDUpState = FCRD_UP_STATE.INACTIVE;
let fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
let fcrNWasForcedOff = false;

// Timers & Flags
let fcrDUpActive = false;
let fcrDDownActive = false;
let fcrDUpTimer = 0;
let fcrDDownTimer = 0;

// Market usage
const MWhPerPress = 0.05;  // 50 kW
const maxOptions = 4,
   timeLimit = 180;
let fcrUpRemaining = maxOptions,
 fcrDownRemaining = maxOptions,
 ffrRemaining = maxOptions,
 timeRemaining = timeLimit;

// Intervals
let timerInterval = null,
 frequencyInterval = null,
 fcrNInterval = null,
 environmentInterval = null;

// For time of day simulation
let timeOfDayMinutes = 0;
const minutesPerSecond = 1440 / timeLimit; // 24 hours => 3 minutes

/*****************************************************
* DOM ELEMENTS
*****************************************************/
const elements = [
'frequencyArrow','frequencyValue','batterySoc','batteryLabel',
'status','timer','revenue','cycleCount','lossMessage','batteryWarning',
'timeOfDay','temperature','wind','sun','spotPrice','wholesalePrice'
].reduce((acc, id) => {
acc[id] = document.getElementById(id);
return acc;
}, {});

const buttons = [
'startGame','pauseGame','restartGame','charge','discharge','ffr'
].reduce((acc, id) => {
acc[id] = document.getElementById(id);
return acc;
}, {});

const fcrNToggleEl = document.getElementById('fcrNToggle');
const fcrDUpToggleEl = document.getElementById('fcrDUpToggle');
const fcrDDownToggleEl = document.getElementById('fcrDDownToggle');

/*****************************************************
* LOG TO CONSOLE
*****************************************************/
function logToConsole(msg) {
const consoleEl = document.getElementById("gameConsole");
if (!consoleEl) return;
const line = document.createElement("div");
line.textContent = msg;
consoleEl.appendChild(line);
consoleEl.scrollTop = consoleEl.scrollHeight;
}

/*****************************************************
* TOGGLES
*****************************************************/
if (fcrNToggleEl) {
fcrNToggleEl.onclick = () => toggleFcrN(!fcrNToggled);
if (fcrNToggled) {
    logToConsole("FCR-N ON");
    }
else {
    logToConsole("FCR-N OFF"); 
}

fcrDUpToggleEl.onchange = () => {
    if (fcrDUpToggleEl.checked) {
      fcrDUpActive = true;
      logToConsole("FCR-D Up ON");
  
      // Force FCR-N off
      if (fcrNToggled) {
        fcrNWasForcedOff = true;
        toggleFcrN(false);
        logToConsole("FCR-N disabled (FCR-D Up is active).");
      }
    } else {
      fcrDUpActive = false;
      logToConsole("FCR-D Up OFF");
      if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
        fcrDUpState = FCRD_UP_STATE.INACTIVE;
        logToConsole("FCR-D Up deactivated (toggle off).");
      }
  
      // Check if FCR-N was forced off & conditions are valid => re-enable
      if (fcrNWasForcedOff) {
        // Are SoC and frequency in normal range?
        if (soc >= 40 && soc <= 60 && frequency >= 49.5 && frequency <= 50.5) {
          fcrNWasForcedOff = false;
          // Toggle FCR-N on
          toggleFcrN(true);
          logToConsole("FCR-N re-enabled (FCR-D Up off, SoC/freq in range).");
        }
      }
    }
  };

  fcrDDownToggleEl.onchange = () => {
    if (fcrDDownToggleEl.checked) {
      fcrDDownActive = true;
      logToConsole("FCR-D Down ON");
  
      // Force FCR-N off
      if (fcrNToggled) {
        fcrNWasForcedOff = true;
        toggleFcrN(false);
        logToConsole("FCR-N disabled (FCR-D Down is active).");
      }
    } else {
      fcrDDownActive = false;
      logToConsole("FCR-D Down OFF");
      if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
        fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
        logToConsole("FCR-D Down deactivated (toggle off).");
      }
  
      // If FCR-N was forced off & SoC + freq are valid => re-enable
      if (fcrNWasForcedOff) {
        if (soc >= 40 && soc <= 60 && frequency >= 49.5 && frequency <= 50.5) {
          fcrNWasForcedOff = false;
          toggleFcrN(true);
          logToConsole("FCR-N re-enabled (FCR-D Down off, SoC/freq in range).");
        }
      }
    }
  };
  

/*****************************************************
* UPDATE UI
*****************************************************/
function updateUI() {
// Frequency meter
const arrowPos = Math.min(100, Math.max(0, ((frequency - 49.5) / 1) * 100));
elements.frequencyArrow.style.left = arrowPos + "%";
elements.frequencyValue.textContent = frequency.toFixed(2) + " Hz";

// Battery
elements.batterySoc.style.height = soc + "%";
elements.batterySoc.style.background = (soc > 90 || soc < 10) ? 'red' : 'blue';
elements.batteryLabel.textContent = soc.toFixed(1) + "% State of Charge";

// Revenue, cycles
elements.revenue.textContent = "EUR " + revenue.toFixed(2);
elements.cycleCount.textContent = cycleCount.toFixed(1);

// Timer
// (You can keep a separate function if desired)

// Check game over
checkGameOver();
}

/*****************************************************
* CHECK GAME OVER
*****************************************************/
function checkGameOver() {
if (
 frequency < 49.5 || frequency > 50.5 ||
 soc < 10 || soc > 90 ||
 cycleCount > 30
) {
 gameActive = false;
 clearInterval(frequencyInterval);
 clearInterval(fcrNInterval);
 stopEnvironment();
 elements.lossMessage.textContent = "You failed! Game over!";
} else if (timeRemaining <= 0) {
 gameActive = false;
 clearInterval(frequencyInterval);
 clearInterval(fcrNInterval);
 stopEnvironment();
 if (revenue < 50) {
   elements.lossMessage.textContent = "You failed! Game over!";
 } else {
   elements.lossMessage.textContent = "You did it!";
 }
}
}

/*****************************************************
* FCR-D UP LOGIC
*****************************************************/
function updateFCRDUp(deltaTimeSeconds, currentFrequency) {
    // 1) If user toggled OFF, remain inactive
    if (!fcrDUpActive) {
      fcrDUpState = FCRD_UP_STATE.INACTIVE;
      return;
    }
  
    // 2) If frequency >= 49.9, no activation needed
    if (currentFrequency >= 49.9) {
      // Deactivate if we were partial/full
      if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
        logToConsole("FCR-D Up deactivated (freq >= 49.9 Hz).");
      }
      fcrDUpState = FCRD_UP_STATE.INACTIVE;
      fcrDUpTimer = 0;
      return;
    }
  
    // 3) freq < 49.9 => increment how long
    fcrDUpTimer += deltaTimeSeconds;
  
    // 4) Determine partial or full activation
    if (fcrDUpTimer >= 30) {
      // FULL
      if (fcrDUpState !== FCRD_UP_STATE.FULL) {
        fcrDUpState = FCRD_UP_STATE.FULL;
        logToConsole("FCR-D Up full activation (100%).");
      }
    } else if (fcrDUpTimer >= 5) {
      // PARTIAL
      if (fcrDUpState !== FCRD_UP_STATE.PARTIAL) {
        fcrDUpState = FCRD_UP_STATE.PARTIAL;
        logToConsole("FCR-D Up partial activation (50%).");
      }
    } else {
      // Ramping from 0 to partial in first 5s
      if (fcrDUpState === FCRD_UP_STATE.INACTIVE) {
        fcrDUpState = FCRD_UP_STATE.PARTIAL;
        logToConsole("FCR-D Up activation starting (ramp).");
      }
    }
  
    // 5) Apply freqImpact, socImpact, revenueImpact based on partial vs full
    let freqImpact = 0;
    let socImpact = 0;
    let revImpact = 0;
  
    if (fcrDUpState === FCRD_UP_STATE.PARTIAL) {
      // Example: half power
      freqImpact = 0.03 * deltaTimeSeconds;  // push freq up
      socImpact = -1 * deltaTimeSeconds;     // battery discharges
      revImpact = 5 * deltaTimeSeconds;      // earn revenue
    } else if (fcrDUpState === FCRD_UP_STATE.FULL) {
      // Example: full power
      freqImpact = 0.06 * deltaTimeSeconds;
      socImpact = -2 * deltaTimeSeconds;
      revImpact = 10 * deltaTimeSeconds;
    }
  
    // 6) Update global variables
    frequency += freqImpact;
    soc = Math.max(0, Math.min(100, soc + socImpact));
    revenue += revImpact;
  
    // 7) Increment cycle count if partially or fully activated
    if (fcrDUpState === FCRD_UP_STATE.PARTIAL || fcrDUpState === FCRD_UP_STATE.FULL) {
      cycleCount += 0.05 * deltaTimeSeconds; // e.g. 0.05 cycles per second
    }
  }
  

/*****************************************************
* FCR-D DOWN LOGIC
*****************************************************/
function updateFCRDDown(deltaTimeSeconds, currentFrequency) {
    // 1) If user toggled OFF, remain inactive
    if (!fcrDDownActive) {
      fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
      return;
    }
  
    // 2) If frequency <= 50.1, no activation needed
    if (currentFrequency <= 50.1) {
      if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
        logToConsole("FCR-D Down deactivated (freq <= 50.1 Hz).");
      }
      fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
      fcrDDownTimer = 0;
      return;
    }
  
    // 3) freq > 50.1 => increment time
    fcrDDownTimer += deltaTimeSeconds;
  
    // 4) partial vs full
    if (fcrDDownTimer >= 30) {
      // FULL
      if (fcrDDownState !== FCRD_DOWN_STATE.FULL) {
        fcrDDownState = FCRD_DOWN_STATE.FULL;
        logToConsole("FCR-D Down full activation (100%).");
      }
    } else if (fcrDDownTimer >= 5) {
      // PARTIAL
      if (fcrDDownState !== FCRD_DOWN_STATE.PARTIAL) {
        fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
        logToConsole("FCR-D Down partial activation (50%).");
      }
    } else {
      // ramp
      if (fcrDDownState === FCRD_DOWN_STATE.INACTIVE) {
        fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
        logToConsole("FCR-D Down activation starting (ramp).");
      }
    }
  
    // 5) Apply freqImpact, socImpact, revenueImpact
    let freqImpact = 0;
    let socImpact = 0;
    let revImpact = 0;
  
    if (fcrDDownState === FCRD_DOWN_STATE.PARTIAL) {
      // half power
      freqImpact = -0.03 * deltaTimeSeconds; // reduce freq
      socImpact = +1 * deltaTimeSeconds;     // battery charges
      revImpact = 5 * deltaTimeSeconds;      // earn revenue if TSO pays to absorb
    } else if (fcrDDownState === FCRD_DOWN_STATE.FULL) {
      // full power
      freqImpact = -0.06 * deltaTimeSeconds;
      socImpact = +2 * deltaTimeSeconds;
      revImpact = 10 * deltaTimeSeconds;
    }
  
    frequency += freqImpact;
    soc = Math.max(0, Math.min(100, soc + socImpact));
    revenue += revImpact;
  
    // 6) Battery cycle increment
    if (fcrDDownState === FCRD_DOWN_STATE.PARTIAL || fcrDDownState === FCRD_DOWN_STATE.FULL) {
      cycleCount += 0.05 * deltaTimeSeconds;
    }
  }
}

/*****************************************************
* ENVIRONMENT / TIME OF DAY
*****************************************************/
function getTemperature(tMinutes) {
// -10°C at 00:00 -> +15°C by 12:00 -> -8°C by 24:00
if (tMinutes <= 720) {
 const slope = 25 / 720;
 return -10 + slope * tMinutes;
} else {
 const slope = -23 / 720;
 return 15 + slope * (tMinutes - 720);
}
}
function getBaseSpotPrice(tMinutes) {
// 00:00-06:00 => 0.0555
// 06:00-09:00 => 0.011
// 09:00-21:00 => 0.2
// 21:00-24:00 => 0.0084
if (tMinutes < 360)      return 0.0555;
else if (tMinutes < 540) return 0.011;
else if (tMinutes < 1260)return 0.2;
else                     return 0.0084;
}
function getRandomWind() {
return 1 + Math.random() * 14;
}
function getRandomSunCondition() {
const conditions = ["Sunny","Partly Cloudy","Cloudy"];
return conditions[Math.floor(Math.random() * conditions.length)];
}

function updateEnvironment() {
timeOfDayMinutes += minutesPerSecond;
if (timeOfDayMinutes >= 1440) {
 timeOfDayMinutes -= 1440; // wrap
}
const hh = Math.floor(timeOfDayMinutes / 60);
const mm = Math.floor(timeOfDayMinutes % 60);
const hhString = hh.toString().padStart(2,"0");
const mmString = mm.toString().padStart(2,"0");
elements.timeOfDay.textContent = `Time of Day: ${hhString}:${mmString}`;

// Temperature
const temperature = getTemperature(timeOfDayMinutes);
elements.temperature.textContent = `Temperature: ${temperature.toFixed(1)}°C`;

// Wind
const wind = getRandomWind();
elements.wind.textContent = `Wind: ${wind.toFixed(1)} m/s`;

// Sun
const sun = getRandomSunCondition();
elements.sun.textContent = `Sun: ${sun}`;

// Spot Price
let sp = getBaseSpotPrice(timeOfDayMinutes);
let weatherFactor = 1.0;
if (temperature < 0) weatherFactor += 0.05;
if (wind < 5)        weatherFactor += 0.1;
if (sun === "Cloudy")weatherFactor += 0.1;
sp *= weatherFactor;

elements.spotPrice.textContent = `Spot Price: €${sp.toFixed(2)}/kWh`;

// Wholesale is half
const wp = sp * 0.5;
elements.wholesalePrice.textContent = `Wholesale Price: €${wp.toFixed(2)}/kWh`;

currentSpotPrice = sp;
currentWholesalePrice = wp;
}

function startEnvironment() {
clearInterval(environmentInterval);
updateEnvironment();
environmentInterval = setInterval(updateEnvironment, 1000);
}
function stopEnvironment() {
clearInterval(environmentInterval);
environmentInterval = null;
}

/*****************************************************
 * START FCR-N INTERVAL
 *****************************************************/
function startFcrN() {
    // Ensure any existing interval is cleared
    clearInterval(fcrNInterval);
  
    fcrNInterval = setInterval(() => {
      // 1) If user has turned off the toggle externally
      if (!fcrNToggled) {
        logToConsole("FCR-N off. No response.");
        clearInterval(fcrNInterval);
        return;
      }
  
      // 2) If SoC out of range, frequency out of normal bounds,
      //    or user activated FCR-D => disable FCR-N
      if (
        soc < 40 || soc > 60 ||
        frequency < 49.5 || frequency > 50.5 ||
        fcrDDownActive || fcrDUpActive
      ) {
        fcrNToggleEl.disabled = true; // prevent re-checking until safe
  
        if (fcrNToggled) {
          toggleFcrN(false);
  
          // Distinguish the reason for disabling
          if (fcrDUpActive || fcrDDownActive) {
            fcrNWasForcedOff = true;
            toggleFcrN(false);
            logToConsole("FCR-N disabled (FCR-D is active).");
          } else if (soc < 40 || soc > 60) {
            logToConsole("FCR-N disabled (SoC out of range).");
          } else {
            logToConsole("FCR-N disabled (freq out of range).");
          }
        }
        return;
      }
  
      // If we reach here, FCR-N is ON, SoC is safe, freq is 49.5–50.5, no FCR-D
      fcrNToggleEl.disabled = false;
  
      // 3) Calculate frequency deviation from 50 Hz
      const dev = frequency - 50.0;
  
      // For ±0.2 Hz => ±1 MW. So powerCommand in MW:
      let powerCommandMW = dev / 0.2;
      // Clamp to ±1 MW
      powerCommandMW = Math.max(-1, Math.min(1, powerCommandMW));
  
      // Convert MW to kW if you want a more detailed dispatch log
      const powerCommandKW = powerCommandMW * 1000; // e.g., -1000..+1000 kW
  
      // 4) If powerCommand is significant => TSO is effectively "activating" you
      //    We'll call it "activated" if it's above ±20 kW, for example.
      if (Math.abs(powerCommandKW) > 20) {
        logToConsole(`FCR-N activated by TSO: ${powerCommandKW.toFixed(0)} kW dispatched.`);
      }
  
      // 5) SoC changes
      //    Example: ±1 MW for 1 second => ±0.3% SoC
      //    So if powerCommandMW=1 => ±0.3% each second
      const socChange = powerCommandMW * 0.3;
      soc = Math.max(0, Math.min(100, soc + socChange));
  
      // 6) Increment cycle count if battery is actually charging/discharging
      if (Math.abs(powerCommandMW) > 0.05) {
        cycleCount += 0.1;
      }
  
      // 7) Revenue: a simple positive payment for power usage
      const basePayment = 10;
      revenue += basePayment * Math.abs(powerCommandMW);
  
      // 8) Frequency feedback
      const freqFactor = 0.02;
      frequency -= powerCommandMW * freqFactor;
  
      // 9) Random noise
      frequency += (Math.random() - 0.5) * 0.02;
  
      // 10) Log direction if notable
      if (Math.abs(powerCommandMW) > 0.05) {
        const direction = (powerCommandMW > 0) ? "charging" : "discharging";
        logToConsole(
          `FCR-N ${direction} with power: ${Math.abs(powerCommandKW).toFixed(0)} kW`
        );
      }
  
      // 11) Finally update UI
      updateUI();
    }, 1000);
  }

/*****************************************************
 * TOGGLE FCR-N
 *****************************************************/
function toggleFcrN(state) {
    fcrNToggled = state;
  
    if (fcrNToggled) {
      // User is toggling FCR-N ON
      logToConsole("FCR-N toggled ON");
      startFcrN();
    } else {
      // User is toggling FCR-N OFF
      logToConsole("FCR-N toggled OFF");
      clearInterval(fcrNInterval);
    }
  }

/*****************************************************
* TIMER
*****************************************************/
function updateTimerDisplay() {
const minutes = Math.floor(timeRemaining / 60);
const seconds = (timeRemaining % 60).toString().padStart(2,"0");
elements.timer.textContent = `Time Left: ${minutes}:${seconds}`;
}
function setTimer(action) {
switch(action) {
 case "start":
   if (!timerInterval) {
     gameActive = true;
     timerInterval = setInterval(() => {
       if (!gameActive) return;
       timeRemaining--;
       updateTimerDisplay();
       if (timeRemaining <= 0) {
         clearInterval(timerInterval);
         timerInterval = null;
         timeRemaining = 0;
         updateTimerDisplay();
         gameActive = false;
         checkGameOver();
       }
     }, 1000);
   }
   break;
 case "pause":
   gameActive = false;
   break;
 case "reset":
   gameActive = false;
   clearInterval(timerInterval);
   timerInterval = null;
   timeRemaining = timeLimit;
   updateTimerDisplay();
   break;
}
}

/*****************************************************
* GAME LOOP
*****************************************************/
buttons.startGame.onclick = () => {
gameActive = true;
elements.lossMessage.textContent = "";
startEnvironment();

// frequencyInterval => 1-second loop
frequencyInterval = setInterval(() => {
 // FCR-D Up / Down
 if (fcrDUpActive)   updateFCRDUp(1, frequency);
 if (fcrDDownActive) updateFCRDDown(1, frequency);

 // random drift
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
timeRemaining = timeLimit;
fcrNToggled = false;
elements.lossMessage.textContent = "";
setTimer("reset");
updateUI();
};

/*****************************************************
* ACTION BUTTONS (Charge, Discharge, FFR)
*****************************************************/
function performAction(action, { freqImpact, socImpact, revenueImpact }) {
// E.g., check if there are remaining counts for FCRUp, FCRDown, etc.
frequency += freqImpact;
soc = Math.min(100, Math.max(0, soc + socImpact));
revenue += revenueImpact;
cycleCount++; // each press => 1 cycle
updateUI();
}

buttons.charge.onclick = () => {
const cost = MWhPerPress * currentSpotPrice; 
performAction("charge", {
 freqImpact: 0.1,
 socImpact: 5,
 revenueImpact: -cost
});
};
buttons.discharge.onclick = () => {
const income = MWhPerPress * currentWholesalePrice;
performAction("discharge", {
 freqImpact: -0.1,
 socImpact: -5,
 revenueImpact: income
});
};
buttons.ffr.onclick = () => {
performAction("ffr", {
 freqImpact: 0.3,
 socImpact: -15,
 revenueImpact: 50
});
};

// Initial UI update
updateUI();