// transferToMainApp.js
// Utility to transfer accounts from Savita QuantiCool Supporting App to the Main Daily Activity App

export const MAIN_APP_API_URL = 'https://quanticool-bess-outreach-main.vercel.app/api/companies';
export const MAIN_APP_BASE_URL = 'https://quanticool-bess-outreach-main.vercel.app';

export function mapSupportingAccountToMain(acc) {
  const compName = (acc.company_name || '').trim();
  
  // Format primary contact
  const contactName = (acc.primary_contact_name || '').trim();
  const contactTitle = (acc.primary_contact_title || '').trim();
  const contactPerson = contactName ? (contactTitle ? `${contactName} — ${contactTitle}` : contactName) : '';
  const mobile = (acc.primary_mobile || '').trim();
  const email = (acc.primary_email || '').trim();
  
  // Priority mapping: A -> High, B -> Medium, C/Excluded -> Low
  const priority = acc.priority === 'A' ? 'High' : (acc.priority === 'B' ? 'Medium' : 'Low');
  
  // Type mapping
  let type = 'New Mfr - Operational';
  if (acc.account_bucket === 'Existing customer') type = 'Existing Contact';
  else if (acc.account_bucket === 'Samples supplied') type = 'Technical Target';
  else if (acc.business_role && acc.business_role.toLowerCase().includes('developer')) type = 'Project Developer';

  // Cooling mapping
  let liquidCooling = acc.cooling_or_product_evidence || 'Liquid Cooled - Type Not Specified';
  if (acc.immersion_fit && acc.immersion_fit.toLowerCase().includes('candidate')) {
    liquidCooling = 'Immersion Cooled';
  } else if (acc.eg50_fit && acc.eg50_fit.toLowerCase().includes('candidate')) {
    liquidCooling = 'DLC / Cold Plate';
  }

  // Next action & notes
  const nextAction = (acc.next_action || acc.discussion_points_to_track || '').trim();
  const nextActionDate = (acc.followup_due_date_edit || '').trim();

  const notesParts = [];
  if (acc.discussion_points_to_track) notesParts.push(`Discussion Points: ${acc.discussion_points_to_track}`);
  if (acc.suggested_offer) notesParts.push(`Suggested Offer: ${acc.suggested_offer}`);
  if (acc.procurement_qualification_gate) notesParts.push(`Procurement Gate: ${acc.procurement_qualification_gate}`);
  if (acc.website) notesParts.push(`Website: ${acc.website}`);
  if (email) notesParts.push(`Email: ${email}`);
  if (acc.account_bucket) notesParts.push(`Status in Supporting App: ${acc.account_bucket}`);

  const contactsList = [];
  if (contactName) {
    contactsList.push({
      name: contactName,
      designation: contactTitle,
      mobile: mobile,
      email: email,
      isPrimary: true
    });
  }

  const activities = [
    {
      id: `act_transfer_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Account Transferred from Supporting App',
      text: `Transferred from Savita QuantiCool Supporting App (Battery Show 2026). Priority: ${acc.priority || 'A'}. Fit: ${acc.coolant_fit_type || 'N/A'}.`,
      timestamp: new Date().toISOString()
    }
  ];

  const payload = {
    company: compName,
    type: type,
    location: (acc.address || 'India').trim(),
    contactPerson: contactPerson,
    mobile: mobile || email,
    capacityOrScale: (acc.application_segments || '').trim(),
    categoryOrRole: (acc.business_role || 'Battery Energy Storage').trim(),
    liquidCooling: liquidCooling,
    priority: priority,
    status: acc.connected_yn === 'Y' ? 'In Dialogue / Technical Review' : 'Not Contacted',
    nextAction: nextAction,
    nextActionDate: nextActionDate,
    notes: notesParts.join('\n'),
    source: acc.event || 'Battery Show India 2026',
    contacts: contactsList,
    activities: activities
  };

  // Strip empty/null/undefined so we don't wipe out existing filled fields in Main App
  const cleanPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== '' && v !== null && v !== undefined) {
      if (Array.isArray(v) && v.length === 0) continue;
      cleanPayload[k] = v;
    }
  }

  return cleanPayload;
}

export async function transferAccountToMainApp(acc) {
  const payload = mapSupportingAccountToMain(acc);
  
  const response = await fetch(MAIN_APP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Main App server error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result;
}
