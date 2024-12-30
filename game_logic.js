/*****************************************************
 * GLOBAL VARIABLES & SETTINGS
 *****************************************************/

// We no longer define a top-level let settings = {...} with large GW numbers.
// Instead, we rely solely on getDefaultSettings() to define them in MW.

let settings = null; // We'll assign this in initializeGame()

// Main game variables
let timeRemaining = 0;      // Time left in the game (seconds)
let timeOfDayMinutes = 0;   // Current time of day in minutes (0..1440)
let gameActive = false;     // Indicates whether the game is active
let mainLoop = null;        // The setInterval handle for our main loop

/*****************************************************
 * BATTERY CONSTANTS
 *****************************************************/
const BATTERY_POWER_RATING_MW = 80;  // Maximum charge/discharge power
const BATTERY_ENERGY_CAPACITY_MWH = 160;  // Total energy capacity
// define a C-rate, or compute it
const BATTERY_CRATE = 0.5; // or (BATTERY_POWER_RATING_MW / BATTERY_ENERGY_CAPACITY_MWH)

/*****************************************************
 * STATE VARIABLES
 *****************************************************/

// Environment
let currentSunCondition = "Dark";   // "Dark", "Sunny", "Partly Cloudy", "Cloudy"
let lastHourChecked = -1;           // Last hour checked for sun condition updates
let currentTemperature = 0;         // Current temperature (°C)
let currentWind = 0;                // Current wind speed (m/s)

// Demand & Generation
let currentDemandMW = 0;           // Current demand (MW)
let currentGenerationMW = 0;       // Current total generation (MW)
let windGenerationMW = 0;          // Current wind generation (MW)
let pvGenerationMW = 0;            // Current solar generation (MW)
let currentGasMW = 0;              // We'll assign after loading settings
let targetGasMW = 0;               // Where we want gas to be in the near future
let currentPVmw = 0;     // actual current PV output
let targetPVmw = 0;      // desired or theoretical PV output

// Frequency & Battery
let frequency = 50.0;    // Current grid frequency (Hz)
let soc = 50;            // State of Charge (%)
let cycleCount = 0;      // Number of charge/discharge cycles used
let revenue = 0;         // Total revenue earned

// FCR / FFR toggles
let fcrNToggled = false;
let fcrDUpActive = false;
let fcrDDownActive = false;
let ffrActive = false;
let fcrNWasForcedOff = false;

// FCR-D states
const FCRD_UP_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
const FCRD_DOWN_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
let fcrDUpState = FCRD_UP_STATE.INACTIVE;
let fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
let fcrDUpTimer = 0;
let fcrDDownTimer = 0;

// FFR states
let ffrState = "idle";
let ffrActivationTime = 0;
let isBatteryAvailable = true;
let isFfrProfileWindow = false;
let isFfrFlexOrdered = false;
let ffrEnergyDischarged = 0;
let ffrRevenue = 0;

/*****************************************************
 * DOM ELEMENTS
 *****************************************************/

const elements = {
  frequencyArrow:        document.getElementById('frequencyArrow'),
  frequencyValue:        document.getElementById('frequencyValue'),
  batterySoc:            document.getElementById('batterySoc'),
  batteryLabel:          document.getElementById('batteryLabel'),
  status:                document.getElementById('status'),
  timer:                 document.getElementById('timer'),
  revenue:               document.getElementById('revenue'),
  cycleCount:            document.getElementById('cycleCount'),
  lossMessage:           document.getElementById('lossMessage'),
  batteryWarning:        document.getElementById('batteryWarning'),
  timeOfDay:             document.getElementById('timeOfDay'),
  temperature:           document.getElementById('temperature'),
  wind:                  document.getElementById('wind'),
  sun:                   document.getElementById('sun'),
  spotPrice:             document.getElementById('spotPrice'),
  wholesalePrice:        document.getElementById('wholesalePrice'),
  gameConsole:           document.getElementById('gameConsole'),
  demand:                document.getElementById('demand'),
  generation:            document.getElementById('generation'),
  windGeneration:        document.getElementById('windGeneration'),
  pvGeneration:          document.getElementById('pvGeneration'),
  baselineGeneration:    document.getElementById('baselineGeneration'),
  ffrEnergyDischarged:   document.getElementById('ffrEnergyDischarged'),
  ffrRevenue:            document.getElementById('ffrRevenue'),
  ffrIndicator:          document.getElementById('ffrIndicator')
};

const buttons = {
  startGame:   document.getElementById('startGame'),
  restartGame: document.getElementById('restartGame'),
  charge:      document.getElementById('charge'),
  discharge:   document.getElementById('discharge'),
  saveSettings:  document.getElementById('saveSettings'),
  resetSettings: document.getElementById('resetSettings')
};

const toggles = {
  fcrNToggle:     document.getElementById('fcrNToggle'),
  fcrDUpToggle:   document.getElementById('fcrDUpToggle'),
  fcrDDownToggle: document.getElementById('fcrDDownToggle'),
  ffrToggle:      document.getElementById('ffrToggle')
};

const settingsButton = document.getElementById('settingsButton');
const settingsPanel  = document.getElementById('settingsPanel');

/*****************************************************
 * HELPER: LOG TO CONSOLE
 *****************************************************/
function logToConsole(msg) {
  // In-game console
  if (elements.gameConsole) {
    const line = document.createElement("div");
    line.textContent = msg;
    elements.gameConsole.appendChild(line);
    elements.gameConsole.scrollTop = elements.gameConsole.scrollHeight;
  }
  // Browser console
  console.log(msg);
}

/*****************************************************
 * HELPER: FORMAT TIME
 *****************************************************/
function formatTime(tMinutes) {
  const hours = Math.floor(tMinutes / 60) % 24;
  const minutes = tMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/*****************************************************
 * SETTINGS LOADING & DEFAULTS (IN MW)
 *****************************************************/

function getDefaultSettings() {
  return {
    // =============== GAME TIME SETTINGS =================
    gameDurationSeconds: 180,
    compressedMinutesPerSecond: 1440 / 180,

    // =============== ENVIRONMENT PARAMETERS =================
    temperatureAmplitude: 5,
    temperatureMidpoint: 0,
    windBaselineAmplitude: 2,
    windBaselineMidpoint: 5,
    windSpeedMax: 10,
    windSpeedMin: 0,

    // =============== CAPACITIES & INITIAL GAS =================
    pvGenerationMaxMW: 30,
    windGenerationMaxMW: 80,
    gasGenerationMaxMW: 100,
    initialGasMW: 59,
    gasGenerationMW: 59,

    // =============== DEMAND PARAMETERS =================
    demandBaseMW: 69,
    demandPeakMultiplierMorning: 1.2,
    demandPeakMultiplierEvening: 1.3,
    demandTemperatureFactor: 0.005,

    // =============== FREQUENCY PARAMETERS =================
    frequencyBase: 50.0,
    frequencyChangeScaling: 0.03, // controls the dyamism of frequency changes. higher is less dynamic.
    frequencyClamp: { min: 49.0, max: 51.0 },
    frequencyNoiseRange: 0.02,

    // =============== FCR-N PARAMETERS =================
    fcrNSoCMin: 40,
    fcrNSoCMax: 60,
    fcrNFrequencyRange: { min: 49.5, max: 50.5 },
    fcrNRevenuePerMW: 10,
    fcrNSoCChangePerMW: 0.3,

    // =============== FCR-D PARAMETERS =================
    fcrDActivationThreshold: { up: 49.9, down: 50.1 },
    fcrDRampTimePartial: 5,
    fcrDRampTimeFull: 30,
    fcrDFrequencyImpactPartial: 0.03,
    fcrDFrequencyImpactFull: 0.06,
    fcrDSoCImpactPartial: -1,
    fcrDSoCImpactFull: -2,
    fcrDRevenuePerSecPartial: 5,
    fcrDRevenuePerSecFull: 10,

    // =============== FFR PARAMETERS =================
    ffrActivationThreshold: 49.7,
    ffrActivationDuration: 1.0,
    ffrSupportDuration: 1.0,
    ffrDeactivationTime: 1.0,
    ffrBufferTime: 10.0,
    ffrRecoveryTime: 900,

    // =============== MARKET PRICES =================
    spotPriceBaseRates: {
      night1: 0.0555,
      morningPeak: 0.011,
      day: 0.2,
      night2: 0.0084
    },
    spotPriceClamp: { min: 0.005, max: 0.5 },
    spotPriceImbalanceUpperScale: 0.05,
    spotPriceImbalanceLowerScale: 0.02,

    // =============== BATTERY PARAMETERS =================
    batteryInitialSoC: 50,
    batteryMaxSoC: 100,
    batteryMinSoC: 0,
    batteryCostPerMWh: 1,
    batteryIncomePerMWh: 0.5,
    batterySoCChangePerDischargeMWh: 5,
    batterySoCChangePerChargeMWh: 5,

    // =============== UI PARAMETERS =================
    uiUpdateIntervalMs: 1000
  };
}

function loadSettingsFromLocalStorage() {
  settings = getDefaultSettings(); // always default
}

function initializeGame() {
  loadSettingsFromLocalStorage();
  updateDerivedSettings();
  updateUI();
  logToConsole("Game initialized with MW-based settings");
}

window.onload = () => {
  initializeGame();
  openIntroPanel();

  const powerRatingEl = document.getElementById('batteryPowerRating');
  const capacityEl    = document.getElementById('batteryEnergyCapacity');
  const cRateEl       = document.getElementById('batteryCRate');

  powerRatingEl.textContent   = `Power Rating: ${BATTERY_POWER_RATING_MW} MW`;
  capacityEl.textContent      = `Energy Capacity: ${BATTERY_ENERGY_CAPACITY_MWH} MWh`;
  cRateEl.textContent         = `C-rate: ${BATTERY_CRATE.toFixed(2)}`;
};

/*****************************************************
 * DERIVED SETTINGS / PANEL SAVE (STUBS)
 *****************************************************/
function updateDerivedSettings() {
  settings.compressedMinutesPerSecond = 1440 / settings.gameDurationSeconds;
}
function validateSettings() { return true; }
function saveSettings() {
  if (!validateSettings()) return;
  updateDerivedSettings();
  logToConsole("Settings saved (MW-based)");
}
function resetSettings() {
  settings = getDefaultSettings();
  updateDerivedSettings();
  logToConsole("Settings reset to default (MW-based)");
}

/*****************************************************
 * ENVIRONMENT CALCULATIONS (NOW IN MW)
 *****************************************************/

/**
 * getTemperature(tMinutes) ...
 */
function getTemperature(tMinutes) {
  const TWO_PI = 2 * Math.PI;
  const fractionOfDay = tMinutes / 1440;
  return (
    settings.temperatureMidpoint +
    settings.temperatureAmplitude *
      Math.sin(TWO_PI * fractionOfDay - (TWO_PI * 0.2083 + Math.PI / 2))
  );
}

/**
 * maybeUpdateSunCondition(tMinutes):
 */
function maybeUpdateSunCondition(tMinutes) {
  const hour = Math.floor(tMinutes / 60);
  if (hour !== lastHourChecked) {
    lastHourChecked = hour;
    if (hour < 6 || hour >= 19) {
      currentSunCondition = "Dark";
    } else {
      const options = ["Sunny", "Partly Cloudy", "Cloudy"];
      currentSunCondition = options[Math.floor(Math.random() * options.length)];
    }
    logToConsole(`Sun condition updated => ${currentSunCondition}`);
  }
}

/**
 * getBaseWind(tMinutes):
 */
function getBaseWind(tMinutes) {
  const TWO_PI = 2 * Math.PI;
  const fractionOfDay = tMinutes / 1440;
  return (
    settings.windBaselineMidpoint +
    settings.windBaselineAmplitude * Math.sin(TWO_PI * fractionOfDay)
  );
}

/**
 * updateWind(tMinutes):
 */
function updateWind(tMinutes) {
  const baseWind = getBaseWind(tMinutes);
  const delta = (Math.random() - 0.5) * 1.0;
  currentWind += 0.3 * (baseWind - currentWind) + delta;
  currentWind = Math.max(settings.windSpeedMin, Math.min(settings.windSpeedMax, currentWind));
  logToConsole(`Wind => ${currentWind.toFixed(1)} m/s`);
}

/** clamp helper for gas ramp */
function clamp(value, minVal, maxVal) {
  return Math.max(minVal, Math.min(maxVal, value));
}

/** updateGasDispatch */

function updateGasDispatch(netImbalanceMW) {
    // If netImbalance < 0 => shortage => raise gas
    // If netImbalance > 0 => surplus => reduce gas
    let needed = -netImbalanceMW;
    const step = Math.sign(needed) * Math.min(Math.abs(needed), 5);
    targetGasMW = clamp(targetGasMW + step, 0, settings.gasGenerationMaxMW);
    logToConsole(`Gas mFRR dispatch => Target=${targetGasMW.toFixed(1)} MW`);
  }
  
/** gas ramp */
const gasRampRate = 5; // MW/s
function applyGasRamp(dt) {
  const maxChange = gasRampRate * dt;
  if (currentGasMW < targetGasMW) {
    currentGasMW = Math.min(currentGasMW + maxChange, targetGasMW);
  } else if (currentGasMW > targetGasMW) {
    currentGasMW = Math.max(currentGasMW - maxChange, targetGasMW);
  }
}

/** calculateDemand */
function calculateDemand(tMinutes) {
  const hour = Math.floor(tMinutes / 60);
  let demandMW = 69; // midnight base

  if (hour >= 6 && hour < 9) {
    demandMW *= 1.1;
  } else if (hour >= 17 && hour < 20) {
    demandMW *= 1.3;
  }

  if (currentTemperature < 10) {
    const degBelow10 = 10 - currentTemperature;
    let tempFactor = degBelow10 * 1.02;
    if (hour < 6) {
      const fraction = hour / 6;
      tempFactor *= fraction;
    }
    demandMW += tempFactor;
  }
  return demandMW;
}

// Then in the main loop or environment function, we do a PV ramp:
function applyPVRamp(dt) {
    const pvRampRate = 2; // MW per second, for example
    const maxChange = pvRampRate * dt;
  
    if (currentPVmw < targetPVmw) {
      currentPVmw = Math.min(currentPVmw + maxChange, targetPVmw);
    } else if (currentPVmw > targetPVmw) {
      currentPVmw = Math.max(currentPVmw - maxChange, targetPVmw);
    }
  }

/** updateEnvironment */
function updateEnvironment(tMinutes, dt=1) {
    // 1) Update environment elements
    currentTemperature = getTemperature(tMinutes);
    maybeUpdateSunCondition(tMinutes);
    updateWind(tMinutes);
  
    currentDemandMW = calculateDemand(tMinutes);
  
    // 2) Wind
    windGenerationMW = Math.min(currentWind, settings.windGenerationMaxMW);
  
    // 3) PV ramp
    //   a) get sunFactor from currentSunCondition
    let sunFactor = 0;
    if (currentSunCondition === "Sunny") sunFactor = 1;
    else if (currentSunCondition === "Partly Cloudy") sunFactor = 0.6;
    else if (currentSunCondition === "Cloudy") sunFactor = 0.3;
    // "Dark" => 0
  
    //   b) set target
    targetPVmw = sunFactor * settings.pvGenerationMaxMW;
  
    //   c) ramp
    applyPVRamp(1);
  
    //   d) final assignment
    pvGenerationMW = currentPVmw;
  
    // 4) Sum total generation
    currentGenerationMW = windGenerationMW + pvGenerationMW + currentGasMW;
  
    // 5) Update UI ...

  if (elements.windGeneration) {
    elements.windGeneration.textContent = `${windGenerationMW.toFixed(1)} MW`;
  }
  if (elements.pvGeneration) {
    elements.pvGeneration.textContent = `${pvGenerationMW.toFixed(1)} MW`;
  }
  if (elements.baselineGeneration) {
    elements.baselineGeneration.textContent = `${currentGasMW.toFixed(1)} MW`;
  }
  if (elements.demand) {
    elements.demand.textContent = `${currentDemandMW.toFixed(1)} MW`;
  }
  if (elements.generation) {
    elements.generation.textContent = `${currentGenerationMW.toFixed(1)} MW`;
  }
  if (elements.timeOfDay) {
    elements.timeOfDay.textContent = formatTime(timeOfDayMinutes);
  }
  if (elements.temperature) {
    elements.temperature.textContent = `${currentTemperature.toFixed(1)}°C`;
  }
  if (elements.wind) {
    elements.wind.textContent = `${currentWind.toFixed(1)} m/s`;
  }
  if (elements.sun) {
    elements.sun.textContent = currentSunCondition;
  }

  logToConsole(
    `Environment => Time=${formatTime(tMinutes)}, Temp=${currentTemperature.toFixed(
      1
    )}°C, Wind=${currentWind.toFixed(1)} m/s, Sun=${currentSunCondition}`
  );
}

/*****************************************************
 * MARKET PRICE CALCULATIONS
 *****************************************************/
function getBaseSpotPrice(tMinutes) {
  if (tMinutes < 360) return settings.spotPriceBaseRates.night1; // 00-06
  else if (tMinutes < 540) return settings.spotPriceBaseRates.morningPeak; // 06-09
  else if (tMinutes < 1260) return settings.spotPriceBaseRates.day; // 09-21
  else return settings.spotPriceBaseRates.night2; // 21-24
}

function updatePrices(tMinutes) {
  const baseSpot = getBaseSpotPrice(tMinutes);
  const netImbalanceMW = currentGenerationMW - currentDemandMW;
  let spotPrice = baseSpot;

  if (netImbalanceMW < 0) {
    spotPrice += settings.spotPriceImbalanceUpperScale * (Math.abs(netImbalanceMW) / 50);
  } else {
    spotPrice -= settings.spotPriceImbalanceLowerScale * (netImbalanceMW / 50);
  }
  spotPrice = Math.max(settings.spotPriceClamp.min, Math.min(settings.spotPriceClamp.max, spotPrice));
  const wholesalePrice = spotPrice * 0.5; // should be average of spot price over time

  if (elements.spotPrice) {
    elements.spotPrice.textContent = `€${spotPrice.toFixed(3)}/kWh`;
  }
  if (elements.wholesalePrice) {
    elements.wholesalePrice.textContent = `€${wholesalePrice.toFixed(3)}/kWh`;
  }
  logToConsole(`Prices => Spot=${spotPrice.toFixed(3)}, Wholesale=${wholesalePrice.toFixed(3)}`);
}

/*****************************************************
 * FREQUENCY MANAGEMENT
 *****************************************************/
function updateFrequency() {
  const netImbalanceMW = currentGenerationMW - currentDemandMW;
  logToConsole("Net imbalance: " + netImbalanceMW.toFixed(3));

  // freqChange = scaling * netImbalanceMW
  const freqChange = settings.frequencyChangeScaling * netImbalanceMW;

  // clamp
  const clamped = Math.max(-0.5, Math.min(0.5, freqChange));
  frequency += clamped;

  // random noise
  frequency += (Math.random() - 0.5) * settings.frequencyNoiseRange;

  if (elements.frequencyArrow) {
    const range = settings.frequencyClamp.max - settings.frequencyClamp.min;
    const arrowPos = ((frequency - settings.frequencyClamp.min) / range) * 100;
    elements.frequencyArrow.style.left = `${arrowPos}%`;
  }
  if (elements.frequencyValue) {
    elements.frequencyValue.textContent = `${frequency.toFixed(2)} Hz`;
  }
  logToConsole(`Frequency => ${frequency.toFixed(2)} Hz (Change=${clamped.toFixed(3)})`);
}

/*****************************************************
 * FCR-N
 *****************************************************/
function updateFCRN() {
  if (!fcrNToggled) return;

  if (
    soc < settings.fcrNSoCMin ||
    soc > settings.fcrNSoCMax ||
    frequency < settings.fcrNFrequencyRange.min ||
    frequency > settings.fcrNFrequencyRange.max ||
    fcrDUpActive ||
    fcrDDownActive
  ) {
    if (fcrNToggled) {
      toggleFcrN(false);
      fcrNWasForcedOff = true;
      logToConsole("FCR-N disabled due to SoC/freq out of range or FCR-D active");
    }
    return;
  }

  const freqDeviation = frequency - settings.frequencyBase;

  // let powerCommandMW = freqDeviation / 0.2; // => ±1 MW
  // powerCommandMW = Math.max(-1, Math.min(1, powerCommandMW));
  // ±5 MW at ±0.2 Hz
    let powerCommandMW = (freqDeviation / 0.2) * 5; 
    // so if freqDeviation= ±0.2 => ±5 MW
    powerCommandMW = Math.max(-5, Math.min(5, powerCommandMW));

  // SoC
  soc = Math.max(0, Math.min(100, soc + powerCommandMW * settings.fcrNSoCChangePerMW));

  // freq feedback
  frequency -= powerCommandMW * 0.02;

  // revenue
  revenue += Math.abs(powerCommandMW) * settings.fcrNRevenuePerMW;
  // cycles
  cycleCount += Math.abs(powerCommandMW) * 0.1;

  logToConsole(
    `FCR-N => cmd=${powerCommandMW.toFixed(2)} MW, SoC=${soc.toFixed(1)}%, freq=${frequency.toFixed(2)}`
  );
}

/*****************************************************
 * FCR-D Up & Down
 *****************************************************/
function updateFCRDUp(deltaTime) {
  if (!fcrDUpActive) {
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    return;
  }
  if (frequency >= settings.fcrDActivationThreshold.up) {
    if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
      logToConsole("FCR-D Up deactivated (freq normal)");
    }
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    fcrDUpTimer = 0;
    return;
  }

  fcrDUpTimer += deltaTime;
  if (fcrDUpTimer >= settings.fcrDRampTimeFull) {
    if (fcrDUpState !== FCRD_UP_STATE.FULL) {
      fcrDUpState = FCRD_UP_STATE.FULL;
      logToConsole("FCR-D Up fully activated");
    }
  } else if (fcrDUpTimer >= settings.fcrDRampTimePartial) {
    if (fcrDUpState !== FCRD_UP_STATE.PARTIAL) {
      fcrDUpState = FCRD_UP_STATE.PARTIAL;
      logToConsole("FCR-D Up partially activated");
    }
  } else if (fcrDUpState === FCRD_UP_STATE.INACTIVE) {
    fcrDUpState = FCRD_UP_STATE.PARTIAL;
    logToConsole("FCR-D Up ramping");
  }

  let freqImpact = 0, socImpact = 0, revImpact = 0, cycleImpact = 0;
  if (fcrDUpState === FCRD_UP_STATE.PARTIAL) {
    freqImpact = settings.fcrDFrequencyImpactPartial * deltaTime;
    socImpact = settings.fcrDSoCImpactPartial * deltaTime;
    revImpact = settings.fcrDRevenuePerSecPartial * deltaTime;
    cycleImpact = 0.05 * deltaTime;
  } else if (fcrDUpState === FCRD_UP_STATE.FULL) {
    freqImpact = settings.fcrDFrequencyImpactFull * deltaTime;
    socImpact = settings.fcrDSoCImpactFull * deltaTime;
    revImpact = settings.fcrDRevenuePerSecFull * deltaTime;
    cycleImpact = 0.1 * deltaTime;
  }

  frequency += freqImpact;
  soc = Math.max(0, Math.min(100, soc + socImpact));
  revenue += revImpact;
  cycleCount += cycleImpact;

  logToConsole(
    `FCR-D Up: ${fcrDUpState}, dFreq=${freqImpact.toFixed(3)}, dSoC=${socImpact.toFixed(
      1
    )}%, dRev=€${revImpact.toFixed(2)}`
  );
}

function updateFCRDDown(deltaTime) {
  if (!fcrDDownActive) {
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    return;
  }
  if (frequency <= settings.fcrDActivationThreshold.down) {
    if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
      logToConsole("FCR-D Down deactivated (freq normal)");
    }
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    fcrDDownTimer = 0;
    return;
  }

  fcrDDownTimer += deltaTime;
  if (fcrDDownTimer >= settings.fcrDRampTimeFull) {
    if (fcrDDownState !== FCRD_DOWN_STATE.FULL) {
      fcrDDownState = FCRD_DOWN_STATE.FULL;
      logToConsole("FCR-D Down fully activated");
    }
  } else if (fcrDDownTimer >= settings.fcrDRampTimePartial) {
    if (fcrDDownState !== FCRD_DOWN_STATE.PARTIAL) {
      fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
      logToConsole("FCR-D Down partially activated");
    }
  } else if (fcrDDownState === FCRD_DOWN_STATE.INACTIVE) {
    fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
    logToConsole("FCR-D Down ramping");
  }

  let freqImpact = 0,
    socImpact = 0,
    revImpact = 0,
    cycleImpact = 0;
  if (fcrDDownState === FCRD_DOWN_STATE.PARTIAL) {
    freqImpact = settings.fcrDFrequencyImpactPartial * deltaTime;
    socImpact = settings.fcrDSoCImpactPartial * deltaTime;
    revImpact = settings.fcrDRevenuePerSecPartial * deltaTime;
    cycleImpact = 0.05 * deltaTime;
  } else if (fcrDDownState === FCRD_DOWN_STATE.FULL) {
    freqImpact = settings.fcrDFrequencyImpactFull * deltaTime;
    socImpact = settings.fcrDSoCImpactFull * deltaTime;
    revImpact = settings.fcrDRevenuePerSecFull * deltaTime;
    cycleImpact = 0.1 * deltaTime;
  }

  frequency += freqImpact;
  soc = Math.max(0, Math.min(100, soc + socImpact));
  revenue += revImpact;
  cycleCount += cycleImpact;

  logToConsole(
    `FCR-D Down: ${fcrDDownState}, dFreq=${freqImpact.toFixed(3)}, dSoC=${socImpact.toFixed(
      1
    )}%, dRev=€${revImpact.toFixed(2)}`
  );
}

/*****************************************************
 * FFR LOGIC
 *****************************************************/
function updateFFR(deltaTimeSec) {
  // You can keep your existing logic here
  // e.g. check triggers, handle FFR activation, etc.
}

/*****************************************************
 * MAIN GAME LOOP
 *****************************************************/
function startMainLoop() {
  clearInterval(mainLoop);
  mainLoop = setInterval(() => {
    if (!gameActive) return;

    // 1) Time
    timeOfDayMinutes += settings.compressedMinutesPerSecond;
    if (timeOfDayMinutes >= 1440) {
      timeOfDayMinutes -= 1440;
    }

    // 2) Environment
    updateEnvironment(timeOfDayMinutes);

    // 3) Calculate netImbalance BEFORE calling updateGasDispatch
    const netImbalanceMW = currentGenerationMW - currentDemandMW;
    updateGasDispatch(netImbalanceMW);

    // 4) Gas ramp
    applyGasRamp(1); // dt=1 second

    // 5) Recalc total after gas changed
    currentGenerationMW = windGenerationMW + pvGenerationMW + currentGasMW;

    // 6) Frequency
    updateFrequency();

    // 7) FCR-N
    updateFCRN();

    // 8) FCR-D
    updateFCRDUp(1);
    updateFCRDDown(1);

    // 9) FFR
    updateFFR(1);

    // 10) Market Prices
    updatePrices(timeOfDayMinutes);

    // 11) UI
    updateUI();

    // 12) Check game over
    checkGameOver();

    // 13) Countdown
    timeRemaining--;
    if (timeRemaining <= 0) {
      gameActive = false;
      timeRemaining = 0;
      checkGameOver();
      clearInterval(mainLoop);
    }
  }, settings.uiUpdateIntervalMs);
}

/*****************************************************
 * UI & GAME-OVER
 *****************************************************/
function updateUI() {
  // Battery SoC
  if (elements.batterySoc) {
    elements.batterySoc.style.height = `${soc}%`;
    elements.batterySoc.style.backgroundColor = soc>90 || soc<10 ? "red" : "#00FF00";
  }
  if (elements.batteryLabel) {
    elements.batteryLabel.textContent = `${soc.toFixed(1)}% State of Charge`;
  }

  // revenue & cycles
  if (elements.revenue) {
    elements.revenue.textContent = `EUR Earned: €${revenue.toFixed(2)}`;
  }
  if (elements.cycleCount) {
    elements.cycleCount.textContent = `Battery Cycles: ${cycleCount.toFixed(1)}`;
  }

  // ... if you have FFR metrics, do them here

  // timer
  if (elements.timer) {
    const m = Math.floor(timeRemaining / 60);
    const s = String(timeRemaining % 60).padStart(2, "0");
    elements.timer.textContent = `TIME LEFT: ${m}:${s}`;
  }

  logToConsole(
    `UI => SoC=${soc.toFixed(2)}%, Rev=€${revenue.toFixed(2)}, Cycles=${cycleCount.toFixed(1)}`
  );
}

function checkGameOver() {
  const freqOutOfRange = frequency < settings.frequencyClamp.min || frequency > settings.frequencyClamp.max;
  const socOutOfRange = soc < 0 || soc > 100;
  const tooManyCycles = cycleCount > 30;

  if (freqOutOfRange || socOutOfRange || tooManyCycles) {
    gameActive = false;
    if (freqOutOfRange) {
      if (elements.lossMessage) elements.lossMessage.textContent = "You failed! Frequency out of bounds.";
      logToConsole("Game Over: Frequency out of bounds");
    } else if (socOutOfRange) {
      if (elements.lossMessage) elements.lossMessage.textContent = "You failed! Battery SoC out of bounds.";
      logToConsole("Game Over: Battery SoC out of bounds");
    } else {
      if (elements.lossMessage) elements.lossMessage.textContent = "You failed! Too many battery cycles.";
      logToConsole("Game Over: Too many cycles");
    }
    clearInterval(mainLoop);
    return;
  }

  if (timeRemaining <= 0) {
    gameActive = false;
    if (revenue >= 50) {
      if (elements.lossMessage) elements.lossMessage.textContent = "You did it! Congratulations!";
      logToConsole("Game Over: You did it!");
    } else {
      if (elements.lossMessage) elements.lossMessage.textContent = "You failed! Insufficient revenue.";
      logToConsole("Game Over: Insufficient revenue.");
    }
    clearInterval(mainLoop);
    return;
  }
}

/*****************************************************
 * BUTTON HANDLERS
 *****************************************************/
buttons.startGame.onclick = () => {
  if (!gameActive) {
    gameActive = true;
    timeRemaining = settings.gameDurationSeconds;
    timeOfDayMinutes = 0;
    soc = settings.batteryInitialSoC;
    cycleCount = 0;
    revenue = 0;

    fcrNToggled = false;
    fcrDUpActive = false;
    fcrDDownActive = false;
    ffrActive = false;

    frequency = settings.frequencyBase;
    currentWind = settings.windBaselineMidpoint;
    currentSunCondition = "Dark";
    lastHourChecked = -1;
    currentTemperature = 0;

    currentDemandMW = settings.demandBaseMW;

    // Gas
    currentGasMW = settings.initialGasMW; // e.g. 59
    targetGasMW = settings.initialGasMW;

    windGenerationMW = 0;
    pvGenerationMW = 0;

    ffrEnergyDischarged = 0;
    ffrRevenue = 0;

    updateUI();
    if (elements.lossMessage) elements.lossMessage.textContent = "";

    startMainLoop();
    logToConsole("Game started");
  }
};

buttons.restartGame.onclick = () => {
  gameActive = false;
  clearInterval(mainLoop);

  timeRemaining = settings.gameDurationSeconds;
  timeOfDayMinutes = 0;
  soc = settings.batteryInitialSoC;
  cycleCount = 0;
  revenue = 0;

  fcrNToggled = false;
  fcrDUpActive = false;
  fcrDDownActive = false;
  ffrActive = false;

  frequency = settings.frequencyBase;
  currentWind = settings.windBaselineMidpoint;
  currentSunCondition = "Dark";
  lastHourChecked = -1;
  currentTemperature = 0;

  currentDemandMW = settings.demandBaseMW;
  currentGasMW = settings.initialGasMW;
  targetGasMW = settings.initialGasMW;

  windGenerationMW = 0;
  pvGenerationMW = 0;
  ffrEnergyDischarged = 0;
  ffrRevenue = 0;

  updateUI();
  if (elements.lossMessage) elements.lossMessage.textContent = "";

  startMainLoop();
  logToConsole("Game stopped");
};

/*****************************************************
 * TOGGLE HANDLERS
 *****************************************************/
toggles.fcrNToggle.onchange = () => {
  toggleFcrN(toggles.fcrNToggle.checked);
};
function toggleFcrN(state) {
  fcrNToggled = state;
  if (state) {
    logToConsole("FCR-N activated");
  } else {
    logToConsole("FCR-N deactivated");
  }
}

toggles.fcrDUpToggle.onchange = () => {
  activateFcrDUp(toggles.fcrDUpToggle.checked);
};
function activateFcrDUp(state) {
  fcrDUpActive = state;
  if (fcrDUpActive) {
    logToConsole("FCR-D Up activated");
    if (fcrNToggled) {
      toggleFcrN(false);
      fcrNWasForcedOff = true;
      logToConsole("FCR-N forced off due to FCR-D Up activation");
    }
  } else {
    logToConsole("FCR-D Up deactivated");
    if (
      fcrNWasForcedOff &&
      soc >= settings.fcrNSoCMin &&
      soc <= settings.fcrNSoCMax &&
      frequency >= settings.fcrNFrequencyRange.min &&
      frequency <= settings.fcrNFrequencyRange.max
    ) {
      toggleFcrN(true);
      fcrNWasForcedOff = false;
      logToConsole("FCR-N reactivated after FCR-D Up deactivation");
    }
  }
}

toggles.fcrDDownToggle.onchange = () => {
  activateFcrDDown(toggles.fcrDDownToggle.checked);
};
function activateFcrDDown(state) {
  fcrDDownActive = state;
  if (fcrDDownActive) {
    logToConsole("FCR-D Down activated");
    if (fcrNToggled) {
      toggleFcrN(false);
      fcrNWasForcedOff = true;
      logToConsole("FCR-N forced off due to FCR-D Down activation");
    }
  } else {
    logToConsole("FCR-D Down deactivated");
    if (
      fcrNWasForcedOff &&
      soc >= settings.fcrNSoCMin &&
      soc <= settings.fcrNSoCMax &&
      frequency >= settings.fcrNFrequencyRange.min &&
      frequency <= settings.fcrNFrequencyRange.max
    ) {
      toggleFcrN(true);
      fcrNWasForcedOff = false;
      logToConsole("FCR-N reactivated after FCR-D Down deactivation");
    }
  }
}

toggles.ffrToggle.onchange = () => {
  ffrActive = toggles.ffrToggle.checked;
  if (ffrActive) {
    logToConsole("FFR activated");
  } else {
    logToConsole("FFR deactivated");
  }
};

/*****************************************************
 * BATTERY ACTIONS
 *****************************************************/
buttons.charge.onclick = () => {
    if (soc >= settings.batteryMaxSoC) {
      logToConsole("Battery is already fully charged");
      return;
    }
    // Use the BATTERY_POWER_RATING_MW constant
    const power = BATTERY_POWER_RATING_MW;  
    const chargeEnergyMWh = power * (settings.uiUpdateIntervalMs / 3600000);
    const cost = settings.batteryCostPerMWh * chargeEnergyMWh;
  
    // SoC changes: TBD: Refine this logic depending on how we 
    // want SoC (%) to correlate with total MWh capacity.
    soc = Math.min(
      settings.batteryMaxSoC,
      soc + settings.batterySoCChangePerChargeMWh
    );
  
    revenue -= cost;
    cycleCount += 0.1;
  
    frequency = Math.max(48, Math.min(52, frequency - 0.01));
  
    updateUI();
    logToConsole(`Battery charged: -€${cost.toFixed(4)}, SoC=${soc.toFixed(1)}%`);
  };

  buttons.discharge.onclick = () => {
    if (soc <= settings.batteryMinSoC) {
      logToConsole("Battery is already fully discharged");
      return;
    }
    const power = BATTERY_POWER_RATING_MW; 
    const dischargeEnergyMWh = power * (settings.uiUpdateIntervalMs / 3600000);
    const income = settings.batteryIncomePerMWh * dischargeEnergyMWh;
  
    soc = Math.max(
      settings.batteryMinSoC,
      soc - settings.batterySoCChangePerDischargeMWh
    );
  
    revenue += income;
    cycleCount += 0.1;
  
    frequency = Math.max(48, Math.min(52, frequency + 0.01));
  
    updateUI();
    logToConsole(`Battery discharged: +€${income.toFixed(4)}, SoC=${soc.toFixed(1)}%`);
  };
  

/*****************************************************
 * SETTINGS PANEL
 *****************************************************/


/**
 * Open the settings panel.
 */
function openSettingsPanel() {
  settingsPanel.classList.add('active');
}

/**
 * Close the settings panel.
 */
function closeSettingsPanel() {
  settingsPanel.classList.remove('active');
}

// Toggle on button click
if (settingsButton) {
  settingsButton.addEventListener('click', () => {
    if (settingsPanel.classList.contains('active')) {
      closeSettingsPanel();
    } else {
      openSettingsPanel();
      // You might call loadSettingsToPanel() here if you want to refresh fields:
      // loadSettingsToPanel();
    }
  });
}

/*****************************************************
 * INFO PANE ACCORDION
 *****************************************************/
// This snippet toggles the "active" class on the parent .accordion-item
// so that CSS can show/hide .accordion-content
const accordionButtons = document.querySelectorAll('.accordion-button');

accordionButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    // The parent .accordion-item
    const accordionItem = btn.closest('.accordion-item');
    if (!accordionItem) return;

    // Toggle 'active' class
    accordionItem.classList.toggle('active');
  });
});

/*****************************************************
 * INTRO PANEL FUNCTIONALITY
 *****************************************************/

// Grab references to the Intro Panel and Toggle Button by their IDs
const introPanel = document.getElementById('introPanel');
const introToggleButton = document.getElementById('introToggleButton');

function openIntroPanel() {
    introPanel.classList.add('active');
    introToggleButton.classList.add('close-mode');
    introToggleButton.textContent = "✕";
  }
  function closeIntroPanel() {
    introPanel.classList.remove('active');
    introToggleButton.classList.remove('close-mode');
    introToggleButton.textContent = "About the Game";
  }

if (introToggleButton) {
  introToggleButton.addEventListener('click', () => {
    if (introPanel.classList.contains('active')) {
      closeIntroPanel();
    } else {
      openIntroPanel();
    }
  });
}

/*****************************************************
 * INTRO PANEL FUNCTIONALITY
 *****************************************************/

// Grab references to the Intro Panel and Toggle Button by their IDs
const InfoPane = document.getElementById('infoPane');
const InfoToggleButton = document.getElementById('infoToggleButton');

function openInfoPane() {
    InfoPane.classList.add('active');
    InfoToggleButton.classList.add('close-mode');
    InfoToggleButton.textContent = "✕";
  }
  function closeInfoPane() {
    InfoPane.classList.remove('active');
    InfoToggleButton.classList.remove('close-mode');
    InfoToggleButton.textContent = "Market Info";
  }

if (InfoToggleButton) {
  InfoToggleButton.addEventListener('click', () => {
    InfoPane.classList.contains('active') ? closeInfoPane() : openInfoPane();
    
  });
}