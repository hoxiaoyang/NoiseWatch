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
      <div className="flex-1 flex justify-center items-center py-12">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrator Login</CardTitle>
              <p className="text-sm text-gray-600 mt-2">Access restricted to authorised personnel.</p>
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
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === "training" ? "primary" : "secondary"}
            onClick={() => setView("training")}
            size="lg"
          >
            Training
          </Button>
          <Button
            type="button"
            variant={view === "maintenance" ? "primary" : "secondary"}
            onClick={() => setView("maintenance")}
            size="lg"
          >
            Maintenance
          </Button>
        </div>

      {view === "training" && (
        <Card>
          <CardHeader>
            <CardTitle>Training — Add Labeled Segment</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Choose a sensor, label the interval and start the training pipeline.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={startTraining} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Training sensor</label>
                {loadingSensors ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm">Loading sensors…</p>
                  </div>
                ) : (
                  <select
                    className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                <select
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <Input
                    className="mt-3"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  label="Start timestamp"
                  value={startTs}
                  onChange={(e) => {
                    setStartTs(e.target.value);
                    if (msg) setMsg(null);
                  }}
                  error={timeError ? "End timestamp must be after start timestamp." : undefined}
                />

                <Input
                  type="datetime-local"
                  label="Stop timestamp"
                  value={stopTs}
                  onChange={(e) => {
                    setStopTs(e.target.value);
                    if (msg) setMsg(null);
                  }}
                  error={timeError ? "End timestamp must be after start timestamp." : undefined}
                />
              </div>

              {msg && (
                <div className={`p-4 rounded-lg border ${
                  msg.type === "error" 
                    ? "bg-red-50 border-red-200 text-red-800" 
                    : "bg-green-50 border-green-200 text-green-800"
                }`}>
                  <div className="flex gap-2">
                    {msg.type === "error" ? (
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="primary" size="lg" disabled={!canStart} className="flex-1">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Starting…
                    </span>
                  ) : (
                    "Start training"
                  )}
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
        <Card>
          <CardHeader>
            <CardTitle>Maintenance — Ping Sensors</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Check the connectivity status of all sensors in the system.
            </p>
          </CardHeader>

          <CardContent>
            <div className="flex justify-end mb-6 gap-3">
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
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Loading sensors…</p>
                </div>
              </div>
            ) : sensors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-600">No sensors found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sensors.map((s: any) => {
                  const id = typeof s === "string" ? s : s.id;
                  const displayLabel = typeof s === "string" ? s : s.name ?? s.id;
                  const status = pingStatuses[id] ?? "idle";
                  
                  const getStatusBadge = () => {
                    switch (status) {
                      case "idle":
                        return <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">Idle</span>;
                      case "pinging":
                        return (
                          <span className="px-3 py-1 rounded-full text-xs font-medium text-yellow-700 bg-yellow-100 flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                            Pinging…
                          </span>
                        );
                      case "online":
                        return <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">Online</span>;
                      case "offline":
                        return <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">Offline</span>;
                      case "error":
                        return <span className="px-3 py-1 rounded-full text-xs font-medium text-red-800 bg-red-200">Error</span>;
                      default:
                        return null;
                    }
                  };

                  return (
                    <div
                      key={id}
                      className="border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            <span className="font-semibold text-gray-900">{displayLabel}</span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono">ID: {id}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge()}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};