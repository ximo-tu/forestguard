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
    saveToHistory(diagnosis, payload);
    sendDiagnosisNotification(diagnosis);
  } catch (error) {
    const diagnosis = createLocalDiagnosis(payload, error);
    renderDiagnosis(diagnosis);
    saveToHistory(diagnosis, payload);
    sendDiagnosisNotification(diagnosis);
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
      ${renderTreatment(possibleCauses)}
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

const TREATMENT_GUIDE = {
  'oak wilt': {
    heading: 'Oak Wilt',
    steps: [
      'There is no cure for an actively infected tree — remove it promptly and chip or burn material on-site to prevent spread.',
      'Sever root connections to neighbors using a vibratory plow or trenching to at least 1.2 m depth before removal.',
      'Avoid all pruning wounds on oaks from April through July when sap beetles that vector the fungus are active.',
      'For high-value trees within 100 m of a confirmed infection, a licensed arborist can apply propiconazole (e.g., Alamo) as a preventive trunk injection.'
    ]
  },
  'dutch elm': {
    heading: 'Dutch Elm Disease',
    steps: [
      'Infected trees cannot be cured once the disease is systemic — remove and dispose of wood promptly (do not store as firewood).',
      'Prune flagging branches at least 3–4 m below the visible wilt to slow spread, disinfecting tools between cuts.',
      'Avoid wounding elms from April through August when bark beetles that carry the pathogen are most active.',
      'High-value elms can be protected with a licensed fungicide injection (propiconazole or thiabendazole) before infection occurs.'
    ]
  },
  'phytophthora': {
    heading: 'Phytophthora / Sudden Oak Death',
    steps: [
      'Remove and destroy heavily cankered branches; bag or burn material rather than chipping it on-site.',
      'Apply a phosphonate product (e.g., Agri-Fos) as a bark spray or trunk injection — this suppresses but does not eliminate the pathogen.',
      'Improve site drainage and avoid overhead irrigation to reduce conditions favorable for spore spread.',
      'Infected tanoaks and bay laurel are major inoculum sources; consult your state forestry agency for regulated disposal requirements.'
    ]
  },
  'ash borer': {
    heading: 'Emerald Ash Borer',
    steps: [
      'Trees with more than 50% canopy loss are generally not worth treating; remove them promptly as they become hazardous quickly.',
      'For trees with less than 50% canopy loss, a licensed applicator can inject emamectin benzoate (TREE-äge) or apply imidacloprid as a soil drench.',
      'Treat in spring before adult emergence; repeat every 1–2 years depending on product label.',
      'Do not move ash firewood, logs, or branches outside a regulated quarantine area — this is the primary way the pest spreads.'
    ]
  },
  'bark beetle': {
    heading: 'Bark Beetles',
    steps: [
      'Actively infested trees cannot be saved — fell and immediately remove, debark, chip, or burn material to kill larvae.',
      'Reduce predisposing stress: supplemental water during drought, avoid root compaction, and remove competing vegetation.',
      'Preventive pyrethroid or carbaryl bark sprays applied by a licensed pest control operator before flight season can protect high-value standing trees.',
      'Salvage logging of dead or dying trees reduces beetle breeding habitat but must happen quickly before adults emerge.'
    ]
  },
  'needle cast': {
    heading: 'Needle Cast / Foliar Blight',
    steps: [
      'Apply a registered fungicide (copper-based products or chlorothalonil) beginning at bud break in spring and repeat every 2–3 weeks through needle elongation.',
      'Remove and dispose of heavily infected branches in the lower crown to reduce overwintering spore loads.',
      'Improve air circulation by thinning surrounding trees and avoid overhead irrigation.',
      'Repeated years of defoliation weaken trees significantly — assess root and stem health and consider supplemental fertilization.'
    ]
  },
  'anthracnose': {
    heading: 'Anthracnose / Hardwood Foliar Blight',
    steps: [
      'Rake and destroy fallen leaves in autumn — they are the primary inoculum source for the following spring.',
      'Prune out dead twigs and water sprouts in late winter to improve air flow through the canopy.',
      'Fungicide sprays (chlorothalonil, copper, or mancozeb) applied at bud swell and again at leaf expansion provide good control in high-value trees.',
      'Most healthy, established hardwoods recover from anthracnose without permanent damage; monitor and withhold treatment in low-severity years.'
    ]
  },
  'armillaria': {
    heading: 'Armillaria Root Disease',
    steps: [
      'There is no effective chemical cure once a tree is infected — remove infected trees including as much of the root system as practical.',
      'Expose and dry the root collar of adjacent at-risk trees; physically remove any visible white mycelial fans or rhizomorphs.',
      'In high-value landscape settings, soil fumigation after stump grinding can reduce inoculum, though efficacy is variable.',
      'Replant with species known to be less susceptible to local Armillaria species; consult your state extension service for regional guidance.'
    ]
  },
  'abiotic': {
    heading: 'Abiotic Stress (Drought, Heat, Soil, Chemical)',
    steps: [
      'Identify and remove the underlying stressor first: restore adequate soil moisture, address compaction, or flush salt/chemical accumulation with deep irrigation.',
      'Apply a 7–10 cm organic mulch layer over the root zone (not against the trunk) to conserve soil moisture and moderate temperature.',
      'Avoid fertilizing stressed trees with high-nitrogen products — this can worsen drought stress; a light phosphorus or micronutrient application may help recovery.',
      'Monitor for secondary opportunistic pests and pathogens, which commonly colonize drought- or chemically-weakened trees.'
    ]
  }
};

function getTreatmentForCauses(causes) {
  const matched = [];
  const seen = new Set();

  for (const cause of causes) {
    const name = (cause.name || '').toLowerCase();
    let key = null;

    if (name.includes('oak wilt') || name.includes('vascular wilt')) key = 'oak wilt';
    else if (name.includes('elm')) key = 'dutch elm';
    else if (name.includes('phytophthora') || name.includes('sudden oak')) key = 'phytophthora';
    else if (name.includes('ash borer') || name.includes('emerald')) key = 'ash borer';
    else if (name.includes('bark beetle')) key = 'bark beetle';
    else if (name.includes('needle cast') || name.includes('foliar blight') || name.includes('needle')) key = 'needle cast';
    else if (name.includes('anthracnose') || name.includes('foliar') || name.includes('hardwood')) key = 'anthracnose';
    else if (name.includes('armillaria') || name.includes('root disease')) key = 'armillaria';
    else if (name.includes('abiotic') || name.includes('drought') || name.includes('stress')) key = 'abiotic';

    if (key && !seen.has(key) && TREATMENT_GUIDE[key]) {
      seen.add(key);
      matched.push(TREATMENT_GUIDE[key]);
    }
  }

  return matched;
}

function renderTreatment(causes) {
  const treatments = getTreatmentForCauses(causes);
  if (!treatments.length) return '';

  return `
    <section class="section-block treatment-block">
      <h4>Treatment &amp; Management</h4>
      ${treatments
        .map(
          (t) => `
        <div class="treatment-entry">
          <h5>${escapeHtml(t.heading)}</h5>
          <ul class="simple-list">
            ${t.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
          </ul>
        </div>
      `
        )
        .join('')}
      <p class="treatment-caveat">Treatment decisions should be confirmed with a certified arborist, forester, or plant diagnostic lab. Some products require a licensed applicator.</p>
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

// ─── History ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'fg-history';
const MAX_HISTORY = 30;
const historyDrawer = document.querySelector('#historyDrawer');
const historyBackdrop = document.querySelector('#historyBackdrop');
const historyList = document.querySelector('#historyList');
const historyButton = document.querySelector('#historyButton');
const closeHistoryButton = document.querySelector('#closeHistoryButton');
const clearHistoryButton = document.querySelector('#clearHistoryButton');

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveToHistory(diagnosis, payload) {
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    species: payload.species || 'Unknown species',
    location: payload.location || '',
    diagnosisTitle: diagnosis.diagnosisTitle,
    severity: diagnosis.severity,
    confidence: diagnosis.confidence,
    modelMode: diagnosis.modelMode,
    diagnosis,
    payload
  };
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function openHistory() {
  renderHistoryList();
  historyDrawer.hidden = false;
  historyBackdrop.hidden = false;
  historyButton.setAttribute('aria-expanded', 'true');
}

function closeHistory() {
  historyDrawer.hidden = true;
  historyBackdrop.hidden = true;
  historyButton.setAttribute('aria-expanded', 'false');
}

function renderHistoryList() {
  const history = getHistory();
  if (!history.length) {
    historyList.innerHTML = '<p class="history-empty">No diagnoses saved yet. Run an assessment to start building history.</p>';
    return;
  }
  historyList.innerHTML = history.map((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const severityClass = entry.severity === 'High' ? 'sev-high' : entry.severity === 'Moderate' ? 'sev-mod' : 'sev-low';
    return `
      <button class="history-entry" type="button" data-id="${escapeHtml(entry.id)}">
        <div class="history-entry-top">
          <span class="history-title">${escapeHtml(entry.diagnosisTitle)}</span>
          <span class="history-sev ${severityClass}">${escapeHtml(entry.severity)}</span>
        </div>
        <div class="history-entry-meta">
          <span>${escapeHtml(entry.species)}</span>
          ${entry.location ? `<span>· ${escapeHtml(entry.location)}</span>` : ''}
        </div>
        <div class="history-entry-meta">
          <span>${dateStr} ${timeStr}</span>
          <span>· ${escapeHtml(entry.confidence)}% · ${escapeHtml(entry.modelMode || '')}</span>
        </div>
      </button>
    `;
  }).join('');

  historyList.querySelectorAll('.history-entry').forEach((btn) => {
    btn.addEventListener('click', () => {
      const entry = getHistory().find((e) => e.id === btn.dataset.id);
      if (!entry) return;
      renderDiagnosis(entry.diagnosis);
      closeHistory();
    });
  });
}

historyButton.addEventListener('click', openHistory);
closeHistoryButton.addEventListener('click', closeHistory);
historyBackdrop.addEventListener('click', closeHistory);
clearHistoryButton.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistoryList();
});

// ─── Notifications ───────────────────────────────────────────────────────────

const notifButton = document.querySelector('#notifButton');
let notificationsEnabled = false;

function updateNotifButton() {
  const supported = 'Notification' in window;
  const granted = supported && Notification.permission === 'granted';
  const denied = supported && Notification.permission === 'denied';
  notificationsEnabled = granted;
  notifButton.textContent = granted ? '◉' : '◌';
  notifButton.title = denied ? 'Notifications blocked — check browser settings'
    : granted ? 'Notifications enabled'
    : 'Enable notifications';
  notifButton.dataset.state = granted ? 'on' : denied ? 'denied' : 'off';
}

async function toggleNotifications() {
  if (!('Notification' in window)) {
    notifButton.title = 'Notifications not supported in this browser';
    return;
  }
  if (Notification.permission === 'denied') return;
  if (Notification.permission === 'granted') {
    notificationsEnabled = !notificationsEnabled;
    updateNotifButton();
    return;
  }
  await Notification.requestPermission();
  updateNotifButton();
}

function sendDiagnosisNotification(diagnosis) {
  if (!notificationsEnabled || Notification.permission !== 'granted') return;
  const isUrgent = diagnosis.severity === 'High';
  new Notification(`ForestGuard${isUrgent ? ' — Urgent' : ''}: ${diagnosis.diagnosisTitle}`, {
    body: `Severity: ${diagnosis.severity}  ·  Confidence: ${diagnosis.confidence}%\n${diagnosis.summary?.slice(0, 100) || ''}`,
    tag: 'fg-diagnosis'
  });
}

notifButton.addEventListener('click', toggleNotifications);
updateNotifButton();

// ─── Demo Mode ───────────────────────────────────────────────────────────────

const DEMO_SCENARIOS = [
  {
    id: 'oak-wilt',
    label: 'Oak Wilt Outbreak',
    meta: 'White oak · Mixed hardwood · Asheville, NC',
    description: 'Rapid canopy decline in a clustered pattern after a wet spring. Classic vascular wilt presentation.',
    badgeSeverity: 'High',
    payload: {
      notes: 'Mixed hardwood stand near Asheville, NC. White oaks showing rapid wilting, brown leaf margins, crown thinning, and dark streaking under the bark. Symptoms appear in a tight cluster along a trail edge after a wet spring. Several trees have died in the last 3 weeks.',
      location: '35.61, -82.55',
      species: 'White oak',
      forestType: 'Mixed hardwood',
      affectedCount: 18,
      totalTrees: 75,
      symptoms: ['Wilting', 'Brown leaf margins', 'Canopy thinning']
    },
    diagnosis: {
      diagnosisTitle: 'Likely oak vascular wilt pattern',
      confidence: 82,
      severity: 'High',
      scope: '18 of 75 trees observed (24%)',
      summary: 'White oak observations with rapid wilting, brown leaf margins, crown thinning, and vascular streaking most closely fit oak wilt or a vascular wilt complex as a first-pass diagnosis. The clustered pattern along a trail edge and rapid progression are consistent with root-graft transmission, which is the primary spread pathway for Ceratocystis fagacearum in the eastern US.',
      possibleCauses: [
        { name: 'Oak wilt or vascular wilt complex', likelihood: 'High', rationale: 'White oak with rapid wilting, brown leaf margins, crown thinning, and dark streaking under bark strongly fits the vascular wilt profile. Clustered distribution after wet spring is consistent with root-graft transmission.', sourceIds: ['oak-wilt-review'] },
        { name: 'Armillaria or root disease', likelihood: 'Possible', rationale: 'Root disease can produce similar crown thinning and mortality patterns, especially in stressed hardwood stands. Should be evaluated at the root collar of declining trees.', sourceIds: ['armillaria-review'] },
        { name: 'Abiotic stress, drought, soil, or chemical injury', likelihood: 'Possible', rationale: 'Brown leaf margins and wilting can also result from late-season drought or soil disturbance. However, the rapid progression and clustered pattern are more consistent with an infectious cause.', sourceIds: ['abiotic-drought'] }
      ],
      sources: [
        SOURCE_LIBRARY['oak-wilt-review'],
        SOURCE_LIBRARY['armillaria-review'],
        SOURCE_LIBRARY['abiotic-drought']
      ],
      evidence: [
        'Reported host species: White oak.',
        'Forest type: Mixed hardwood.',
        'Location context: 35.61, -82.55.',
        'Symptoms selected: Wilting, Brown leaf margins, Canopy thinning.',
        'Natural-language notes describe rapid progression and clustered stand pattern.',
        'Affected stand estimate: 24%.'
      ],
      nextActions: [
        'Photograph the whole tree, crown, leaves, bark, root collar, and nearby unaffected trees.',
        'Map affected and unaffected trees to confirm the cluster is centered on a connected root system.',
        'Avoid all pruning wounds on oaks from April through July — sap beetles that vector oak wilt are active during this period.',
        'Check for vascular streaking (brown or tan discoloration under bark) on a recently dead or dying branch.',
        'Contact your county extension office or state forest health specialist — oak wilt is a reportable disease in some states.',
        'Do not move firewood or symptomatic material off-site until a diagnosis is confirmed.',
        'Escalate to a certified arborist, forester, or state forest health specialist within a few days.'
      ],
      riskFlags: [
        'Rapid symptom progression increases concern for an aggressive pest, pathogen, or acute stress.',
        'A 24% affected share with clustered pattern suggests root-graft transmission is already underway.',
        'Delaying removal and trenching allows underground fungal spread to adjacent healthy trees.'
      ],
      followUpQuestions: [
        'Is there any visible discoloration (brown or tan streaking) in the sapwood of dying branches?',
        'Have any oak trees been pruned or wounded in this stand in the past 2–3 months?',
        'Are the dead trees physically connected — overlapping canopy or proximity suggesting root contact?'
      ],
      imageInterpretation: 'No image was attached for this demo scenario.',
      disclaimer: 'Decision support only — this is a demo scenario with pre-built results. Confirm any real case with a qualified local forester, arborist, extension specialist, or plant diagnostic lab before treatment or removal.',
      modelMode: 'Demo'
    }
  },
  {
    id: 'ash-borer',
    label: 'Emerald Ash Borer',
    meta: 'Green ash · Urban forest · Ann Arbor, MI',
    description: 'D-shaped exit holes and serpentine galleries on multiple street ash trees. Canopy thinning across the block.',
    badgeSeverity: 'Moderate',
    payload: {
      notes: 'Street and park green ash trees in Ann Arbor showing canopy thinning from the top down, D-shaped exit holes in the bark, serpentine galleries visible under loose bark, and epicormic shoots sprouting from lower trunk. About 12 trees affected on two adjacent blocks.',
      location: 'Ann Arbor, Michigan',
      species: 'Green ash',
      forestType: 'Urban forest',
      affectedCount: 12,
      totalTrees: 40,
      symptoms: ['Exit holes', 'Canopy thinning']
    },
    diagnosis: {
      diagnosisTitle: 'Likely emerald ash borer infestation',
      confidence: 88,
      severity: 'Moderate',
      scope: '12 of 40 trees observed (30%)',
      summary: 'Green ash in an urban setting with D-shaped exit holes, serpentine galleries, top-down canopy thinning, and epicormic sprouting is a textbook emerald ash borer presentation. Michigan is a long-established EAB zone. Trees with less than 50% canopy loss may be candidates for treatment; those beyond that threshold are generally safety hazards and should be assessed for removal.',
      possibleCauses: [
        { name: 'Emerald ash borer or ash borer complex', likelihood: 'High', rationale: 'D-shaped exit holes (approximately 3–4 mm), serpentine S-shaped galleries under bark, top-down canopy dieback, and epicormic shooting are the diagnostic hallmarks of EAB on ash species. Michigan is a confirmed EAB region.', sourceIds: ['emerald-ash-borer-review'] },
        { name: 'Bark beetle attack with drought stress', likelihood: 'Possible', rationale: 'Other bark-boring beetles can produce similar exit holes, though typically larger and circular rather than D-shaped. Drought stress can predispose trees to secondary borers. Confirm gallery shape and exit hole geometry.', sourceIds: ['bark-beetle-eruptions', 'abiotic-drought'] }
      ],
      sources: [
        SOURCE_LIBRARY['emerald-ash-borer-review'],
        SOURCE_LIBRARY['bark-beetle-eruptions'],
        SOURCE_LIBRARY['abiotic-drought']
      ],
      evidence: [
        'Reported host species: Green ash.',
        'Forest type: Urban forest.',
        'Location context: Ann Arbor, Michigan — confirmed EAB quarantine zone.',
        'Symptoms selected: Exit holes, Canopy thinning.',
        'Notes describe D-shaped exit holes, serpentine galleries, epicormic sprouting.',
        'Affected stand estimate: 30%.'
      ],
      nextActions: [
        'Inspect each tree for D-shaped exit holes (3–4 mm wide) and S-shaped larval galleries under loose bark.',
        'Assess canopy loss percentage for each tree — trees over 50% canopy loss are generally beyond cost-effective treatment.',
        'Do not move ash logs, branches, or firewood outside the quarantine area.',
        'Contact a licensed commercial applicator for emamectin benzoate trunk injection (TREE-äge) on trees with less than 50% loss.',
        'Treatment must be applied in spring before adult emergence — coordinate timing with a local arborist.',
        'File a report with the Michigan Department of Agriculture if this block has not been previously documented.',
        'Recheck the stand in 7 to 14 days and compare symptom progression with new photos.'
      ],
      riskFlags: [
        'Michigan is in the core of the established EAB range — spread to untreated neighboring trees is expected.',
        'Urban ash trees with 50%+ canopy loss become structural hazards quickly; prioritize a safety assessment.',
        'EAB movement regulations apply — confirm disposal rules with local authorities before removing wood.'
      ],
      followUpQuestions: [
        'What percentage of each tree\'s canopy has been lost — less than 30%, 30–50%, or over 50%?',
        'Have any adjacent ash trees on neighboring blocks already been removed or treated?',
        'Are the exit holes clearly D-shaped (a key distinguishing feature from round holes left by other borers)?'
      ],
      imageInterpretation: 'No image was attached for this demo scenario.',
      disclaimer: 'Decision support only — this is a demo scenario with pre-built results. Confirm any real case with a qualified local forester, arborist, extension specialist, or plant diagnostic lab before treatment or removal.',
      modelMode: 'Demo'
    }
  },
  {
    id: 'bark-beetle',
    label: 'Mountain Pine Beetle + Drought',
    meta: 'Lodgepole pine · Montane conifer · Steamboat Springs, CO',
    description: 'Rapid red-needle crown fade across multiple ridge slopes. Pitch tubes and boring dust confirm active beetle attack under drought stress.',
    badgeSeverity: 'High',
    payload: {
      notes: 'Lodgepole pine stand on south-facing slopes above Steamboat Springs. Rapid needle reddening across the upper crown of multiple trees. Pitch tubes (white, popcorn-like resin masses) on lower trunk. Fine reddish boring dust at the base. Several trees fully red in crown — likely dead. Drought conditions have been severe for the past two summers.',
      location: 'Steamboat Springs, Colorado',
      species: 'Lodgepole pine',
      forestType: 'Boreal or montane conifer',
      affectedCount: 60,
      totalTrees: 200,
      symptoms: ['Pitch tubes', 'Needle discoloration', 'Canopy thinning']
    },
    diagnosis: {
      diagnosisTitle: 'Active bark beetle eruption with drought predisposition',
      confidence: 85,
      severity: 'High',
      scope: '60 of 200 trees observed (30%)',
      summary: 'Lodgepole pine on drought-stressed south-facing slopes with pitch tubes, boring dust, and rapid crown fade is a well-recognized bark beetle outbreak pattern. Prolonged drought reduces resin production, weakening tree defenses against mass attack. The 30% affected estimate on a prominent landscape feature suggests the outbreak is in an active expansion phase, not an isolated event.',
      possibleCauses: [
        { name: 'Bark beetle attack with drought stress', likelihood: 'High', rationale: 'Pitch tubes, reddish boring dust, and rapid top-down crown reddening in drought-stressed lodgepole pine are the diagnostic profile for mountain pine beetle (Dendroctonus ponderosae). South-facing slope and multi-year drought further elevate the risk.', sourceIds: ['bark-beetle-eruptions', 'abiotic-drought'] },
        { name: 'Abiotic stress, drought, soil, or chemical injury', likelihood: 'Moderate', rationale: 'Drought stress alone can cause needle browning and crown dieback in conifers, and likely predisposed these trees to beetle attack. Separating primary drought injury from secondary beetle colonization requires close inspection.', sourceIds: ['abiotic-drought'] },
        { name: 'Needle cast or foliar blight', likelihood: 'Possible', rationale: 'Foliar pathogens can produce needle discoloration that resembles early beetle-related crown fade. However, the presence of pitch tubes and boring dust makes a foliar pathogen unlikely as the primary cause.', sourceIds: ['swiss-needle-cast'] }
      ],
      sources: [
        SOURCE_LIBRARY['bark-beetle-eruptions'],
        SOURCE_LIBRARY['abiotic-drought'],
        SOURCE_LIBRARY['swiss-needle-cast']
      ],
      evidence: [
        'Reported host species: Lodgepole pine.',
        'Forest type: Boreal or montane conifer.',
        'Location context: Steamboat Springs, Colorado — historic MPB outbreak zone.',
        'Symptoms selected: Pitch tubes, Needle discoloration, Canopy thinning.',
        'Notes describe boring dust, pitch tubes, and south-facing drought-exposed aspect.',
        'Affected stand estimate: 30%.'
      ],
      nextActions: [
        'Confirm active attack by checking for reddish boring dust and S-shaped egg galleries under bark on a recently dead or dying tree.',
        'Do not attempt to treat currently infested trees — remove and destroy (debark, chip, or burn) infested material before adult emergence in early summer.',
        'Map red-crowned trees by GPS and compare to aerial imagery to estimate outbreak extent across the ridge.',
        'Consult the Colorado State Forest Service or USFS Rocky Mountain Region for current outbreak maps and salvage guidance.',
        'Assess fire risk — beetle-killed lodgepole creates significant ladder fuel loads; coordinate with local fire management.',
        'Prioritize removal of trees that pose a hazard to roads, structures, or high-use recreation areas.',
        'Escalate to a certified arborist, forester, or state forest health specialist within a few days.'
      ],
      riskFlags: [
        'A 30% affected stand estimate with rapid progression indicates an active outbreak, not isolated mortality.',
        'South-facing slopes under multi-year drought are the highest-risk sites — expect continued expansion.',
        'Beetle-killed conifer significantly increases wildfire risk on this landscape — flag for fire management review.'
      ],
      followUpQuestions: [
        'How many of the red-crowned trees were already fully brown (dead) versus showing early fade?',
        'Has the state forest service or USFS mapped this stand in their current aerial survey?',
        'Are there any green, apparently healthy trees intermixed, or is the mortality contiguous across the slope?'
      ],
      imageInterpretation: 'No image was attached for this demo scenario.',
      disclaimer: 'Decision support only — this is a demo scenario with pre-built results. Confirm any real case with a qualified local forester, arborist, extension specialist, or plant diagnostic lab before treatment or removal.',
      modelMode: 'Demo'
    }
  }
];

const demoButton = document.querySelector('#demoButton');
const demoModal = document.querySelector('#demoModal');
const closeDemoModal = document.querySelector('#closeDemoModal');
const demoScenarioGrid = document.querySelector('#demoScenarioGrid');

function openDemoModal() {
  renderDemoScenarios();
  demoModal.hidden = false;
}

function closeDemoModalFn() {
  demoModal.hidden = true;
}

function renderDemoScenarios() {
  demoScenarioGrid.innerHTML = DEMO_SCENARIOS.map((s) => {
    const sevClass = s.badgeSeverity === 'High' ? 'sev-high' : 'sev-mod';
    return `
      <button class="demo-card" type="button" data-scenario="${escapeHtml(s.id)}">
        <div class="demo-card-top">
          <span class="demo-card-title">${escapeHtml(s.label)}</span>
          <span class="history-sev ${sevClass}">${escapeHtml(s.badgeSeverity)}</span>
        </div>
        <p class="demo-card-meta">${escapeHtml(s.meta)}</p>
        <p class="demo-card-desc">${escapeHtml(s.description)}</p>
      </button>
    `;
  }).join('');

  demoScenarioGrid.querySelectorAll('.demo-card').forEach((card) => {
    card.addEventListener('click', () => {
      const scenario = DEMO_SCENARIOS.find((s) => s.id === card.dataset.scenario);
      if (!scenario) return;
      loadDemoScenario(scenario);
      closeDemoModalFn();
    });
  });
}

function loadDemoScenario(scenario) {
  const p = scenario.payload;
  form.reset();
  clearImage();
  document.querySelectorAll('.chip-grid .is-selected').forEach((c) => c.classList.remove('is-selected'));

  fields.notes.value = p.notes || '';
  fields.location.value = p.location || '';
  fields.species.value = p.species || '';
  if (p.forestType) fields.forestType.value = p.forestType;
  if (p.affectedCount != null) fields.affectedCount.value = p.affectedCount;
  if (p.totalTrees != null) fields.totalTrees.value = p.totalTrees;

  document.querySelectorAll('.chip-grid button').forEach((chip) => {
    chip.classList.toggle('is-selected', (p.symptoms || []).includes(chip.dataset.symptom));
  });

  updateAffectedRatio();
  renderDiagnosis(scenario.diagnosis);
  saveToHistory(scenario.diagnosis, p);
  sendDiagnosisNotification(scenario.diagnosis);
}

demoButton.addEventListener('click', openDemoModal);
closeDemoModal.addEventListener('click', closeDemoModalFn);
demoModal.addEventListener('click', (e) => { if (e.target === demoModal) closeDemoModalFn(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDemoModalFn(); closeHistory(); }
});
