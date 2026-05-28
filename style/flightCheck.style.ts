const styles = `
  .flight-check {
    min-height: 100vh;
    padding: 24px;
    background: #111113;
    color: #f7f4ee;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0 0 4px;
    color: #ffb347;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h1, h2, p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 0;
    font-size: 30px;
  }

  h2 {
    margin-bottom: 12px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .phone-clock {
    min-width: 128px;
    padding: 12px;
    border: 1px solid rgba(255, 179, 71, 0.28);
    border-radius: 16px;
    text-align: right;
    background: rgba(255, 255, 255, 0.05);
  }

  .phone-clock span,
  .field-hint {
    display: block;
    color: #ffb347;
    font-size: 12px;
    font-weight: 700;
  }

  .phone-clock strong {
    display: block;
    margin-top: 4px;
    font-size: 18px;
  }

  .phase-nav {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 10px;
    margin-bottom: 10px;
  }

  .phase-nav button,
  .secondary,
  .danger,
  .primary,
  .check-item,
  .mood-button {
    cursor: pointer;
    border: 0;
    font: inherit;
  }

  .phase-nav button {
    flex: 0 0 auto;
    padding: 10px 12px;
    border-radius: 999px;
    color: #ffb347;
    background: rgba(255, 255, 255, 0.06);
  }

  .phase-nav button.active {
    color: #111113;
    background: #ffb347;
    font-weight: 900;
  }

  .panel,
  .section {
    display: grid;
    gap: 12px;
  }

  .section {
    padding: 16px;
    border: 1px solid rgba(255, 179, 71, 0.18);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.045);
  }

  .flight-field label {
    display: block;
    margin-bottom: 8px;
    color: #ffb347;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .time-scroller {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) 92px;
    align-items: center;
    gap: 10px;
  }

  .time-scroller input,
  .time-scroller select,
  .checkpoint-count,
  .location-select {
    width: 100%;
    min-height: 46px;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #f7f4ee;
    background: #1f1f23;
    font-weight: 800;
  }

  .checkpoint-count {
    box-sizing: border-box;
  }

  .dropdown-toggle {
    display: flex;
    width: 100%;
    min-height: 48px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(255, 179, 71, 0.24);
    border-radius: 14px;
    color: #f7f4ee;
    background: rgba(255, 255, 255, 0.06);
    cursor: pointer;
    font: inherit;
    font-weight: 800;
  }

  .dropdown-toggle strong {
    color: #ffb347;
  }

  .dropdown-toggle.open {
    background: rgba(255, 179, 71, 0.14);
  }

  .dropdown-checklist {
    display: grid;
    gap: 10px;
  }

  .time-scroller span {
    color: #ffb347;
    font-weight: 900;
  }

  .checklist,
  .mood-grid {
    display: grid;
    gap: 10px;
  }

  .check-item {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 12px;
    border-radius: 14px;
    color: #f7f4ee;
    background: rgba(255, 255, 255, 0.06);
    text-align: left;
  }

  .check-item.checked {
    background: rgba(255, 179, 71, 0.16);
  }

  .box {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.28);
    border-radius: 7px;
    color: #111113;
    background: transparent;
    font-weight: 900;
  }

  .checked .box {
    border-color: #ffb347;
    background: #ffb347;
  }

  .mood-grid {
    grid-template-columns: repeat(7, minmax(38px, 1fr));
  }

  .mood-button {
    min-height: 46px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.06);
    font-size: 22px;
  }

  .mood-button.selected {
    outline: 2px solid #ffb347;
    background: rgba(255, 179, 71, 0.16);
  }

  .primary,
  .secondary,
  .danger {
    width: 100%;
    min-height: 48px;
    padding: 12px 16px;
    border-radius: 14px;
    font-weight: 900;
  }

  .primary {
    color: #111113;
    background: #ffb347;
  }

  .secondary {
    color: #f7f4ee;
    background: rgba(255, 255, 255, 0.08);
  }

  .danger {
    color: #ffffff;
    background: #ff3b30;
  }

  .countdown,
  .breath-count {
    margin-bottom: 0;
    color: #ffb347;
    font-size: 42px;
    font-weight: 900;
    text-align: center;
  }

  .progress-track {
    height: 14px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: #ffb347;
    transition: width 300ms ease;
  }

  .emergency-panel {
    border-color: rgba(255, 59, 48, 0.36);
  }

  .notice-panel {
    margin-bottom: 12px;
  }

  .contact-card p {
    margin-bottom: 4px;
    font-weight: 900;
  }

  .contact-card a {
    color: #ffb347;
    font-weight: 900;
    text-decoration: none;
  }

  @media (max-width: 560px) {
    .flight-check {
      padding: 16px;
    }

    .topbar {
      display: grid;
    }

    .phone-clock {
      width: 100%;
      box-sizing: border-box;
      text-align: left;
    }

    .mood-grid {
      grid-template-columns: repeat(4, minmax(42px, 1fr));
    }
  }
`;
