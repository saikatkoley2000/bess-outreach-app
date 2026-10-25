import * as XLSX from 'xlsx';

export function exportAccountsToExcel(accounts, filename = 'Savita_QuantiCool_Accounts.xlsx') {
  const data = accounts.map(acc => ({
    'Company Name': acc.company_name,
    'Priority': acc.priority,
    'Bucket': acc.account_bucket,
    'Event / Source': acc.event,
    'Met Status': acc.met_status,
    'Relationship Stage': acc.relationship_stage,
    'Business Role': acc.business_role,
    'Application Segments': acc.application_segments,
    'Cooling Evidence': acc.cooling_or_product_evidence,
    'EG50 Fit': acc.eg50_fit,
    'Immersion Fit': acc.immersion_fit,
    'Suggested Offer': acc.suggested_offer,
    'Procurement Qualification Gate': acc.procurement_qualification_gate,
    'Next Action': acc.next_action,
    'Primary Contact': acc.primary_contact_name,
    'Contact Title': acc.primary_contact_title,
    'Email': acc.primary_email,
    'Mobile': acc.primary_mobile,
    'Address': acc.address,
    'Research Score (0-100)': acc.research_score_100,
    'EG50 Sample Status': acc.eg50_sample_status,
    'Immersion Sample Status': acc.immersion_sample_status,
    'Regular Supply Status': acc.regular_supply_status,
    'Sales Owner': acc.account_owner_edit || '',
    'Follow-up Due Date': acc.followup_due_date_edit || '',
    'Website': acc.website
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
  XLSX.writeFile(wb, filename);
}

export function exportOpportunitiesToExcel(opportunities, filename = 'Savita_QuantiCool_Opportunities_Volume.xlsx') {
  const data = opportunities.map(opp => ({
    'Company Name': opp.company_name,
    'Product': opp.product,
    'Application': opp.application,
    'Opportunity Stage': opp.opportunity_stage,
    'Priority': opp.priority,
    'Technical Fit': opp.technical_fit_assessment,
    'Sample Status': opp.sample_status,
    'Technical Approval': opp.technical_approval_status,
    'Est. Annual Volume (Litres)': opp.estimated_annual_litres_edit || '',
    'Win Probability (%)': opp.win_probability_pct_edit || '',
    'Weighted Volume (Litres)': opp.weighted_litres_formula || '',
    'Sales Owner': opp.sales_owner_edit || '',
    'Target Decision Date': opp.target_decision_date_edit || '',
    'Caveats': opp.caveats || '',
    'Next Action': opp.next_action || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Opportunities');
  XLSX.writeFile(wb, filename);
}

export function exportActionsToExcel(actions, filename = 'Savita_QuantiCool_Sales_Actions.xlsx') {
  const data = actions.map(act => ({
    'Company Name': act.company,
    'Urgency': act.urgency,
    'Priority': act.priority,
    'Relationship Stage': act.relationship_stage,
    'Action Type': act.action_type,
    'Action Description': act.action_description,
    'Status': act.status_edit || 'Not started',
    'Owner': act.owner_edit || '',
    'Due Date': act.due_date_edit || '',
    'Success Criterion': act.success_criterion || '',
    'Notes / Caution': act.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Actions');
  XLSX.writeFile(wb, filename);
}

export function exportFullMasterToExcel(masterData, filename = 'Savita_QuantiCool_Unified_Master_Export.xlsx') {
  const wb = XLSX.utils.book_new();

  const cleanAccounts = (masterData.Accounts || []).map(acc => {
    const { account_id, ...rest } = acc;
    return { 'Company Name': acc.company_name, ...rest };
  });

  const cleanOpportunities = (masterData.Opportunities || []).map(opp => {
    const {
      opportunity_id,
      account_id,
      indicative_price_inr_per_litre_edit,
      unweighted_revenue_inr_formula,
      weighted_revenue_inr_formula,
      ...rest
    } = opp;
    return { 'Company Name': opp.company_name, ...rest };
  });

  const cleanActions = (masterData.Actions || []).map(act => {
    const { action_id, account_id, ...rest } = act;
    return { 'Company Name': act.company, ...rest };
  });

  const cleanContacts = (masterData.Contacts || []).map(c => {
    const { contact_id, account_id, ...rest } = c;
    return { 'Full Name': c.full_name, 'Company': c.company_on_card, ...rest };
  });

  const cleanEngagements = (masterData.Engagements || []).map(eng => {
    const { engagement_id, account_id, ...rest } = eng;
    return { 'Company Name': eng.account, ...rest };
  });

  const cleanEvidence = (masterData.Evidence || []).map(evd => {
    const { evidence_id, account_id, ...rest } = evd;
    return { 'Company Name': evd.company, ...rest };
  });

  const cleanCorrections = (masterData.Corrections || []).map(corr => {
    const { correction_id, account_id, ...rest } = corr;
    return { 'Company Name': corr.company_affected, ...rest };
  });

  const sheetsToExport = [
    { name: 'Accounts', data: cleanAccounts },
    { name: 'Opportunities', data: cleanOpportunities },
    { name: 'Contacts', data: cleanContacts },
    { name: 'Actions', data: cleanActions },
    { name: 'Engagements', data: cleanEngagements },
    { name: 'Evidence', data: cleanEvidence },
    { name: 'Exclusions', data: masterData.Exclusions },
    { name: 'Expo_41', data: masterData.Expo_41 },
    { name: 'Corrections', data: cleanCorrections }
  ];

  sheetsToExport.forEach(s => {
    if (s.data && s.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(s.data);
      XLSX.utils.book_append_sheet(wb, ws, s.name);
    }
  });

  XLSX.writeFile(wb, filename);
}
