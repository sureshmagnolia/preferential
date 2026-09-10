import { STVElection, Ballot, CandidateStatus } from '../js/stv.js';

function runTests() {
  console.log("Running STV JavaScript Engine Tests...");
  let passed = 0;
  let failed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ ${name}`);
      failed++;
    }
  }

  // Test 1: Droop Quota calculation
  {
    const stv = new STVElection(['A', 'B', 'C'], 2, 'droop');
    // 100 votes, 2 seats => floor(100 / (2 + 1)) + 1 = floor(33.33) + 1 = 34
    assert(stv.calculateQuota(100) === 34, "Droop quota for 100 votes, 2 seats is 34");
    // 100 votes, 3 seats => floor(100 / 4) + 1 = 25 + 1 = 26
    const stv3 = new STVElection(['A', 'B', 'C', 'D'], 3, 'droop');
    assert(stv3.calculateQuota(100) === 26, "Droop quota for 100 votes, 3 seats is 26");
  }

  // Test 2: Standard 100-ballot 3-seat election matching Python result
  {
    const candidates = ["Alice", "Bob", "Charlie", "Diana", "Evan"];
    const seats = 3;
    const ballotGroups = [
      [["Alice", "Bob", "Diana"], 24],
      [["Alice", "Diana", "Bob"], 12],
      [["Bob", "Alice", "Diana"], 20],
      [["Charlie", "Evan", "Diana"], 18],
      [["Diana", "Bob", "Charlie"], 16],
      [["Evan", "Diana", "Charlie"], 10],
    ];

    const ballots = [];
    for (const [prefs, count] of ballotGroups) {
      for (let i = 0; i < count; i++) {
        ballots.push(new Ballot(prefs, 1.0));
      }
    }

    const stv = new STVElection(candidates, seats, 'droop');
    const result = stv.count(ballots);

    assert(result.quota === 26, "Election quota is 26");
    assert(result.totalValidVotes === 100, "Total valid votes is 100");
    assert(result.electedCandidates.length === 3, "3 candidates elected");
    assert(
      JSON.stringify(result.electedCandidates) === JSON.stringify(["Alice", "Bob", "Diana"]),
      "Elected order is Alice, Bob, Diana"
    );
    assert(result.rounds.length === 4, "Election completed in 4 rounds");
    console.log("  Sample election result rounds:", result.rounds.map(r => `R${r.roundNumber}: ${r.actionType}`));
  }

  // Test 3: Single-seat election (Instant Runoff Voting / Alternative Vote)
  {
    const candidates = ["Alpha", "Beta", "Gamma"];
    const ballots = [
      new Ballot(["Alpha", "Beta"], 1.0),
      new Ballot(["Beta", "Alpha"], 1.0),
      new Ballot(["Gamma", "Beta"], 1.0),
      new Ballot(["Beta", "Gamma"], 1.0),
      new Ballot(["Alpha", "Beta"], 1.0),
    ];
    // Alpha: 2, Beta: 2, Gamma: 1. Gamma eliminated, transfer to Beta -> Beta: 3 (>= quota 3)
    const stv = new STVElection(candidates, 1, 'droop');
    const res = stv.count(ballots);
    assert(res.quota === 3, "Single seat quota for 5 ballots is 3");
    assert(res.electedCandidates[0] === "Beta", "Beta elected via IRV redistribution");
  }

  // Test 4: Ballot exhaustion
  {
    const candidates = ["X", "Y", "Z"];
    const ballots = [
      new Ballot(["X"], 1.0),
      new Ballot(["Y"], 1.0),
      new Ballot(["Z"], 1.0),
    ];
    const stv = new STVElection(candidates, 2, 'droop');
    const res = stv.count(ballots);
    assert(res.electedCandidates.length === 2, "2 candidates elected under exhaustion scenario");
  }

  console.log(`\nTests Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
