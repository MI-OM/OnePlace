"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Shield, User, Trash2, Clock, Star } from "lucide-react";
import {
  inviteStaff,
  updateStaffRole,
  removeStaff,
  updateStaffAvailability,
  updateStaffSpecialties,
} from "@/lib/business/staff-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  userId: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

type AvailabilityEntry = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type SpecialtyEntry = {
  serviceId: string;
  serviceName: string;
};

type Props = {
  businessId: string;
  members: Member[];
  isAdmin: boolean;
  businessServices: { id: string; name: string }[];
  availabilityMap: Record<string, AvailabilityEntry[]>;
  specialtiesMap: Record<string, SpecialtyEntry[]>;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ROLE_ICONS: Record<string, typeof Shield> = {
  owner: Shield,
  manager: Star,
  staff: User,
};

export function TeamManager({
  businessId,
  members,
  isAdmin,
  businessServices,
  availabilityMap,
  specialtiesMap,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"team" | "availability">("team");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    startTransition(async () => {
      const result = await inviteStaff(businessId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${inviteEmail} has been added to the team.`);
        setInviteEmail("");
      }
    });
  };

  const handleRoleChange = (memberId: string, role: string) => {
    startTransition(async () => {
      const result = await updateStaffRole(businessId, memberId, role as "owner" | "manager" | "staff");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated.");
      }
    });
  };

  const handleRemove = (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    startTransition(async () => {
      const result = await removeStaff(businessId, memberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team member removed.");
      }
    });
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("team")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "team"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Team Members
        </button>
        <button
          type="button"
          onClick={() => setTab("availability")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "availability"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Availability
        </button>
      </div>

      <div className="mt-6">
        {tab === "team" && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium">Invite team member</h3>
                <div className="mt-3 flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "manager" | "staff")}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={pending || !inviteEmail.trim()}>
                    <UserPlus className="mr-1.5 size-4" aria-hidden />
                    Add
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  The person must have a OnePlace account first.
                </p>
              </div>
            )}

            {members.map((member) => {
              const Icon = ROLE_ICONS[member.role] ?? User;
              const fallbackName = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
              const name = member.displayName ?? fallbackName ?? "Unknown";

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email ?? "No email"} · Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(v) => v && handleRoleChange(member.id, v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 className="size-4 text-muted-foreground" aria-hidden />
                      </Button>
                    </div>
                  )}

                  {!isAdmin && (
                    <span className="flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden />
                      {member.role}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "availability" && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Select team member</Label>
              <Select
                value={selectedMemberId ?? ""}
                onValueChange={(v) => setSelectedMemberId(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => {
                    const fallbackName = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
                    const name = m.displayName ?? fallbackName ?? "Unknown";
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <AvailabilityEditor
                businessId={businessId}
                memberId={selectedMember.id}
                initialSchedule={availabilityMap[selectedMember.id] ?? []}
                specialties={specialtiesMap[selectedMember.id] ?? []}
                businessServices={businessServices}
                pending={pending}
                startTransition={startTransition}
              />
            )}

            {!selectedMember && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Select a team member to manage their availability.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AvailabilityEditor({
  businessId,
  memberId,
  initialSchedule,
  specialties,
  businessServices,
  pending,
  startTransition,
}: {
  businessId: string;
  memberId: string;
  initialSchedule: AvailabilityEntry[];
  specialties: SpecialtyEntry[];
  businessServices: { id: string; name: string }[];
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [schedule, setSchedule] = useState(() => {
    const map = new Map(initialSchedule.map((s) => [s.day_of_week, s]));
    return Array.from({ length: 7 }, (_, i) => ({
      day: i,
      isAvailable: map.get(i)?.is_available ?? (i >= 1 && i <= 5),
      startTime: map.get(i)?.start_time ?? "09:00",
      endTime: map.get(i)?.end_time ?? "17:00",
    }));
  });

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    specialties.map((s) => s.serviceId),
  );

  const handleSaveAvailability = () => {
    startTransition(async () => {
      const result = await updateStaffAvailability(businessId, {
        memberId,
        schedule: schedule.map((s) => ({
          day: s.day,
          isAvailable: s.isAvailable,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Availability saved.");
      }
    });
  };

  const handleSaveSpecialties = () => {
    startTransition(async () => {
      const result = await updateStaffSpecialties(businessId, memberId, selectedSpecialties);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Specialties saved.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4" aria-hidden />
          Weekly Schedule
        </h3>
        <div className="mt-4 space-y-2">
          {schedule.map((entry) => (
            <div key={entry.day} className="flex items-center gap-3">
              <span className="w-10 text-sm font-medium">{DAY_NAMES[entry.day]}</span>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={entry.isAvailable}
                  onChange={(e) =>
                    setSchedule((prev) =>
                      prev.map((s) =>
                        s.day === entry.day ? { ...s, isAvailable: e.target.checked } : s,
                      ),
                    )
                  }
                  className="size-4 accent-primary"
                />
                Available
              </label>
              {entry.isAvailable && (
                <>
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((s) =>
                          s.day === entry.day ? { ...s, startTime: e.target.value } : s,
                        ),
                      )
                    }
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((s) =>
                          s.day === entry.day ? { ...s, endTime: e.target.value } : s,
                        ),
                      )
                    }
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <Button onClick={handleSaveAvailability} disabled={pending} className="mt-4">
          {pending ? "Saving..." : "Save availability"}
        </Button>
      </div>

      {businessServices.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Star className="size-4" aria-hidden />
            Specialties
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Which services this team member handles.
          </p>
          <div className="mt-3 space-y-2">
            {businessServices.map((svc) => (
              <label key={svc.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedSpecialties.includes(svc.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSpecialties((prev) => [...prev, svc.id]);
                    } else {
                      setSelectedSpecialties((prev) => prev.filter((id) => id !== svc.id));
                    }
                  }}
                  className="size-4 accent-primary"
                />
                {svc.name}
              </label>
            ))}
          </div>
          <Button onClick={handleSaveSpecialties} disabled={pending} className="mt-4">
            {pending ? "Saving..." : "Save specialties"}
          </Button>
        </div>
      )}
    </div>
  );
}
