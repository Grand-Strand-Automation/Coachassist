"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button, Card } from "@/components/ui";

type SourceType = "photo" | "screenshot" | "spreadsheet";
type DraftGame = {
  opponent: string;
  game_date: string;
  game_time: string;
  location_name: string;
  home_or_away: string;
  uniform: string;
  additional_notes: string;
};

const EMPTY_ROW: DraftGame = { opponent: "", game_date: "", game_time: "", location_name: "", home_or_away: "", uniform: "", additional_notes: "" };
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const headerMap: Record<keyof DraftGame, string[]> = {
  opponent: ["opponent", "vs", "versus", "team", "matchup", "rival"],
  game_date: ["date", "game date", "day"],
  game_time: ["time", "start", "game time"],
  location_name: ["location", "field", "venue", "site", "park", "gym"],
  home_or_away: ["homeaway", "home/away", "home away", "ha"],
  uniform: ["uniform", "jersey", "kit"],
  additional_notes: ["notes", "note", "details", "comments"],
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseSheetRows(rows: Record<string, string>[]) {
  return rows
    .map((row) => {
      const normalizedEntries = Object.entries(row).map(([k, v]) => [normalizeHeader(k), String(v ?? "").trim()] as const);
      const byKey = new Map(normalizedEntries);
      const out = { ...EMPTY_ROW };
      for (const key of Object.keys(headerMap) as Array<keyof DraftGame>) {
        const hit = headerMap[key].find((alias) => byKey.has(normalizeHeader(alias)));
        if (hit) out[key] = byKey.get(normalizeHeader(hit)) || "";
      }
      if (!out.opponent && !out.game_date && !out.game_time && !out.location_name && !out.additional_notes) return null;
      return out;
    })
    .filter(Boolean) as DraftGame[];
}

export function ScheduleImport({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SourceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DraftGame[]>([]);
  const [saving, setSaving] = useState(false);
  const foundText = useMemo(() => (rows.length ? `Found ${rows.length} games. Review and edit before saving.` : ""), [rows.length]);

  async function extractFromImage(file: File, sourceType: "photo" | "screenshot") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sourceType", sourceType);
    const res = await fetch(`/api/teams/${teamId}/schedule-import/extract`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not read this image. Please try again.");
    return (data.games || []) as DraftGame[];
  }

  async function parseSpreadsheet(file: File) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length) throw new Error("We could not read this CSV. Please check the file format.");
      return parseSheetRows(parsed.data);
    }
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: "" });
    return parseSheetRows(data);
  }

  async function onUpload(file: File) {
    try {
      setError(null);
      setLoading(true);
      if (file.size > MAX_FILE_SIZE) throw new Error("File is too large. Please upload a file under 8MB.");
      if (!mode) throw new Error("Choose an import type first.");
      const parsed = mode === "spreadsheet" ? await parseSpreadsheet(file) : await extractFromImage(file, mode);
      setRows(parsed.length ? parsed : [{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
    } catch (err) {
      setRows([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
      setError(err instanceof Error ? err.message : "Could not import schedule.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!rows.length) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/schedule-import/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType: mode || "spreadsheet", games: rows }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save these games.");
      setSaving(false);
      return;
    }
    window.location.href = `/app/team/${teamId}/game?status=saved&message=${encodeURIComponent("Schedule imported. Games saved.")}`;
  }

  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Import Schedule</h2>
          <p className="text-sm text-slate-600">Upload a photo, screenshot, CSV, or Excel file and review every game before saving.</p>
        </div>
        <Button type="button" onClick={() => setOpen((v) => !v)}>{open ? "Close Import" : "Import Schedule"}</Button>
      </div>
      {open ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(["photo", "screenshot", "spreadsheet"] as SourceType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  mode === option ? "border-[#0C2D5A] bg-[#0C2D5A] text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {option === "photo" ? "Upload Photo" : option === "screenshot" ? "Upload Screenshot" : "Upload Spreadsheet"}
              </button>
            ))}
          </div>
          {mode ? (
            <label className="block rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-700">
              <span className="mb-2 block font-semibold">Choose file ({mode === "spreadsheet" ? "CSV or XLSX" : "JPG, PNG, or WEBP"})</span>
              <input
                type="file"
                accept={mode === "spreadsheet" ? ".csv,.xlsx,.xls" : "image/png,image/jpeg,image/webp"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(file);
                }}
                className="w-full text-sm"
              />
            </label>
          ) : null}
          {loading ? <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Reading your schedule. This usually takes a few seconds...</p> : null}
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {foundText ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{foundText}</p> : null}
          {rows.length ? (
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={`row-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    {(
                      [
                        ["opponent", "Opponent"],
                        ["game_date", "Date"],
                        ["game_time", "Time"],
                        ["location_name", "Location"],
                        ["home_or_away", "Home/Away"],
                        ["uniform", "Uniform"],
                        ["additional_notes", "Notes"],
                      ] as Array<[keyof DraftGame, string]>
                    ).map(([key, label]) => (
                      <label key={`${key}-${idx}`} className="text-xs font-semibold text-slate-600">
                        {label}
                        <input
                          value={row[key] || ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setRows((current) => current.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
                          }}
                          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((current) => current.filter((_, i) => i !== idx))}
                    className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-red-600"
                  >
                    Delete row
                  </button>
                </div>
              ))}
              <div className="sticky bottom-3 flex gap-2 rounded-xl bg-white/95 p-2 shadow-md backdrop-blur">
                <Button type="button" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save All"}</Button>
                <button type="button" onClick={() => setRows((current) => [...current, { ...EMPTY_ROW }])} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  Add Row
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
