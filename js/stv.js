/**
 * Single Transferable Vote (STV) Election Engine
 * ==============================================
 * Pure JavaScript module implementing the Single Transferable Vote preferential
 * electoral system with fractional surplus transfers (Inclusive Gregory Method).
 */

export const CandidateStatus = Object.freeze({
  HOPEFUL: 'Hopeful',
  ELECTED: 'Elected',
  ELIMINATED: 'Eliminated',
});

/**
 * Represents an individual voter's ranked ballot.
 */
export class Ballot {
  /**
   * @param {string[]} preferences - Ranked list of candidate names (order of preference).
   * @param {number} [weight=1.0] - Floating point weight of the ballot.
   * @param {string} [id=null] - Optional identifier for audit tracking.
   */
  constructor(preferences, weight = 1.0, id = null) {
    if (weight < 0) {
      throw new Error(`Ballot weight cannot be negative: ${weight}`);
    }
    // Remove duplicates while preserving order
    const seen = new Set();
    this.preferences = [];
    for (const p of preferences) {
      const trimmed = p.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        this.preferences.push(trimmed);
      }
    }
    this.weight = Number(weight);
    this.id = id || Math.random().toString(36).substring(2, 9);
  }

  /**
   * Returns the top ranked candidate who is still active (hopeful).
   * @param {Set<string>} activeCandidates - Set of candidates currently hopeful.
   * @returns {string|null} - Name of next preferred candidate, or null if exhausted.
   */
  currentPreference(activeCandidates) {
    for (const candidate of this.preferences) {
      if (activeCandidates.has(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  /**
   * Creates a clone of this ballot.
   * @returns {Ballot}
   */
  clone() {
    return new Ballot([...this.preferences], this.weight, this.id);
  }
}

/**
 * Single Transferable Vote Election System.
 */
export class STVElection {
  /**
   * @param {string[]} candidates - List of candidate names.
   * @param {number} seats - Number of vacancies to fill.
   * @param {string} [quotaType='droop'] - 'droop' or 'hare'.
   * @param {number} [tolerance=1e-7] - Floating-point tolerance.
   */
  constructor(candidates, seats, quotaType = 'droop', tolerance = 1e-7) {
    if (!Number.isInteger(seats) || seats <= 0) {
      throw new Error('Number of seats must be a positive integer.');
    }
    const cleanCandidates = candidates.map(c => c.trim()).filter(Boolean);
    const unique = new Set(cleanCandidates);
    if (unique.size !== cleanCandidates.length) {
      throw new Error('Candidate names must be unique.');
    }
    if (seats > cleanCandidates.length) {
      throw new Error(`Number of seats (${seats}) cannot exceed candidates count (${cleanCandidates.length}).`);
    }

    this.candidates = cleanCandidates;
    this.seats = seats;
    this.quotaType = quotaType.toLowerCase();
    this.tolerance = tolerance;
  }

  /**
   * Computes the winning quota.
   * - Droop Quota: floor(valid_votes / (seats + 1)) + 1
   * - Hare Quota : valid_votes / seats
   * @param {number} totalVotes - Total weight of valid ballots.
   * @returns {number}
   */
  calculateQuota(totalVotes) {
    if (this.quotaType === 'droop') {
      return Math.floor(totalVotes / (this.seats + 1)) + 1.0;
    } else if (this.quotaType === 'hare') {
      return totalVotes / this.seats;
    } else {
      throw new Error(`Unknown quota type: ${this.quotaType}`);
    }
  }

  /**
   * Executes the full STV count.
   * @param {Ballot[]} originalBallots - Array of voter ballots.
   * @returns {Object} Full election result with rounds and summary.
   */
  count(originalBallots) {
    // Clone ballots so input is not mutated
    const ballots = originalBallots.map(b => b.clone());
    const totalValidVotes = ballots.reduce((acc, b) => acc + b.weight, 0);
    const quota = this.calculateQuota(totalValidVotes);

    /** @type {Record<string, string>} */
    const candidateStatus = {};
    for (const c of this.candidates) {
      candidateStatus[c] = CandidateStatus.HOPEFUL;
    }

    const electedList = [];
    const roundLogs = [];

    /** @type {Record<string, Ballot[]>} */
    const allocation = {};
    for (const c of this.candidates) {
      allocation[c] = [];
    }
    /** @type {Ballot[]} */
    const exhaustedBallots = [];

    // Initial distribution to first active preferences
    const activeSet = new Set(this.candidates);
    for (const b of ballots) {
      const pref = b.currentPreference(activeSet);
      if (pref !== null) {
        allocation[pref].push(b);
      } else {
        exhaustedBallots.push(b);
      }
    }

    let roundNum = 1;

    while (electedList.length < this.seats) {
      const hopefuls = this.candidates.filter(c => candidateStatus[c] === CandidateStatus.HOPEFUL);

      // Condition 1: If remaining hopefuls + already elected == seats, auto-elect all hopefuls
      if (electedList.length + hopefuls.length === this.seats) {
        const newlyElected = [];
        for (const c of hopefuls) {
          candidateStatus[c] = CandidateStatus.ELECTED;
          electedList.push(c);
          newlyElected.push(c);
        }

        const tallies = {};
        for (const c of this.candidates) {
          tallies[c] = allocation[c].reduce((sum, b) => sum + b.weight, 0);
        }
        const exhaustedVotes = exhaustedBallots.reduce((sum, b) => sum + b.weight, 0);

        const steps = [
          {
            stepNumber: 1,
            stage: 'AUTO_ELECT',
            title: 'Statutory Auto-Election',
            subtitle: `Active Candidates (${hopefuls.length}) Equal Remaining Vacancies`,
            speechText: `Active candidates equal remaining vacancies. Auto-electing: ${newlyElected.join(', ')}.`,
            narrative: `The number of continuing hopeful candidates (${hopefuls.length}) equals the remaining unfilled vacancies. In accordance with statutory STV rules, all remaining hopeful candidates (${newlyElected.join(', ')}) are declared ELECTED without requiring further vote transfers.`,
            metrics: { newlyElected, vacanciesFilled: this.seats, totalSeats: this.seats }
          }
        ];

        roundLogs.push({
          roundNumber: roundNum,
          tallies: { ...tallies },
          candidateStatus: { ...candidateStatus },
          exhaustedVotes,
          actionType: 'AUTO_ELECT',
          actionDescription: `Active candidates (${hopefuls.length}) equal remaining seats. Auto-electing: ${newlyElected.join(', ')}.`,
          electedThisRound: newlyElected,
          eliminatedThisRound: [],
          surplusTransferred: {},
          demonstrativeSteps: steps,
          transferBreakdown: [],
        });
        break;
      }

      // Calculate current vote tallies
      const tallies = {};
      for (const c of this.candidates) {
        tallies[c] = allocation[c].reduce((sum, b) => sum + b.weight, 0);
      }
      const exhaustedVotes = exhaustedBallots.reduce((sum, b) => sum + b.weight, 0);

      // Check if any hopeful candidate reached or exceeded quota
      const overQuota = hopefuls.filter(c => tallies[c] >= quota - this.tolerance);

      if (overQuota.length > 0) {
        // Choose candidate with highest vote total
        overQuota.sort((a, b) => tallies[b] - tallies[a]);
        const chosen = overQuota[0];
        candidateStatus[chosen] = CandidateStatus.ELECTED;
        electedList.push(chosen);

        const chosenVotes = tallies[chosen];
        const surplus = Math.max(0.0, chosenVotes - quota);
        const surplusInfo = {};

        const newActive = new Set(this.candidates.filter(c => candidateStatus[c] === CandidateStatus.HOPEFUL));

        if (surplus > this.tolerance && electedList.length < this.seats && newActive.size > 0) {
          // Fractional Transfer Value (Inclusive Gregory Method)
          const transferFactor = surplus / chosenVotes;
          surplusInfo[chosen] = {
            surplus,
            transferFactor,
            retained: quota,
          };

          const ballotsToTransfer = [];
          const retainedBallots = [];

          for (const b of allocation[chosen]) {
            const retainedWeight = b.weight * (1.0 - transferFactor);
            const transferredWeight = b.weight * transferFactor;

            retainedBallots.push(new Ballot([...b.preferences], retainedWeight, b.id));
            ballotsToTransfer.push(new Ballot([...b.preferences], transferredWeight, b.id));
          }

          allocation[chosen] = retainedBallots;

          // Distribute fractional surplus to next hopeful preference
          const prefCounts = {};
          const prefWeights = {};
          let exhaustedTransCount = 0;
          let exhaustedTransWeight = 0;

          for (const b of ballotsToTransfer) {
            const nextPref = b.currentPreference(newActive);
            if (nextPref !== null) {
              prefCounts[nextPref] = (prefCounts[nextPref] || 0) + 1;
              prefWeights[nextPref] = (prefWeights[nextPref] || 0) + b.weight;
              allocation[nextPref].push(b);
            } else {
              exhaustedTransCount++;
              exhaustedTransWeight += b.weight;
              exhaustedBallots.push(b);
            }
          }

          const breakdown = Object.keys(prefCounts).map(cand => ({
            candidate: cand,
            ballotCount: prefCounts[cand],
            transferredValue: prefWeights[cand],
            previousVotes: tallies[cand] || 0,
            newVotes: (tallies[cand] || 0) + prefWeights[cand]
          }));
          if (exhaustedTransCount > 0) {
            breakdown.push({
              candidate: 'Exhausted / Non-Transferable',
              ballotCount: exhaustedTransCount,
              transferredValue: exhaustedTransWeight,
              previousVotes: exhaustedVotes,
              newVotes: exhaustedVotes + exhaustedTransWeight,
              isExhausted: true
            });
          }

          const steps = [
            {
              stepNumber: 1,
              stage: 'STANDINGS_AUDIT',
              title: '1. First Preference Tally & Standings',
              subtitle: `Auditing active candidates against Winning Quota (${quota.toFixed(4)})`,
              speechText: `Auditing current tallies against winning quota of ${quota.toFixed(2)} votes. Candidate ${chosen} leads with ${chosenVotes.toFixed(2)} votes.`,
              narrative: `Candidate '${chosen}' has secured ${chosenVotes.toFixed(4)} votes, which meets or exceeds the winning quota threshold of ${quota.toFixed(4)} votes.`,
              metrics: { candidate: chosen, votes: chosenVotes, quota }
            },
            {
              stepNumber: 2,
              stage: 'OFFICIAL_DECLARATION',
              title: `2. Official Declaration of Winner #${electedList.length}`,
              subtitle: `Returning Officer Declaration for Vacancy #${electedList.length}`,
              speechText: `Candidate ${chosen} has met the quota. Declaring ${chosen} elected to seat number ${electedList.length}!`,
              narrative: `>> OFFICIAL DECLARATION: Candidate '${chosen}' has satisfied the quota threshold and is declared ELECTED to Seat #${electedList.length} of ${this.seats}! <<`,
              metrics: { candidate: chosen, seatNumber: electedList.length, totalSeats: this.seats }
            },
            {
              stepNumber: 3,
              stage: 'SURPLUS_CALCULATION',
              title: '3. Calculating Surplus & Fractional Transfer Value',
              subtitle: 'Inclusive Gregory Method Mathematical Formula',
              speechText: `Calculating surplus of ${surplus.toFixed(2)} votes. Transfer value factor is ${transferFactor.toFixed(4)} per ballot.`,
              narrative: `Candidate '${chosen}' retains exactly ${quota.toFixed(4)} votes to secure their seat. The surplus votes (${chosenVotes.toFixed(4)} - ${quota.toFixed(4)} = ${surplus.toFixed(4)}) are transferred to next preferences at a fractional value: Transfer Factor = Surplus / Total Votes = ${surplus.toFixed(4)} / ${chosenVotes.toFixed(4)} = ${transferFactor.toFixed(6)} per ballot.`,
              metrics: { totalVotes: chosenVotes, quota, surplus, transferFactor, retained: quota }
            },
            {
              stepNumber: 4,
              stage: 'PREFERENCE_INSPECTION',
              title: `4. Examining 2nd & Next Preferences on '${chosen}'s Ballots`,
              subtitle: `Auditing ${allocation[chosen].length + ballotsToTransfer.length} Ballots for Continuing Candidates`,
              speechText: `Auditing second preferences across ${chosen}'s ballots for redistribution.`,
              narrative: `Inspecting every physical ballot assigned to '${chosen}' to identify each voter's next continuing preference among the active hopeful candidates (${Array.from(newActive).join(', ')}).`,
              breakdown
            },
            {
              stepNumber: 5,
              stage: 'TRANSFER_EXECUTION',
              title: '5. Fractional Value Redistribution to Continuing Candidates',
              subtitle: 'Updating Active Hopeful Candidates Tally',
              speechText: `Transferred fractional surplus values to continuing active candidates.`,
              narrative: `Each active candidate receives their proportional share of fractional surplus votes: ${breakdown.filter(b => !b.isExhausted).map(b => `${b.candidate} (+${b.transferredValue.toFixed(4)})`).join(', ')}${exhaustedTransCount > 0 ? `, with ${exhaustedTransWeight.toFixed(4)} votes non-transferable (exhausted)` : ''}.`,
              breakdown
            }
          ];

          roundLogs.push({
            roundNumber: roundNum,
            tallies: { ...tallies },
            candidateStatus: { ...candidateStatus },
            exhaustedVotes,
            actionType: 'ELECT_SURPLUS',
            actionDescription: `Candidate '${chosen}' elected with ${chosenVotes.toFixed(4)} votes. Transferred surplus of ${surplus.toFixed(4)} (factor ${transferFactor.toFixed(6)}) to next preferences.`,
            electedThisRound: [chosen],
            eliminatedThisRound: [],
            surplusTransferred: surplusInfo,
            demonstrativeSteps: steps,
            transferBreakdown: breakdown,
          });
        } else {
          // No surplus to transfer or seats now full
          const steps = [
            {
              stepNumber: 1,
              stage: 'OFFICIAL_DECLARATION',
              title: `Official Declaration of Winner #${electedList.length}`,
              subtitle: `Candidate '${chosen}' Elected Exactly on Quota`,
              speechText: `Candidate ${chosen} elected with ${chosenVotes.toFixed(2)} votes. No surplus to transfer.`,
              narrative: `>> OFFICIAL DECLARATION: Candidate '${chosen}' has satisfied the quota threshold (${chosenVotes.toFixed(4)} votes) and is declared ELECTED to Seat #${electedList.length}! No surplus is transferable. <<`,
              metrics: { candidate: chosen, seatNumber: electedList.length, totalSeats: this.seats }
            }
          ];

          roundLogs.push({
            roundNumber: roundNum,
            tallies: { ...tallies },
            candidateStatus: { ...candidateStatus },
            exhaustedVotes,
            actionType: 'ELECT_NO_SURPLUS',
            actionDescription: `Candidate '${chosen}' elected with ${chosenVotes.toFixed(4)} votes (no surplus to transfer).`,
            electedThisRound: [chosen],
            eliminatedThisRound: [],
            surplusTransferred: {},
            demonstrativeSteps: steps,
            transferBreakdown: [],
          });
        }
      } else {
        // No candidate met quota: eliminate candidate with lowest vote total
        const hopefulsSorted = [...hopefuls].sort((a, b) => {
          const diff = tallies[a] - tallies[b];
          if (Math.abs(diff) > this.tolerance) {
            return diff;
          }
          return a.localeCompare(b); // Deterministic tie-breaker
        });

        const eliminated = hopefulsSorted[0];
        candidateStatus[eliminated] = CandidateStatus.ELIMINATED;

        const eliminatedBallots = allocation[eliminated];
        allocation[eliminated] = [];

        const newActive = new Set(this.candidates.filter(c => candidateStatus[c] === CandidateStatus.HOPEFUL));
        const countTransferred = eliminatedBallots.length;

        // Redistribute eliminated ballots at full current weight
        const prefCounts = {};
        const prefWeights = {};
        let exhaustedTransCount = 0;
        let exhaustedTransWeight = 0;

        for (const b of eliminatedBallots) {
          const nextPref = b.currentPreference(newActive);
          if (nextPref !== null) {
            prefCounts[nextPref] = (prefCounts[nextPref] || 0) + 1;
            prefWeights[nextPref] = (prefWeights[nextPref] || 0) + b.weight;
            allocation[nextPref].push(b);
          } else {
            exhaustedTransCount++;
            exhaustedTransWeight += b.weight;
            exhaustedBallots.push(b);
          }
        }

        const breakdown = Object.keys(prefCounts).map(cand => ({
          candidate: cand,
          ballotCount: prefCounts[cand],
          transferredValue: prefWeights[cand],
          previousVotes: tallies[cand] || 0,
          newVotes: (tallies[cand] || 0) + prefWeights[cand]
        }));
        if (exhaustedTransCount > 0) {
          breakdown.push({
            candidate: 'Exhausted / Non-Transferable',
            ballotCount: exhaustedTransCount,
            transferredValue: exhaustedTransWeight,
            previousVotes: exhaustedVotes,
            newVotes: exhaustedVotes + exhaustedTransWeight,
            isExhausted: true
          });
        }

        const steps = [
          {
            stepNumber: 1,
            stage: 'STANDINGS_AUDIT',
            title: '1. Quota Assessment',
            subtitle: `No Hopeful Candidate Reached Quota (${quota.toFixed(4)})`,
            speechText: `No candidate has reached the quota threshold of ${quota.toFixed(2)} votes.`,
            narrative: `All continuing hopeful candidates are below the Winning Quota threshold of ${quota.toFixed(4)} votes. Under statutory STV rules, candidate exclusion must take place.`,
            metrics: { quota, lowestVotes: tallies[eliminated] }
          },
          {
            stepNumber: 2,
            stage: 'TRAILING_ELIMINATION',
            title: `2. Trailing Candidate Exclusion: '${eliminated}'`,
            subtitle: `Lowest Candidate Eliminated with ${tallies[eliminated].toFixed(4)} Votes`,
            speechText: `Candidate ${eliminated} has the fewest votes and is eliminated from the race.`,
            narrative: `Candidate '${eliminated}' received the lowest vote total (${tallies[eliminated].toFixed(4)} votes). In accordance with exclusion rules, Candidate '${eliminated}' is ELIMINATED from the election.`,
            metrics: { eliminated, votes: tallies[eliminated], totalBallots: countTransferred }
          },
          {
            stepNumber: 3,
            stage: 'REDISTRIBUTION',
            title: `3. Redistributing '${eliminated}'s Ballots to 2nd / Next Preferences`,
            subtitle: `Transferring ${countTransferred} Ballots at Full Current Value`,
            speechText: `Redistributing ${eliminated}'s ballots to next preferences at full current value.`,
            narrative: `Examining next active preferences across all ${countTransferred} ballots from '${eliminated}'. Each ballot transfers to the voter's next continuing hopeful candidate at 100% of its current weight: ${breakdown.filter(b => !b.isExhausted).map(b => `${b.candidate} (+${b.transferredValue.toFixed(4)})`).join(', ')}${exhaustedTransCount > 0 ? `, with ${exhaustedTransWeight.toFixed(4)} votes non-transferable (exhausted)` : ''}.`,
            breakdown
          }
        ];

        roundLogs.push({
          roundNumber: roundNum,
          tallies: { ...tallies },
          candidateStatus: { ...candidateStatus },
          exhaustedVotes,
          actionType: 'ELIMINATE',
          actionDescription: `No candidate reached quota. Eliminated '${eliminated}' with ${tallies[eliminated].toFixed(4)} votes. Redistributed ${countTransferred} ballots at full current weight.`,
          electedThisRound: [],
          eliminatedThisRound: [eliminated],
          surplusTransferred: {},
          demonstrativeSteps: steps,
          transferBreakdown: breakdown,
        });
      }

      roundNum++;
    }

    const finalTallies = {};
    for (const c of this.candidates) {
      finalTallies[c] = allocation[c].reduce((sum, b) => sum + b.weight, 0);
    }
    const finalExhausted = exhaustedBallots.reduce((sum, b) => sum + b.weight, 0);

    return {
      seats: this.seats,
      quota,
      totalValidVotes,
      electedCandidates: electedList,
      rounds: roundLogs,
      finalTallies,
      exhaustedTotal: finalExhausted,
    };
  }
}
