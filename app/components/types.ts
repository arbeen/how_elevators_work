export type ElevatorState = "idle" | "moving" | "doors";

export type Elevator = {
  id: number;
  position: number;
  queue: number[];
  state: ElevatorState;
  doorsOpen: boolean;
  animDuration: number;
  color: string;
};

export const FLOORS = 10;
export const ELEVATORS = 3;
export const SPEED_FLOOR_SECONDS = 0.9;
export const DOOR_OPEN_SECONDS = 2.0;
export const COLORS = ["bg-sky-500", "bg-rose-500", "bg-emerald-500"];
