import { supabase } from '@/integrations/supabase/client';

export interface AdminNotification {
  type: 'table_combination_needed' | 'capacity_exceeded' | 'manual_assignment_required' | 'waitlist_conversion' | 'large_party_request';
  title: string;
  message: string;
  data?: any;
}

export async function createAdminNotification(
  restaurantId: string,
  notification: AdminNotification
) {
  try {
    const { error } = await supabase.from('notifications').insert({
      restaurant_id: restaurantId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      is_read: false
    });

    if (error) {
      console.error('Error creating admin notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create admin notification:', error);
  }
}

// Specific notification creators
export async function notifyTableCombinationNeeded(
  restaurantId: string,
  customerName: string,
  partySize: number,
  suggestedCombinations: any[]
) {
  const tableNumbers = suggestedCombinations[0]?.table_numbers?.join(', ') || '';
  
  await createAdminNotification(restaurantId, {
    type: 'table_combination_needed',
    title: 'Tafel Combinatie Nodig',
    message: `Reservering voor ${partySize} personen (${customerName}) vereist combinatie van tafels: ${tableNumbers}`,
    data: {
      customer_name: customerName,
      party_size: partySize,
      suggested_combinations: suggestedCombinations
    }
  });
}

export async function notifyCapacityExceeded(
  restaurantId: string,
  customerName: string,
  partySize: number,
  currentCapacity: number,
  maxCapacity: number,
  timeSlot: string
) {
  await createAdminNotification(restaurantId, {
    type: 'capacity_exceeded',
    title: 'Capaciteit Overschreden',
    message: `Reservering van ${customerName} (${partySize} personen) zou capaciteit overschrijden. Huidige bezetting: ${currentCapacity}/${maxCapacity} om ${timeSlot}`,
    data: {
      customer_name: customerName,
      party_size: partySize,
      current_capacity: currentCapacity,
      max_capacity: maxCapacity,
      time_slot: timeSlot
    }
  });
}

export async function notifyManualAssignmentRequired(
  restaurantId: string,
  customerName: string,
  partySize: number,
  reason: string
) {
  await createAdminNotification(restaurantId, {
    type: 'manual_assignment_required',
    title: 'Handmatige Tafeltoewijzing Vereist',
    message: `Reservering van ${customerName} (${partySize} personen) vereist handmatige tafeltoewijzing: ${reason}`,
    data: {
      customer_name: customerName,
      party_size: partySize,
      reason: reason
    }
  });
}

export async function notifyLargePartyRequest(
  restaurantId: string,
  customerName: string,
  partySize: number,
  preferredDate: string,
  preferredTime: string
) {
  await createAdminNotification(restaurantId, {
    type: 'large_party_request',
    title: 'Grote Groep Aanvraag',
    message: `${customerName} heeft een aanvraag gedaan voor ${partySize} personen op ${preferredDate} om ${preferredTime}`,
    data: {
      customer_name: customerName,
      party_size: partySize,
      preferred_date: preferredDate,
      preferred_time: preferredTime
    }
  });
}

export async function notifyWaitlistConversion(
  restaurantId: string,
  customerName: string,
  partySize: number,
  convertedFromWaitlist: boolean = true
) {
  await createAdminNotification(restaurantId, {
    type: 'waitlist_conversion',
    title: 'Wachtlijst Conversie',
    message: `${customerName} (${partySize} personen) is automatisch omgezet van wachtlijst naar reservering`,
    data: {
      customer_name: customerName,
      party_size: partySize,
      converted_from_waitlist: convertedFromWaitlist
    }
  });
}