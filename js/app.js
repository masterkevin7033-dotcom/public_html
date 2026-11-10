/**
 * AI Smart Work Portfolio - Interactive Application Logic
 * Author: Park Jiwon | Hallym University
 * Supports: Search, Category Filters, Sorting, In-Browser Video/Image/Doc Preview, Deep-Linking
 */

(function () {
  'use strict';

  const data = window.PORTFOLIO_DATA;
  if (!data || !data.projects) {
    console.error('Portfolio data not loaded properly.');
    return;
  }

  // DOM Elements
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  // Application State
  const state = {
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'new',
    activeModalProjectId: null,
    featuredTab: 'report',
    currentSlideIndex: 0
  };

  // Format Helper
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getFormatBadgeColor(format) {
    switch (format.toUpperCase()) {
      case 'DOCX': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'PPTX': return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' };
      case 'HWPX': return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'MP4':
      case 'MOV': return { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
      case 'PNG': return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  }

  function getDocumentIcon(format) {
    switch (format.toUpperCase()) {
      case 'DOCX': return '📄';
      case 'PPTX': return '📊';
      case 'HWPX': return '📑';
      case 'MP4':
      case 'MOV': return '🎬';
      case 'PNG': return '🖼️';
      default: return '📁';
    }
  }

  // =========================================================================
  // 1. Featured Project Showcase Tabs
  // =========================================================================
  function initFeaturedShowcase() {
    const tabs = $$('.featured-tab-btn');
    const panels = $$('.featured-tab-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        panels.forEach((p) => p.classList.toggle('active', p.id === `tab-panel-${target}`));
        state.featuredTab = target;
      });
    });
  }

  // =========================================================================
  // 2. Project Card Rendering & Explorer
  // =========================================================================
  function filterAndSortProjects() {
    let list = [...data.projects];

    // Filter by Category
    if (state.selectedCategory !== 'all') {
      list = list.filter((p) => {
        if (state.selectedCategory === 'semiconductor') return p.categories.includes('semiconductor');
        if (state.selectedCategory === 'data-report') return p.categories.includes('data-report');
        if (state.selectedCategory === 'business') return p.categories.includes('business');
        if (state.selectedCategory === 'media') return p.categories.includes('media');
        return true;
      });
    }

    // Filter by Search Query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const inTitle = p.title.toLowerCase().includes(q);
        const inSub = p.subtitle ? p.subtitle.toLowerCase().includes(q) : false;
        const inSum = p.summary.toLowerCase().includes(q);
        const inOrig = p.originalFileName.toLowerCase().includes(q);
        const inTools = p.tools ? p.tools.some((t) => t.name.toLowerCase().includes(q)) : false;
        return inTitle || inSub || inSum || inOrig || inTools;
      });
    }

    // Sort
    if (state.sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else if (state.sortBy === 'size') {
      const parseSize = (s) => {
        if (!s) return 0;
        if (s.includes('MB')) return parseFloat(s) * 1024 * 1024;
        if (s.includes('KB')) return parseFloat(s) * 1024;
        return parseFloat(s) || 0;
      };
      list.sort((a, b) => parseSize(b.fileSize) - parseSize(a.fileSize));
    } else {
      // Default: featured first, then chronological
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }

  function renderProjectsGrid() {
    const grid = $('#projects-grid');
    const countDisplay = $('#filter-result-count');
    if (!grid) return;

    const filtered = filterAndSortProjects();

    if (countDisplay) {
      countDisplay.textContent = `총 ${filtered.length}개의 과제 프로젝트`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">일치하는 프로젝트가 없습니다.</div>
          <div class="empty-desc">검색어 철자를 확인하거나 다른 카테고리를 선택해 보세요.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const badge = getFormatBadgeColor(p.format);
        const icon = getDocumentIcon(p.format);
        const isMedia = p.mediaType === 'video' || p.mediaType === 'image';
        const thumbSrc = p.thumbnail || '';

        // Media visual representation
        let thumbHtml = '';
        if (thumbSrc) {
          thumbHtml = `
            <div class="project-card-thumb">
              <img src="${thumbSrc}" alt="${escapeHtml(p.title)}" loading="lazy">
              ${p.mediaType === 'video' ? '<div class="badge-video-play">▶</div>' : ''}
              <span class="card-format-tag" style="background:${badge.bg}; color:${badge.text}; border:1px solid ${badge.border}">${p.format}</span>
            </div>
          `;
        } else {
          thumbHtml = `
            <div class="project-card-thumb">
              <div class="card-doc-visual">
                <span class="card-doc-icon">${icon}</span>
                <span class="card-doc-ext" style="color:${badge.text}">${p.format}</span>
              </div>
              <span class="card-format-tag" style="background:${badge.bg}; color:${badge.text}; border:1px solid ${badge.border}">${p.format}</span>
            </div>
          `;
        }

        // Tools chips
        const toolChips = (p.tools || [])
          .slice(0, 2)
          .map((t) => `<span class="meta-chip tool-chip">${escapeHtml(t.name)}</span>`)
          .join('');

        return `
          <article class="project-card" data-project-id="${p.id}">
            ${thumbHtml}
            <div class="card-body">
              <div class="card-category-row">
                <span class="card-category">${p.category}</span>
                <span class="card-date">${p.date || '2026'}</span>
              </div>
              <h3 class="card-title">${escapeHtml(p.title)}</h3>
              <p class="card-desc">${escapeHtml(p.summary)}</p>
              
              <div class="card-meta-chips">
                <span class="meta-chip">${p.fileSize}</span>
                ${toolChips}
              </div>
            </div>
            <div class="card-footer">
              <button type="button" class="btn-card-detail" onclick="window.PortfolioApp.openModal('${p.id}')">
                상세 보기 & 미리보기 ↗
              </button>
              <a href="${p.file}" download="${escapeHtml(p.originalFileName)}" class="btn-card-download" title="원본 다운로드" onclick="event.stopPropagation()">
                ⬇ ${p.format}
              </a>
            </div>
          </article>
        `;
      })
      .join('');
  }

  // =========================================================================
  // 3. Project Detail Modal & Media Viewers
  // =========================================================================
  function openModal(projectId) {
    const project = data.projects.find((p) => p.id === projectId);
    if (!project) return;

    state.activeModalProjectId = projectId;
    window.location.hash = projectId;

    const overlay = $('#modal-overlay');
    const container = $('#modal-container');
    if (!overlay || !container) return;

    // Render Preview Component based on mediaType
    let previewHtml = '';

    if (project.mediaType === 'video') {
      previewHtml = `
        <div class="modal-media-box">
          <div class="modal-video-wrap">
            <video controls playsinline preload="metadata" poster="${project.thumbnail || ''}">
              <source src="${project.file}" type="${project.format === 'MOV' ? 'video/quicktime' : 'video/mp4'}">
              브라우저가 비디오 재생을 지원하지 않습니다. 원본 파일을 다운로드하여 감상하세요.
            </video>
          </div>
        </div>
      `;
    } else if (project.mediaType === 'image') {
      previewHtml = `
        <div class="modal-media-box">
          <div class="modal-image-wrap">
            <img src="${project.file}" alt="${escapeHtml(project.title)}" loading="lazy">
          </div>
        </div>
      `;
    } else if (project.mediaType === 'slides' && project.slides) {
      state.currentSlideIndex = 0;
      const firstSlide = project.slides[0];
      previewHtml = `
        <div class="slides-deck-viewer">
          <div class="slides-deck-nav">
            <strong style="font-size:15px; color:var(--text-main);">📊 프레젠테이션 슬라이드 뷰어</strong>
            <div style="display:flex; gap:8px; align-items:center;">
              <span id="slide-counter-badge" class="badge-category">슬라이드 1 / ${project.slides.length}</span>
              <button type="button" class="btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="window.PortfolioApp.changeSlide(-1)">◀ 이전</button>
              <button type="button" class="btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="window.PortfolioApp.changeSlide(1)">다음 ▶</button>
            </div>
          </div>
          <div class="slide-current-box" id="active-slide-box">
            <div class="slide-num-badge">SLIDE 01</div>
            <h4 class="slide-title-view">${escapeHtml(firstSlide.title)}</h4>
            <p class="slide-desc-view">${escapeHtml(firstSlide.desc)}</p>
          </div>
          <div class="slides-grid-mini">
            ${project.slides
              .map(
                (s, idx) => `
                <button type="button" class="slide-thumb-btn ${idx === 0 ? 'active' : ''}" data-idx="${idx}" onclick="window.PortfolioApp.setSlide(${idx})">
                  ${s.num}. ${escapeHtml(s.title)}
                </button>
              `
              )
              .join('')}
          </div>
        </div>
      `;
    } else if (project.documentSections && project.documentSections.length > 0) {
      // Document Reader view
      previewHtml = `
        <div class="doc-reader-box">
          <div class="doc-reader-header">
            <div class="doc-reader-title">
              <span>${getDocumentIcon(project.format)}</span>
              <span>보고서 본문 인터랙티브 리더</span>
            </div>
            <span class="badge-verify">✔ 원본 문서 내용 반영</span>
          </div>
          ${project.documentSections
            .map((sec) => {
              if (sec.isTable) {
                return `
                  <div class="doc-section-block">
                    <h4 class="doc-section-heading">${escapeHtml(sec.title)}</h4>
                    <div class="doc-table-wrap">
                      <table class="doc-data-table">
                        <thead>
                          <tr>${sec.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                          ${sec.rows
                            .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
                            .join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="doc-section-block">
                    <h4 class="doc-section-heading">${escapeHtml(sec.title)}</h4>
                    <div class="doc-section-content">${sec.content}</div>
                  </div>
                `;
              }
            })
            .join('')}
        </div>
      `;
    }

    // Key metrics chips
    const metricsHtml = (project.keyMetrics || [])
      .map(
        (m) => `
        <div class="metric-mini-card">
          <div class="metric-mini-val">${escapeHtml(m.value)}</div>
          <div class="metric-mini-label">${escapeHtml(m.label)}</div>
          <div style="font-size:10px; color:var(--text-light); margin-top:2px;">${escapeHtml(m.desc)}</div>
        </div>
      `
      )
      .join('');

    // Workflow steps
    const workflowHtml = (project.workflow || [])
      .map(
        (w) => `
        <div class="workflow-step-item">
          <div class="workflow-step-num">${w.step}</div>
          <div class="workflow-step-content">
            <div class="workflow-step-title">${escapeHtml(w.title)}</div>
            <div class="workflow-step-desc">${escapeHtml(w.desc)}</div>
          </div>
        </div>
      `
      )
      .join('');

    // Verified Tools
    const toolsHtml = (project.tools || [])
      .map(
        (t) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-subtle); font-size:13px;">
          <div>
            <strong style="color:var(--text-main);">${escapeHtml(t.name)}</strong>
            <span style="color:var(--text-muted); margin-left:6px;">(${escapeHtml(t.role)})</span>
          </div>
          <span style="font-size:11px; color:var(--accent-green); background:var(--accent-green-light); padding:2px 8px; border-radius:10px;">
            ${escapeHtml(t.verifiedSource)}
          </span>
        </div>
      `
      )
      .join('');

    // Learnings list
    const learningsHtml = (project.learnings || [])
      .map((l) => `<li style="margin-bottom:6px;">${escapeHtml(l)}</li>`)
      .join('');

    container.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-meta">
          <span class="badge-category">${project.category}</span>
          <span class="card-format-tag" style="position:static; background:#0f172a; color:#fff;">${project.format}</span>
          <span class="badge-verify">✔ 원본 확인 완료</span>
        </div>
        <button type="button" class="modal-close-btn" onclick="window.PortfolioApp.closeModal()" title="닫기 (ESC)">✕</button>
      </div>

      <div class="modal-content-scroll">
        <!-- Title Block -->
        <div class="modal-title-block">
          <h2 class="modal-title">${escapeHtml(project.title)}</h2>
          ${project.subtitle ? `<p class="modal-subtitle">${escapeHtml(project.subtitle)}</p>` : ''}
        </div>

        <!-- Meta Grid -->
        <div class="modal-meta-grid">
          <div class="modal-meta-item">
            <span class="modal-meta-key">작성자 / 발표자</span>
            <span class="modal-meta-val">${escapeHtml(project.author || data.author.name)}</span>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-key">작성 기준일</span>
            <span class="modal-meta-val">${project.date || '2026'}</span>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-key">파일 형식 / 규격</span>
            <span class="modal-meta-val">${project.format} (${project.mediaType})</span>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-key">원본 파일 크기</span>
            <span class="modal-meta-val">${project.fileSize}</span>
          </div>
        </div>

        <!-- Interactive Preview -->
        ${previewHtml}

        <!-- Key Metrics -->
        ${
          metricsHtml
            ? `
          <div class="detail-section-card">
            <h3 class="detail-section-title">📈 핵심 정량 지표 & 분석 결과</h3>
            <div class="metric-cards-row" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              ${metricsHtml}
            </div>
          </div>
        `
            : ''
        }

        <!-- Purpose & Core Question -->
        <div class="detail-section-card">
          <h3 class="detail-section-title">🎯 과제 목적 및 핵심 질문</h3>
          <p style="font-size:14px; line-height:1.7; color:var(--text-body); margin-bottom:12px;">
            ${escapeHtml(project.purpose)}
          </p>
          <div style="background:var(--bg-secondary); padding:14px 16px; border-radius:var(--radius-md); border-left:3px solid var(--accent-blue);">
            <strong style="font-size:12px; color:var(--accent-blue); text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:4px;">Core Question</strong>
            <div style="font-size:14px; font-weight:600; color:var(--text-main);">${escapeHtml(project.coreQuestion)}</div>
          </div>
        </div>

        <!-- AI Tools & Workflow -->
        <div class="detail-section-card">
          <h3 class="detail-section-title">⚡ AI 활용 도구 및 단계별 제작 과정</h3>
          
          <div style="margin-bottom:18px;">
            <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:8px;">확인된 사용 도구 및 근거 메타데이터:</div>
            ${toolsHtml}
          </div>

          <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:10px;">작업 진행 단계:</div>
          <div class="workflow-steps-list">
            ${workflowHtml}
          </div>

          <div class="ai-verification-note">
            <strong style="color:var(--text-main); display:block; margin-bottom:4px;">🔍 AI 활용 검증 및 원칙:</strong>
            ${escapeHtml(project.aiDetails.verificationNotes)}
            <div style="margin-top:6px; color:var(--text-muted); font-size:12px;">
              * 원칙: 실제 파일 내부에서 확인되지 않은 비공개 프롬프트나 과장된 성과는 임의로 작성하지 않았습니다.
            </div>
          </div>
        </div>

        <!-- Learnings -->
        ${
          learningsHtml
            ? `
          <div class="detail-section-card">
            <h3 class="detail-section-title">💡 배운 점 및 시사점 (Key Learnings)</h3>
            <ul style="padding-left:20px; font-size:14px; line-height:1.7; color:var(--text-body);">
              ${learningsHtml}
            </ul>
          </div>
        `
            : ''
        }

        <!-- Download Card -->
        <div class="download-action-box">
          <div class="download-file-info">
            <span style="font-size:11px; font-weight:700; color:var(--accent-blue); text-transform:uppercase;">Download Original Asset</span>
            <div class="download-file-name">${escapeHtml(project.originalFileName)}</div>
            <div class="download-file-meta">용량: ${project.fileSize} · 원본 무수정 보존 상태</div>
          </div>
          <a href="${project.file}" download="${escapeHtml(project.originalFileName)}" class="btn-primary" style="padding:12px 24px;">
            ⬇ 원본 파일 다운로드 (${project.format})
          </a>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = $('#modal-overlay');
    if (!overlay) return;

    // Pause any playing videos inside modal
    const video = overlay.querySelector('video');
    if (video) video.pause();

    overlay.classList.remove('open');
    document.body.style.overflow = '';
    state.activeModalProjectId = null;

    // Remove hash without scrolling
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }

  // Slide Deck navigation inside modal
  function setSlide(index) {
    const project = data.projects.find((p) => p.id === state.activeModalProjectId);
    if (!project || !project.slides || index < 0 || index >= project.slides.length) return;

    state.currentSlideIndex = index;
    const slide = project.slides[index];

    const slideBox = $('#active-slide-box');
    const counterBadge = $('#slide-counter-badge');
    if (slideBox) {
      slideBox.innerHTML = `
        <div class="slide-num-badge">SLIDE ${slide.num < 10 ? '0' + slide.num : slide.num}</div>
        <h4 class="slide-title-view">${escapeHtml(slide.title)}</h4>
        <p class="slide-desc-view">${escapeHtml(slide.desc)}</p>
      `;
    }
    if (counterBadge) {
      counterBadge.textContent = `슬라이드 ${index + 1} / ${project.slides.length}`;
    }

    $$('.slide-thumb-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === index);
    });
  }

  function changeSlide(delta) {
    setSlide(state.currentSlideIndex + delta);
  }

  // =========================================================================
  // 4. Global Event Handlers & Initialization
  // =========================================================================
  function bindEvents() {
    // Search input with debounce
    const searchInput = $('#search-input');
    if (searchInput) {
      let timer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.searchQuery = e.target.value;
          renderProjectsGrid();
        }, 150);
      });
    }

    // Category pills
    $$('.pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedCategory = btn.dataset.category || 'all';
        renderProjectsGrid();
      });
    });

    // Sort select
    const sortSelect = $('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderProjectsGrid();
      });
    }

    // Modal background click
    const modalOverlay = $('#modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    // ESC key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.activeModalProjectId) {
        closeModal();
      }
    });

    // Hash change handler for deep linking
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('project-')) {
        openModal(hash);
      } else if (!hash && state.activeModalProjectId) {
        closeModal();
      }
    });
  }

  // App bootstrap
  function init() {
    initFeaturedShowcase();
    renderProjectsGrid();
    bindEvents();

    // Check if initial URL has hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && initialHash.startsWith('project-')) {
      setTimeout(() => openModal(initialHash), 100);
    }
  }

  // Expose global methods
  window.PortfolioApp = {
    init,
    openModal,
    closeModal,
    setSlide,
    changeSlide
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
