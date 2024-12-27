/*****************************************************
 * CONFIGURATION - GAMEPLAY VARIABLES
 *****************************************************/

// =============== GAME TIME SETTINGS =================
const GAME_DURATION_SECONDS = 180; // Total game duration in real seconds (3 minutes)
const COMPRESSED_MINUTES_PER_SECOND = 1440 / GAME_DURATION_SECONDS; // 24h / 3min => 8 min per real second

// =============== ENVIRONMENT PARAMETERS =================
const TEMPERATURE_AMPLITUDE = 10; // Amplitude for temperature oscillation (±10°C)
const TEMPERATURE_MIDPOINT = 5; // Midpoint temperature (°C)
const WIND_BASELINE_AMPLITUDE = 3; // Amplitude for wind speed oscillation (±3 m/s)
const WIND_BASELINE_MIDPOINT = 5; // Midpoint wind speed (m/s)
const WIND_SPEED_MAX = 10; // Maximum wind speed for power generation (m/s)
const WIND_SPEED_MIN = 0; // Minimum wind speed (m/s)

const PV_GENERATION_MAX_GW = 5; // Maximum PV (solar) generation (GW)
const WIND_GENERATION_MAX_GW = 10; // Maximum Wind generation (GW)
const BASELINE_GENERATION_GW = 40; // Baseline generation from non-renewable sources (GW)

// =============== DEMAND PARAMETERS =================
const DEMAND_BASE_GW = 50; // Baseline demand (GW)
const DEMAND_PEAK_MULTIPLIER_MORNING = 1.2; // Morning peak demand multiplier
const DEMAND_PEAK_MULTIPLIER_EVENING = 1.3; // Evening peak demand multiplier
const DEMAND_TEMPERATURE_FACTOR = 1; // Demand increase per °C below 0°C

// =============== FREQUENCY PARAMETERS =================
const FREQUENCY_BASE = 50.0; // Base frequency (Hz)
const FREQUENCY_CHANGE_SCALING = 0.005; // Scaling factor for frequency change per GW imbalance
const FREQUENCY_CLAMP = { // Frequency bounds to prevent extreme jumps
  min: 49.0,
  max: 51.0
};
const FREQUENCY_NOISE_RANGE = 0.02; // Random noise added to frequency (±0.02 Hz)

// =============== FCR-N PARAMETERS =================
const FCRN_SoC_MIN = 40; // Minimum State of Charge (%) to enable FCR-N
const FCRN_SoC_MAX = 60; // Maximum State of Charge (%) to enable FCR-N
const FCRN_FREQUENCY_RANGE = { // Frequency range to enable FCR-N
  min: 49.5,
  max: 50.5
};
const FCRN_REVENUE_PER_MW = 10; // Revenue earned per MW for FCR-N
const FCRN_SOC_CHANGE_PER_MW = 0.3; // SoC change per MW commanded by FCR-N

// =============== FCR-D PARAMETERS =================
const FCRD_ACTIVATION_THRESHOLD = { // Frequency thresholds to activate FCR-D
  up: 49.9, // Below this, FCR-D Up can activate
  down: 50.1 // Above this, FCR-D Down can activate
};
const FCRD_RAMP_TIME_PARTIAL = 5; // Time in seconds to reach partial activation
const FCRD_RAMP_TIME_FULL = 30; // Time in seconds to reach full activation
const FCRD_FREQUENCY_IMPACT_PARTIAL = 0.03; // Frequency change per second at partial activation
const FCRD_FREQUENCY_IMPACT_FULL = 0.06; // Frequency change per second at full activation
const FCRD_SOC_IMPACT_PARTIAL = -1; // SoC change per second at partial activation
const FCRD_SOC_IMPACT_FULL = -2; // SoC change per second at full activation
const FCRD_REVENUE_PER_SEC_PARTIAL = 5; // Revenue per second at partial activation
const FCRD_REVENUE_PER_SEC_FULL = 10; // Revenue per second at full activation

// =============== FFR PARAMETERS =================
const FFR_ACTIVATION_THRESHOLD = 49.7; // Frequency threshold to trigger FFR (Hz)
const FFR_ACTIVATION_DURATION = 1.0; // Duration to activate FFR (seconds)
const FFR_SUPPORT_DURATION = 1.0; // Support duration for FFR (seconds)
const FFR_DEACTIVATION_TIME = 1.0; // Time to deactivate FFR (seconds)
const FFR_BUFFER_TIME = 10.0; // Buffer time after deactivation (seconds)
const FFR_RECOVERY_TIME = 900; // Recovery time after buffer (seconds)

// =============== MARKET PRICES =================
const SPOT_PRICE_BASE_RATES = { // Base spot prices based on time of day
  night1: 0.0555, // 00:00-06:00 EUR/kWh
  morningPeak: 0.011, // 06:00-09:00 EUR/kWh
  day: 0.2, // 09:00-21:00 EUR/kWh
  night2: 0.0084 // 21:00-24:00 EUR/kWh
};
const SPOT_PRICE_CLAMP = { // Spot price bounds
  min: 0.005,
  max: 0.5
};
const SPOT_PRICE_IMBALANCE_UPPER_SCALE = 0.05; // Spot price increase per GW shortage
const SPOT_PRICE_IMBALANCE_LOWER_SCALE = 0.02; // Spot price decrease per GW surplus

// =============== BATTERY PARAMETERS =================
const BATTERY_INITIAL_SOC = 50; // Initial State of Charge (%)
const BATTERY_MAX_SOC = 100; // Maximum SoC (%)
const BATTERY_MIN_SOC = 0; // Minimum SoC (%)
const BATTERY_COST_PER_MWH = 1; // Cost to charge per MWh
const BATTERY_INCOME_PER_MWH = 0.5; // Income from discharge per MWh
const BATTERY_SOC_CHANGE_PER_DISCHARGE_MWH = 5; // SoC change per discharge action
const BATTERY_SOC_CHANGE_PER_CHARGE_MWH = 5; // SoC change per charge action

// =============== UI PARAMETERS =================
const UI_UPDATE_INTERVAL_MS = 1000; // UI update interval (milliseconds)

/*****************************************************
 * GLOBAL VARIABLES - GAME STATE
 *****************************************************/

// =============== GAME TIME =================
let timeRemaining = GAME_DURATION_SECONDS; // Time left in the game (seconds)
let timeOfDayMinutes = 0; // Current time of day in minutes (0..1440)

// =============== ENVIRONMENT STATE =================
let currentSunCondition = "Dark"; // Current sun condition
let lastHourChecked = -1; // Last hour checked for sun condition updates
let currentTemperature = 0; // Current temperature (°C)
let currentWind = WIND_BASELINE_MIDPOINT; // Current wind speed (m/s)
let currentDemand = DEMAND_BASE_GW; // Current power demand (GW)
let currentGeneration = BASELINE_GENERATION_GW; // Current total power generation (GW)

// =============== GENERATION STATE =================
let windGenerationGW = 0; // Current wind power generation (GW)
let pvGenerationGW = 0; // Current PV power generation (GW)

// =============== FREQUENCY STATE =================
let frequency = FREQUENCY_BASE; // Current grid frequency (Hz)

// =============== BATTERY STATE =================
let soc = BATTERY_INITIAL_SOC; // Current State of Charge (%)
let cycleCount = 0; // Number of charge/discharge cycles used
let revenue = 0; // Total revenue earned

// =============== FCR / FFR STATE =================
let fcrNToggled = false; // Whether FCR-N is active
let fcrDUpActive = false; // Whether FCR-D Up is active
let fcrDDownActive = false; // Whether FCR-D Down is active
let ffrActive = false; // Whether FFR is active
let fcrNWasForcedOff = false; // Whether FCR-N was forced off due to FCR-D activation

// FCR-D States
const FCRD_UP_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
const FCRD_DOWN_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
let fcrDUpState = FCRD_UP_STATE.INACTIVE;
let fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
let fcrDUpTimer = 0;
let fcrDDownTimer = 0;

// FFR States
let ffrState = "idle"; // Current FFR state
let ffrActivationTime = 0; // Timer for FFR activation
let isBatteryAvailable = true; // Whether the battery is available for FFR
let isFfrProfileWindow = false; // Whether FFR profile window is active
let isFfrFlexOrdered = false; // Whether FFR is flex-ordered by TSO

// Current Prices
let currentSpotPrice = 0;
let currentWholesalePrice = 0;

/*****************************************************
 * DOM ELEMENTS
 *****************************************************/
const elements = {
  frequencyArrow: document.getElementById('frequencyArrow'),
  frequencyValue: document.getElementById('frequencyValue'),
  batterySoc: document.getElementById('batterySoc'),
  batteryLabel: document.getElementById('batteryLabel'),
  status: document.getElementById('status'),
  timer: document.getElementById('timer'),
  revenue: document.getElementById('revenue'),
  cycleCount: document.getElementById('cycleCount'),
  lossMessage: document.getElementById('lossMessage'),
  batteryWarning: document.getElementById('batteryWarning'),
  timeOfDay: document.getElementById('timeOfDay'),
  temperature: document.getElementById('temperature'),
  wind: document.getElementById('wind'),
  sun: document.getElementById('sun'),
  spotPrice: document.getElementById('spotPrice'),
  wholesalePrice: document.getElementById('wholesalePrice'),
  gameConsole: document.getElementById('gameConsole'),
  demand: document.getElementById('demand'), // Newly added for currentDemand
  generation: document.getElementById('generation'), // Newly added for currentGeneration
  windGeneration: document.getElementById('windGeneration'),
  pvGeneration: document.getElementById('pvGeneration'),
  baselineGeneration: document.getElementById('baselineGeneration') // Optional
};

const buttons = {
  startGame: document.getElementById('startGame'),
  restartGame: document.getElementById('restartGame'),
  charge: document.getElementById('charge'),
  discharge: document.getElementById('discharge')
};

const toggles = {
  fcrNToggle: document.getElementById('fcrNToggle'),
  fcrDUpToggle: document.getElementById('fcrDUpToggle'),
  fcrDDownToggle: document.getElementById('fcrDDownToggle'),
  ffrToggle: document.getElementById('ffrToggle')
};

/*****************************************************
 * LOG TO CONSOLE
 *****************************************************/
function logToConsole(msg) {
  if (elements.gameConsole) {
    const line = document.createElement("div");
    line.textContent = msg;
    elements.gameConsole.appendChild(line);
    elements.gameConsole.scrollTop = elements.gameConsole.scrollHeight;
  }
  
  // Also log to the browser console for debugging
  console.log(msg);
}

/*****************************************************
 * HELPER FUNCTIONS
 *****************************************************/

/**
 * Format time from minutes to "HH:MM" format.
 * @param {number} tMinutes - Time in minutes.
 * @returns {string} Formatted time string.
 */
function formatTime(tMinutes) {
  const hours = Math.floor(tMinutes / 60) % 24;
  const minutes = tMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/*****************************************************
 * ENVIRONMENT CALCULATIONS
 *****************************************************/

/**
 * Calculate temperature based on time of day.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 * @returns {number} Temperature in °C.
 */
function getTemperature(tMinutes) {
  const TWO_PI = 2 * Math.PI;
  const fractionOfDay = tMinutes / 1440; // 0..1

  const temp = TEMPERATURE_MIDPOINT + TEMPERATURE_AMPLITUDE * Math.sin(TWO_PI * fractionOfDay - (TWO_PI * 0.2083 + Math.PI / 2));
  
  return temp; // -5..15°C
}

/**
 * Update sun condition once per hour.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 */
function maybeUpdateSunCondition(tMinutes) {
  const hour = Math.floor(tMinutes / 60);
  if (hour !== lastHourChecked) {
    lastHourChecked = hour;

    if (hour < 6 || hour >= 19) {
      // Nighttime
      currentSunCondition = "Dark";
    } else {
      // Daytime: Randomly select sun condition
      const possibleConditions = ["Sunny", "Partly Cloudy", "Cloudy"];
      const index = Math.floor(Math.random() * possibleConditions.length);
      currentSunCondition = possibleConditions[index];
    }

    logToConsole(`Sun condition updated to: ${currentSunCondition}`);
  }
}

/**
 * Calculate base wind speed based on time of day.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 * @returns {number} Base wind speed in m/s.
 */
function getBaseWind(tMinutes) {
  const TWO_PI = 2 * Math.PI;
  const fractionOfDay = tMinutes / 1440; // 0..1

  const baseWind = WIND_BASELINE_MIDPOINT + WIND_BASELINE_AMPLITUDE * Math.sin(TWO_PI * fractionOfDay);
  
  return baseWind; // Varies smoothly over the day
}

/**
 * Update wind speed with a smooth random walk.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 */
function updateWind(tMinutes) {
  const baseWind = getBaseWind(tMinutes);
  
  // Random step: ±0.5 m/s
  const delta = (Math.random() - 0.5) * 1.0;
  
  // Smooth adjustment towards base wind
  currentWind += 0.3 * (baseWind - currentWind) + delta;
  
  // Clamp wind speed to defined limits
  currentWind = Math.max(WIND_SPEED_MIN, Math.min(WIND_SPEED_MAX, currentWind));
  
  logToConsole(`Wind speed updated to: ${currentWind.toFixed(1)} m/s`);
}

/**
 * Calculate power demand based on time of day and temperature.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 * @returns {number} Power demand in GW.
 */
function calculateDemand(tMinutes) {
  const hour = Math.floor(tMinutes / 60);
  let peakFactor = 1;

  if (hour >= 6 && hour < 9) { // Morning peak
    peakFactor = DEMAND_PEAK_MULTIPLIER_MORNING;
  } else if (hour >= 17 && hour < 20) { // Evening peak
    peakFactor = DEMAND_PEAK_MULTIPLIER_EVENING;
  }

  // Demand increases by DEMAND_TEMPERATURE_FACTOR per °C below 0°C
  const tempFactor = (currentTemperature < 0) ? Math.abs(currentTemperature) * DEMAND_TEMPERATURE_FACTOR : 0;
  
  const demand = DEMAND_BASE_GW * peakFactor + tempFactor;
  
  logToConsole(`Demand calculated: ${demand.toFixed(1)} GW (Peak Factor: ${peakFactor}, Temp Factor: ${tempFactor})`);
  
  return demand;
}

/**
 * Update the environment: temperature, sun, wind, demand, and generation.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 */
function updateEnvironment(tMinutes) {
  // Update temperature
  currentTemperature = getTemperature(tMinutes);
  
  // Update sun condition
  maybeUpdateSunCondition(tMinutes);
  
  // Update wind speed
  updateWind(tMinutes);
  
  // Calculate demand
  currentDemand = calculateDemand(tMinutes);
  
  // Calculate power generation
  windGenerationGW = Math.min(currentWind, WIND_GENERATION_MAX_GW); // 0-10 GW
  pvGenerationGW = (currentSunCondition === "Sunny" ? 1 :
                   currentSunCondition === "Partly Cloudy" ? 0.6 :
                   currentSunCondition === "Cloudy" ? 0.3 : 0) * PV_GENERATION_MAX_GW; // 0-5 GW
  currentGeneration = windGenerationGW + pvGenerationGW + BASELINE_GENERATION_GW; // Total generation

  // Update UI elements
  elements.windGeneration.textContent = `${windGenerationGW.toFixed(1)} GW`;
  elements.pvGeneration.textContent = `${pvGenerationGW.toFixed(1)} GW`;
  elements.baselineGeneration.textContent = `${BASELINE_GENERATION_GW.toFixed(1)} GW`;
  elements.demand.textContent = `${currentDemand.toFixed(1)} GW`;
  elements.generation.textContent = `${currentGeneration.toFixed(1)} GW`;
  
  // Update additional UI elements
  elements.timeOfDay.textContent = formatTime(timeOfDayMinutes);
  elements.temperature.textContent = `${currentTemperature.toFixed(1)}°C`;
  elements.wind.textContent = `${currentWind.toFixed(1)} m/s`;
  elements.sun.textContent = currentSunCondition;
  
  logToConsole(`Environment updated: Time=${formatTime(tMinutes)}, Temp=${currentTemperature}°C, Wind=${currentWind} m/s, Sun=${currentSunCondition}`);
}

/*****************************************************
 * MARKET PRICE CALCULATIONS
 *****************************************************/

/**
 * Determine base spot price based on time of day.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 * @returns {number} Base spot price in EUR/kWh.
 */
function getBaseSpotPrice(tMinutes) {
  if (tMinutes < 360) { // 00:00-06:00
    return SPOT_PRICE_BASE_RATES.night1;
  } else if (tMinutes < 540) { // 06:00-09:00
    return SPOT_PRICE_BASE_RATES.morningPeak;
  } else if (tMinutes < 1260) { // 09:00-21:00
    return SPOT_PRICE_BASE_RATES.day;
  } else { // 21:00-24:00
    return SPOT_PRICE_BASE_RATES.night2;
  }
}

/**
 * Update market prices based on net imbalance.
 * @param {number} tMinutes - Current time in minutes (0..1440).
 */
function updatePrices(tMinutes) {
  const baseSpotPrice = getBaseSpotPrice(tMinutes);
  const netImbalance = currentGeneration - currentDemand; // GW

  let spotPrice = baseSpotPrice;

  if (netImbalance < 0) { // Shortage
    spotPrice += SPOT_PRICE_IMBALANCE_UPPER_SCALE * Math.abs(netImbalance) / 50;
  } else { // Surplus
    spotPrice -= SPOT_PRICE_IMBALANCE_LOWER_SCALE * netImbalance / 50;
  }

  // Clamp spot price
  spotPrice = Math.max(SPOT_PRICE_CLAMP.min, Math.min(SPOT_PRICE_CLAMP.max, spotPrice));

  // Calculate wholesale price
  const wholesalePrice = spotPrice * 0.5;

  // Update global prices
  currentSpotPrice = spotPrice;
  currentWholesalePrice = wholesalePrice;

  // Update UI elements
  elements.spotPrice.textContent = `€${spotPrice.toFixed(3)}/kWh`;
  elements.wholesalePrice.textContent = `€${wholesalePrice.toFixed(3)}/kWh`;

  logToConsole(`Prices updated: Spot Price=${spotPrice.toFixed(3)} EUR/kWh, Wholesale Price=${wholesalePrice.toFixed(3)} EUR/kWh`);
}

/*****************************************************
 * FREQUENCY MANAGEMENT
 *****************************************************/

/**
 * Update grid frequency based on net imbalance.
 */
/**
 * Update grid frequency based on net imbalance.
 */
function updateFrequency() {
    const netImbalance = currentGeneration - currentDemand; // GW
    
    // Calculate frequency change
    let freqChange = FREQUENCY_CHANGE_SCALING * netImbalance; // Hz
  
    // Clamp frequency change to prevent extreme jumps
    freqChange = Math.max(-0.3, Math.min(0.3, freqChange));
  
    // Update frequency
    frequency += freqChange;
  
    // Add random noise
    frequency += (Math.random() - 0.5) * FREQUENCY_NOISE_RANGE;
  
    // **Remove the following line to allow frequency to go out of bounds**
    // frequency = Math.max(FREQUENCY_CLAMP.min, Math.min(FREQUENCY_CLAMP.max, frequency));
  
    // Update UI
    const arrowPos = ((frequency - FREQUENCY_CLAMP.min) / (FREQUENCY_CLAMP.max - FREQUENCY_CLAMP.min)) * 100;
    elements.frequencyArrow.style.left = `${arrowPos}%`;
    elements.frequencyValue.textContent = `${frequency.toFixed(2)} Hz`;
  
    logToConsole(`Frequency updated: ${frequency.toFixed(2)} Hz (Change: ${freqChange.toFixed(3)} Hz)`);
  }
  

/*****************************************************
 * FREQUENCY CONTROL MECHANISMS
 *****************************************************/

/**
 * Update FCR-N.
 */
function updateFCRN() {
  if (!fcrNToggled) return;

  // Check if conditions to disable FCR-N are met
  if (
    soc < FCRN_SoC_MIN || soc > FCRN_SoC_MAX ||
    frequency < FCRN_FREQUENCY_RANGE.min || frequency > FCRN_FREQUENCY_RANGE.max ||
    fcrDUpActive || fcrDDownActive
  ) {
    if (fcrNToggled) {
      fcrNWasForcedOff = true;
      toggleFcrN(false);
      logToConsole("FCR-N disabled due to SoC/frequency out of range or FCR-D active");
    }
    return;
  }

  // Calculate power command based on frequency deviation
  const freqDeviation = frequency - FREQUENCY_BASE; // Hz
  let powerCommandMW = freqDeviation / 0.2; // ±1 MW at ±0.2 Hz
  powerCommandMW = Math.max(-1, Math.min(1, powerCommandMW));

  // Update State of Charge
  soc = Math.max(0, Math.min(100, soc + powerCommandMW * FCRN_SOC_CHANGE_PER_MW));

  // Update frequency to simulate FCR-N response
  frequency -= powerCommandMW * 0.02; // Frequency feedback

  // Update revenue
  revenue += Math.abs(powerCommandMW) * FCRN_REVENUE_PER_MW;

  // Logging
  logToConsole(`FCR-N active: Power Command=${powerCommandMW.toFixed(2)} MW, SoC=${soc.toFixed(1)}%, Frequency=${frequency.toFixed(2)} Hz`);
}

/*****************************************************
 * FCR-D LOGIC
 *****************************************************/
function updateFCRDUp(deltaTime) {
  if (!fcrDUpActive) {
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    return;
  }

  if (frequency >= FCRD_ACTIVATION_THRESHOLD.up) {
    if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
      logToConsole("FCR-D Up deactivated (frequency back to normal)");
    }
    fcrDUpState = FCRD_UP_STATE.INACTIVE;
    fcrDUpTimer = 0;
    return;
  }

  // Increment timer
  fcrDUpTimer += deltaTime;

  // Determine activation state
  if (fcrDUpTimer >= FCRD_RAMP_TIME_FULL) {
    if (fcrDUpState !== FCRD_UP_STATE.FULL) {
      fcrDUpState = FCRD_UP_STATE.FULL;
      logToConsole("FCR-D Up fully activated");
    }
  } else if (fcrDUpTimer >= FCRD_RAMP_TIME_PARTIAL) {
    if (fcrDUpState !== FCRD_UP_STATE.PARTIAL) {
      fcrDUpState = FCRD_UP_STATE.PARTIAL;
      logToConsole("FCR-D Up partially activated");
    }
  } else {
    if (fcrDUpState === FCRD_UP_STATE.INACTIVE) {
      fcrDUpState = FCRD_UP_STATE.PARTIAL;
      logToConsole("FCR-D Up ramping up");
    }
  }

  // Apply impacts based on activation state
  let freqImpact = 0;
  let socImpact = 0;
  let revImpact = 0;
  if (fcrDUpState === FCRD_UP_STATE.PARTIAL) {
    freqImpact = FCRD_FREQUENCY_IMPACT_PARTIAL * deltaTime;
    socImpact = FCRD_SOC_IMPACT_PARTIAL * deltaTime;
    revImpact = FCRD_REVENUE_PER_SEC_PARTIAL * deltaTime;
  } else if (fcrDUpState === FCRD_UP_STATE.FULL) {
    freqImpact = FCRD_FREQUENCY_IMPACT_FULL * deltaTime;
    socImpact = FCRD_SOC_IMPACT_FULL * deltaTime;
    revImpact = FCRD_REVENUE_PER_SEC_FULL * deltaTime;
  }

  // Update frequency and SoC
  frequency += freqImpact;
  soc = Math.max(0, Math.min(100, soc + socImpact));
  
  // Update revenue
  revenue += revImpact;

  logToConsole(`FCR-D Up: State=${fcrDUpState}, Frequency Change=${freqImpact.toFixed(3)} Hz, SoC Change=${socImpact.toFixed(1)}%, Revenue Change=€${revImpact.toFixed(2)}`);
}

function updateFCRDDown(deltaTime) {
  if (!fcrDDownActive) {
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    return;
  }

  if (frequency <= FCRD_ACTIVATION_THRESHOLD.down) {
    if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
      logToConsole("FCR-D Down deactivated (frequency back to normal)");
    }
    fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
    fcrDDownTimer = 0;
    return;
  }

  // Increment timer
  fcrDDownTimer += deltaTime;

  // Determine activation state
  if (fcrDDownTimer >= FCRD_RAMP_TIME_FULL) {
    if (fcrDDownState !== FCRD_DOWN_STATE.FULL) {
      fcrDDownState = FCRD_DOWN_STATE.FULL;
      logToConsole("FCR-D Down fully activated");
    }
  } else if (fcrDDownTimer >= FCRD_RAMP_TIME_PARTIAL) {
    if (fcrDDownState !== FCRD_DOWN_STATE.PARTIAL) {
      fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
      logToConsole("FCR-D Down partially activated");
    }
  } else {
    if (fcrDDownState === FCRD_DOWN_STATE.INACTIVE) {
      fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
      logToConsole("FCR-D Down ramping up");
    }
  }

  // Apply impacts based on activation state
  let freqImpact = 0;
  let socImpact = 0;
  let revImpact = 0;
  if (fcrDDownState === FCRD_DOWN_STATE.PARTIAL) {
    freqImpact = FCRD_FREQUENCY_IMPACT_PARTIAL * deltaTime;
    socImpact = FCRD_SOC_IMPACT_PARTIAL * deltaTime;
    revImpact = FCRD_REVENUE_PER_SEC_PARTIAL * deltaTime;
  } else if (fcrDDownState === FCRD_DOWN_STATE.FULL) {
    freqImpact = FCRD_FREQUENCY_IMPACT_FULL * deltaTime;
    socImpact = FCRD_SOC_IMPACT_FULL * deltaTime;
    revImpact = FCRD_REVENUE_PER_SEC_FULL * deltaTime;
  }

  // Update frequency and SoC
  frequency += freqImpact;
  soc = Math.max(0, Math.min(100, soc + socImpact));
  
  // Update revenue
  revenue += revImpact;

  logToConsole(`FCR-D Down: State=${fcrDDownState}, Frequency Change=${freqImpact.toFixed(3)} Hz, SoC Change=${socImpact.toFixed(1)}%, Revenue Change=€${revImpact.toFixed(2)}`);
}

/*****************************************************
 * FFR LOGIC
 *****************************************************/
function updateFFR(deltaTimeSec) {
  // Check if FFR can be activated
  isFfrProfileWindow = checkFfrProfileWindow();
  isFfrFlexOrdered = checkFfrFlexOrdered();

  if (!isBatteryAvailable) {
    ffrState = "idle";
    return;
  }

  const ffrAvailable = isFfrProfileWindow || isFfrFlexOrdered;

  if (frequency < FFR_ACTIVATION_THRESHOLD && ffrState === "idle" && ffrAvailable) {
    ffrState = "activated";
    ffrActive = true;
    ffrActivationTime = 0;
    logToConsole(`FFR activated at frequency ${frequency.toFixed(2)} Hz`);
  }

  switch(ffrState) {
    case "activated":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_ACTIVATION_DURATION + FFR_SUPPORT_DURATION) {
        ffrState = "deactivating";
        ffrActivationTime = 0;
        logToConsole("FFR deactivating");
      }
      break;
    case "deactivating":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_DEACTIVATION_TIME) {
        ffrState = "buffer";
        ffrActivationTime = 0;
        logToConsole("FFR buffer period started");
      }
      break;
    case "buffer":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_BUFFER_TIME) {
        ffrState = "recovering";
        ffrActivationTime = 0;
        logToConsole("FFR recovering");
      }
      break;
    case "recovering":
      ffrActivationTime += deltaTimeSec;
      if (ffrActivationTime >= FFR_RECOVERY_TIME) {
        ffrState = "idle";
        ffrActive = false;
        logToConsole("FFR fully recovered and idle");
      }
      break;
    default:
      // "idle"
      break;
  }
}

/**
 * Check if current time is within FFR profile window.
 * @returns {boolean} True if within profile window, else false.
 */
function checkFfrProfileWindow() {
  // Example condition: night time (22:00-07:00) or weekends
  const hour = Math.floor(timeOfDayMinutes / 60);
  const dayOfWeek = 3; // Placeholder: 0=Sunday, 6=Saturday
  const night = (hour >= 22 || hour < 7);
  const weekend = (dayOfWeek === 0 || dayOfWeek === 6);
  return (night || weekend);
}

/**
 * Check if FFR is flex-ordered by TSO.
 * @returns {boolean} True if flex-ordered, else false.
 */
function checkFfrFlexOrdered() {
  // Placeholder: Implement actual logic or schedule
  return false;
}

/*****************************************************
 * MAIN GAME LOOP
 *****************************************************/
let mainLoop = null;
let gameActive = false; // Indicates whether the game is active

function startMainLoop() {
  clearInterval(mainLoop);
  mainLoop = setInterval(() => {
    if (!gameActive) return;

    // 1) Advance compressed "day" time
    timeOfDayMinutes += COMPRESSED_MINUTES_PER_SECOND;
    if (timeOfDayMinutes >= 1440) {
      timeOfDayMinutes -= 1440; // Wrap to next day
    }

    // 2) Update environment
    updateEnvironment(timeOfDayMinutes);

    // 3) Update frequency based on net imbalance
    updateFrequency();

    // 4) Update FCR-N
    updateFCRN();

    // 5) Update FCR-D Up and Down
    updateFCRDUp(1); // deltaTime = 1 second
    updateFCRDDown(1); // deltaTime = 1 second

    // 6) Update FFR
    if (ffrActive) {
      updateFFR(1);
    }

    // 7) Update market prices
    updatePrices(timeOfDayMinutes);

    // 8) Update UI
    updateUI();

    // 9) Check for game over conditions
    checkGameOver();

    // 10) Decrement remaining time
    timeRemaining--;
    if (timeRemaining <= 0) {
      gameActive = false;
      timeRemaining = 0;
      checkGameOver();
      clearInterval(mainLoop);
    }

  }, UI_UPDATE_INTERVAL_MS);
}

/*****************************************************
 * UI AND GAME OVER LOGIC
 *****************************************************/

/**
 * Update all UI elements.
 */
function updateUI() {
  // Frequency is updated within updateFrequency()

  // Update battery SoC display
  elements.batterySoc.style.height = `${soc}%`;
  elements.batterySoc.style.backgroundColor = (soc > 90 || soc < 10) ? 'red' : 'blue';
  elements.batteryLabel.textContent = `${soc.toFixed(1)}% State of Charge`;

  // Update revenue and cycle count
  elements.revenue.textContent = `EUR Earned: €${revenue.toFixed(2)}`;
  elements.cycleCount.textContent = `Battery Cycles: ${cycleCount.toFixed(1)}`;

  // Update time remaining
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = String(timeRemaining % 60).padStart(2, '0');
  elements.timer.textContent = `TIME LEFT: ${minutes}:${seconds}`;

  // Other UI elements (demand, generation) are updated within respective functions

  // Log UI update
  logToConsole(`UI Updated: SoC=${soc}%, Revenue=€${revenue}, Cycles=${cycleCount}, Time Left=${minutes}:${seconds}`);
}

/**
 * Check if game over conditions are met.
 */
function checkGameOver() {
  const frequencyOutOfBounds = (frequency < FREQUENCY_CLAMP.min || frequency > FREQUENCY_CLAMP.max);
  const socOutOfBounds = (soc < BATTERY_MIN_SOC || soc > BATTERY_MAX_SOC);
  const excessiveCycles = (cycleCount > 30);

  if (frequencyOutOfBounds || socOutOfBounds || excessiveCycles) {
    gameActive = false;
    elements.lossMessage.textContent = "You failed! Game over!";
    logToConsole("Game Over: You failed!");
    clearInterval(mainLoop);
    return;
  }

  if (timeRemaining <= 0) {
    gameActive = false;
    if (revenue >= 50) {
      elements.lossMessage.textContent = "You did it! Congratulations!";
      logToConsole("Game Over: You did it!");
    } else {
      elements.lossMessage.textContent = "You failed! Game over!";
      logToConsole("Game Over: You failed!");
    }
    clearInterval(mainLoop);
    return;
  }

  // Optionally, add other win conditions
}

/*****************************************************
 * TOGGLE AND BUTTON EVENT HANDLERS
 *****************************************************/

/**
 * Handle FCR-N toggle.
 */
toggles.fcrNToggle.onchange = () => {
  if (toggles.fcrNToggle.checked) {
    toggleFcrN(true);
  } else {
    toggleFcrN(false);
  }
};

function toggleFcrN(state) {
  fcrNToggled = state;
  if (fcrNToggled) {
    logToConsole("FCR-N activated");
  } else {
    logToConsole("FCR-N deactivated");
  }
}

/**
 * Handle FCR-D Up toggle.
 */
toggles.fcrDUpToggle.onchange = () => {
  if (toggles.fcrDUpToggle.checked) {
    activateFcrDUp(true);
  } else {
    activateFcrDUp(false);
  }
};

function activateFcrDUp(state) {
  fcrDUpActive = state;
  if (fcrDUpActive) {
    logToConsole("FCR-D Up activated");
    // Force FCR-N off if active
    if (fcrNToggled) {
      toggleFcrN(false);
      fcrNWasForcedOff = true;
      logToConsole("FCR-N forced off due to FCR-D Up activation");
    }
  } else {
    logToConsole("FCR-D Up deactivated");
    // Re-enable FCR-N if it was forced off and conditions are met
    if (fcrNWasForcedOff && soc >= FCRN_SoC_MIN && soc <= FCRN_SoC_MAX && frequency >= FCRN_FREQUENCY_RANGE.min && frequency <= FCRN_FREQUENCY_RANGE.max) {
      toggleFcrN(true);
      fcrNWasForcedOff = false;
      logToConsole("FCR-N reactivated after FCR-D Up deactivation");
    }
  }
}

/**
 * Handle FCR-D Down toggle.
 */
toggles.fcrDDownToggle.onchange = () => {
  if (toggles.fcrDDownToggle.checked) {
    activateFcrDDown(true);
  } else {
    activateFcrDDown(false);
  }
};

function activateFcrDDown(state) {
  fcrDDownActive = state;
  if (fcrDDownActive) {
    logToConsole("FCR-D Down activated");
    // Force FCR-N off if active
    if (fcrNToggled) {
      toggleFcrN(false);
      fcrNWasForcedOff = true;
      logToConsole("FCR-N forced off due to FCR-D Down activation");
    }
  } else {
    logToConsole("FCR-D Down deactivated");
    // Re-enable FCR-N if it was forced off and conditions are met
    if (fcrNWasForcedOff && soc >= FCRN_SoC_MIN && soc <= FCRN_SoC_MAX && frequency >= FCRN_FREQUENCY_RANGE.min && frequency <= FCRN_FREQUENCY_RANGE.max) {
      toggleFcrN(true);
      fcrNWasForcedOff = false;
      logToConsole("FCR-N reactivated after FCR-D Down deactivation");
    }
  }
}

/**
 * Handle FFR toggle.
 */
toggles.ffrToggle.onchange = () => {
  if (toggles.ffrToggle.checked) {
    ffrActive = true;
    logToConsole("FFR activated");
  } else {
    ffrActive = false;
    logToConsole("FFR deactivated");
  }
}

/**
 * Handle Start Game button.
 */
buttons.startGame.onclick = () => {
  if (!gameActive) {
    gameActive = true;
    timeRemaining = GAME_DURATION_SECONDS;
    timeOfDayMinutes = 0;
    soc = BATTERY_INITIAL_SOC;
    cycleCount = 0;
    revenue = 0;
    fcrNToggled = false;
    fcrDUpActive = false;
    fcrDDownActive = false;
    ffrActive = false;
    currentWind = WIND_BASELINE_MIDPOINT;
    currentSunCondition = "Dark";
    lastHourChecked = -1;
    currentDemand = DEMAND_BASE_GW;
    currentGeneration = BASELINE_GENERATION_GW;
    frequency = FREQUENCY_BASE;

    // Reset UI
    updateUI();
    elements.lossMessage.textContent = "";

    // Start the main loop
    startMainLoop();
    logToConsole("Game started");
  }
};

/**
 * Handle Restart Game button.
 */
buttons.restartGame.onclick = () => {
  gameActive = false;
  clearInterval(mainLoop);

  // Reset all states to initial values
  timeRemaining = GAME_DURATION_SECONDS;
  timeOfDayMinutes = 0;
  soc = BATTERY_INITIAL_SOC;
  cycleCount = 0;
  revenue = 0;
  fcrNToggled = false;
  fcrDUpActive = false;
  fcrDDownActive = false;
  ffrActive = false;
  currentWind = WIND_BASELINE_MIDPOINT;
  currentSunCondition = "Dark";
  lastHourChecked = -1;
  currentDemand = DEMAND_BASE_GW;
  currentGeneration = BASELINE_GENERATION_GW;
  frequency = FREQUENCY_BASE;

  // Reset UI
  updateUI();
  elements.lossMessage.textContent = "";

  logToConsole("Game restarted & state reset");
};

/**
 * Handle Battery Charge button.
 */
buttons.charge.onclick = () => {
  if (soc >= BATTERY_MAX_SOC) {
    logToConsole("Battery is already fully charged.");
    return;
  }

  // Calculate cost
  const cost = BATTERY_COST_PER_MWH * 0.05; // 50 kW for 1 second => 0.05 MWh

  // Update SoC and revenue
  soc = Math.min(BATTERY_MAX_SOC, soc + BATTERY_SOC_CHANGE_PER_CHARGE_MWH);
  revenue -= cost;
  cycleCount += 1;

  // Impact frequency
  frequency += 0.1; // Small upward frequency impact

  // Update UI
  updateUI();
  logToConsole(`Battery charged: Cost €${cost.toFixed(4)}, SoC=${soc.toFixed(1)}%`);
};

/**
 * Handle Battery Discharge button.
 */
buttons.discharge.onclick = () => {
  if (soc <= BATTERY_MIN_SOC) {
    logToConsole("Battery is already fully discharged.");
    return;
  }

  // Calculate income
  const income = BATTERY_INCOME_PER_MWH * 0.05; // 50 kW for 1 second => 0.05 MWh

  // Update SoC and revenue
  soc = Math.max(BATTERY_MIN_SOC, soc - BATTERY_SOC_CHANGE_PER_DISCHARGE_MWH);
  revenue += income;
  cycleCount += 1;

  // Impact frequency
  frequency -= 0.1; // Small downward frequency impact

  // Update UI
  updateUI();
  logToConsole(`Battery discharged: Earned €${income.toFixed(4)}, SoC=${soc.toFixed(1)}%`);
};

/*****************************************************
 * INITIALIZE UI
 *****************************************************/
updateUI();
