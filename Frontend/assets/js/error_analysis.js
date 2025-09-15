const cardData = {
  master: {
    title: "Automatic BELNR Field Population",
    desc: "Implement automatic document number generation for missing BELNR fields using partner-specific patterns and date-based sequencing",
    confidence: "95%",
    risk: "LOW",
    steps: [
      "Analyze partner configuration and document type",
      "Generate document number using pattern: YYYYMMDD-[Partner]-[Sequence]",
      "Validate generated number against existing documents",
      "Update IDOC segment E1EDK01 with generated BELNR",
      "Trigger reprocessing of the IDOC"
    ],
    idocs: ["IDOC_00001", "IDOC_00005"]
  },
  partner: {
    title: "Partner Profile Issue Resolution",
    desc: "Implement automatic partner profile validation and correction using predefined templates and mappings.",
    confidence: "92%",
    risk: "LOW",
    steps: [
      "Check partner profile consistency",
      "Auto-correct missing fields",
      "Validate profile changes against SAP records",
      "Notify responsible user for review",
      "Reprocess affected IDOCs"
    ],
    idocs: ["IDOC_00011", "IDOC_00012"]
  },
  mapping: {
    title: "Mapping Error Correction",
    desc: "Detect and resolve mapping errors by applying standard mapping templates and verifying data integrity.",
    confidence: "90%",
    risk: "MEDIUM",
    steps: [
      "Identify erroneous mapping fields",
      "Apply standard mapping template",
      "Revalidate all mappings",
      "Update mapping in system",
      "Reprocess IDOCs with corrected mapping"
    ],
    idocs: ["IDOC_00021", "IDOC_00025"]
  },
  technical: {
    title: "Technical Failure Recovery",
    desc: "Automate recovery from technical failures by retrying failed operations and monitoring system health.",
    confidence: "88%",
    risk: "HIGH",
    steps: [
      "Detect failed technical operations",
      "Retry failed actions",
      "Log errors and notify admin",
      "Apply recovery protocol",
      "Reprocess affected IDOCs"
    ],
    idocs: ["IDOC_00031", "IDOC_00035"]
  }
};
 
function renderCard(cardKey) {
  const data = cardData[cardKey];
  return `
    <span class="solution-bolt-icon material-symbols-outlined">bolt</span>
    <div class="solution-title-row">
      <div class="solution-title">${data.title}</div>
    </div>
    <div class="solution-desc">
      ${data.desc}
    </div>
    <div class="confidence-risk-row">
      <span class="confidence-label">Confidence</span>
      <span class="confidence-value">${data.confidence}</span>
      <div class="confidence-bar"><div class="confidence-bar-inner"></div></div>
      <span class="risk-label">Risk Level</span>
      <span class="risk-value">${data.risk}</span>
    </div>
    <div class="implementation-title">Implementation Steps:</div>
    <ul class="implementation-list">
      ${data.steps.map((step, i) =>
        `<li><span class="step-number">${i + 1}</span> ${step}</li>`
      ).join("")}
    </ul>
    <div class="affected-idocs-title">Affected IDOCs:</div>
    ${data.idocs.map(idoc => `<span class="idoc-tag">${idoc}</span>`).join("")}
  `;
}
 
function selectCard(cardKey) {
  document.querySelectorAll('.error-card').forEach(card => card.classList.remove('card-active'));
  document.querySelector('.error-card[data-card="' + cardKey + '"]').classList.add('card-active');
  document.getElementById('dynamic-card').innerHTML = renderCard(cardKey);
}
 

// Initial load: show Master Data card details (works for dynamic HTML injection)
(function initErrorAnalysisCard(retry) {
  retry = retry || 0;
  var dynamicCard = document.getElementById('dynamic-card');
  if (dynamicCard) {
    dynamicCard.innerHTML = renderCard('master');
  } else if (retry < 20) {
    setTimeout(function() { initErrorAnalysisCard(retry + 1); }, 100);
  }
})();

function showErrorAnalysisDefaultCard() {
  var dynamicCard = document.getElementById('dynamic-card');
  if (dynamicCard) {
    selectCard('master');
  }
}