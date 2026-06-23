import { useState, useRef } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { useMission } from "@/lib/mission/store";
import { Modal } from "./Modal";

/**
 * Settings panel with data export, import, and reset functionality.
 */
export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [tab, setTab] = useState<"export" | "import" | "danger">("export");
    const fileRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

    const handleExport = () => {
        const state = useMission.getState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mission-2029-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportStatus("idle");

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                // Validate minimal structure
                if (!parsed || typeof parsed !== "object" || !("missionTarget" in parsed)) {
                    throw new Error("Invalid backup file format");
                }
                // Replace entire store state
                useMission.setState(parsed);
                setImportStatus("success");
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } catch {
                setImportStatus("error");
            }
        };
        reader.readAsText(file);
        // Reset input so the same file can be re-imported
        e.target.value = "";
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
            // Clear localStorage and reload
            localStorage.removeItem("mission-2029");
            window.location.reload();
        }
    };

    const tabs = [
        { id: "export" as const, label: "Export" },
        { id: "import" as const, label: "Import" },
        { id: "danger" as const, label: "Danger Zone" },
    ];

    return (
        <Modal open={open} onClose={onClose} title="Settings" size="sm">
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`text-[10px] uppercase tracking-[0.3em] px-4 py-2 rounded-full transition ${tab === t.id
                                ? "bg-white text-black font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "export" && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Download all your mission data as a JSON file. Use this to create backups or migrate data
                        between devices.
                    </p>
                    <button
                        onClick={handleExport}
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-4 transition text-sm text-foreground"
                    >
                        <Download className="h-4 w-4" />
                        Download Backup
                    </button>
                </div>
            )}

            {tab === "import" && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Restore data from a previous backup file. This will replace all current data.
                    </p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-4 transition text-sm text-foreground"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Backup File
                    </button>
                    {importStatus === "success" && (
                        <div className="text-sm text-success text-center">Data restored successfully! Reloading...</div>
                    )}
                    {importStatus === "error" && (
                        <div className="text-sm text-danger text-center">Invalid backup file. Please check the file format.</div>
                    )}
                </div>
            )}

            {tab === "danger" && (
                <div className="space-y-4">
                    <p className="text-sm text-danger">
                        This action permanently deletes all your mission data. Make sure to export a backup first.
                    </p>
                    <button
                        onClick={handleClearAll}
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/30 px-5 py-4 transition text-sm text-danger"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete All Data
                    </button>
                </div>
            )}
        </Modal>
    );
}