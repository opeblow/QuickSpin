import { describe, expect, it, vi } from "vitest";
import { SessionStateMachine } from "./state-machine";
import type { SessionStatus } from "./types";

function make(onEvent?: ReturnType<typeof vi.fn>) {
  const emit = onEvent ?? vi.fn();
  return { machine: new SessionStateMachine(emit), emit };
}

describe("SessionStateMachine", () => {
  it("walks a happy path explicitly (no progress inference)", () => {
    const { machine } = make();
    expect(machine.status).toBe("idle");
    expect(machine.transition("waiting")).toBe(true);
    expect(machine.transition("playing")).toBe(true);
    expect(machine.transition("response-ready")).toBe(true);
    expect(machine.transition("completed")).toBe(true);
    expect(machine.status).toBe("completed");
  });

  it("is idempotent for same-state transitions", () => {
    const { machine, emit } = make();
    expect(machine.transition("waiting")).toBe(true);
    emit.mockClear();
    expect(machine.transition("waiting")).toBe(true);
    expect(machine.status).toBe("waiting");
    expect(emit).not.toHaveBeenCalled();
  });

  it("rejects disallowed transitions and stays put", () => {
    const { machine } = make();
    expect(machine.transition("completed")).toBe(false);
    expect(machine.status).toBe("idle");
    expect(machine.transition("playing")).toBe(false);
    expect(machine.status).toBe("idle");
  });

  it("allows response-ready -> playing (replay) but never idle -> idle on request", () => {
    const { machine } = make();
    machine.transition("waiting");
    machine.transition("response-ready");
    expect(machine.transition("playing")).toBe(true);
    expect(machine.transition("idle")).toBe(false);
  });

  it("is terminal once completed", () => {
    const { machine } = make();
    machine.transition("waiting");
    machine.transition("completed");
    expect(machine.isTerminal).toBe(true);
    expect(machine.transition("playing")).toBe(false);
    expect(machine.transition("cancelled")).toBe(false);
    expect(machine.transition("idle")).toBe(true);
  });

  it("treats undefined/NaN progress as indeterminate (null)", () => {
    const { machine, emit } = make();
    machine.transition("waiting");
    machine.setProgress(0.5);
    expect(machine.progress).toBe(0.5);
    machine.setProgress(undefined);
    expect(machine.progress).toBeNull();
    machine.setProgress(Number.NaN);
    expect(machine.progress).toBeNull();
    emit.mockClear();
    machine.setProgress(2);
    expect(machine.progress).toBe(1);
    machine.setProgress(-1);
    expect(machine.progress).toBe(0);
  });

  it("emits phase {from,to} and progress events", () => {
    const emit = vi.fn();
    const { machine } = make(emit);
    machine.transition("waiting");
    expect(emit).toHaveBeenCalledWith({
      type: "phase",
      data: { from: "idle" as SessionStatus, to: "waiting" },
    });
    machine.setProgress(0.25);
    expect(emit).toHaveBeenCalledWith({ type: "progress", data: 0.25 });
  });
});
