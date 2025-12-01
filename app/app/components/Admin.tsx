'use client';

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type Sensor = string | { id: string; name?: string };
type PingStatus = "idle" | "pinging" | "online" | "offline" | "error";

export const Admin: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Training state
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loadingSensors, setLoadingSensors] = useState(false);
  const [sensorId, setSensorId] = useState("");
  const [labelOption, setLabelOption] = useState<string>("shouting");
  const [customLabel, setCustomLabel] = useState<string>("");
  const [label, setLabel] = useState<string>("shouting");
  const [startTs, setStartTs] = useState("");
  const [stopTs, setStopTs] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Maintenance state
  const [view, setView] = useState<"training" | "maintenance">("training");
  const [pingStatuses, setPingStatuses] = useState<Record<string, PingStatus>>({});

  const handleChange = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (error) setError("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminEmail = "admin@gmail.com";
    const adminPassword = "admin123";

    if (form.email === adminEmail && form.password === adminPassword) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid email or password.");
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    setLoadingSensors(true);
    (async () => {
      try {
        const res = await fetch("/api/admin/sensors");
        if (!res.ok) throw new Error("Failed to load sensors");
        const data: Sensor[] = await res.json();
        setSensors(data);
        if (data.length) {
          const first = data[0];
          setSensorId(typeof first === "string" ? first : first.id);
        }
        // initialize ping statuses
        const initial: Record<string, PingStatus> = {};
        (data || []).forEach((s: any) => {
          const id = typeof s === "string" ? s : s.id;
          initial[id] = "idle";
        });
        setPingStatuses(initial);
      } catch (err) {
        console.error(err);
        setMsg({ type: "error", text: "Could not load sensors." });
      } finally {
        setLoadingSensors(false);
      }
    })();
  }, [authenticated]);

  // validate timestamps: require stop > start
  const timeValid =
    startTs && stopTs ? new Date(stopTs).getTime() > new Date(startTs).getTime() : false;
  const timeError = startTs && stopTs && !timeValid;

  const canStart = !!sensorId && !!label && !!startTs && !!stopTs && timeValid && !busy;

  const startTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) {
      if (timeError) {
        setMsg({ type: "error", text: "End timestamp must be after start timestamp." });
      }
      return;
    }
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "train",
          sensorId,
          label,
          startTimestamp: startTs,
          stopTimestamp: stopTs,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Training request failed");
      setMsg({ type: "success", text: "Training job queued." });
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  const reRecord = () => {
    setLabel("");
    setStartTs("");
    setStopTs("");
    setMsg({ type: "success", text: "Ready to re-record — fields cleared." });
  };

  // Maintenance: ping single sensor
  async function pingSensor(id: string) {
    setPingStatuses((s) => ({ ...s, [id]: "pinging" }));
    try {
      const res = await fetch("/api/admin/sensors/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId: id }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Ping failed", id, res.status, txt);
        setPingStatuses((s) => ({ ...s, [id]: "offline" }));
        return;
      }
      const body = await res.json();
      setPingStatuses((s) => ({ ...s, [id]: body?.ok ? "online" : "offline" }));
    } catch (err) {
      console.error("Ping error", id, err);
      setPingStatuses((s) => ({ ...s, [id]: "error" }));
    }
  }

  async function pingAll() {
    for (const s of sensors) {
      const id = typeof s === "string" ? s : s.id;
      // eslint-disable-next-line no-await-in-loop
      await pingSensor(id);
    }
  }

  if (!authenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Administrator Login</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Access restricted to authorised personnel.</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={error ? "" : undefined}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={error}
              />

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <Button type="submit" variant="primary" size="lg" fullWidth>
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="w-full max-w-2xl mb-4 flex gap-2">
        <Button
          type="button"
          variant={view === "training" ? "primary" : "secondary"}
          onClick={() => setView("training")}
        >
          Training
        </Button>
        <Button
          type="button"
          variant={view === "maintenance" ? "primary" : "secondary"}
          onClick={() => setView("maintenance")}
        >
          Maintenance
        </Button>
      </div>

      {view === "training" && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Training — add labeled segment</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Choose a sensor, label the interval and start the training pipeline.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={startTraining} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training sensor</label>
                {loadingSensors ? (
                  <p>Loading sensors…</p>
                ) : (
                  <select
                    className="w-full border rounded p-2"
                    value={sensorId}
                    onChange={(e) => {
                      setSensorId(e.target.value);
                      if (msg) setMsg(null);
                    }}
                  >
                    {sensors.map((s: any) => {
                      const id = typeof s === "string" ? s : s.id;
                      const displayLabel = typeof s === "string" ? s : s.name ?? s.id;
                      return (
                        <option key={id} value={id}>
                          {displayLabel}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <select
                  className="w-full border rounded p-2"
                  value={labelOption}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLabelOption(v);
                    if (v === "other") {
                      setLabel("");
                      setCustomLabel("");
                    } else {
                      setLabel(v);
                      setCustomLabel("");
                    }
                    if (msg) setMsg(null);
                  }}
                >
                  <option value="shouting">shouting</option>
                  <option value="drilling">drilling</option>
                  <option value="other">Other…</option>
                </select>

                {labelOption === "other" && (
                  <input
                    type="text"
                    className="mt-2 w-full border rounded p-2"
                    placeholder="Enter custom label"
                    value={customLabel}
                    onChange={(e) => {
                      setCustomLabel(e.target.value);
                      setLabel(e.target.value);
                      if (msg) setMsg(null);
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start timestamp</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded p-2"
                    value={startTs}
                    onChange={(e) => {
                      setStartTs(e.target.value);
                      if (msg) setMsg(null);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stop timestamp</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded p-2"
                    value={stopTs}
                    onChange={(e) => {
                      setStopTs(e.target.value);
                      if (msg) setMsg(null);
                    }}
                  />
                </div>
              </div>

              {timeError && <p className="text-red-600 text-sm">End timestamp must be after start timestamp.</p>}

              {msg && (
                <p className={msg.type === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>
                  {msg.text}
                </p>
              )}

              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="lg" disabled={!canStart}>
                  {busy ? "Starting…" : "Start training"}
                </Button>

                <Button type="button" variant="secondary" size="lg" onClick={reRecord}>
                  Re-record
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {view === "maintenance" && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Maintenance — ping sensors</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex justify-end mb-4 gap-2">
              <Button type="button" variant="primary" onClick={pingAll} disabled={loadingSensors}>
                Ping All
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const reset: Record<string, PingStatus> = {};
                  sensors.forEach((s: any) => {
                    const id = typeof s === "string" ? s : s.id;
                    reset[id] = "idle";
                  });
                  setPingStatuses(reset);
                }}
              >
                Reset
              </Button>
            </div>

            {loadingSensors ? (
              <p>Loading sensors…</p>
            ) : sensors.length === 0 ? (
              <p className="text-sm text-gray-600">No sensors found.</p>
            ) : (
              <ul className="space-y-2">
                {sensors.map((s: any) => {
                  const id = typeof s === "string" ? s : s.id;
                  const displayLabel = typeof s === "string" ? s : s.name ?? s.id;
                  const status = pingStatuses[id] ?? "idle";
                  return (
                    <li key={id} className="flex items-center justify-between border rounded p-3">
                      <div>
                        <div className="font-medium">{displayLabel}</div>
                        <div className="text-xs text-gray-500">id: {id}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          {status === "idle" && <span className="text-gray-600">idle</span>}
                          {status === "pinging" && <span className="text-yellow-600">pinging…</span>}
                          {status === "online" && <span className="text-green-600">online</span>}
                          {status === "offline" && <span className="text-red-600">offline</span>}
                          {status === "error" && <span className="text-red-700">error</span>}
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => pingSensor(id)}
                          disabled={status === "pinging"}
                        >
                          Ping
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};