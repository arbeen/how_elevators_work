import React from "react";
import { Elevator, SPEED_FLOOR_SECONDS, DOOR_OPEN_SECONDS } from "./types";

type ControllerPanelProps = {
  elevators: Elevator[];
  externalCalls: Record<string, boolean>;
};

export function ControllerPanel({ elevators, externalCalls }: ControllerPanelProps) {
  return (
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
  );
}
