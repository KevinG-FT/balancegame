# Balance To Zero Readme

Welcome to the **Balance to Zero**, a simulation of grid operations where you manage:
- A battery energy storage system (BESS)
- Renewable generation (wind & solar)
- Gas-fired generation
- Frequency regulation services (FCR-N, FCR-D, and FFR)
- Market prices and demand

This is a contrived scenario - a fully isolated grid with a Nordic balancing market, no day ahead or intraday markets, no bidding or price setting, etc. Market program behavior is simplified for gameplay. You can however get an idea of the role of various elements, markets and your battery in keep the grid stable. 

## How It Works

1. **Day/Night Cycle**  
   The game compresses a 24-hour day into a shorter play session, offering multiple "scenes" (morning, midday, evening) to experience varying demand, temperature, and weather.

2. **Frequency Response**  
   - **FCR-N** for continuous regulation  
   - **FCR-D Up/Down** for significant frequency deviations  
   - **FFR** for rapid short-term events  

3. **Battery & Revenue**  
   - Keep an eye on Battery State of Charge (SoC), frequency, and your total revenue.  
   - Survive until time runs out without letting SoC or frequency go out of limits.

4. **Winning & Losing**  
   - If frequency or SoC drifts out of bounds—or you exceed your battery cycle limit—you lose.  
   - If you finish with enough revenue, you win!

## Getting Started

1. Click **Start** to begin.  
2. Use **Charge/Discharge** to manage SoC.  
3. Toggle FCR services for additional revenue (and SoC usage).  
4. Watch out for frequency events!

## Contributing

Feel free to open an issue or submit a pull request if you have improvements or bug fixes.

---

© 2025, Sympower. All rights reserved.
