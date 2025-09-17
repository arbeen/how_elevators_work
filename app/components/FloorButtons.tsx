import React from "react";
import { FLOORS } from "./types";

type FloorButtonsProps = {
  floor: number;
  externalCalls: Record<string, boolean>;
  assignExternalCall: (floor: number, dir: "up" | "down") => void;
};

export function FloorButtons({ floor, externalCalls, assignExternalCall }: FloorButtonsProps) {
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
