# 🚇 Elevator Simulator 
## ⚠️ Work in Progress
This project is still under development — features and behavior may change.

A fun **elevator system simulator** built with **Next.js + Tailwind CSS**.  
Simulates 3 elevators serving 10 floors with smooth movement, door animations, and call buttons.

## Features
- 3 elevators, 10 floors
- Floor call buttons (Up/Down)
- Inside elevator panels
- Queue handling & assignment algorithm
- Smooth movement + door animations
- Live status controller

## Run Locally
```bash
git clone https://github.com/yourusername/elevator-simulator.git
cd elevator-simulator
npm install
npm run dev
```

## ⚙️ Config

Edit `components/types.ts`:

- `ELEVATORS` → number of elevators  
- `FLOORS` → number of floors  
- `SPEED_FLOOR_SECONDS` → speed per floor  
- `DOOR_OPEN_SECONDS` → door duration  