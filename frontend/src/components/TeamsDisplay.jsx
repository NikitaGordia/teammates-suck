import React, { useState, useEffect, useReducer, useRef } from 'react'; // Added useReducer, useRef
import { useTranslation } from 'react-i18next';
import { API_CONFIG, getApiUrl } from '../config';
import { handleApiResponse } from '../utils/apiUtils';
import { validateAdminSecret } from '../utils/adminUtils';
import { getCookie, setCookie, COOKIE_NAMES } from '../utils/cookieUtils';
import { getScoreColor, getScoreTextColor } from '../utils/scoreUtils';
import AdminSecretModal from './AdminSecretModal';
import Confetti from './Confetti';
import './TeamsDisplay.css';

// --- Reducer Logic ---

const initialState = {
  status: 'idle', // idle | teamSelected | awaitingSecret | validatingSecret | submitting | success | error
  selectedTeamForSubmission: null, // 'team1' | 'team2' | null
  error: null, // string | null
};

// Action Types (optional but good practice)
const ACTIONS = {
  SELECT_TEAM: 'SELECT_TEAM',
  DESELECT_TEAM: 'DESELECT_TEAM',
  REQUIRE_SECRET: 'REQUIRE_SECRET',
  VALIDATE_SECRET: 'VALIDATE_SECRET', // Action to trigger validation effect
  VALIDATION_COMPLETE: 'VALIDATION_COMPLETE', // Action after validation finishes
  SUBMIT_SECRET: 'SUBMIT_SECRET', // From modal
  CANCEL_SECRET: 'CANCEL_SECRET', // From modal
  SUBMISSION_START: 'SUBMISSION_START', // Trigger API call
  SUBMISSION_SUCCESS: 'SUBMISSION_SUCCESS',
  SUBMISSION_FAILURE: 'SUBMISSION_FAILURE',
  RESET_STATUS: 'RESET_STATUS',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SELECT_TEAM:
      // Prevent selection if already submitting or if the same team is already selected/processing
      if (state.status === 'submitting' || state.selectedTeamForSubmission === action.payload.team) {
        return state;
      }
      return {
        ...state,
        status: 'teamSelected',
        selectedTeamForSubmission: action.payload.team,
        error: null, // Clear previous errors
      };
    case ACTIONS.DESELECT_TEAM:
       // Only allow deselection if a team is currently selected or awaiting secret
      if (state.selectedTeamForSubmission === action.payload.team &&
          (state.status === 'teamSelected' || state.status === 'awaitingSecret' || state.status === 'error')) {
        return {
          ...initialState, // Reset to initial state
        };
      }
      return state; // Otherwise, do nothing
    case ACTIONS.VALIDATE_SECRET:
      // If we have a secret to validate
      if (action.payload.secret) {
          return { ...state, status: 'validatingSecret', error: null };
      }
      // If no secret provided (e.g., from cookie check), require manual input
      return { ...state, status: 'awaitingSecret', error: null };
    case ACTIONS.VALIDATION_COMPLETE:
        if (action.payload.isValid) {
            // If valid, proceed to submission
             return { ...state, status: 'submitting', error: null };
        } else {
            // If invalid, go back to awaiting secret input, possibly with error
            return { ...state, status: 'awaitingSecret', error: action.payload.error || 'Invalid Secret'};
        }
    case ACTIONS.REQUIRE_SECRET:
      return { ...state, status: 'awaitingSecret', error: null };
    case ACTIONS.SUBMIT_SECRET: // From modal
        // Trigger validation for the submitted secret
        // The effect listening for VALIDATE_SECRET will handle the validation logic
        return { ...state, status: 'validatingSecret' }; // Validation effect will pick this up
    case ACTIONS.CANCEL_SECRET: // From modal
      // Reset back to idle state if modal is cancelled
      return { ...initialState };
    case ACTIONS.SUBMISSION_START: // Explicitly triggered after validation
        return { ...state, status: 'submitting', error: null };
    case ACTIONS.SUBMISSION_SUCCESS:
      return {
        ...state,
        status: 'success',
        error: null,
        // Keep selectedTeamForSubmission briefly for success feedback
      };
    case ACTIONS.SUBMISSION_FAILURE:
      return {
        ...state,
        status: 'error',
        error: action.payload.error,
        // Keep selectedTeamForSubmission so user knows which submission failed
      };
    case ACTIONS.RESET_STATUS:
       // Reset completely after success timeout or potentially after acknowledging error
      if (state.status === 'success') {
          return { ...initialState };
      }
      // If resetting from error, keep team selected but allow retry
      if (state.status === 'error') {
          return { ...state, status: 'teamSelected', error: null };
      }
      return state;
    default:
      return state;
  }
}

// --- Component ---

const TeamsDisplay = ({ teams, onGameSubmitted }) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const validatedAdminSecretRef = useRef(null); // To store the validated secret for submission effect

  // --- Calculations (no changes) ---
  const team1Score = teams.team1.reduce((sum, player) => sum + player.score, 0);
  const team2Score = teams.team2.reduce((sum, player) => sum + player.score, 0);
  const scoreDifference = Math.abs(team1Score - team2Score);
  const totalScore = team1Score + team2Score;
  const balancePercentage = totalScore === 0 ? 100 : Math.max(0, 100 - (scoreDifference / totalScore * 100));
  let balanceQuality = '';
  let balanceDescription = '';
  if (balancePercentage >= 99) { balanceQuality = 'meter-perfect'; balanceDescription = t('teams.balancePerfect'); }
  else if (balancePercentage >= 96) { balanceQuality = 'meter-good'; balanceDescription = t('teams.balanceGood'); }
  else if (balancePercentage >= 93) { balanceQuality = 'meter-fair'; balanceDescription = t('teams.balanceFair'); }
  else { balanceQuality = 'meter-poor'; balanceDescription = t('teams.balancePoor'); }
  const team1Higher = team1Score > team2Score;
  const team2Higher = team2Score > team1Score;
  const equalScores = team1Score === team2Score;
  // --- End Calculations ---


  // --- Side Effects ---

  // Effect 1: Check cookie or require secret when a team is selected
  useEffect(() => {
    if (state.status === 'teamSelected') {
      const savedAdminSecret = getCookie(COOKIE_NAMES.ADMIN_SECRET);
      if (savedAdminSecret) {
        // If we have a potential secret, trigger validation
        validatedAdminSecretRef.current = savedAdminSecret; // Store temporarily
        dispatch({ type: ACTIONS.VALIDATE_SECRET, payload: { secret: savedAdminSecret } });
      } else {
        // No saved secret, require user input
        dispatch({ type: ACTIONS.REQUIRE_SECRET });
      }
    }
  }, [state.status]); // Run only when status changes to 'teamSelected'

  // Effect 2: Validate Secret when status is 'validatingSecret'
  useEffect(() => {
      if (state.status === 'validatingSecret') {
          const secretToValidate = validatedAdminSecretRef.current; // Get secret from ref
          const validationError = validateAdminSecret(secretToValidate, t);

          if (!validationError) {
              // Validation successful
              setCookie(COOKIE_NAMES.ADMIN_SECRET, secretToValidate, 30); // Save/update cookie
              // Dispatch complete, API call will be triggered by 'submitting' status change
              dispatch({ type: ACTIONS.VALIDATION_COMPLETE, payload: { isValid: true } });
          } else {
              // Validation failed
              validatedAdminSecretRef.current = null; // Clear invalid secret
              // Need to handle case where cookie was invalid vs modal input invalid
              const savedSecret = getCookie(COOKIE_NAMES.ADMIN_SECRET);
               if (savedSecret && savedSecret === secretToValidate) {
                   // Saved cookie secret was invalid, prompt for input
                    dispatch({ type: ACTIONS.VALIDATION_COMPLETE, payload: { isValid: false, error: validationError }});
               } else {
                   // Modal input secret was invalid
                    dispatch({ type: ACTIONS.VALIDATION_COMPLETE, payload: { isValid: false, error: validationError }});
               }
          }
      }
  }, [state.status, t]); // Re-run if status becomes 'validatingSecret'

  // Effect 3: Submit game when status changes to 'submitting'
  useEffect(() => {
    if (state.status === 'submitting' && state.selectedTeamForSubmission && validatedAdminSecretRef.current) {
      const submitGame = async () => {
        try {
          const now = new Date();
          const gameDatetime = now.toISOString().slice(0, 19).replace('T', ' '); // "YYYY-MM-DD HH:MM:SS" in UTC

          const team1Names = teams.team1.map(player => player.nickname).join(',');
          const team2Names = teams.team2.map(player => player.nickname).join(',');
          const gameName = `${team1Names}|VS|${team2Names}`;

          const requestData = {
            teamA: teams.team1.map(player => player.id), // Use player IDs instead of nickname objects
            teamB: teams.team2.map(player => player.id), // Use player IDs instead of nickname objects
            winningTeam: state.selectedTeamForSubmission === 'team1' ? 'A' : 'B',
            gameName: gameName,
            gameDatetime: gameDatetime,
            adminPasscode: validatedAdminSecretRef.current, // Use the validated secret
          };

          const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBMIT_GAME), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            mode: 'cors',
          });

          const data = await handleApiResponse(response);
          console.log('Game submission successful:', data);

          dispatch({ type: ACTIONS.SUBMISSION_SUCCESS });

          if (onGameSubmitted && typeof onGameSubmitted === 'function') {
            onGameSubmitted({
              teamA: teams.team1.map(player => player.nickname), // Use original team data for callback
              teamB: teams.team2.map(player => player.nickname), // Use original team data for callback
              winningTeam: requestData.winningTeam
            });
          }
        } catch (error) {
          console.error('Error submitting game:', error);
          dispatch({ type: ACTIONS.SUBMISSION_FAILURE, payload: { error: error.message || t('teams.submissionError') } });
        } finally {
            validatedAdminSecretRef.current = null; // Clear secret after attempt
        }
      };

      submitGame();
    }
  }, [state.status, state.selectedTeamForSubmission, teams, t, onGameSubmitted]); // Dependencies for submission

  // Effect 4: Reset status after success message timeout
  useEffect(() => {
    if (state.status === 'success') {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.RESET_STATUS });
      }, 3000); // Keep success message and confetti visible for 3 seconds

      return () => clearTimeout(timer); // Cleanup timer on unmount or status change
    }
  }, [state.status]);

  // --- Event Handlers ---

  const handleTeamSelect = (team) => {
    // Prevent interaction during submission
    if (state.status === 'submitting') return;

    // Check if clicking the currently selected team to deselect
    if (state.selectedTeamForSubmission === team && (state.status === 'teamSelected' || state.status === 'awaitingSecret' || state.status === 'error')) {
      dispatch({ type: ACTIONS.DESELECT_TEAM, payload: { team } });
    } else if (state.selectedTeamForSubmission !== team) {
       // Selecting a new/different team
      // Basic validation: Ensure both teams have players before allowing selection
      if (teams.team1.length === 0 || teams.team2.length === 0) {
          // Maybe dispatch an error action or handle inline? For now, just prevent.
          console.warn("Cannot select team: Both teams need players.");
          return;
      }
      dispatch({ type: ACTIONS.SELECT_TEAM, payload: { team } });
    }
    // If clicking the same team while already processing ('validatingSecret', 'submitting', 'success'), do nothing
  };

  const handleAdminModalSubmit = (adminSecret) => {
     // Store secret in ref immediately for validation effect
    validatedAdminSecretRef.current = adminSecret;
    // Dispatch action to start validation process
    dispatch({ type: ACTIONS.SUBMIT_SECRET });
  };

  const handleAdminModalClose = () => {
    dispatch({ type: ACTIONS.CANCEL_SECRET });
     validatedAdminSecretRef.current = null; // Clear any potentially stored secret
  };


  // Determine if a team is highlighted
  const isTeamHighlighted = (team) => {
      return state.selectedTeamForSubmission === team &&
             ['teamSelected', 'awaitingSecret', 'validatingSecret', 'submitting', 'success', 'error'].includes(state.status);
  };

  // Determine if clicks should be disabled
   const isInteractionDisabled = state.status === 'submitting' || teams.team1.length === 0 || teams.team2.length === 0;


  // --- JSX ---
  return (
    <div className="teams-container">
      <div className="teams-grid">
        {/* Team 1 */}
        <div
          className={`team-card team1-card ${isTeamHighlighted('team1') ? 'winning-team' : ''} ${isInteractionDisabled ? 'team-disabled' : 'team-clickable'}`}
          onClick={() => !isInteractionDisabled && handleTeamSelect('team1')}
          style={{ cursor: isInteractionDisabled ? 'default' : 'pointer' }}
        >
          <div className="team-header team1-header">
            <h3>
              {t('teams.team1')}
              {/* Show winner badge if highlighted (and not just idle/error before selection) */}
              {isTeamHighlighted('team1') && state.status !== 'idle' && (
                <span className="winning-badge">
                  {/* Show "Winner" during success, otherwise indicate selection */}
                  {state.status === 'success' ? t('teams.winner') : t('teams.selected')}
                </span>
              )}
            </h3>
          </div>
          <div className="team-content">
            {/* Keep "Click to Select" indicator logic based on team population */}
             {teams.team1.length > 0 && teams.team2.length > 0 && state.status === 'idle' && (
               <div className="click-indicator-center">
                 <span className="click-text">{t('teams.clickToSelect')}</span>
               </div>
             )}
            {/* Player List (same as before) */}
            {teams.team1.length > 0 ? (
              <ul className="player-list">
                {teams.team1.map((player, index) => (
                   <li key={index} className={`player-item ${index === 0 ? 'player-leader' : ''}`}>
                    <span className="player-name">
                      {player.nickname}
                    </span>
                    <div className="player-stats">
                      {player.wins !== undefined && player.losses !== undefined && (
                        <span className="player-wl">
                          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{player.wins}</span> / <span style={{ color: '#F44336', fontWeight: 'bold' }}>{player.losses}</span>
                        </span>
                      )}
                      <span className="player-score" style={{ backgroundColor: getScoreColor(player.score), color: getScoreTextColor(player.score) }}>
                        {player.score}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-team">{t('teams.noPlayers')}</div>
            )}
          </div>
          {/* Paycheck for Team 1 (same as before) */}
           {teams.team1.length > 0 && (
            <div className="paycheck">
              <div className="paycheck-amount">
                <span className="paycheck-label">{t('teams.total')}:</span>
                <div>
                  <span className="paycheck-value">{team1Score.toFixed(1)}</span>
                   {team1Higher && !equalScores && (<span className="paycheck-badge higher-score">{t('teams.higher')}</span>)}
                   {team2Higher && !equalScores && (<span className="paycheck-badge lower-score">{t('teams.lower')}</span>)}
                   {equalScores && totalScore > 0 && (<span className="paycheck-badge equal-score">{t('teams.equal')}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team 2 (Similar structure, update highlight/click logic) */}
         <div
          className={`team-card team2-card ${isTeamHighlighted('team2') ? 'winning-team' : ''} ${isInteractionDisabled ? 'team-disabled' : 'team-clickable'}`}
          onClick={() => !isInteractionDisabled && handleTeamSelect('team2')}
          style={{ cursor: isInteractionDisabled ? 'default' : 'pointer' }}
        >
          <div className="team-header team2-header">
             <h3>
              {t('teams.team2')}
              {isTeamHighlighted('team2') && state.status !== 'idle' && (
                 <span className="winning-badge">
                   {state.status === 'success' ? t('teams.winner') : t('teams.selected')}
                 </span>
              )}
            </h3>
          </div>
           <div className="team-content">
              {teams.team1.length > 0 && teams.team2.length > 0 && state.status === 'idle' && (
               <div className="click-indicator-center">
                 <span className="click-text">{t('teams.clickToSelect')}</span>
               </div>
             )}
             {/* Player List */}
             {teams.team2.length > 0 ? (
              <ul className="player-list">
                 {teams.team2.map((player, index) => (
                   <li key={index} className={`player-item ${index === 0 ? 'player-leader' : ''}`}>
                     <span className="player-name">
                       {player.nickname}
                     </span>
                     <div className="player-stats">
                       {player.wins !== undefined && player.losses !== undefined && (
                         <span className="player-wl">
                           <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{player.wins}</span> / <span style={{ color: '#F44336', fontWeight: 'bold' }}>{player.losses}</span>
                         </span>
                       )}
                       <span className="player-score" style={{ backgroundColor: getScoreColor(player.score), color: getScoreTextColor(player.score) }}>
                         {player.score}
                       </span>
                     </div>
                   </li>
                 ))}
               </ul>
             ) : (
               <div className="empty-team">{t('teams.noPlayers')}</div>
             )}
           </div>
            {/* Paycheck for Team 2 */}
           {teams.team2.length > 0 && (
             <div className="paycheck">
               <div className="paycheck-amount">
                 <span className="paycheck-label">{t('teams.total')}:</span>
                 <div>
                   <span className="paycheck-value">{team2Score.toFixed(1)}</span>
                   {team2Higher && !equalScores && (<span className="paycheck-badge higher-score">{t('teams.higher')}</span>)}
                   {team1Higher && !equalScores && (<span className="paycheck-badge lower-score">{t('teams.lower')}</span>)}
                   {equalScores && totalScore > 0 && (<span className="paycheck-badge equal-score">{t('teams.equal')}</span>)}
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Status message based on reducer state */}
      {(state.status === 'submitting' || state.status === 'success' || state.status === 'error') && (
        <div className={`submission-status ${state.status === 'success' ? 'success' : state.status === 'error' ? 'error' : ''}`}>
          {state.status === 'submitting' && <div className="loading-spinner"></div>}
          {state.status === 'submitting' && <span>{t('teams.submitting')}</span>}
          {state.status === 'success' && <span>{t('teams.submissionSuccess')}</span>}
          {state.status === 'error' && <span>{t('teams.submissionError')}: {state.error}</span>}
           {/* Optionally add a dismiss button for errors */}
           {/* {state.status === 'error' && <button onClick={() => dispatch({ type: ACTIONS.RESET_STATUS })}>Dismiss</button>} */}
        </div>
      )}

      {/* Balance meter (same as before) */}
      {(teams.team1.length > 0 || teams.team2.length > 0) && (
         <div className="balance-meter">
           {/* ... (meter JSX unchanged) ... */}
            <div className="meter-label">{balanceDescription}</div>
          <div className="meter-bar">
            <div
              className={`meter-fill ${balanceQuality}`}
              style={{ width: `${balancePercentage}%` }}
            ></div>
          </div>
          <div className="meter-value">
            {t('teams.balancePercentage', { percentage: balancePercentage.toFixed(1) })}
            {scoreDifference > 0 && t('teams.pointDifference', { difference: scoreDifference.toFixed(1) })}
          </div>
         </div>
      )}

      {/* Admin Secret Modal controlled by reducer state */}
      <AdminSecretModal
        isOpen={state.status === 'awaitingSecret'}
        onClose={handleAdminModalClose}
        onSubmit={handleAdminModalSubmit}
        // Pass error message specifically related to modal input failure
        error={state.status === 'awaitingSecret' && state.error ? state.error : null}
      />

      {/* Confetti effect for successful game submission */}
      <Confetti
        isActive={state.status === 'success'}
        duration={3000}
      />
    </div>
  );
};

export default TeamsDisplay;