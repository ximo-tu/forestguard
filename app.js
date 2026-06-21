const form = document.querySelector('#diagnosisForm');
const results = document.querySelector('#results');
const modePill = document.querySelector('#modePill');
const analyzeButton = document.querySelector('#analyzeButton');
const gpsButton = document.querySelector('#gpsButton');
const gpsStatus = document.querySelector('#gpsStatus');
const imageInput = document.querySelector('#imageInput');
const imagePreview = document.querySelector('#imagePreview');
const removeImage = document.querySelector('#removeImage');
const uploadZone = document.querySelector('#uploadZone');
const clearButton = document.querySelector('#clearButton');
const loadSample = document.querySelector('#loadSample');
const affectedRatioPreview = document.querySelector('#affectedRatioPreview');
const chipContainer = document.querySelector('#symptomChips');

let imageDataUrl = '';

const fields = {
  notes: document.querySelector('#notes'),
  location: document.querySelector('#location'),
  species: document.querySelector('#species'),
  forestType: document.querySelector('#forestType'),
  affectedCount: document.querySelector('#affectedCount'),
  totalTrees: document.querySelector('#totalTrees'),
  customSymptoms: document.querySelector('#customSymptoms')
};

const SOURCE_LIBRARY = {
  'oak-wilt-review': {
    id: 'oak-wilt-review',
    label: 'Oak wilt',
    title: 'Oak Wilt in the North Central United States',
    authors: 'Juzwik, Harrington, MacDonald & Appel',
    year: '2011',
    venue: 'Plant Disease',
    url: 'https://doi.org/10.1094/PDIS-12-10-0944',
    supports: 'Host range, wilt symptoms, transmission pathways, and rapid oak decline patterns.'
  },
  'dutch-elm-pathogen': {
    id: 'dutch-elm-pathogen',
    label: 'Dutch elm disease',
    title: 'Ophiostoma novo-ulmi sp. nov., causative agent of current Dutch elm disease pandemics',
    authors: 'Brasier',
    year: '1991',
    venue: 'Mycopathologia',
    url: 'https://link.springer.com/article/10.1007/BF00462219',
    supports: 'Elm vascular wilt disease agent and pandemic context.'
  },
  'sudden-oak-death-review': {
    id: 'sudden-oak-death-review',
    label: 'Sudden oak death',
    title: 'Phytophthora ramorum: Integrative Research and Management of an Emerging Pathogen in California and Oregon Forests',
    authors: 'Rizzo, Garbelotto & Hansen',
    year: '2005',
    venue: 'Annual Review of Phytopathology',
    url: 'https://doi.org/10.1146/annurev.phyto.42.040803.140418',
    supports: 'Host relationships, canker disease, epidemiology, and management of Phytophthora ramorum.'
  },
  'emerald-ash-borer-review': {
    id: 'emerald-ash-borer-review',
    label: 'Emerald ash borer',
    title: 'Emerald Ash Borer Invasion of North America: History, Biology, Ecology, Impacts, and Management',
    authors: 'Herms & McCullough',
    year: '2014',
    venue: 'Annual Review of Entomology',
    url: 'https://doi.org/10.1146/annurev-ento-011613-162051',
    supports: 'Ash host risk, canopy decline, galleries, spread, and management.'
  },
  'bark-beetle-eruptions': {
    id: 'bark-beetle-eruptions',
    label: 'Bark beetles',
    title: 'Cross-scale Drivers of Natural Disturbances Prone to Anthropogenic Amplification: The Dynamics of Bark Beetle Eruptions',
    authors: 'Raffa et al.',
    year: '2008',
    venue: 'BioScience',
    url: 'https://doi.org/10.1641/B580607',
    supports: 'Bark beetle outbreak dynamics and interactions with stressed forest conditions.'
  },
  'swiss-needle-cast': {
    id: 'swiss-needle-cast',
    label: 'Needle cast',
    title: 'Pseudothecia of Swiss Needle Cast Fungus, Phaeocryptopus gaeumannii, Physically Block Stomata of Douglas Fir, Reducing CO2 Assimilation',
    authors: 'Manter, Kelsey & Stone',
    year: '2000',
    venue: 'New Phytologist',
    url: 'https://doi.org/10.1046/j.1469-8137.2000.00779.x',
    supports: 'Needle-cast mechanism, needle discoloration, premature needle loss, and growth effects.'
  },
  'dogwood-anthracnose': {
    id: 'dogwood-anthracnose',
    label: 'Anthracnose',
    title: 'Dogwood Anthracnose: Understanding a Disease New to North America',
    authors: 'Daughtrey et al.',
    year: '1996',
    venue: 'Plant Disease',
    url: 'https://doi.org/10.1094/PD-80-0349',
    supports: 'Anthracnose-style foliar lesions, twig dieback, and hardwood decline context.'
  },
  'armillaria-review': {
    id: 'armillaria-review',
    label: 'Armillaria',
    title: 'Secrets of the Subterranean Pathosystem of Armillaria',
    authors: 'Baumgartner, Coetzee & Hoffmeister',
    year: '2011',
    venue: 'Molecular Plant Pathology',
    url: 'https://doi.org/10.1111/j.1364-3703.2010.00693.x',
    supports: 'Armillaria root disease biology, rhizomorph spread, and root-collar infection context.'
  },
  'abiotic-drought': {
    id: 'abiotic-drought',
    label: 'Drought stress',
    title: 'A Global Overview of Drought and Heat-Induced Tree Mortality Reveals Emerging Climate Change Risks for Forests',
    authors: 'Allen et al.',
    year: '2010',
    venue: 'Forest Ecology and Management',
    url: 'https://doi.org/10.1016/j.foreco.2009.09.001',
    supports: 'Drought and heat stress patterns that can mimic or intensify pest and disease symptoms.'
  }
};

chipContainer.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-symptom]');
  if (!chip) return;
  chip.classList.toggle('is-selected');
});

[fields.affectedCount, fields.totalTrees].forEach((field) => {
  field.addEventListener('input', updateAffectedRatio);
});

gpsButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    gpsStatus.textContent = 'GPS is not available in this browser.';
    return;
  }

  gpsStatus.textContent = 'Requesting location...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      fields.location.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      gpsStatus.textContent = `Captured within about ${Math.round(accuracy)} meters.`;
    },
    () => {
      gpsStatus.textContent = 'Location permission was not granted.';
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

imageInput.addEventListener('change', () => {
  const [file] = imageInput.files;
  if (file) handleImage(file);
});

['dragenter', 'dragover'].forEach((type) => {
  uploadZone.addEventListener(type, (event) => {
    event.preventDefault();
    uploadZone.classList.add('is-dragging');
  });
});

['dragleave', 'drop'].forEach((type) => {
  uploadZone.addEventListener(type, (event) => {
    event.preventDefault();
    uploadZone.classList.remove('is-dragging');
  });
});

uploadZone.addEventListener('drop', (event) => {
  const [file] = event.dataTransfer.files;
  if (file && file.type.startsWith('image/')) handleImage(file);
});

removeImage.addEventListener('click', (event) => {
  event.preventDefault();
  clearImage();
});

clearButton.addEventListener('click', () => {
  form.reset();
  clearImage();
  document.querySelectorAll('.chip-grid .is-selected').forEach((chip) => chip.classList.remove('is-selected'));
  updateAffectedRatio();
  modePill.textContent = 'Ready';
  results.className = 'results empty-state';
  results.innerHTML = `
    <div class="empty-illustration" aria-hidden="true"></div>
    <h3>No diagnosis yet</h3>
    <p>Enter what you observed in the field, add any known stand details, then run the assessment.</p>
  `;
});

loadSample.addEventListener('click', () => {
  fields.notes.value =
    'Mixed hardwood stand near Asheville, North Carolina. White oaks are showing rapid wilting, brown leaf margins, crown thinning, and dark streaking under the bark. Symptoms appear in a cluster along a trail edge after a wet spring.';
  fields.location.value = '35.61, -82.55';
  fields.species.value = 'White oak';
  fields.forestType.value = 'Mixed hardwood';
  fields.affectedCount.value = '18';
  fields.totalTrees.value = '75';
  fields.customSymptoms.value = 'dark streaking under bark, clustered pattern';
  document.querySelectorAll('.chip-grid button').forEach((chip) => {
    chip.classList.toggle(
      'is-selected',
      ['Wilting', 'Brown leaf margins', 'Canopy thinning'].includes(chip.dataset.symptom)
    );
  });
  updateAffectedRatio();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = collectPayload();

  if (!payload.notes && !payload.species && payload.symptoms.length === 0) {
    modePill.textContent = 'Needs details';
    results.className = 'results empty-state';
    results.innerHTML = `
      <div class="empty-illustration" aria-hidden="true"></div>
      <h3>Add a few observations</h3>
      <p>A species, symptom, or field note is needed before the tool can assess the case.</p>
    `;
    return;
  }

  setLoading();

  try {
    if (window.location.protocol === 'file:') {
      throw new Error('Server is not running.');
    }

    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const diagnosis = await response.json();
    renderDiagnosis(diagnosis);
  } catch (error) {
    renderDiagnosis(createLocalDiagnosis(payload, error));
  }
});

function handleImage(file) {
  if (file.size > 7 * 1024 * 1024) {
    modePill.textContent = 'Image too large';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = reader.result;
    imagePreview.src = imageDataUrl;
    imagePreview.hidden = false;
    removeImage.hidden = false;
    uploadZone.querySelector('.upload-copy span').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  imageDataUrl = '';
  imageInput.value = '';
  imagePreview.src = '';
  imagePreview.hidden = true;
  removeImage.hidden = true;
  uploadZone.querySelector('.upload-copy span').textContent = 'Drop a photo or choose one from your device.';
}

function collectPayload() {
  const symptoms = [...document.querySelectorAll('.chip-grid .is-selected')].map((chip) => chip.dataset.symptom);
  const customSymptoms = fields.customSymptoms.value
    .split(',')
    .map((symptom) => symptom.trim())
    .filter(Boolean);

  return {
    notes: fields.notes.value.trim(),
    location: fields.location.value.trim(),
    species: fields.species.value.trim(),
    forestType: fields.forestType.value,
    affectedCount: parseNumber(fields.affectedCount.value),
    totalTrees: parseNumber(fields.totalTrees.value),
    symptoms: [...new Set([...symptoms, ...customSymptoms])],
    imageDataUrl,
    capturedAt: new Date().toISOString()
  };
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function updateAffectedRatio() {
  const affected = parseNumber(fields.affectedCount.value) || 0;
  const total = parseNumber(fields.totalTrees.value) || 0;
  const ratio = total > 0 ? Math.min(100, Math.round((affected / total) * 100)) : 0;
  affectedRatioPreview.textContent = `${ratio}%`;
}

function setLoading() {
  analyzeButton.disabled = true;
  modePill.textContent = 'Assessing';
  results.className = 'results loading';
  results.innerHTML = `
    <div class="loading-bar" aria-hidden="true"></div>
    <h3>Reviewing the case</h3>
    <p>Checking the pattern against species, symptoms, location, stand context, and the uploaded image if a live model is configured.</p>
  `;
}

function renderDiagnosis(diagnosis) {
  analyzeButton.disabled = false;
  modePill.textContent = diagnosis.modelMode || 'Complete';
  results.className = 'results';

  const possibleCauses = diagnosis.possibleCauses || [];
  const evidence = diagnosis.evidence || [];
  const nextActions = diagnosis.nextActions || [];
  const questions = diagnosis.followUpQuestions || [];
  const riskFlags = diagnosis.riskFlags || [];
  const sources = diagnosis.sources?.length ? diagnosis.sources : collectSources(possibleCauses);

  results.innerHTML = `
    <article class="diagnosis-card">
      <div class="diagnosis-summary">
        <div class="diagnosis-title-row">
          <h3>${escapeHtml(diagnosis.diagnosisTitle || 'Forest health issue')}</h3>
          <span class="confidence-badge">${escapeHtml(String(diagnosis.confidence ?? 'N/A'))}%</span>
        </div>
        <p>${escapeHtml(diagnosis.summary || 'No summary returned.')}</p>
        <div class="severity">
          <span class="tag">Severity: <strong>${escapeHtml(diagnosis.severity || 'Unknown')}</strong></span>
          <span class="tag">Scope: ${escapeHtml(diagnosis.scope || 'Unknown')}</span>
        </div>
      </div>

      ${renderCauseList(possibleCauses)}
      ${renderList('Evidence used', evidence)}
      ${renderList('Recommended next actions', nextActions)}
      ${riskFlags.length ? renderList('Risk flags', riskFlags) : ''}
      ${diagnosis.imageInterpretation ? renderList('Image note', [diagnosis.imageInterpretation]) : ''}
      ${questions.length ? renderList('Follow-up questions', questions) : ''}
      ${renderSources(sources)}
      <p class="disclaimer">${escapeHtml(diagnosis.disclaimer || 'Decision support only. Confirm with a qualified local professional or diagnostic lab before treatment.')}</p>
    </article>
  `;
}

function renderCauseList(causes) {
  if (!causes.length) return '';
  return `
    <section class="section-block">
      <h4>Most likely causes</h4>
      <ul class="cause-list">
        ${causes
          .map(
            (cause) => `
              <li>
                <div class="cause-topline">
                  <span>${escapeHtml(cause.name || 'Possible cause')}</span>
                  <span class="likelihood">${escapeHtml(cause.likelihood || 'Possible')}</span>
                </div>
                <p>${escapeHtml(cause.rationale || '')}</p>
                ${renderSourceBadges(cause.sourceIds || [])}
              </li>
            `
          )
          .join('')}
      </ul>
    </section>
  `;
}

function renderSourceBadges(sourceIds) {
  const labels = sourceIds.map((id) => SOURCE_LIBRARY[id]?.label).filter(Boolean);
  if (!labels.length) return '';
  return `<div class="source-badges">${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('')}</div>`;
}

function renderSources(sources) {
  if (!sources.length) return '';
  return `
    <section class="section-block sources-block">
      <h4>Sources</h4>
      <ul class="source-list">
        ${sources
          .map(
            (source) => `
              <li>
                <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a>
                <p>${escapeHtml(source.authors)} (${escapeHtml(source.year)}), ${escapeHtml(source.venue)}.</p>
                <span>${escapeHtml(source.supports)}</span>
              </li>
            `
          )
          .join('')}
      </ul>
    </section>
  `;
}

function collectSources(causes) {
  const ids = new Set();
  causes.forEach((cause) => (cause.sourceIds || []).forEach((id) => ids.add(id)));
  return [...ids].map((id) => SOURCE_LIBRARY[id]).filter(Boolean);
}

function renderList(title, items) {
  if (!items.length) return '';
  return `
    <section class="section-block">
      <h4>${escapeHtml(title)}</h4>
      <ul class="simple-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderError(error) {
  analyzeButton.disabled = false;
  modePill.textContent = 'Error';
  results.className = 'results empty-state';
  results.innerHTML = `
    <div class="empty-illustration" aria-hidden="true"></div>
    <h3>Assessment could not run</h3>
    <p>${escapeHtml(error.message || 'Please try again.')}</p>
  `;
}

function createLocalDiagnosis(payload, error) {
  const caseText = [
    payload.notes,
    payload.location,
    payload.species,
    payload.forestType,
    ...(payload.symptoms || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const ratio =
    Number.isFinite(payload.affectedCount) && Number.isFinite(payload.totalTrees) && payload.totalTrees > 0
      ? Math.max(0, Math.min(1, payload.affectedCount / payload.totalTrees))
      : 0;

  const profiles = [
    {
      name: 'Oak wilt or vascular wilt complex',
      title: 'Likely oak vascular wilt pattern',
      species: ['oak', 'quercus'],
      terms: ['wilting', 'brown leaf margins', 'bronzing', 'rapid', 'crown thinning', 'streaking', 'vascular'],
      sourceIds: ['oak-wilt-review'],
      rationale: 'Oak species plus wilting, leaf browning, crown thinning, or bark streaking can indicate a vascular wilt pattern.'
    },
    {
      name: 'Emerald ash borer or ash borer complex',
      title: 'Likely ash borer investigation',
      species: ['ash', 'fraxinus'],
      terms: ['exit holes', 'd-shaped', 'canopy thinning', 'epicormic', 's-shaped', 'bark splitting'],
      sourceIds: ['emerald-ash-borer-review'],
      rationale: 'Ash species with exit holes, bark splitting, canopy thinning, or epicormic shoots should be checked for borer activity.'
    },
    {
      name: 'Bark beetle attack with drought stress',
      title: 'Likely bark beetle or drought-stress complex',
      species: ['pine', 'spruce', 'fir', 'conifer', 'cedar'],
      terms: ['pitch tubes', 'boring dust', 'red needles', 'needle discoloration', 'drought', 'canopy thinning'],
      sourceIds: ['bark-beetle-eruptions', 'abiotic-drought'],
      rationale: 'Conifers with pitch tubes, boring dust, red needles, or rapid crown fade often need bark beetle and drought checks.'
    },
    {
      name: 'Needle cast or foliar blight',
      title: 'Possible foliar needle disease',
      species: ['spruce', 'pine', 'fir', 'conifer'],
      terms: ['needle discoloration', 'leaf spots', 'defoliation', 'lower crown', 'wet spring'],
      sourceIds: ['swiss-needle-cast'],
      rationale: 'Needle discoloration, spotting, and lower-crown defoliation after wet weather can fit needle cast or foliar blight.'
    },
    {
      name: 'Armillaria or root disease',
      title: 'Possible root disease center',
      species: ['oak', 'conifer', 'pine', 'hardwood', 'fir'],
      terms: ['mushrooms at base', 'root decay', 'white mycelium', 'basal', 'windthrow', 'crown thinning'],
      sourceIds: ['armillaria-review'],
      rationale: 'Basal mushrooms, root decay, crown thinning, and grouped mortality can indicate root disease.'
    },
    {
      name: 'Abiotic stress, drought, soil, or chemical injury',
      title: 'Possible non-infectious stress pattern',
      species: [],
      terms: ['scorch', 'brown leaf margins', 'drought', 'heat', 'road salt', 'herbicide', 'uniform', 'soil compaction'],
      sourceIds: ['abiotic-drought'],
      rationale: 'Leaf-margin scorch, uniform exposure patterns, recent heat, soil disruption, or chemical exposure can mimic disease.'
    }
  ];

  const scored = profiles
    .map((profile) => {
      let score = 0;
      const species = String(payload.species || '').toLowerCase();
      profile.terms.forEach((term) => {
        if (caseText.includes(term)) score += 1;
      });
      if (profile.species.some((term) => species.includes(term) || caseText.includes(term))) score += 2;
      if (ratio >= 0.2 && /wilt|root/i.test(profile.name)) score += 1;
      if (ratio > 0.55 && /Abiotic/i.test(profile.name)) score += 1;
      return { ...profile, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const causes = scored
    .filter((profile) => profile.score > 0)
    .slice(0, 4)
    .map((profile, index) => ({
      name: profile.name,
      likelihood: index === 0 && profile.score >= 5 ? 'High' : profile.score >= 3 ? 'Moderate' : 'Possible',
      rationale: profile.rationale,
      sourceIds: profile.sourceIds || []
    }));

  if (!causes.length) {
    causes.push({
      name: 'Undifferentiated forest health decline',
      likelihood: 'Possible',
      rationale: 'Add host species, symptom timing, stand pattern, and close-up signs to separate disease, insects, and abiotic stress.',
      sourceIds: ['abiotic-drought']
    });
  }

  const evidence = [];
  if (payload.species) evidence.push(`Reported host species: ${payload.species}.`);
  if (payload.forestType) evidence.push(`Forest type: ${payload.forestType}.`);
  if (payload.location) evidence.push(`Location context: ${payload.location}.`);
  if (payload.symptoms?.length) evidence.push(`Symptoms selected: ${payload.symptoms.join(', ')}.`);
  if (ratio > 0) evidence.push(`Affected stand estimate: ${Math.round(ratio * 100)}%.`);

  return {
    diagnosisTitle: best.score > 0 ? best.title : 'Additional field details needed',
    confidence: best.score > 0 ? Math.min(78, Math.max(36, 34 + best.score * 8)) : 24,
    severity: ratio >= 0.45 || best.score >= 7 ? 'High' : ratio >= 0.18 || best.score >= 4 ? 'Moderate' : 'Low to moderate',
    scope:
      Number.isFinite(payload.affectedCount) && Number.isFinite(payload.totalTrees) && payload.totalTrees > 0
        ? `${payload.affectedCount} of ${payload.totalTrees} trees observed (${Math.round(ratio * 100)}%)`
        : 'Unknown stand scope',
    summary:
      best.score > 0
        ? `The observations most closely fit ${causes[0].name.toLowerCase()} as a first-pass diagnosis. Confirm with local field inspection before treatment.`
        : 'The current observations are not specific enough for a strong triage result.',
    possibleCauses: causes,
    sources: collectSources(causes),
    evidence: evidence.length ? evidence : ['Limited field context was provided.'],
    nextActions: buildLocalActions(causes[0].name, ratio),
    riskFlags: [
      ...(ratio >= 0.35 ? ['A large affected share suggests urgent follow-up or a stand-level stressor.'] : []),
      ...(payload.imageDataUrl ? ['Photo attached, but visual interpretation requires the optional live AI server.'] : []),
      ...(error ? ['Using local triage because the live diagnosis server is not reachable.'] : [])
    ],
    followUpQuestions: [
      ...(!payload.location ? ['What county, state, or GPS coordinate is the stand in?'] : []),
      ...(!payload.species ? ['What species or genus are the affected trees?'] : []),
      'Are affected trees clustered, scattered, along an edge, or following a road or drainage line?',
      'How quickly did symptoms appear or spread?'
    ].slice(0, 5),
    imageInterpretation: payload.imageDataUrl
      ? 'Image was attached. Start the optional live AI server for visual interpretation.'
      : 'No image was attached.',
    disclaimer:
      'Decision support only. Confirm with a qualified local forester, arborist, extension specialist, or plant diagnostic lab before treatment or removal.',
    modelMode: 'Local in-browser'
  };
}

function buildLocalActions(primaryCause, ratio) {
  const actions = [
    'Photograph the whole tree, crown, leaves or needles, bark, root collar, and nearby unaffected trees.',
    'Map affected and unaffected trees to see whether the pattern is clustered, linear, edge-related, or scattered.',
    'Avoid pruning, moving firewood, or transporting symptomatic material until a high-risk pest or pathogen is ruled out.'
  ];

  if (/oak wilt|vascular/i.test(primaryCause)) {
    actions.push('Check for vascular streaking under bark and contact a local extension office or plant pathology lab before pruning oaks.');
  }

  if (/ash borer/i.test(primaryCause)) {
    actions.push('Inspect ash bark for D-shaped exit holes, S-shaped galleries, bark splitting, and epicormic shoots.');
  }

  if (/bark beetle/i.test(primaryCause)) {
    actions.push('Look for pitch tubes, reddish boring dust, galleries under bark, and recent drought or storm stress.');
  }

  actions.push(ratio >= 0.35 ? 'Escalate to a certified arborist, forester, or state forest health specialist within a few days.' : 'Recheck the stand in 7 to 14 days and compare symptom progression with new photos.');
  return actions.slice(0, 7);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
