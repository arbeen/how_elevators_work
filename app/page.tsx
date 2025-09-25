"use client";

import React, { useEffect, useRef, useState } from "react";

/*
Next.js single-file client component simulating 3 elevators in a 10-floor building.
Drop this file into `app/page.tsx` (or any page) of a Next.js + Tailwind project.

Features:
- 3 elevator shafts, 10 floors (1 = bottom, 10 = top)
- Floor call buttons (Up/Down) and in-elevator panels
- Reasonable assignment algorithm (estimated time / nearest)
- Smooth vertical animation based on distance (CSS transition)
- Door open/close animation
- Queues per elevator & sequential serving

Notes:
- This uses Tailwind CSS classes for base layout. If Tailwind isn't available, paste the styles
  into a global stylesheet or convert the classes to your preferred CSS.
- Tweak SPEED_FLOOR_SECONDS and DOOR_OPEN_SECONDS at top to change the feel.
*/


import { Elevator, ElevatorState, FLOORS, ELEVATORS, SPEED_FLOOR_SECONDS, DOOR_OPEN_SECONDS, COLORS } from "./components/types";
import { clamp, floorToTranslatePercent } from "./components/utils";
import { ElevatorShaft } from "./components/ElevatorShaft";
import { FloorButtons } from "./components/FloorButtons";
import { ControllerPanel } from "./components/ControllerPanel";

export default function ElevatorSimulator() {
  const [elevators, setElevators] = useState<Elevator[]>(() =>
    Array.from({ length: ELEVATORS }, (_, i) => ({
      id: i,
      position: 1,
      queue: [],
      state: "idle" as ElevatorState,
      doorsOpen: false,
      animDuration: 0,
      color: COLORS[i % COLORS.length],
    }))
  );

  const [externalCalls, setExternalCalls] = useState<Record<string, boolean>>(() => {
    // key: `${floor}:${dir}` where dir is "up" or "down"
    const obj: Record<string, boolean> = {};
    for (let f = 1; f <= FLOORS; f++) {
      if (f < FLOORS) obj[`${f}:up`] = false;
      if (f > 1) obj[`${f}:down`] = false;
    }
    return obj;
  });

  // refs for timers per elevator so we can clear them on reassignments
  const timersRef = useRef<Record<string, number | null>>({});

  // Utility to set state safely
  function updateElevator(id: number, patch: Partial<Elevator>) {
    setElevators((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function estimateTimeToServe(e: Elevator, targetFloor: number) {
    // estimate time in seconds for elevator to reach target given its current queue
    let time = 0;
    let current = e.position;
    const q = [...e.queue];
    // if currently doors open, add that cost
    if (e.doorsOpen) time += DOOR_OPEN_SECONDS;

    // simulate visiting queue
    for (const dest of q) {
      time += Math.abs(dest - current) * SPEED_FLOOR_SECONDS + DOOR_OPEN_SECONDS;
      current = dest;
    }
    // finally to target floor
    time += Math.abs(targetFloor - current) * SPEED_FLOOR_SECONDS;
    return time;
  }

  function assignExternalCall(floor: number, dir: "up" | "down") {
    // mark external call active
    setExternalCalls((prev) => ({ ...prev, [`${floor}:${dir}`]: true }));

    // pick elevator with minimum estimated time
    setElevators((prev) => {
      let bestIndex = 0;
      let bestTime = Infinity;
      prev.forEach((e, idx) => {
        const t = estimateTimeToServe(e, floor);
        if (t < bestTime) {
          bestTime = t;
          bestIndex = idx;
        }
      });

      // enqueue floor if not already present
      const newElevators = prev.map((e) => ({ ...e }));
      const chosen = newElevators[bestIndex];
      if (!chosen.queue.includes(floor) && chosen.position !== floor) {
        chosen.queue.push(floor);
      }
      // if elevator is idle and doors closed, it will start moving via process loop
      return newElevators;
    });
  }

  function insidePanelPress(elevatorId: number, floor: number) {
    setElevators((prev) => {
      const copy = prev.map((e) => ({ ...e }));
      const el = copy.find((x) => x.id === elevatorId)!;
      if (!el.queue.includes(floor) && el.position !== floor) {
        el.queue.push(floor);
      }
      return copy;
    });
  }

  // main processing effect: for each elevator, if idle and has queue, start moving
  useEffect(() => {
    elevators.forEach((el) => {
      const timerKey = `e${el.id}`;
      // clear any stale timer
      if (timersRef.current[timerKey]) {
        // leave running - don't clear here as it's used to process
      }

      if ((el.state === "idle" || el.state === "doors") && el.queue.length > 0 && !el.doorsOpen) {
        // start moving to next target
        const next = el.queue[0];
        const distance = Math.abs(next - el.position);
        const duration = Math.max(0.25, distance * SPEED_FLOOR_SECONDS);

        // set animation target and duration
        updateElevator(el.id, { animDuration: duration, state: "moving" });

        // trigger CSS transform by setting position to next; animation occurs due to transition style
        setElevators((prev) => prev.map((e) => (e.id === el.id ? { ...e, position: next } : e)));

        // schedule arrival
        const id = window.setTimeout(() => {
          // arrived
          // remove first queue entry
          setElevators((prev) => {
            const copy = prev.map((x) => ({ ...x }));
            const our = copy.find((x) => x.id === el.id)!;
            our.queue = our.queue.slice(1);
            our.state = "doors";
            our.doorsOpen = true;
            our.animDuration = 0; // no movement while doors open
            return copy;
          });

          // clear the external call for this floor (any direction)
          setExternalCalls((prev) => {
            const copy = { ...prev };
            copy[`${next}:up`] = false;
            copy[`${next}:down`] = false;
            return copy;
          });

          // after door open time, close doors and set to idle (or continue loop if more in queue)
          const closeId = window.setTimeout(() => {
            setElevators((prev) => prev.map((x) => (x.id === el.id ? { ...x, doorsOpen: false, state: "idle" } : x)));
            timersRef.current[`${timerKey}-close`] = null;
          }, DOOR_OPEN_SECONDS * 1000);

          timersRef.current[`${timerKey}-close`] = closeId;
        }, duration * 1000 + 60); // small epsilon

        timersRef.current[timerKey] = id;
      }
    });

    return () => {
      // on cleanup nothing special; timers are stored and reused
    };
  }, [elevators]);

  // cleanup all timers when unmounting
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => t && clearTimeout(t));
    };
  }, []);

  function renderFloorButtons(floor: number) {
    return (
      <div className="flex flex-col gap-1 items-center">
        {floor < FLOORS && (
          <button
            onClick={() => assignExternalCall(floor, "up")}
            className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs ${externalCalls[`${floor}:up`] ? "bg-yellow-300" : "bg-white"}`}
            title={`Call elevator up from ${floor}`}
          >
            ↑
          </button>
        )}
        {floor > 1 && (
          <button
            onClick={() => assignExternalCall(floor, "down")}
            className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs ${externalCalls[`${floor}:down`] ? "bg-yellow-300" : "bg-white"}`}
            title={`Call elevator down from ${floor}`}
          >
            ↓
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Elevator Simulator — 3 elevators, 10 floors</h1>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9">
            {/* Building */}
            <div className="border rounded-lg bg-white shadow p-4">
              <div className="flex gap-4">
                {/* Floor labels + call buttons */}
                <div className="w-20 flex flex-col-reverse items-center text-sm">
                  {Array.from({ length: FLOORS }, (_, idx) => idx + 1).map((f) => (
                    <div key={f} className="w-full flex items-center justify-between h-12">
                      <div className="w-8 text-xs">{f}</div>
                      {renderFloorButtons(f)}
                    </div>
                  ))}
                </div>

                {/* Shafts */}
                <div className="flex-1 grid grid-cols-3 gap-4 p-2" style={{ alignItems: "stretch" }}>
                  {Array.from({ length: ELEVATORS }, (_, i) => i).map((i) => {
                    const el = elevators.find((e) => e.id === i)!;
                    return (
                      <div key={i} className="relative border rounded-md h-[720px] bg-gradient-to-b from-slate-100 to-slate-50 overflow-hidden">
                        {/* Floor lines */}
                        <div className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: FLOORS }, (_, idx) => (
                            <div key={idx} style={{ top: `${(idx / (FLOORS - 1)) * 100}%` }} className="absolute left-0 right-0 h-[1px] bg-slate-200" />
                          ))}
                        </div>

                        {/* Elevator car */}
                        <div
                          className={`absolute left-4 right-4 flex items-center justify-center ${el.color} rounded-md shadow-lg`}
                          style={{
                            width: "auto",
                            height: "64px",
                            // translate based on logical floor
                            transform: `translateY(${floorToTranslatePercent(el.position, FLOORS)}%)`,
                            transition: `transform ${el.animDuration}s linear`,
                            bottom: 0,
                          }}
                        >
                          {/* Doors */}
                          <div className="relative w-full h-full overflow-hidden bg-transparent px-2 py-1">
                            <div
                              className="absolute top-0 bottom-0 left-0"
                              style={{
                                width: el.doorsOpen ? "0%" : "50%",
                                transition: "width 0.5s ease",
                                background: "rgba(255,255,255,0.9)",
                              }}
                            />
                            <div
                              className="absolute top-0 bottom-0 right-0"
                              style={{
                                width: el.doorsOpen ? "0%" : "50%",
                                transition: "width 0.5s ease",
                                background: "rgba(255,255,255,0.9)",
                              }}
                            />
                            <div className="relative z-10 w-full h-full flex items-center justify-center gap-2 text-xs font-medium">
                              <div>#{el.id + 1}</div>
                              <div className="text-[10px] opacity-90">{el.state === "moving" ? "Moving" : el.doorsOpen ? "Doors open" : "Idle"}</div>
                            </div>
                          </div>
                        </div>

                        {/* Elevator control panel (small) */}
                        <div className="absolute top-3 right-3 bg-white p-2 rounded shadow text-xs">
                          <div className="font-semibold">Elev {el.id + 1}</div>
                          <div className="text-[11px]">Floor: {el.position}</div>
                          <div className="flex gap-1 mt-2 flex-wrap max-w-[120px]">
                            {Array.from({ length: FLOORS }, (_, idx) => FLOORS - idx).map((f) => (
                              <button
                                key={f}
                                onClick={() => insidePanelPress(el.id, f)}
                                className={`w-6 h-6 rounded border text-[11px] ${el.queue.includes(f) ? "bg-yellow-200" : "bg-white"}`}
                                title={`Inside: ${f}`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="border rounded-lg bg-white shadow p-4 space-y-3">
              <h2 className="font-medium">Controller / Status</h2>
              <div className="text-sm space-y-2">
                <div>Speed: {SPEED_FLOOR_SECONDS}s per floor • Door open: {DOOR_OPEN_SECONDS}s</div>
                {elevators.map((el) => (
                  <div key={el.id} className="p-2 border rounded flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <div className="font-medium">Elevator {el.id + 1}</div>
                      <div className="text-xs">{el.doorsOpen ? "doors" : el.state}</div>
                    </div>
                    <div className="text-xs">Floor {el.position}</div>
                    <div className="text-xs">Queue: {el.queue.length ? el.queue.join(", ") : "—"}</div>
                  </div>
                ))}

                <div>
                  <div className="font-medium mb-1">Active floor calls</div>
                  <div className="text-xs space-y-1">
                    {Object.entries(externalCalls)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <div key={k} className="inline-block mr-2 px-2 py-1 text-[12px] bg-yellow-100 rounded">
                          {k}
                        </div>
                      ))}
                    {Object.values(externalCalls).every((v) => !v) && <div className="text-[12px]">None</div>}
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500">Click floor buttons on the left to call an elevator. Click numbers in elevator panels to request floors from inside.
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-600">
          Assignment algorithm: picks elevator with lowest estimated time-to-serve (simulates queue travel time). Elevators serve queued requests in FIFO order.
        </div>
      </div>
    </div>
  );
}
