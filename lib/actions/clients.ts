'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireCapability } from '@/lib/auth/require-capability';
import { seedDefaultPortalVisibility } from '@/lib/actions/portal-visibility';
import { ok, fail, type ActionResult } from '@/lib/actions/result';
import { createClientSchema, updateClientSchema, type CreateClientInput, type UpdateClientInput } from '@/lib/validation/schemas';

export async function createClientAction(input: CreateClientInput): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'clients.create');
    const parsed = createClientSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');

    const sb = createClient();
    const payload: any = { ...parsed.data };
    if (payload.pan === '') payload.pan = null;
    if (payload.gstin === '') payload.gstin = null;
    if (payload.primary_contact_email === '') payload.primary_contact_email = null;

    const { data, error } = await sb.from('clients').insert(payload).select('id, portal_enabled').single();
    if (error) return fail(error.message, 'DB');

    // If portal_enabled at creation, seed default visibility (dashboard + tasks + queries)
    if ((data as any).portal_enabled) {
      await seedDefaultPortalVisibility((data as any).id, me.id);
    }

    revalidatePath('/admin/clients');
    revalidatePath('/team/clients');
    return ok({ id: data.id });
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function updateClientAction(input: UpdateClientInput): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'clients.edit');
    const parsed = updateClientSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Invalid input', 'VALIDATION');
    const { id, ...rest } = parsed.data;
    const payload: any = { ...rest, updated_at: new Date().toISOString() };
    if (payload.pan === '') payload.pan = null;
    if (payload.gstin === '') payload.gstin = null;
    if (payload.primary_contact_email === '') payload.primary_contact_email = null;
    const sb = createClient();

    // Capture prior portal state to detect transition false -> true
    const { data: prior } = await sb.from('clients').select('portal_enabled').eq('id', id).maybeSingle();

    const { error } = await sb.from('clients').update(payload).eq('id', id);
    if (error) return fail(error.message, 'DB');

    // Toggle portal-on transition: seed default visibility
    if (!(prior as any)?.portal_enabled && payload.portal_enabled === true) {
      await requireCapability(me, 'clients.toggle_portal');
      await seedDefaultPortalVisibility(id, me.id);
    }

    revalidatePath('/admin/clients');
    revalidatePath(`/admin/clients/${id}`);
    revalidatePath('/team/clients');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function softDeleteClientAction(id: string): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'clients.delete');
    const sb = createClient();
    const { error } = await sb
      .from('clients')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: me.id })
      .eq('id', id);
    if (error) return fail(error.message, 'DB');
    revalidatePath('/admin/clients');
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function assignTeamMemberAction(input: { clientId: string; teamUserId: string; role: 'lead' | 'support' | 'reviewer' }): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'clients.assign_team');
    const sb = createClient();
    const { error } = await sb.from('team_client_assignment').insert({
      client_id: input.clientId,
      team_user_id: input.teamUserId,
      role: input.role,
      assigned_from: new Date().toISOString().slice(0, 10),
    });
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/admin/clients/${input.clientId}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}

export async function unassignTeamMemberAction(assignmentId: string, clientId: string): Promise<ActionResult<void>> {
  try {
    const me = await requireRole(['admin']);
    await requireCapability(me, 'clients.assign_team');
    const sb = createClient();
    const { error } = await sb
      .from('team_client_assignment')
      .update({ assigned_to: new Date().toISOString().slice(0, 10) })
      .eq('id', assignmentId);
    if (error) return fail(error.message, 'DB');
    revalidatePath(`/admin/clients/${clientId}`);
    return ok(undefined);
  } catch (e: any) {
    return fail(e?.message ?? 'unknown', e?.code ?? 'UNKNOWN');
  }
}
