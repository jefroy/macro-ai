"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { logout } from "@/lib/api/auth";
import { exportAllData } from "@/lib/api/reports";
import {
  createReminder,
  deleteReminder,
  listReminders,
  toggleReminder,
  type Reminder,
} from "@/lib/api/reminders";
import { getAIConfig, updateAIConfig, type AIConfig } from "@/lib/api/settings";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Download, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PROVIDERS = [
  { value: "claude", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI" },
  { value: "local", label: "Local (Ollama / vLLM)" },
  { value: "custom", label: "Custom (OpenAI-compatible)" },
];

const DEFAULT_MODELS: Record<string, string> = {
  claude: "claude-sonnet-4-5-20250929",
  openai: "gpt-4o",
  local: "llama3.1",
  custom: "",
};

const REMINDER_TYPES = [
  { value: "meal", label: "Meal" },
  { value: "supplement", label: "Supplement" },
  { value: "hydration", label: "Hydration" },
  { value: "custom", label: "Custom" },
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  // Reminder form state
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderType, setReminderType] = useState("meal");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");

  const { data: aiConfig } = useQuery({
    queryKey: ["ai-config"],
    queryFn: getAIConfig,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: listReminders,
  });

  useEffect(() => {
    if (aiConfig) {
      setProvider(aiConfig.provider);
      setModel(aiConfig.model);
      setBaseUrl(aiConfig.base_url);
    }
  }, [aiConfig]);

  const saveMutation = useMutation({
    mutationFn: updateAIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-config"] });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setApiKey("");
      toast.success("AI settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const createReminderMutation = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setShowReminderForm(false);
      setReminderTitle("");
      setReminderTime("08:00");
      toast.success("Reminder created");
    },
    onError: () => toast.error("Failed to create reminder"),
  });

  const toggleReminderMutation = useMutation({
    mutationFn: toggleReminder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const deleteReminderMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder deleted");
    },
  });

  function handleSaveAI(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      provider,
      model,
      api_key: apiKey || undefined,
      base_url: baseUrl || undefined,
    });
  }

  function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    createReminderMutation.mutate({
      type: reminderType,
      title: reminderTitle.trim(),
      time: reminderTime,
    });
  }

  function handleLogout() {
    logout();
    setAuthenticated(false);
    router.push("/login");
  }

  const needsApiKey = provider === "claude" || provider === "openai";
  const needsBaseUrl = provider === "local" || provider === "custom";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>
            Configure your LLM provider for AI chat. Bring your own API key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAI} className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => {
                  setProvider(v);
                  setModel(DEFAULT_MODELS[v] || "");
                  setBaseUrl(v === "local" ? "http://localhost:11434/v1" : "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. claude-sonnet-4-5-20250929"
              />
            </div>

            {needsApiKey && (
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    aiConfig?.has_api_key
                      ? "••••••••  (leave blank to keep current)"
                      : "sk-..."
                  }
                />
                {aiConfig?.has_api_key && (
                  <p className="text-xs text-muted-foreground">
                    API key is saved and encrypted. Leave blank to keep the current key.
                  </p>
                )}
              </div>
            )}

            {needsBaseUrl && (
              <div className="space-y-2">
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={!provider || !model || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminders
          </CardTitle>
          <CardDescription>
            Set reminders for meals, supplements, hydration, and custom tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reminders.length > 0 && (
            <div className="space-y-2">
              {reminders.map((r: Reminder) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={() => toggleReminderMutation.mutate(r.id)}
                    />
                    <div>
                      <p className={`text-sm font-medium ${!r.enabled ? "text-muted-foreground" : ""}`}>
                        {r.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.time} · {r.days.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {r.type}
                    </Badge>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      }
                      title="Delete reminder?"
                      description={`Remove "${r.title}" reminder?`}
                      onConfirm={() => deleteReminderMutation.mutate(r.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {reminders.length === 0 && !showReminderForm && (
            <p className="text-sm text-muted-foreground">
              No reminders set. Add one to stay on track.
            </p>
          )}

          {showReminderForm ? (
            <form onSubmit={handleCreateReminder} className="space-y-3 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={reminderType} onValueChange={setReminderType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="e.g. Take Vitamin D, Log lunch..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowReminderForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReminderMutation.isPending}>
                  {createReminderMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowReminderForm(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Reminder
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Download all your data as a JSON file including profile, food logs, weight, recipes, and reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => exportAllData()}>
            <Download className="mr-2 h-4 w-4" />
            Export All Data (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
