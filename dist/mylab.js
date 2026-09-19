(() => {
  const i18nNodes = [...document.querySelectorAll('[data-i18n]')];
  const ru = Object.fromEntries(i18nNodes.map((node) => [node.dataset.i18n, node.textContent.trim()]));
  const en = {
    mapKind: 'LAYER MAP', mapCompute: 'Physical foundation', mapData: 'Data',
    mapHint: 'Choose a layer to explore its story. A case map, not live monitoring.',
    conclusionNote: 'MyLab is my full-cycle practice: from crimping cables and installing a hypervisor to diagnosing failures and verifying data. Not just launching systems, but understanding how they work.',
    skip: 'Skip to the case study', navHardware: 'Hardware', navNetwork: 'Network', navRecovery: 'Recovery', back: 'All projects ',
    heroKicker: 'PERSONAL INFRASTRUCTURE', heroLead: 'My infrastructure. From cable to cluster.',
    heroNote: 'From two GPUs and Proxmox to a hand-built network, Kubernetes, Grafana and a verifiable archive.', heroCta: 'Open the case map',
    heroProof: 'Primary compute host · two physical GPUs', metricNodes: 'infrastructure nodes', metricThreads: 'hardware threads', snapshot: 'VERIFIED HISTORICAL SNAPSHOT · 2026',
    mapHardware: 'Hardware', mapNetwork: 'Network', mapPlatform: 'Platform', mapObserve: 'Observability', mapRecovery: 'Recovery',
    briefTitle: 'Turn different machines into one understandable platform.', briefProblemLabel: 'CHALLENGE',
    briefProblem: 'Different devices, nodes that are not always powered on, GPU passthrough, local data and no public IP all had to become a manageable system.',
    briefRuleLabel: 'PRINCIPLE', briefRule: 'Every node has a role; user traffic is separate from administration; every important change leaves verifiable evidence.',
    briefResultLabel: 'RESULT', briefResult: 'A home environment for development, AI, storage and operations that can be observed, inspected layer by layer and moved without blindly trusting backups.',
    hardwareTitle: 'Physical foundation.', hardwareIntro: 'Not a render or a cloud account: physical machines that I assembled, reinstalled and connected into one environment.',
    historicalNote: 'Specifications come from the inventory; status reflects the audit date rather than a live SLA.',
    rigCaption: 'Ryzen 9 9950X · 64 GB DDR5 · 2 TB NVMe · 2 x RTX 5060 Ti 16 GB',
    coreRole: 'Role: Proxmox, QEMU VMs, GPU passthrough, the control plane and heavyweight compute environments.',
    workstationCaption: 'Work and management station. QR codes were removed from the public copy.',
    connectCore: 'Wired LAN · virtualization and GPU', connectWorker: 'LAN / Wi-Fi · Kubernetes worker', connectArchive: 'Wired LAN · archive and lightweight services',
    connectEdge: 'Internet · WireGuard / SSH / gateway', connectAdmin: 'Administration · SSH / VPN · not a server node',
    virtualizationTitle: 'One host. Different roles.',
    virtualizationIntro: 'Proxmox became the physical foundation, while QEMU machines separated the control plane, AI, work environments, game services and a dedicated Windows gateway.',
    pveNodes: 'physical PVE node',
    pveAuditNote: 'Deliberate overcommit and thin provisioning added flexibility, but required watching memory pressure and never treating allocated capacity as physically free.',
    pvePrivacy: 'The raw interface is not public because it contained internal names and addresses. This is a verified, anonymized audit summary.',
    buildTitle: 'From bare metal to a managed platform.', build1Title: 'Built the foundation', build1Body: 'Verified power, cooling, NVMe, memory and both GPUs before installing services.',
    build2Title: 'Installed the hypervisor', build2Body: 'Deployed Proxmox VE and separated responsibilities across QEMU virtual machines.',
    build3Title: 'Configured GPU passthrough', build3Body: 'Assigned two physical RTX cards to selected compute VMs and verified them by UUID.',
    build4Title: 'Connected Linux nodes', build4Body: 'Prepared Ubuntu Server and Debian, containerd, Docker and boot-time services.',
    build5Title: 'Built Kubernetes', build5Body: 'Configured kubeadm, Calico, MetalLB, kube-proxy and NVIDIA Container Toolkit.',
    build6Title: 'Moved stateful workloads', build6Body: 'Pinned persistent data to a stable control-plane node while retaining the source copies.',
    gpuIncidentTitle: 'A guest reboot was not a physical reset.',
    gpuIncidentProblem: 'Both cards were visible on PCI, but the driver initialized only one; function reset and ROM-Bar changes did not help.',
    gpuIncidentSolution: 'Stable passthrough settings and a full cold power cycle of the physical host restored both GPUs; nvidia-smi, device nodes and DCGM confirmed the result.',
    networkTitle: 'Network and access.',
    networkIntro: 'I went beyond browser settings: assigned router roles, added a switch, terminated cables to the required length and separated local, public and administrative traffic.',
    networkKitCaption: 'CAT6A, RJ45, tools and an 8-port switch — the physical layer before installation.', networkSwitchCaption: 'The installed switch with active links.',
    networkNodeCaption: 'Service laptop, switch and wired network after installation.',
    wifiHuawei: 'Primary router and the only DHCP server: one address authority instead of competing configurations.',
    wifiMercusys: 'Converted LAN-to-LAN into an access point and switch, with no second DHCP server.',
    wifiTplink: 'After a reset, Wi-Fi and DHCP were disabled and DSL/WAN left unused; the device now works as a wired switch.',
    wifiSummary: 'One shared SSID, WPA2-AES, WPS disabled and separated radio channels. Secrets and addresses are intentionally omitted.',
    wifiResult: 'Post-checks confirmed one DHCP domain, no double NAT, four BSSIDs under one SSID and access to the server network.',
    wifiLimits: 'This is not mesh or WPA3; the legacy segment is limited to roughly 100 Mbps, and guest VLAN and captive portal are not yet implemented.',
    wifiPrinter: 'Printer Ethernet did not become stable after cable and port checks, so USB remains the working fallback.',
    cable1: 'Measure the route and length', cable2: 'Cut and strip CAT6A', cable3: 'Arrange pairs and crimp RJ45', cable4: 'Test the link and required ports',
    accessTitle: 'A dedicated route for each type of access.', accessIntro: 'Web publishing, administration and latency-sensitive traffic should not share one path.',
    routeWeb: 'Selected services only; an outbound-only tunnel with no public administration panel.', routeAdmin: 'A separate protected route for SSH and administration.',
    routeGame: 'VPS + WireGuard worked but added latency; the isolated gateway became primary and the VPS remained as fallback.',
    wireguardCaption: 'Sanitized WireGuard reconstruction: keys are hidden and addresses and endpoint use test values.',
    platformTitle: 'Services as a system.',
    platformIntro: 'Kubernetes, GitOps and local services turned separate machines into an environment where placement, delivery and data are described explicitly.',
    hostsMapCaption: 'Historical map of hosts and roles without IP addresses, domains or secrets.',
    controlPlane: 'Orchestration and stable stateful workloads; Prometheus is pinned here so monitoring does not depend on the power-cycled AI VM.',
    aiCompute: 'Physical GPUs moved between compute VMs; DCGM and hardware UUIDs allowed metrics to be combined without double counting.',
    linuxNodes: 'Ubuntu Server and Debian joined the kubeadm cluster; a powered-off worker became NotReady without breaking the control plane.',
    gitopsPath: 'GitLab / registry / review / Argo CD / Kubernetes. Sync is separate from user traffic and requires stateful settings to be checked.',
    toolchainTitle: 'Every tool has a concrete role.', toolchainIntro: 'This is a map of the verified stack, not a technology list for decoration.',
    trademark: 'Product names and trademarks belong to their respective owners.',
    observeTitle: 'Metrics and signals.',
    observeIntro: 'Prometheus, Grafana, Loki, node_exporter and DCGM connected physical resources, Linux, Kubernetes and GPUs into one operational picture.',
    grafanaCaption: 'Public-safe Grafana reconstruction: 7 targets UP, 1 DOWN, 53 threads, 87.6 GiB RAM, 36.6 GiB VRAM and 3 active GPUs — a historical snapshot.',
    metricPath: 'Targets are exporters and data sources, not physical nodes. A powered-off source is shown honestly as DOWN instead of disappearing from the dashboard.',
    dedupBody: 'The same two RTX cards could appear from different VMs. Queries group metrics by hardware UUID, so GPUs and VRAM are not counted twice.',
    grafanaIncidentTitle: 'The same role does not imply the same bootstrap.', incidentSymptom: 'Symptom',
    grafanaIncidentSymptom: 'Grafana returned 502 and the replacement pod could not create a sandbox on the Debian worker.', incidentDiagnosis: 'Diagnosis',
    grafanaIncidentDiagnosis: 'Kubelet expected a systemd-resolved path that did not exist on Debian.', incidentResolution: 'Resolution',
    grafanaIncidentResolution: 'A configuration backup, the correct resolv.conf, a kubelet restart and a post-check restored monitoring.',
    recoveryTitle: 'Backups and recovery.', recoveryIntro: 'Data was collected in a controlled sequence and verified through several independent methods.',
    verifiedFiles: 'files passed SHA-256 verification', backupSets: 'daily backup sets', archiveSize: 'curated archive',
    recovery1Title: 'Inventory', recovery1Body: 'Compare real df/du usage, services, volumes, databases and dependencies instead of trusting quotas alone.',
    recovery2Title: 'Stop write services', recovery2Body: 'Gracefully stop applications, GitLab, the registry, monitoring and game data in a defined order.',
    recovery3Title: 'Native exports', recovery3Body: 'Create PostgreSQL dumps, an etcd snapshot, a GitLab backup and an offline copy of Grafana SQLite.',
    recovery4Title: 'Curated copy', recovery4Body: 'Collect registry, media, configuration and application data without overwriting the original backup sets.',
    recovery5Title: 'Integrity', recovery5Body: 'Generate a manifest and SHA-256 checksums; validate gzip, pg_restore catalogs, SQLite and extraction.',
    recovery6Title: 'Restore drills', recovery6Body: 'Restore selected PostgreSQL databases, read bundles and verify the game world, media and control-plane state.',
    validationDb: 'tables across two test restores', validationWorld: 'chunks · 0 corrupt records', validationEtcd: 'keys in the final snapshot',
    validationGitlab: 'repository bundles / refs verified', validationImmich: 'objects · missing = 0',
    honestyTitle: 'What still needs strengthening.',
    honesty1: 'The GitLab backup and bundles were verified, but a complete end-to-end GitLab restore was not confirmed.',
    honesty2: 'Daily copies and the curated archive remained on one physical HDD — this was not yet a full 3-2-1 strategy.',
    honesty3: 'Metrics and statuses on this page are historical snapshots, not a promise of current uptime.',
    conclusionTitle: 'Build. Understand. Recover.',
    nextProjects: ' All projects', nextContact: 'Discuss a challenge ', footerSnapshot: 'VERIFIED HISTORICAL SNAPSHOT · 2026'
  };

  const copy = { ru, en };
  const ui = {
    ru: { motionOff: 'Движение отключено настройками устройства', motionOn: 'Включить движение', motionPause: 'Приостановить движение', openImage: 'Открыть изображение', closeImage: 'Закрыть изображение' },
    en: { motionOff: 'Motion is disabled by device settings', motionOn: 'Enable motion', motionPause: 'Pause motion', openImage: 'Open image', closeImage: 'Close image' }
  };

  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const motionButton = document.querySelector('.ml-motion-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lightbox = document.querySelector('#ml-lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('#ml-lightbox-caption');
  const lightboxClose = lightbox?.querySelector('.ml-lightbox-close');
  let currentLanguage = 'ru';
  let manuallyPaused = false;

  try { manuallyPaused = localStorage.getItem('mylab-motion') === 'paused'; } catch {}
  const isMotionPaused = () => reduceMotion.matches || manuallyPaused;

  const updateMotionLabel = () => {
    if (!motionButton) return;
    const state = reduceMotion.matches ? 'motionOff' : manuallyPaused ? 'motionOn' : 'motionPause';
    const label = ui[currentLanguage][state];
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.setAttribute('aria-pressed', String(isMotionPaused()));
    motionButton.disabled = reduceMotion.matches;
    const icon = motionButton.querySelector('span');
    if (icon) icon.innerHTML = isMotionPaused() ? '<svg class="ml-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m8 5 11 7-11 7Z"></path></svg>' : '<svg class="ml-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 5v14M16 5v14"></path></svg>';
    document.body.classList.toggle('ml-motion-paused', isMotionPaused());
  };

  const updateMediaLabels = () => {
    document.querySelectorAll('[data-lightbox]').forEach((button) => {
      const caption = copy[currentLanguage][button.dataset.captionKey] || button.querySelector('img')?.alt || '';
      button.setAttribute('aria-label', `${ui[currentLanguage].openImage}: ${caption}`);
    });
    lightboxClose?.setAttribute('aria-label', ui[currentLanguage].closeImage);
  };

  const setLanguage = (language) => {
    currentLanguage = copy[language] ? language : 'ru';
    document.documentElement.lang = currentLanguage;
    document.body.dataset.lang = currentLanguage;
    i18nNodes.forEach((node) => {
      const value = copy[currentLanguage][node.dataset.i18n];
      if (typeof value === 'string') node.textContent = value;
    });
    languageButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage)));
    updateMotionLabel();
    updateMediaLabels();
    if (lightbox?.open && lightboxCaption) {
      const key = lightbox.dataset.captionKey;
      if (key) lightboxCaption.textContent = copy[currentLanguage][key] || '';
    }
    try { localStorage.setItem('mylab-language', currentLanguage); } catch {}
  };

  languageButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  let savedLanguage = 'ru';
  try { savedLanguage = localStorage.getItem('mylab-language') || 'ru'; } catch {}
  setLanguage(savedLanguage);

  motionButton?.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    try { localStorage.setItem('mylab-motion', manuallyPaused ? 'paused' : 'active'); } catch {}
    updateMotionLabel();
    scheduleFrame();
  });
  reduceMotion.addEventListener('change', () => { updateMotionLabel(); scheduleFrame(); });

  const hero = document.querySelector('.ml-hero');
  const heroProof = document.querySelector('.ml-system-map');
  const progress = document.querySelector('.ml-progress');
  const caseMap = document.querySelector('.ml-case-map');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const chapterLinks = [...document.querySelectorAll('[data-case-link]')];
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;
  let lastActiveChapter = '';

  const updateChapterState = () => {
    if (!chapters.length) return;
    const offset = (caseMap?.offsetHeight || 0) + 120;
    let active = chapters[0].dataset.chapter;
    chapters.forEach((chapter) => { if (chapter.getBoundingClientRect().top <= offset) active = chapter.dataset.chapter; });
    chapterLinks.forEach((link) => {
      if (link.dataset.caseLink === active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (active !== lastActiveChapter && caseMap && innerWidth <= 900) {
      const activeLink = chapterLinks.find((link) => link.dataset.caseLink === active);
      if (activeLink) {
        const left = activeLink.offsetLeft - (caseMap.clientWidth - activeLink.offsetWidth) / 2;
        caseMap.scrollTo({ left: Math.max(0, left), behavior: isMotionPaused() ? 'auto' : 'smooth' });
      }
    }
    lastActiveChapter = active;
  };

  const render = () => {
    frame = 0;
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - innerHeight);
    caseMap?.style.setProperty('--case-progress', Math.min(1, Math.max(0, scrollY / maxScroll)).toFixed(4));
    if (hero && progress) {
      const rect = hero.getBoundingClientRect();
      const heroProgress = Math.min(1, Math.max(0, -rect.top / Math.max(1, hero.offsetHeight - innerHeight * 0.25)));
      progress.style.transform = `scaleX(${heroProgress})`;
      if (heroProof && !isMotionPaused() && innerWidth > 900 && rect.bottom > 0) {
        heroProof.style.transform = `translate3d(${pointerX}px, ${pointerY + heroProgress * 18}px, 0) rotate(${pointerX * 0.03}deg)`;
      } else if (heroProof) heroProof.style.transform = '';
    }
    updateChapterState();
  };

  function scheduleFrame() { if (!frame) frame = requestAnimationFrame(render); }
  hero?.addEventListener('pointermove', (event) => {
    if (isMotionPaused() || event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
    scheduleFrame();
  });
  hero?.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; scheduleFrame(); });
  addEventListener('scroll', scheduleFrame, { passive: true });
  addEventListener('resize', scheduleFrame);

  const revealTargets = [...document.querySelectorAll('[data-reveal]')];
  document.body.classList.add('ml-reveal-ready');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) revealTargets.forEach((node) => node.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach((node) => observer.observe(node));
  }

  document.querySelectorAll('[data-lightbox]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!lightbox || !lightboxImage || !lightboxCaption) return;
      const sourceImage = button.querySelector('img');
      const captionKey = button.dataset.captionKey || '';
      lightboxImage.src = button.dataset.lightbox;
      lightboxImage.alt = sourceImage?.alt || '';
      lightboxCaption.textContent = copy[currentLanguage][captionKey] || sourceImage?.alt || '';
      lightbox.dataset.captionKey = captionKey;
      lightbox.showModal?.();
    });
  });
  lightboxClose?.addEventListener('click', () => lightbox?.close());
  lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  lightbox?.addEventListener('close', () => {
    lightboxImage?.removeAttribute('src');
    lightbox.removeAttribute('data-caption-key');
  });

  updateMotionLabel();
  render();
})();
