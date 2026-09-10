# Single Transferable Vote (STV) Preferential Election Simulator

An interactive, responsive client-side web application simulating preferential elections using the **Single Transferable Vote (STV)** system with **Droop Quota** and **Fractional Surplus Transfers (Inclusive Gregory Method)**.

Deployed effortlessly to **GitHub Pages** with zero build configuration or backend servers.

---

## 🌟 Key Features

- **Standard STV Mathematical Precision**:
  - **Droop Quota**: $\lfloor \frac{\text{Valid Votes}}{\text{Seats} + 1} \rfloor + 1$ (also supports **Hare Quota**: $\frac{\text{Valid Votes}}{\text{Seats}}$).
  - **Ballot Weights**: Tracked as floating-point values starting at $1.0$.
  - **Inclusive Gregory Fractional Transfer**: Surplus votes $(\text{Total Votes} - \text{Quota})$ are transferred to subsequent preferences scaled by the fractional transfer factor $\frac{\text{Surplus}}{\text{Total Votes}}$, preserving voter intent without paper sampling randomness.
  - **Lowest Candidate Elimination**: When no candidate reaches quota, the lowest-polling candidate is eliminated and their ballots are redistributed at full current weight.
  - **Exhaustion Tracking**: Ballots with no remaining active preferences are recorded as exhausted votes.
  - **Auto-Election**: When active hopefuls equal remaining vacancies, all are elected automatically.
- **Interactive UI & Visualizer**:
  - Real-time candidate cards with animated progress bars and an overlaid **Winning Quota Threshold line**.
  - Stepper controls: Step forwards, backwards, jump to final results, or auto-play through rounds with speed control.
  - Detailed **Round Audit Log & Mathematical Narrative** breaking down exact formulas and surplus distribution.
- **Preset Election Scenarios**:
  - *City Council*: 3 Seats, 5 Candidates, 100 Ballots (demonstrates multi-round surplus transfer & elimination).
  - *Student Union Executive*: 2 Seats, 4 Candidates, 50 Ballots.
  - *Presidential Runoff*: 1 Seat, 4 Candidates, 45 Ballots (instant-runoff voting mode).
- **Custom Ballot Editor & Import/Export**:
  - Live candidate manager and seat config.
  - Custom preference group builder (e.g., `24 : Alice > Bob > Diana`).
  - Export audit results to structured JSON.
- **Zero-Build & 100% Static**:
  - Pure HTML5, modern Vanilla CSS with dark/light themes, and ES6 JavaScript.
  - Works locally right out of the box and deploys to GitHub Pages in seconds.

---

## 🚀 Instant Deployment to GitHub Pages

### Option A: Standard GitHub Pages Branch Deployment (Easiest)

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `stv-election-simulator`).
2. Initialize and push this folder to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: STV election web app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Navigate to **Settings** &rarr; **Pages** (under Code and automation).
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under Branch, select `main` and folder `/ (root)`. Click **Save**.
4. Your simulator is now live at:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```

### Option B: Automated GitHub Actions Deployment

A ready-to-use GitHub Actions workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Under **Settings** &rarr; **Pages** &rarr; **Source**, select **GitHub Actions**.
- GitHub will automatically deploy your app on every commit to `main`.

---

## 💻 Running Locally

Because the app uses standard ES6 modules, it is best served via any local HTTP server:

### Using Python
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

### Using Node.js
```bash
npx serve .
```

---

## 📂 Project Structure

```
stv-web-app/
├── index.html                   # Main semantic HTML dashboard and modal dialogs
├── css/
│   └── style.css                # Tailored design system, dark mode & animations
├── js/
│   ├── stv.js                   # Pure STV algorithmic engine & Ballot class
│   └── app.js                   # Reactive UI controller, presets & stepper
├── test/
│   └── test_stv.js              # Automated unit tests for STV mathematical logic
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deployment workflow
└── README.md                    # Documentation & GitHub deployment guide
```

---

## 🧪 Testing the STV Logic

To run the automated mathematical test suite:
```bash
node test/test_stv.js
```
Expected output:
```
Running STV JavaScript Engine Tests...
  ✓ Droop quota for 100 votes, 2 seats is 34
  ✓ Droop quota for 100 votes, 3 seats is 26
  ✓ Election quota is 26
  ✓ Total valid votes is 100
  ✓ 3 candidates elected
  ✓ Elected order is Alice, Bob, Diana
  ✓ Election completed in 4 rounds
  ✓ Single seat quota for 5 ballots is 3
  ✓ Beta elected via IRV redistribution
  ✓ 2 candidates elected under exhaustion scenario

Tests Summary: 10 passed, 0 failed.
```

---

## 📄 License
MIT License. Open source and free for educational, municipal, and institutional use.
