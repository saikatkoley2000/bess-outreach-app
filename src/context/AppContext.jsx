import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import rawMasterData from '../data/master_data.json';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  AUTH_USER: 'savita_auth_user_2026',
  ACCOUNT_OVERRIDES: 'savita_account_overrides_2026',
  OPPORTUNITY_OVERRIDES: 'savita_opportunity_overrides_2026',
  DELETED_OPPS: 'savita_deleted_opps_2026',
  DELETED_ACCOUNTS: 'savita_deleted_accounts_2026',
  NEW_OPPORTUNITIES: 'savita_new_opps_2026',
  ACTION_OVERRIDES: 'savita_action_overrides_2026',
  ENGAGEMENT_OVERRIDES: 'savita_engagement_overrides_2026',
  NEW_ACTIONS: 'savita_new_actions_2026',
};

export function AppProvider({ children }) {
  const defaultUser = {
    name: 'Savita BD Team',
    email: 'commercial.bd@savita.com',
    role: 'Specialty Fluids & BESS Division',
    department: 'Commercial BD'
  };

  // Public Session State - No login required
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultUser;
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Selected Account for 360° modal
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [modalInitialEditMode, setModalInitialEditMode] = useState(false);

  const openAccountDetail = (accountId, editMode = false) => {
    setModalInitialEditMode(editMode);
    setSelectedAccountId(accountId);
  };

  // Editable overrides persisted to localStorage
  const [accountOverrides, setAccountOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNT_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [opportunityOverrides, setOpportunityOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITY_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [deletedOppIds, setDeletedOppIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETED_OPPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedAccountIds, setDeletedAccountIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETED_ACCOUNTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_ACCOUNTS, JSON.stringify(deletedAccountIds));
  }, [deletedAccountIds]);

  const [newOpportunities, setNewOpportunities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEW_OPPORTUNITIES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [actionOverrides, setActionOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTION_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [newActions, setNewActions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEW_ACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [engagementOverrides, setEngagementOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENGAGEMENT_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_OVERRIDES, JSON.stringify(accountOverrides));
  }, [accountOverrides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITY_OVERRIDES, JSON.stringify(opportunityOverrides));
  }, [opportunityOverrides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_OPPS, JSON.stringify(deletedOppIds));
  }, [deletedOppIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NEW_OPPORTUNITIES, JSON.stringify(newOpportunities));
  }, [newOpportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTION_OVERRIDES, JSON.stringify(actionOverrides));
  }, [actionOverrides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NEW_ACTIONS, JSON.stringify(newActions));
  }, [newActions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENGAGEMENT_OVERRIDES, JSON.stringify(engagementOverrides));
  }, [engagementOverrides]);

  // Merge Master Accounts with user overrides and exclude transferred/deleted
  const accounts = useMemo(() => {
    const deletedAccSet = new Set(deletedAccountIds);
    return rawMasterData.Accounts
      .filter(acc => !deletedAccSet.has(acc.account_id))
      .map(acc => {
      const override = accountOverrides[acc.account_id] || {};
      
      const priority = override.priority !== undefined ? override.priority : acc.priority;
      const score = override.research_score_100 !== undefined && override.research_score_100 !== ''
        ? override.research_score_100
        : (acc.research_score_100 !== undefined && acc.research_score_100 !== '' ? acc.research_score_100 : 0);
      const coolantFitType = override.coolant_fit_type !== undefined 
        ? override.coolant_fit_type 
        : (acc.coolant_fit_type || 'Both');

      const isConnectedDefault = (acc.connected_yn !== undefined && acc.connected_yn !== '')
        ? acc.connected_yn
        : (acc.met_status && acc.met_status.toLowerCase().includes('met') ? 'Y' : 'N');
      const connectedYn = override.connected_yn !== undefined ? override.connected_yn : isConnectedDefault;
      const discussionPoints = (override.discussion_points_to_track !== undefined && override.discussion_points_to_track.trim() !== '')
        ? override.discussion_points_to_track
        : (acc.discussion_points_to_track || '');

      return {
        ...acc,
        ...override,
        priority: priority,
        research_score_100: score,
        coolant_fit_type: coolantFitType,
        connected_yn: connectedYn,
        discussion_points_to_track: discussionPoints,
        account_owner_edit: override.account_owner_edit !== undefined ? override.account_owner_edit : (acc.account_owner_edit || ''),
        followup_due_date_edit: override.followup_due_date_edit !== undefined ? override.followup_due_date_edit : (acc.followup_due_date_edit || '')
      };
    });
  }, [accountOverrides, deletedAccountIds]);

  // Merge Master Opportunities with user overrides, dynamic formula calculation, deleted rows and custom added rows
  const opportunities = useMemo(() => {
    const deletedSet = new Set(deletedOppIds);
    const combined = [...rawMasterData.Opportunities, ...newOpportunities].filter(o => !deletedSet.has(o.opportunity_id));

    return combined.map(opp => {
      const override = opportunityOverrides[opp.opportunity_id] || {};
      const product = override.product || opp.product;
      const stage = override.opportunity_stage || opp.opportunity_stage;
      const litres = override.estimated_annual_litres_edit !== undefined
        ? override.estimated_annual_litres_edit
        : (opp.estimated_annual_litres_edit || '');
      const prob = override.win_probability_pct_edit !== undefined
        ? override.win_probability_pct_edit
        : (opp.win_probability_pct_edit || '');
      const price = override.indicative_price_inr_per_litre_edit !== undefined
        ? override.indicative_price_inr_per_litre_edit
        : (opp.indicative_price_inr_per_litre_edit || '');

      const numLitres = litres === '' ? null : Number(litres);
      const numProb = prob === '' ? null : Number(prob);
      const numPrice = price === '' ? null : Number(price);

      // Formulas matching Excel workbook:
      // P: IF(OR(M="",N=""),"",M*N/100)
      const weightedLitres = (numLitres !== null && numProb !== null && !isNaN(numLitres) && !isNaN(numProb))
        ? (numLitres * numProb / 100)
        : '';

      // Q: IF(OR(M="",O=""),"",M*O)
      const unweightedRevenue = (numLitres !== null && numPrice !== null && !isNaN(numLitres) && !isNaN(numPrice))
        ? (numLitres * numPrice)
        : '';

      // R: IF(OR(P="",O=""),"",P*O)
      const weightedRevenue = (weightedLitres !== '' && numPrice !== null && !isNaN(numPrice))
        ? (weightedLitres * numPrice)
        : '';

      return {
        ...opp,
        ...override,
        product,
        opportunity_stage: stage,
        estimated_annual_litres_edit: litres,
        win_probability_pct_edit: prob,
        indicative_price_inr_per_litre_edit: price,
        weighted_litres_formula: weightedLitres !== '' ? Math.round(weightedLitres) : '',
        unweighted_revenue_inr_formula: unweightedRevenue !== '' ? Math.round(unweightedRevenue) : '',
        weighted_revenue_inr_formula: weightedRevenue !== '' ? Math.round(weightedRevenue) : '',
        sales_owner_edit: override.sales_owner_edit !== undefined ? override.sales_owner_edit : (opp.sales_owner_edit || ''),
        target_decision_date_edit: override.target_decision_date_edit !== undefined ? override.target_decision_date_edit : (opp.target_decision_date_edit || '')
      };
    });
  }, [opportunityOverrides, deletedOppIds, newOpportunities]);

  // Merge Master Actions with user overrides and appended actions
  const actions = useMemo(() => {
    const base = rawMasterData.Actions.map(act => {
      const override = actionOverrides[act.action_id] || {};
      return {
        ...act,
        ...override,
        status_edit: override.status_edit || act.status_edit || 'Not started',
        owner_edit: override.owner_edit !== undefined ? override.owner_edit : (act.owner_edit || ''),
        due_date_edit: override.due_date_edit !== undefined ? override.due_date_edit : (act.due_date_edit || '')
      };
    });
    return [...base, ...newActions];
  }, [actionOverrides, newActions]);

  // Engagements with overrides
  const engagements = useMemo(() => {
    return rawMasterData.Engagements.map(eng => {
      const override = engagementOverrides[eng.engagement_id] || {};
      return {
        ...eng,
        ...override
      };
    });
  }, [engagementOverrides]);

  // Update Account with intelligent multi-field cascading
  const updateAccount = (accountId, fields) => {
    setAccountOverrides(prev => {
      const currentOverride = prev[accountId] || {};
      const baseAccount = rawMasterData.Accounts.find(a => a.account_id === accountId) || {};
      const merged = { ...baseAccount, ...currentOverride, ...fields };

      let cascaded = { ...fields };

      const newBucket = fields.account_bucket !== undefined ? fields.account_bucket : merged.account_bucket;
      const newEg50Sample = fields.eg50_sample_status !== undefined ? fields.eg50_sample_status : merged.eg50_sample_status;
      const newImmersionSample = fields.immersion_sample_status !== undefined ? fields.immersion_sample_status : merged.immersion_sample_status;
      const newRegularSupply = fields.regular_supply_status !== undefined ? fields.regular_supply_status : merged.regular_supply_status;
      const newStage = fields.relationship_stage !== undefined ? fields.relationship_stage : merged.relationship_stage;

      // Check for Active Regular Supply condition
      const isTargetActiveSupply =
        (newBucket && (newBucket.toLowerCase().includes('existing') || newBucket.toLowerCase().includes('active'))) ||
        (newRegularSupply && newRegularSupply.toLowerCase().includes('active regular')) ||
        (newStage && (newStage.toLowerCase().includes('regular supply') || newStage.toLowerCase().includes('existing commercial')));

      // Check for Under Testing / Samples Supplied condition
      const isTargetUnderTesting = !isTargetActiveSupply && (
        (newBucket && (newBucket.toLowerCase().includes('sample') || newBucket.toLowerCase().includes('testing'))) ||
        (newEg50Sample && !newEg50Sample.toLowerCase().includes('no') && (newEg50Sample.toLowerCase().includes('sample supplied') || newEg50Sample.toLowerCase().includes('under test') || newEg50Sample.toLowerCase().includes('testing'))) ||
        (newImmersionSample && !newImmersionSample.toLowerCase().includes('no') && (newImmersionSample.toLowerCase().includes('sample supplied') || newImmersionSample.toLowerCase().includes('under test') || newImmersionSample.toLowerCase().includes('testing'))) ||
        (newStage && (newStage.toLowerCase().includes('samples supplied') || newStage.toLowerCase().includes('under testing')))
      );

      if (isTargetActiveSupply) {
        cascaded.account_bucket = 'Existing customer';
        cascaded.regular_supply_status = 'Active regular supply';
        cascaded.relationship_stage = fields.relationship_stage || 'Active commercial supply';
        cascaded.stage_number = fields.stage_number || 7;
      } else if (isTargetUnderTesting) {
        cascaded.account_bucket = 'Samples supplied';
        cascaded.relationship_stage = fields.relationship_stage || 'Samples supplied / Under testing';
        if (cascaded.regular_supply_status === 'Active regular supply') {
          cascaded.regular_supply_status = 'Under trial evaluation';
        }
        if (!cascaded.stage_number) {
          cascaded.stage_number = merged.stage_number || 3;
        }
        // If neither sample status is marked, default based on product fit
        if (!newEg50Sample?.toLowerCase().includes('sample') && !newImmersionSample?.toLowerCase().includes('sample')) {
          if (merged.immersion_fit && !merged.immersion_fit.toLowerCase().includes('not')) {
            cascaded.immersion_sample_status = 'Sample supplied (under test)';
          }
          if (merged.eg50_fit && !merged.eg50_fit.toLowerCase().includes('not')) {
            cascaded.eg50_sample_status = 'Sample supplied (under test)';
          }
          if (!cascaded.eg50_sample_status && !cascaded.immersion_sample_status) {
            cascaded.eg50_sample_status = 'Sample supplied (under test)';
          }
        }
      } else if (fields.account_bucket === 'Prospect') {
        cascaded.account_bucket = 'Prospect';
        if (merged.regular_supply_status === 'Active regular supply') {
          cascaded.regular_supply_status = 'None';
        }
      }

      // Cascade to linked opportunities in opportunities table
      setTimeout(() => {
        setOpportunityOverrides(prevOpps => {
          const linkedOpps = rawMasterData.Opportunities.filter(o => o.account_id === accountId);
          if (linkedOpps.length === 0) return prevOpps;

          const updated = { ...prevOpps };
          linkedOpps.forEach(opp => {
            const currentOppOverride = updated[opp.opportunity_id] || {};
            if (isTargetActiveSupply) {
              updated[opp.opportunity_id] = {
                ...currentOppOverride,
                opportunity_stage: 'Commercial supply',
                sample_status: 'Sample tested & approved',
                win_probability_pct_edit: currentOppOverride.win_probability_pct_edit !== undefined ? currentOppOverride.win_probability_pct_edit : 90
              };
            } else if (isTargetUnderTesting) {
              updated[opp.opportunity_id] = {
                ...currentOppOverride,
                opportunity_stage: 'Testing / validation',
                sample_status: 'Sample supplied',
                win_probability_pct_edit: currentOppOverride.win_probability_pct_edit !== undefined ? currentOppOverride.win_probability_pct_edit : 50
              };
            }
          });
          return updated;
        });
      }, 0);

      return {
        ...prev,
        [accountId]: {
          ...currentOverride,
          ...cascaded
        }
      };
    });
  };

  // Helper to dispatch sample and shift any account to Under Testing
  const dispatchSampleToAccount = (accountId, { sampleType = 'both', initialStage = 1, notes = '', contactName = '' } = {}) => {
    const acc = rawMasterData.Accounts.find(a => a.account_id === accountId);
    if (!acc) return;

    const updates = {
      account_bucket: 'Samples supplied',
      relationship_stage: 'Samples supplied / Under testing',
      stage_number: initialStage,
      next_action: notes || acc.next_action || 'Sample dispatched for laboratory testing & evaluation.'
    };

    if (contactName) {
      updates.primary_contact_name = contactName;
    }

    if (sampleType === 'eg50') {
      updates.eg50_sample_status = 'Sample supplied (under test)';
    } else if (sampleType === 'immersion') {
      updates.immersion_sample_status = 'Sample supplied (under test)';
    } else {
      updates.eg50_sample_status = 'Sample supplied (under test)';
      updates.immersion_sample_status = 'Sample supplied (under test)';
    }

    updateAccount(accountId, updates);
  };

  // Helper to elevate any account to Active Regular Supply
  const elevateToActiveSupply = (accountId, { notes = '' } = {}) => {
    const acc = rawMasterData.Accounts.find(a => a.account_id === accountId);
    if (!acc) return;

    const updates = {
      account_bucket: 'Existing customer',
      regular_supply_status: 'Active regular supply',
      relationship_stage: 'Active commercial supply',
      stage_number: 7,
      next_action: notes || acc.next_action || 'Commercial regular supply active; coordinate manufacturing batches.'
    };

    updateAccount(accountId, updates);
  };

  // Update Opportunity (supports changing product, volume, probability, stage, owner, date)
  const updateOpportunity = (oppId, fields) => {
    setOpportunityOverrides(prev => ({
      ...prev,
      [oppId]: {
        ...prev[oppId],
        ...fields
      }
    }));
  };

  // Delete Opportunity line
  const deleteOpportunity = (oppId) => {
    setDeletedOppIds(prev => [...prev, oppId]);
  };

  // Add new Opportunity line
  const addOpportunity = (oppData) => {
    const newId = `OPP-MANUAL-${Date.now().toString().slice(-5)}`;
    const createdOpp = {
      opportunity_id: newId,
      account_id: oppData.account_id || '',
      company_name: oppData.company_name || '',
      product: oppData.product || 'EG50',
      application: oppData.application || 'BESS / EV / specialty — qualify',
      opportunity_stage: oppData.opportunity_stage || 'Technical specification needed',
      priority: oppData.priority || 'B',
      commercial_route: oppData.commercial_route || 'Direct OEM qualification',
      technical_fit_assessment: oppData.technical_fit_assessment || 'Candidate — spec check',
      sample_status: oppData.sample_status || 'Not recorded',
      technical_approval_status: oppData.technical_approval_status || 'Not established',
      estimated_annual_litres_edit: oppData.estimated_annual_litres_edit || '',
      win_probability_pct_edit: oppData.win_probability_pct_edit || '',
      sales_owner_edit: oppData.sales_owner_edit || '',
      target_decision_date_edit: oppData.target_decision_date_edit || '',
      next_action: oppData.next_action || '',
      caveats: oppData.caveats || ''
    };
    setNewOpportunities(prev => [createdOpp, ...prev]);
    return createdOpp;
  };

  // Batch update opportunities for management scenarios
  const applyScenarioPreset = (scenarioType) => {
    if (scenarioType === 'reset_blank') {
      setOpportunityOverrides({});
      return;
    }

    const newOverrides = {};
    if (scenarioType === 'base_case') {
      // Conservative scenario for testing and Priority A BESS prospects:
      // EG50 base: 25,000L @ ₹185/L, 35% probability for Priority A;
      // Immersion base: 8,000L @ ₹480/L, 25% probability for Priority A.
      opportunities.forEach(opp => {
        if (opp.priority === 'A' || opp.sample_status.toLowerCase().includes('sample')) {
          let litres = 15000;
          let prob = 30;
          let price = 185;

          if (opp.product === 'Dielectric immersion') {
            litres = 6000;
            prob = 20;
            price = 480;
          }

          if (opp.company_name.includes('REPLUS') || opp.company_name.includes('Good Enough') || opp.company_name.includes('Lineage') || opp.company_name.includes('Epitome')) {
            prob = 60;
            litres = 35000;
          } else if (opp.company_name.includes('AmpereHour') || opp.company_name.includes('Clean Electric')) {
            prob = 85;
            litres = 50000;
          }

          newOverrides[opp.opportunity_id] = {
            estimated_annual_litres_edit: litres,
            win_probability_pct_edit: prob
          };
        }
      });
    } else if (scenarioType === 'aggressive_growth') {
      opportunities.forEach(opp => {
        if (opp.priority === 'A' || opp.priority === 'B') {
          let litres = 30000;
          let prob = 50;

          if (opp.product === 'Dielectric immersion') {
            litres = 12000;
            prob = 35;
          }

          if (opp.company_name.includes('REPLUS') || opp.company_name.includes('Good Enough') || opp.company_name.includes('Lineage') || opp.company_name.includes('Epitome')) {
            prob = 75;
            litres = 60000;
          } else if (opp.company_name.includes('AmpereHour') || opp.company_name.includes('Clean Electric')) {
            prob = 90;
            litres = 85000;
          }

          newOverrides[opp.opportunity_id] = {
            estimated_annual_litres_edit: litres,
            win_probability_pct_edit: prob
          };
        }
      });
    }

    setOpportunityOverrides(newOverrides);
  };

  // Update Action
  const updateAction = (actionId, fields) => {
    setActionOverrides(prev => ({
      ...prev,
      [actionId]: {
        ...prev[actionId],
        ...fields
      }
    }));
  };

  // Add New Action
  const addNewAction = (actionData) => {
    const newId = `ACT-MANUAL-${Date.now().toString().slice(-4)}`;
    const createdAction = {
      action_id: newId,
      account_id: actionData.account_id || '',
      company: actionData.company || '',
      urgency: actionData.urgency || '0-30 days',
      priority: actionData.priority || 'A',
      relationship_stage: actionData.relationship_stage || 'Cold / qualify',
      owner_edit: actionData.owner_edit || currentUser?.name || 'BD Team',
      action_type: actionData.action_type || 'Custom Sales Task',
      action_description: actionData.action_description || '',
      due_date_edit: actionData.due_date_edit || '',
      status_edit: actionData.status_edit || 'Not started',
      success_criterion: actionData.success_criterion || '',
      source_context: 'User created in app',
      notes: actionData.notes || ''
    };
    setNewActions(prev => [createdAction, ...prev]);
  };

  // Update Engagement
  const updateEngagement = (engagementId, fields) => {
    setEngagementOverrides(prev => ({
      ...prev,
      [engagementId]: {
        ...prev[engagementId],
        ...fields
      }
    }));
  };

  // 360° Account Linker
  const getAccount360 = (accountId) => {
    if (!accountId) return null;
    const account = accounts.find(a => a.account_id === accountId);
    if (!account) return null;

    const linkedContacts = rawMasterData.Contacts.filter(c => c.account_id === accountId);
    const linkedOpportunities = opportunities.filter(o => o.account_id === accountId);
    const linkedActions = actions.filter(a => a.account_id === accountId);
    const linkedEvidence = rawMasterData.Evidence.filter(e => e.account_id === accountId);
    const linkedExclusion = rawMasterData.Exclusions.find(e => e.account_id === accountId);
    const linkedEngagement = engagements.find(e => e.account_id === accountId);
    const linkedCorrections = rawMasterData.Corrections.filter(c => c.account_id === accountId);
    const linkedExpo = rawMasterData.Expo_41.find(e => e.account_id === accountId);

    return {
      account,
      contacts: linkedContacts,
      opportunities: linkedOpportunities,
      actions: linkedActions,
      evidence: linkedEvidence,
      exclusion: linkedExclusion,
      engagement: linkedEngagement,
      corrections: linkedCorrections,
      expo: linkedExpo
    };
  };

  // Logout / Login
  const login = (user) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(defaultUser);
  };

  // Remove an account (used when transferring account to Main App)
  const removeAccount = (accountId) => {
    setDeletedAccountIds(prev => (prev.includes(accountId) ? prev : [...prev, accountId]));
    const oppsToDelete = rawMasterData.Opportunities
      .filter(o => o.account_id === accountId)
      .map(o => o.opportunity_id);
    if (oppsToDelete.length > 0) {
      setDeletedOppIds(prev => Array.from(new Set([...prev, ...oppsToDelete])));
    }
    if (selectedAccountId === accountId) {
      setSelectedAccountId(null);
    }
  };

  // Reset all local storage changes back to blank workbook defaults
  const resetAllToWorkbookDefaults = () => {
    if (window.confirm('Reset all edited owners, due dates, scenario inputs and status updates back to original Excel defaults?')) {
      setAccountOverrides({});
      setOpportunityOverrides({});
      setDeletedOppIds([]);
      setDeletedAccountIds([]);
      setNewOpportunities([]);
      setActionOverrides({});
      setNewActions([]);
      setEngagementOverrides({});
      localStorage.removeItem(STORAGE_KEYS.ACCOUNT_OVERRIDES);
      localStorage.removeItem(STORAGE_KEYS.OPPORTUNITY_OVERRIDES);
      localStorage.removeItem(STORAGE_KEYS.DELETED_OPPS);
      localStorage.removeItem(STORAGE_KEYS.DELETED_ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.NEW_OPPORTUNITIES);
      localStorage.removeItem(STORAGE_KEYS.ACTION_OVERRIDES);
      localStorage.removeItem(STORAGE_KEYS.NEW_ACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ENGAGEMENT_OVERRIDES);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        activeTab,
        setActiveTab,
        selectedAccountId,
        setSelectedAccountId,
        modalInitialEditMode,
        setModalInitialEditMode,
        openAccountDetail,
        dispatchSampleToAccount,
        elevateToActiveSupply,
        accounts,
        opportunities,
        actions,
        contacts: rawMasterData.Contacts,
        evidence: rawMasterData.Evidence,
        exclusions: rawMasterData.Exclusions,
        corrections: rawMasterData.Corrections,
        expo41: rawMasterData.Expo_41,
        engagements,
        dashboardSheet: rawMasterData.Dashboard,
        appFields: rawMasterData.App_Fields,
        updateAccount,
        removeAccount,
        deletedAccountIds,
        updateOpportunity,
        deleteOpportunity,
        addOpportunity,
        applyScenarioPreset,
        updateAction,
        addNewAction,
        updateEngagement,
        getAccount360,
        resetAllToWorkbookDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
