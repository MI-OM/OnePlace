import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { TeamManager } from "@/components/business/team-manager";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Team Management" };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getUser();
  if (!user) notFound();

  const { businessId } = await params;
  const service = createServiceClient();

  const { data: business } = await service
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();

  // Check caller is a member
  const { data: callerMember } = await service
    .from("business_members")
    .select("id, role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!callerMember) notFound();

  const isAdmin = callerMember.role === "owner" || callerMember.role === "manager";

  // Load all team members
  const { data: members } = await service
    .from("business_members")
    .select(
      "id, role, status, created_at, user:profiles(id, display_name, first_name, last_name, email, avatar_url, bio)",
    )
    .eq("business_id", businessId)
    .neq("status", "removed")
    .order("created_at");

  const memberList = (members ?? []).map((m) => {
    const profile = Array.isArray(m.user) ? m.user[0] : m.user;
    return {
      id: m.id,
      role: m.role,
      status: m.status,
      createdAt: m.created_at,
      userId: profile?.id ?? "",
      displayName: profile?.display_name ?? null,
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      email: (profile as { email?: string } | null)?.email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      bio: profile?.bio ?? null,
    };
  });

  // Load availability for all members
  const memberIds = memberList.map((m) => m.id);
  const { data: availabilityRows } = memberIds.length > 0
    ? await service
        .from("staff_availability")
        .select("staff_member_id, day_of_week, start_time, end_time, is_available")
        .in("staff_member_id", memberIds)
        .order("day_of_week")
    : { data: null };

  const availabilityMap = new Map<string, { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[]>();
  for (const row of availabilityRows ?? []) {
    if (!availabilityMap.has(row.staff_member_id)) {
      availabilityMap.set(row.staff_member_id, []);
    }
    availabilityMap.get(row.staff_member_id)!.push({
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      is_available: row.is_available,
    });
  }

  // Load specialties
  const { data: specialtyRows } = memberIds.length > 0
    ? await service
        .from("staff_specialties")
        .select("staff_member_id, service_id, service:services(id, name)")
        .in("staff_member_id", memberIds)
    : { data: null };

  const specialtiesMap = new Map<string, { serviceId: string; serviceName: string }[]>();
  for (const row of specialtyRows ?? []) {
    const service_ = Array.isArray(row.service) ? row.service[0] : row.service;
    if (!specialtiesMap.has(row.staff_member_id)) {
      specialtiesMap.set(row.staff_member_id, []);
    }
    specialtiesMap.get(row.staff_member_id)!.push({
      serviceId: row.service_id,
      serviceName: (service_ as { name: string } | null)?.name ?? "Unknown",
    });
  }

  // Load business services for specialty selection
  const { data: businessServices } = await service
    .from("business_services")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Button render={<Link href={`/dashboard/${businessId}`} />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to inbox
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Team Management</h1>
      <p className="mt-2 text-sm text-muted-foreground">{business.name}</p>

      <TeamManager
        businessId={businessId}
        members={memberList}
        isAdmin={isAdmin}
        businessServices={(businessServices ?? []).map((s) => ({ id: s.id, name: s.name }))}
        availabilityMap={Object.fromEntries(availabilityMap)}
        specialtiesMap={Object.fromEntries(
          [...specialtiesMap.entries()].map(([k, v]) => [k, v]),
        )}
      />
    </main>
  );
}
