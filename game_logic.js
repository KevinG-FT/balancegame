/*****************************************************
 * GLOBAL VARIABLES
 *****************************************************/

// ===============  GAME TIME  =================
let timeRemaining = 180;               // 3 min real-time = 180s
let timeOfDayMinutes = 0;              // 0..1440 (24h)
const minutesPerSecond = 1440 / 180;   // 24h / 3min => 8 min per real second

let currentSunCondition = "Dark";      // Store globally
const possibleConditions = ["Sunny", "Partly Cloudy", "Cloudy"];
let lastHourChecked = -1;

// ===============  FREQUENCY  =================
let frequency = 50.0;

// ===============  BATTERY  =================
let soc = 50;                           // 0..100%
let cycleCount = 0;                     // How many charge/discharge cycles used
let revenue = 0;
let gameActive = false;

// ===============  FCR / FFR  =================
let fcrNToggled = false;    // Whether FCR-N is on
let fcrDUpActive = false;   // Whether FCR-D Up is toggled
let fcrDDownActive = false; // Whether FCR-D Down is toggled
let ffrActive = false;      // Whether FFR is toggled
let fcrNWasForcedOff = false;

// FCR-D States
const FCRD_UP_STATE   = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
const FCRD_DOWN_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
let fcrDUpState   = FCRD_UP_STATE.INACTIVE;
let fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
let fcrDUpTimer   = 0;
let fcrDDownTimer = 0;

// FFR
let ffrState          = "idle";
let ffrActivationTime = 0;
let isBatteryAvailable  = true;       // Simple check for SoC constraints, etc.
let isFfrProfileWindow = false;       // Night, weekend, or summer
let isFfrFlexOrdered   = false;       // TSO order

// FFR config
const ffrActivationThreshold = 49.7;
const FFR_ACTIVATION_DURATION = 1.0;
const FFR_SUPPORT_DURATION    = 1.0;
const FFR_DEACTIVATION_TIME   = 1.0;
const FFR_BUFFER_TIME         = 10.0;
const FFR_RECOVERY_TIME       = 15 * 60;

// ===============  MARKET PRICES  =================
let currentSpotPrice = 0.0555;          // in EUR/kWh
let currentWholesalePrice = 0.02775;

// ===============  GENERATION  =================
const baselineGenerationGW = 40;        // Baseline Generation from other sources (40 GW)
let windGenerationGW = 0;                // Wind Power Generation in GW (0-10 GW)
let pvGenerationGW = 0;                  // PV Power Generation in GW (0-5 GW)
let currentGeneration = 0;               // Total Generation (GW)

// ===============  DEMAND & GENERATION FACTORS  =================
let currentTemperature = 0;
let currentWind = 5;
let currentSun = 0;
let currentDemand = 0;

/*****************************************************
 * DOM ELEMENTS
 *****************************************************/
const elements = {
  frequencyArrow:    document.getElementById('frequencyArrow'),
  frequencyValue:    document.getElementById('frequencyValue'),
  batterySoc:        document.getElementById('batterySoc'),
  batteryLabel:      document.getElementById('batteryLabel'),
  status:            document.getElementById('status'),
  timer:             document.getElementById('timer'),
  revenue:           document.getElementById('revenue'),
  cycleCount:        document.getElementById('cycleCount'),
  lossMessage:       document.getElementById('lossMessage'),
  batteryWarning:    document.getElementById('batteryWarning'),
  timeOfDay:         document.getElementById('timeOfDay'),
  temperature:       document.getElementById('temperature'),
  wind:              document.getElementById('wind'),
  sun:               document.getElementById('sun'),
  spotPrice:         document.getElementById('spotPrice'),
  wholesalePrice:    document.getElementById('wholesalePrice'),
  gameConsole:       document.getElementById('gameConsole'),
  
  // New UI Elements for Generation
  windGeneration:    document.getElementById('windGeneration'),
  pvGeneration:      document.getElementById('pvGeneration'),
  currentDemand:     document.getElementById('el-demand') 
  // baselineGeneration: document.getElementById('baselineGeneration') // Optional
};

const buttons = {
  startGame:   document.getElementById('startGame'),
  restartGame: document.getElementById('restartGame'),
  charge:      document.getElementById('charge'),
  discharge:   document.getElementById('discharge')
};

const fcrNToggleEl    = document.getElementById('fcrNToggle');
const fcrDUpToggleEl  = document.getElementById('fcrDUpToggle');
const fcrDDownToggleEl= document.getElementById('fcrDDownToggle');
const ffrToggleEl     = document.getElementById('ffrToggle');

/*****************************************************
 * LOG TO CONSOLE
 *****************************************************/
function logToConsole(msg) {
  if (!elements.gameConsole) return;
  const line = document.createElement("div");
  line.textContent = msg;
  elements.gameConsole.appendChild(line);
  elements.gameConsole.scrollTop = elements.gameConsole.scrollHeight;
}

/*****************************************************
 * ENVIRONMENT CALCULATIONS
 * Smooth (sinusoidal) changes for temperature,
 * hour-to-hour changes for sun conditions,
 * and minute-to-minute smooth random walk for wind.
 *****************************************************/

/**
 * Temperature: Coldest (~-5°C) at ~6 AM, peaks (~15°C) at ~3 PM
 */
function getTemperature(tMinutes) {
  const TWO_PI = 2 * Math.PI;
  const fractionOfDay = tMinutes / 1440; // 0..1

  const amplitude = 10; // Half the range: (15 - (-5))/2=10
  const midpoint  = 5;  // (15 + (-5))/2=5

  // Minimum at ~5 AM (fractionOfDay ≈ 5/24 ≈ 0.2083)
  const phaseShift = TWO_PI * 0.2083 + Math.PI / 2;

  const radians = TWO_PI * fractionOfDay - phaseShift;
  const temp = midpoint + amplitude * Math.sin(radians);

  return temp; // -5..15°C
}

/**
 * Sun Condition: Changes once per hour during daylight
 */
function maybeUpdateSunCondition(tMinutes) {
  const hour = Math.floor(tMinutes / 60);
  if (hour !== lastHourChecked) {
    // Moved into a new hour
    lastHourChecked = hour;

    if (hour < 6 || hour >= 19) {
      // Nighttime => Dark
      currentSunCondition = "Dark";
    } else {
      // Daytime => Randomly pick a condition
      const index = Math.floor(Math.random() * possibleConditions.length);
      currentSunCondition = possibleConditions[index];
    }
  }
}

/**
 * Wind Generation: Smooth random walk around daily baseline
 */
function getBaseWind(tMinutes) {
  // Daily sinusoid: average=5 m/s, amplitude=3, 1 cycle per day
  const fractionOfDay = tMinutes / 1440; // 0..1
  const base = 5;
  const amplitude = 3;

  return base + amplitude * Math.sin(2 * Math.PI * fractionOfDay);
}

function updateWind(tMinutes) {
  // 1) Get the daily baseline
  const dailyBase = getBaseWind(tMinutes);

  // 2) Generate a small random step: e.g., ±0.5 m/s
  const delta = (Math.random() - 0.5) * 1.0; 
    // => range ~ -0.5..+0.5 m/s

  // 3) Pull currentWind ~30% toward dailyBase 
  //    (prevents drifting infinitely from baseline)
  currentWind += 0.3 * (dailyBase - currentWind);

  // 4) Apply the random step
  currentWind += delta;

  // 5) Clamp wind to a reasonable range, e.g., 0..25 m/s
  currentWind = Math.max(0, Math.min(25, currentWind));

  // Logging for debugging
  console.log(`Wind Speed: ${currentWind.toFixed(1)} m/s`);
}

/**
 * Calculate Demand based on time of day and temperature
 */
function calculateDemand(tMinutes) {
  const hour = Math.floor(tMinutes / 60);
  let peakFactor = 1;

  if (hour >= 6 && hour < 9) { // Morning peak
    peakFactor = 1.2;
  } else if (hour >= 17 && hour < 20) { // Evening peak
    peakFactor = 1.3;
  } else {
    peakFactor = 1;
  }

  // Baseline demand is 50 GW, increases with colder temperatures
  const tempFactor = (currentTemperature < 0) ? Math.abs(currentTemperature) : 0;
  const demand = 50 * peakFactor + tempFactor;

  // Logging for debugging
  console.log(`Demand Calculation: Peak Factor=${peakFactor}, Temperature Factor=${tempFactor}, Total Demand=${demand} GW`);

  return demand;
}

/**
 * Update Environment: Temperature, Sun, Wind, Demand, Generation
 */
function updateEnvironment(tMinutes) {
  // 1) TEMPERATURE
  currentTemperature = getTemperature(tMinutes);

  // 2) SUN CONDITION (hourly)
  maybeUpdateSunCondition(tMinutes);
  // Sets global currentSunCondition = "Dark" | "Sunny" | "Partly Cloudy" | "Cloudy"

  // 3) WIND (random-walk around daily baseline)
  updateWind(tMinutes);
  // Updates global currentWind in a smooth manner

  // 4) DEMAND & GENERATION
  // Calculate Demand
  currentDemand = calculateDemand(tMinutes);

  // Calculate Generation
  // Wind Power Generation: 0-10 GW based on currentWind (0-10 m/s maps to 0-10 GW)
  windGenerationGW = Math.min(currentWind, 10); // Caps at 10 GW

  // PV Power Generation: 0-5 GW based on sun condition
  let sunFactor = 0;
  switch(currentSunCondition) {
    case "Sunny":
      sunFactor = 1; // 100% PV generation
      break;
    case "Partly Cloudy":
      sunFactor = 0.6; // 60% PV generation
      break;
    case "Cloudy":
      sunFactor = 0.3; // 30% PV generation
      break;
    case "Dark":
    default:
      sunFactor = 0; // 0% PV generation
      break;
  }
  pvGenerationGW = sunFactor * 5; // 0..5 GW

  // Total Generation
  currentGeneration = windGenerationGW + pvGenerationGW + baselineGenerationGW; // 40 +0-10 +0-5 =40-55 GW

  // Update Generation in UI
  elements.windGeneration.textContent = `${windGenerationGW.toFixed(1)} GW`;
  elements.pvGeneration.textContent   = `${pvGenerationGW.toFixed(1)} GW`;
 // elements.currentDemand   = `${el-demand.toFixed(1)} GW`;
  // elements.baselineGeneration.textContent = `${baselineGenerationGW.toFixed(1)} GW`; // Optional

  // Logging for debugging
  console.log(`Total Generation: ${currentGeneration} GW`);
}

/*****************************************************
 * PRICES
 * Base spot price from time-of-day, plus factor in net imbalance
 *****************************************************/
function getBaseSpotPrice(tMinutes) {
  // Example day-structure: 
  //  00:00-06:00 => 0.0555 EUR/kWh
  //  06:00-09:00 => 0.011 EUR/kWh
  //  09:00-21:00 => 0.2 EUR/kWh
  //  21:00-24:00 => 0.0084 EUR/kWh
  if (tMinutes < 360)        return 0.0555;
  else if (tMinutes < 540)   return 0.011;
  else if (tMinutes < 1260)  return 0.2;
  else                       return 0.0084;
}

function updatePrices(tMinutes) {
  let sp = getBaseSpotPrice(tMinutes);

  // Net Imbalance: generation - demand
  const netImbalance = currentGeneration - currentDemand; // GW

  // Adjust Spot Price based on Net Imbalance
  // If netImbalance < 0 (shortage), price increases
  // If netImbalance > 0 (surplus), price decreases
  if (netImbalance < 0) {
    sp += 0.05 * Math.abs(netImbalance) / 50;  // Scale for balance
  } else {
    sp -= 0.02 * netImbalance / 50;           // Scale for balance
  }

  // Clamp Spot Price to a reasonable range
  sp = Math.max(0.005, Math.min(0.5, sp));

  // Update Current Prices
  currentSpotPrice       = sp;
  currentWholesalePrice  = sp * 0.5;

  // Update DOM
  elements.spotPrice.textContent      = `€${sp.toFixed(3)}`;
  elements.wholesalePrice.textContent = `€${(sp * 0.5).toFixed(3)}`;

  // Logging for debugging
  console.log(`Spot Price: €${sp.toFixed(3)}/kWh, Wholesale Price: €${(sp * 0.5).toFixed(3)}/kWh`);
}

/*****************************************************
 * FREQUENCY
 * Let net supply/demand push frequency up or down, plus random noise.
 *****************************************************/
function updateFrequency() {
  const netImbalance = currentGeneration - currentDemand; // GW

  // Scale imbalance to frequency change
  // Increased scaling factor for more noticeable frequency changes
  let freqChange = 0.005 * netImbalance; // 0.005 Hz per GW imbalance

  // Clamp frequency change to prevent extreme jumps
  freqChange = Math.max(-0.3, Math.min(0.3, freqChange));

  // Update Frequency
  frequency += freqChange;

  // Add random noise for realism
  frequency += (Math.random() - 0.5) * 0.02;

  // Logging for debugging
  console.log(`Frequency Change: ${freqChange.toFixed(3)} Hz, New Frequency: ${frequency.toFixed(2)} Hz`);
}

/*****************************************************
 * FCR-N LOGIC (Simplified)
 *****************************************************/
function updateFCRN() {
  // If toggled OFF, do nothing
  if (!fcrNToggled) return;

  // If SoC or freq is out of range or FCR-D is active => disable
  if (
    soc < 40 || soc > 60 ||
    frequency < 49.5 || frequency > 50.5 ||
    fcrDDownActive || fcrDUpActive
  ) {
    if (fcrNToggled) {
      fcrNWasForcedOff = fcrDDownActive || fcrDUpActive; // Forced by FCR-D
      toggleFcrN(false);
      logToConsole("FCR-N disabled (SoC/freq out of range or FCR-D active)");
    }
    return;
  }

  // If we reach here => FCR-N is ON, SoC is safe, freq is 49.5–50.5
  // Slight correction proportional to freq deviation
  const dev = frequency - 50.0;
  let powerCommandMW = dev / 0.2; // ±1 MW at ±0.2 Hz
  powerCommandMW = Math.max(-1, Math.min(1, powerCommandMW));

  // SoC usage
  const socChange = powerCommandMW * 0.3; // e.g., ±0.3% SoC per second at ±1MW
  soc = Math.max(0, Math.min(100, soc + socChange));

  // Revenue: base payment for regulation
  revenue += 10 * Math.abs(powerCommandMW);

  // Frequency feedback
  frequency -= powerCommandMW * 0.02;

  // Random noise
  frequency += (Math.random() - 0.5) * 0.01;

  // Cycle count if charging/discharging
  if (Math.abs(powerCommandMW) > 0.05) {
    cycleCount += 0.1;
    logToConsole(`FCR-N adjusting: ${powerCommandMW.toFixed(2)} MW`);
  }

  // Logging for debugging
  console.log(`FCR-N Power Command: ${powerCommandMW.toFixed(2)} MW, Frequency after FCR-N: ${frequency.toFixed(2)} Hz`);
}

/*****************************************************
 * FCR-D Up/Down LOGIC
 * For frequency <49.9 => FCR-D Up can ramp
 * For frequency >50.1 => FCR-D Down can ramp
 *****************************************************/
function updateFCRDUp(deltaTime) {
  if (!fcrDUpActive) {
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    return;
  }

  if (frequency >= 49.9) {
    if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
      logToConsole("FCR-D Up deactivated (freq >= 49.9 Hz)");
    }
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    fcrDUpTimer = 0;
    return;
  }

  // freq < 49.9
  fcrDUpTimer += deltaTime;
  if (fcrDUpTimer >= 30) {
    if (fcrDUpState !== FCRD_UP_STATE.FULL) {
      fcrDUpState = FCRD_UP_STATE.FULL;
      logToConsole("FCR-D Up full activation (100%)");
    }
  } else if (fcrDUpTimer >= 5) {
    if (fcrDUpState !== FCRD_UP_STATE.PARTIAL) {
      fcrDUpState = FCRD_UP_STATE.PARTIAL;
      logToConsole("FCR-D Up partial activation (50%)");
    }
  } else {
    if (fcrDUpState === FCRD_UP_STATE.INACTIVE) {
      fcrDUpState = FCRD_UP_STATE.PARTIAL;
      logToConsole("FCR-D Up activation starting (ramp)");
    }
  }

  // Apply impacts
  let freqImpact = 0;
  let socImpact  = 0;
  let revImpact  = 0;
  if (fcrDUpState === FCRD_UP_STATE.PARTIAL) {
    freqImpact = 0.03 * deltaTime;
    socImpact  = -1  * deltaTime;
    revImpact  = 5   * deltaTime;
  } else if (fcrDUpState === FCRD_UP_STATE.FULL) {
    freqImpact = 0.06 * deltaTime;
    socImpact  = -2  * deltaTime;
    revImpact  = 10  * deltaTime;
  }
  frequency += freqImpact;
  soc = Math.max(0, Math.min(100, soc + socImpact));
  revenue += revImpact;
  if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
    cycleCount += 0.05 * deltaTime;
  }

  // Logging for debugging
  console.log(`FCR-D Up State: ${fcrDUpState}, Frequency Change: ${freqImpact.toFixed(3)} Hz, SoC Change: ${socImpact.toFixed(1)}%, Revenue Change: €${revImpact.toFixed(2)}`);
}

function updateFCRDDown(deltaTime) {
  if (!fcrDDownActive) {
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    return;
  }

  if (frequency <= 50.1) {
    if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
      logToConsole("FCR-D Down deactivated (freq <= 50.1 Hz)");
    }
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    fcrDDownTimer = 0;
    return;
  }

  // freq > 50.1
  fcrDDownTimer += deltaTime;
  if (fcrDDownTimer >= 30) {
    if (fcrDDownState !== FCRD_DOWN_STATE.FULL) {
      fcrDDownState = FCRD_DOWN_STATE.FULL;
      logToConsole("FCR-D Down full activation (100%)");
    }
  } else if (fcrDDownTimer >= 5) {
    if (fcrDDownState !== FCRD_DOWN_STATE.PARTIAL) {
      fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
      logToConsole("FCR-D Down partial activation (50%)");
    }
  } else {
    if (fcrDDownState === FCRD_DOWN_STATE.INACTIVE) {
      fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
      logToConsole("FCR-D Down activation starting (ramp)");
    }
  }

  // Apply impacts
  let freqImpact = 0;
  let socImpact  = 0;
  let revImpact  = 0;
  if (fcrDDownState === FCRD_DOWN_STATE.PARTIAL) {
    freqImpact = -0.03 * deltaTime;
    socImpact  = +1   * deltaTime;
    revImpact  = 5    * deltaTime;
  } else if (fcrDDownState === FCRD_DOWN_STATE.FULL) {
    freqImpact = -0.06 * deltaTime;
    socImpact  = +2   * deltaTime;
    revImpact  = 10   * deltaTime;
  }
  frequency += freqImpact;
  soc = Math.max(0, Math.min(100, soc + socImpact));
  revenue += revImpact;
  if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
    cycleCount += 0.05 * deltaTime;
  }

  // Logging for debugging
  console.log(`FCR-D Down State: ${fcrDDownState}, Frequency Change: ${freqImpact.toFixed(3)} Hz, SoC Change: ${socImpact.toFixed(1)}%, Revenue Change: €${revImpact.toFixed(2)}`);
}

/*****************************************************
 * FFR LOGIC
 *****************************************************/
function checkFfrProfileWindow() {
  // Example: night + weekends => on. (Simplified approach)
  const hour = Math.floor(timeOfDayMinutes / 60);
  const dayOfWeek = 3; // Placeholder: 0=Sunday, 6=Saturday
  const night = (hour >= 22 || hour < 7);
  const weekend = (dayOfWeek === 0 || dayOfWeek === 6);
  return (night || weekend);
}

function checkFfrFlexOrdered() {
  // Stub: always false unless you have a schedule
  return false;
}

function updateFFR(deltaTimeSec) {
  isFfrProfileWindow = checkFfrProfileWindow();
  isFfrFlexOrdered   = checkFfrFlexOrdered();
  
  if (!isBatteryAvailable) {
    ffrState = "idle";
    return;
  }
  
  const ffrAvailable = (isFfrProfileWindow || isFfrFlexOrdered);

  if (frequency < ffrActivationThreshold && ffrState === "idle" && ffrAvailable) {
    ffrState = "activated";
    ffrActive = true;
    ffrActivationTime = 0;
    logToConsole(`FFR triggered at freq=${frequency.toFixed(2)} Hz`);
    console.log(`FFR triggered at freq=${frequency.toFixed(2)} Hz`);
  }

  switch(ffrState) {
    case "activated":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime <= (FFR_ACTIVATION_DURATION + FFR_SUPPORT_DURATION)) {
        // Deliver FFR power...
      } else {
        ffrState = "deactivating";
        ffrActivationTime = 0;
        logToConsole("FFR deactivation begun");
        console.log("FFR deactivation begun");
      }
      break;
    case "deactivating":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_DEACTIVATION_TIME) {
        ffrState = "buffer";
        ffrActivationTime = 0;
        logToConsole("FFR buffer period started");
        console.log("FFR buffer period started");
      }
      break;
    case "buffer":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_BUFFER_TIME) {
        ffrState = "recovering";
        ffrActivationTime = 0;
        logToConsole("FFR recovery started (15min)");
        console.log("FFR recovery started (15min)");
      }
      break;
    case "recovering":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_RECOVERY_TIME) {
        ffrState = "idle";
        ffrActive = false;
        logToConsole("FFR fully recovered, back to idle");
        console.log("FFR fully recovered, back to idle");
      }
      break;
    default:
      // "idle"
      break;
  }
}

/*****************************************************
 * MAIN LOOP
 *****************************************************/
let mainLoop = null;
function startMainLoop() {
  clearInterval(mainLoop);
  mainLoop = setInterval(() => {
    if (!gameActive) return;

    // 1) Advance compressed "day" time
    timeOfDayMinutes += minutesPerSecond;
    if (timeOfDayMinutes >= 1440) {
      timeOfDayMinutes -= 1440; // Wrap next day
    }

    // 2) Update environment (temp, wind, sun => demand & generation)
    updateEnvironment(timeOfDayMinutes);

    // 3) Update frequency from net supply/demand
    updateFrequency();

    // 4) Update FCR-N in the same timescale
    updateFCRN();

    // 5) Update FCR-D Up / Down
    updateFCRDUp(1);     // Pass deltaTime=1 second
    updateFCRDDown(1);

    // 6) Update FFR
    if (ffrActive) {
      updateFFR(1); 
    }

    // 7) Update prices
    updatePrices(timeOfDayMinutes);

    // 8) Update UI
    updateUI();

    // 9) Check game over
    checkGameOver();

    // 10) Decrement timeRemaining
    timeRemaining--;
    if (timeRemaining <= 0) {
      gameActive = false;
      timeRemaining = 0;
      checkGameOver();
      clearInterval(mainLoop);
    }

  }, 1000);
}

/*****************************************************
 * UI & GAME OVER
 *****************************************************/
function updateUI() {
  // Frequency meter
  const arrowPos = Math.min(100, Math.max(0, ((frequency - 49.5) / 1.0) * 100));
  elements.frequencyArrow.style.left = arrowPos + "%";
  elements.frequencyValue.textContent = frequency.toFixed(2) + " Hz";

  // Battery
  elements.batterySoc.style.height = soc + "%";
  elements.batterySoc.style.background = (soc > 90 || soc < 10) ? 'red' : 'blue';
  elements.batteryLabel.textContent = soc.toFixed(1) + "% State of Charge";

  // Revenue, cycles
  elements.revenue.textContent = "EUR Earned " + revenue.toFixed(2);
  elements.cycleCount.textContent = "Battery Cycles: " + cycleCount.toFixed(1);

  // Timer
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = (timeRemaining % 60).toString().padStart(2,"0");
  elements.timer.textContent = `TIME LEFT: ${minutes}:${seconds}`;

  // Update Generation in UI
  elements.windGeneration.textContent = `${windGenerationGW.toFixed(1)} GW`;
  elements.pvGeneration.textContent   = `${pvGenerationGW.toFixed(1)} GW`;
 // elements.baselineGeneration.textContent = `${baselineGenerationGW.toFixed(1)} GW`; // Optional

  // Clear warning
  elements.batteryWarning.textContent = "";
}

function checkGameOver() {
  if (
    frequency < 49.5 || frequency > 50.5 ||
    soc < 10 || soc > 90 ||
    cycleCount > 30
  ) {
    gameActive = false;
    elements.lossMessage.textContent = "You failed! Game over!";
    clearInterval(mainLoop);
    logToConsole("Game Over: You failed!");
    console.log("Game Over: You failed!");
  } else if (timeRemaining <= 0) {
    gameActive = false;
    if (revenue < 50) {
      elements.lossMessage.textContent = "You failed! Game over!";
      logToConsole("Game Over: You failed!");
      console.log("Game Over: You failed!");
    } else {
      elements.lossMessage.textContent = "You did it!";
      logToConsole("Game Over: You did it!");
      console.log("Game Over: You did it!");
    }
    clearInterval(mainLoop);
  }
}

/*****************************************************
 * TOGGLES
 *****************************************************/
fcrNToggleEl.onchange = () => {
  if (fcrNToggleEl.checked) {
    toggleFcrN(true);
  } else {
    toggleFcrN(false);
  }
};
function toggleFcrN(state) {
  fcrNToggled = state;
  if (fcrNToggled) {
    logToConsole("FCR-N ON");
    console.log("FCR-N ON");
  } else {
    logToConsole("FCR-N OFF");
    console.log("FCR-N OFF");
  }
}

fcrDUpToggleEl.onchange = () => {
  if (fcrDUpToggleEl.checked) {
    fcrDUpActive = true;
    logToConsole("FCR-D Up ON");
    console.log("FCR-D Up ON");
    // Force FCR-N off if needed
    if (fcrNToggled) {
      fcrNWasForcedOff = true;
      toggleFcrN(false);
      logToConsole("FCR-N disabled (FCR-D Up is active)");
      console.log("FCR-N disabled (FCR-D Up is active)");
    }
  } else {
    fcrDUpActive = false;
    logToConsole("FCR-D Up OFF");
    console.log("FCR-D Up OFF");
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    fcrDUpTimer = 0;
    // Re-enable FCR-N if forced
    if (fcrNWasForcedOff && soc >= 40 && soc <= 60 && frequency >= 49.5 && frequency <= 50.5) {
      fcrNWasForcedOff = false;
      toggleFcrN(true);
      logToConsole("FCR-N re-enabled after FCR-D Up off");
      console.log("FCR-N re-enabled after FCR-D Up off");
    }
  }
};

fcrDDownToggleEl.onchange = () => {
  if (fcrDDownToggleEl.checked) {
    fcrDDownActive = true;
    logToConsole("FCR-D Down ON");
    console.log("FCR-D Down ON");
    // Force FCR-N off if needed
    if (fcrNToggled) {
      fcrNWasForcedOff = true;
      toggleFcrN(false);
      logToConsole("FCR-N disabled (FCR-D Down is active)");
      console.log("FCR-N disabled (FCR-D Down is active)");
    }
  } else {
    fcrDDownActive = false;
    logToConsole("FCR-D Down OFF");
    console.log("FCR-D Down OFF");
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    fcrDDownTimer = 0;
    // Re-enable FCR-N if forced
    if (fcrNWasForcedOff && soc >= 40 && soc <= 60 && frequency >= 49.5 && frequency <= 50.5) {
      fcrNWasForcedOff = false;
      toggleFcrN(true);
      logToConsole("FCR-N re-enabled after FCR-D Down off");
      console.log("FCR-N re-enabled after FCR-D Down off");
    }
  }
};

ffrToggleEl.onchange = () => {
  if (ffrToggleEl.checked) {
    ffrActive = true;
    logToConsole("FFR ON");
    console.log("FFR ON");
  } else {
    ffrActive = false;
    logToConsole("FFR OFF");
    console.log("FFR OFF");
  }
};

/*****************************************************
 * ACTION BUTTONS
 *****************************************************/
buttons.startGame.onclick = () => {
  if (!gameActive) {
    elements.lossMessage.textContent = "";
    gameActive = true;
    // Reset certain values if needed
    // Start main loop if not already running
    timeRemaining = 180; 
    startMainLoop();
    logToConsole("Game started");
    console.log("Game started");
  }
};

buttons.restartGame.onclick = () => {
  gameActive = false;
  clearInterval(mainLoop);
  // Reset state
  frequency = 50;
  soc = 50;
  revenue = 0;
  cycleCount = 0;
  windGenerationGW = 0;
  pvGenerationGW = 0;
  timeRemaining = 180;
  fcrNToggled = false;
  fcrDUpActive = false;
  fcrDDownActive = false;
  ffrActive = false;
  currentWind = 5;
  currentSunCondition = "Dark";
  lastHourChecked = -1;
  currentGeneration = baselineGenerationGW; // Initialize with baseline
  currentDemand = 50; // Initial demand
  elements.lossMessage.textContent = "";
  updateUI();
  logToConsole("Game restarted & state reset");
  console.log("Game restarted & state reset");
};

buttons.charge.onclick = () => {
  // 50 kW for 1 second => 0.05 MWh
  const MWhPerPress = 0.05;
  const cost = MWhPerPress * currentSpotPrice;
  frequency += 0.1; // Small upward freq effect
  soc = Math.min(100, soc + 5);
  revenue -= cost;
  cycleCount += 1; 
  logToConsole(`Battery charged, cost €${cost.toFixed(4)}`);
  console.log(`Battery charged, cost €${cost.toFixed(4)}`);
  updateUI();
};

buttons.discharge.onclick = () => {
  // 50 kW for 1 second => 0.05 MWh
  const MWhPerPress = 0.05;
  const income = MWhPerPress * currentWholesalePrice;
  frequency -= 0.1; // Small downward freq effect
  soc = Math.max(0, soc - 5);
  revenue += income;
  cycleCount += 1;
  logToConsole(`Battery discharged, earned €${income.toFixed(4)}`);
  console.log(`Battery discharged, earned €${income.toFixed(4)}`);
  updateUI();
};

/*****************************************************
 * INIT UI
 *****************************************************/
updateUI();
