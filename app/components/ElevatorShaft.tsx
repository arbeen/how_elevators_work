import React from "react";
import { Elevator, FLOORS } from "./types";
import { floorToTranslatePercent } from "./utils";

type ElevatorShaftProps = {
  elevator: Elevator;
  insidePanelPress: (elevatorId: number, floor: number) => void;
};

export function ElevatorShaft({ elevator: el, insidePanelPress }: ElevatorShaftProps) {
  return (
    <div className="relative border rounded-md h-[720px] bg-gradient-to-b from-slate-100 to-slate-50 overflow-hidden">
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
}
