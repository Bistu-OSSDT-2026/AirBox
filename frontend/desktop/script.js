/**
 * C板块 - 资料展示模块 + ZCode AI 搜索功能集成
 * 负责：资料列表展示、查看详情、关键词搜索、标签筛选、时间筛选、分页
 */
const API_BASE = 'http://localhost:3000/api';
let allResources = [];
let allTags = [];
let selectedTags = [];
let currentPage = 1;
let totalPages = 1;
let searchTotal = 0;
let isSearchMode = false;

// ============================================================
// ZCode AI 生成 - 加载标签列表
// ============================================================
async function loadTags() {
    try {
        const res = await fetch('/api/search/tags');
        const data = await res.json();
        if (data.code === 0 && Array.isArray(data.data)) {
            allTags = data.data.map(t => t.name);
        }
        renderTagChips();
    } catch (e) { /* 标签接口不可用时静默降级 */ }
}

// ============================================================
// ZCode AI 生成 - 渲染标签筛选 chip
// ============================================================
const TAG_COLORS = ['#1a73e8','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#3498db','#e84393','#00cec9','#6c5ce7','#fd79a8','#00b894','#fdcb6e','#636e72'];
function tagColor(n) { let h=0; for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h); return TAG_COLORS[Math.abs(h)%TAG_COLORS.length]; }

function renderTagChips() {
    const container = document.getElementById('tagChips');
    if (!allTags.length) { container.innerHTML = '<span style="color:#b0bac5;font-size:12px;">暂无标签</span>'; return; }
    container.innerHTML = allTags.map(t => {
        const active = selectedTags.includes(t);
        const c = tagColor(t);
        const style = active ? `border-color:${c};background:${c}18;color:${c};font-weight:500;` : '';
        return `<span class="tag-chip${active?' tag-chip--active':''}" style="${style}" data-tag="${t}">${t}</span>`;
    }).join('');
    container.querySelectorAll('.tag-chip').forEach(el => {
        el.onclick = function() {
            const t = this.dataset.tag;
            const i = selectedTags.indexOf(t);
            i === -1 ? selectedTags.push(t) : selectedTags.splice(i,1);
            renderTagChips();
            currentPage = 1; doSearch();
        };
    });
}

// ============================================================
// ZCode AI 生成 - 搜索
// ============================================================
async function doSearch() {
    const kw = document.getElementById('searchInput').value.trim();
    const sd = document.getElementById('startDate').value;
    const ed = document.getElementById('endDate').value;

    if (!kw && !selectedTags.length && !sd && !ed) {
        // 无任何筛选条件 → 恢复默认
        isSearchMode = false;
        document.getElementById('paginationRow').style.display = 'none';
        await fetchResources();
        return;
    }

    isSearchMode = true;
    const params = ['page=' + currentPage, 'page_size=12'];
    if (kw) params.push('keyword=' + encodeURIComponent(kw));
    if (selectedTags.length) params.push('tags=' + encodeURIComponent(selectedTags.join(',')));
    if (sd) params.push('start_date=' + encodeURIComponent(sd));
    if (ed) params.push('end_date=' + encodeURIComponent(ed));

    try {
        const res = await fetch('/api/search?' + params.join('&'));
        const data = await res.json();
        if (data.code === 0) {
            searchTotal = data.pagination ? data.pagination.total : data.data.length;
            totalPages = data.pagination ? data.pagination.total_pages : 1;
            const normalized = normalizeResults(data.data);
            renderStatsForSearch(searchTotal, normalized);
            renderResources(normalized);
            renderPagination();
        } else {
            renderResources([]);
            document.getElementById('paginationRow').style.display = 'none';
        }
    } catch (e) {
        console.error('Search failed:', e);
    }
}

// ============================================================
// ZCode AI 生成 - 搜索结果格式归一化
// search API 返回 content_summary + tags[{id,name}]
// Desktop 期望 content (string) + tags ("a,b,c")
// ============================================================
function normalizeResults(items) {
    return items.map(item => ({
        ...item,
        content: item.content_summary || item.content || '',
        tags: Array.isArray(item.tags)
            ? item.tags.map(t => t.name).join(',')
            : (item.tags || '')
    }));
}

// ============================================================
// ZCode AI 生成 - 搜索模式下的统计
// ============================================================
function renderStatsForSearch(total, items) {
    document.getElementById('totalCount').textContent = total;
    const types = new Set(items.map(r => r.type).filter(t => t && t !== ''));
    document.getElementById('typeCount').textContent = types.size;
}

// ============================================================
// ZCode AI 生成 - 分页控件
// ============================================================
function renderPagination() {
    const row = document.getElementById('paginationRow');
    if (totalPages <= 1) { row.style.display = 'none'; return; }
    row.style.display = 'flex';
    document.getElementById('pageInfo').textContent = '第 ' + currentPage + ' / ' + totalPages + ' 页';
    document.getElementById('prevPageBtn').disabled = currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;
}

// ============================================================
// ZCode AI 生成 - 重置搜索
// ============================================================
async function resetSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    selectedTags = [];
    currentPage = 1;
    isSearchMode = false;
    document.getElementById('paginationRow').style.display = 'none';
    renderTagChips();
    await fetchResources();
}

// ============================================================
// 获取所有资料列表（原有逻辑，无搜索时使用）
// ============================================================
async function fetchResources() {
    try {
        const response = await fetch(`${API_BASE}/resources`);
        const result = await response.json();
        if (result.code === 0) {
            allResources = result.data || [];
            renderStats(allResources);
            renderResources(allResources);
        } else {
            throw new Error(result.message || '获取资料失败');
        }
    } catch (error) {
        console.error('获取资料列表失败:', error);
        showError('加载资料失败，请检查后端服务是否启动');
    }
}

// ============================================================
// 渲染统计信息
// ============================================================
function renderStats(resources) {
    document.getElementById('totalCount').textContent = resources.length;
    const types = new Set(resources.map(r => r.type).filter(t => t && t !== ''));
    document.getElementById('typeCount').textContent = types.size;
}

// ============================================================
// 渲染资料列表
// ============================================================
function renderResources(resources) {
    const container = document.getElementById('resourceContainer');
    if (!resources || resources.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <h3>暂无资料</h3>
                <p>${isSearchMode ? '没有匹配的结果，试试其他关键词' : '手机端上传资料后，这里会显示'}</p>
            </div>
        `;
        return;
    }

    let html = '<div class="resource-grid">';
    resources.forEach(item => {
        const typeLabel = item.type || '未分类';
        const previewText = item.content ? item.content.substring(0, 80) : '无内容预览';
        const tags = item.tags ? item.tags.split(',').filter(t => t.trim()) : [];
        const createdTime = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '未知时间';

        let thumbnailHtml = '';
        if (item.type === 'image' && item.file_url) {
            thumbnailHtml = `<img src="${item.file_url}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:10px;" />`;
        }

        html += `
            <div class="resource-card" onclick="showDetail(${item.id})">
                ${thumbnailHtml}
                <div class="card-type">${typeLabel}</div>
                <div class="card-title">${escapeHtml(item.title || '无标题')}</div>
                <div class="card-preview">${escapeHtml(previewText)}${previewText.length >= 80 ? '...' : ''}</div>
                <div class="card-footer">
                    <span>${createdTime}</span>
                    <div class="tags">
                        ${tags.map(tag => `<span class="tag">#${escapeHtml(tag.trim())}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ============================================================
// 查看资料详情
// ============================================================
async function showDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/resources/${id}`);
        const result = await response.json();
        if (result.code !== 0) {
            alert('获取详情失败：' + (result.message || '未知错误'));
            return;
        }
        const data = result.data;
        document.getElementById('modalTitle').textContent = data.title || '无标题';
        document.getElementById('modalType').textContent = data.type || '未分类';

        let bodyHtml = '';
        if (data.type === 'image' && data.file_url) {
            bodyHtml = `<img src="${data.file_url}" style="max-width:100%;border-radius:8px;" />`;
        } else if (data.file_url && (data.file_url.endsWith('.pdf') || data.file_url.endsWith('.doc') || data.file_url.endsWith('.docx') || data.file_url.endsWith('.ppt') || data.file_url.endsWith('.pptx'))) {
            bodyHtml = `<p>📎 文件已上传</p><a href="${data.file_url}" target="_blank" class="file-link">📄 查看文件</a>`;
        } else {
            bodyHtml = escapeHtml(data.content || '暂无内容');
        }

        if (data.tags) {
            const tags = data.tags.split(',').filter(t => t.trim());
            if (tags.length > 0) {
                bodyHtml += `<div style="margin-top:12px;">🏷️ ${tags.map(t => `<span style="background:#f0f2f5;padding:2px 12px;border-radius:10px;font-size:13px;margin:4px;">#${escapeHtml(t.trim())}</span>`).join('')}</div>`;
            }
        }
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalFooter').textContent = `📅 创建时间：${data.created_at ? new Date(data.created_at).toLocaleString('zh-CN') : '未知'}`;
        document.getElementById('detailModal').classList.add('active');
    } catch (error) {
        console.error('获取详情失败:', error);
        alert('获取详情失败，请检查网络连接');
    }
}

// ============================================================
// 关闭弹窗
// ============================================================
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('active');
});
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detailModal')) {
        document.getElementById('detailModal').classList.remove('active');
    }
});

// ============================================================
// 工具函数
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const container = document.getElementById('resourceContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="icon">⚠️</div>
            <h3>加载失败</h3>
            <p>${message}</p>
        </div>
    `;
}

// ============================================================
// ZCode AI 生成 - 搜索事件绑定
// ============================================================
document.getElementById('searchBtn').addEventListener('click', () => { currentPage = 1; doSearch(); });
document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') { currentPage = 1; doSearch(); } });
document.getElementById('searchInput').addEventListener('input', function() {
    if (!this.value.trim() && !selectedTags.length && !document.getElementById('startDate').value && !document.getElementById('endDate').value) {
        resetSearch();
    }
});
document.getElementById('startDate').addEventListener('change', () => { currentPage = 1; doSearch(); });
document.getElementById('endDate').addEventListener('change', () => { currentPage = 1; doSearch(); });
document.getElementById('resetBtn').addEventListener('click', resetSearch);
document.getElementById('prevPageBtn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; doSearch(); } });
document.getElementById('nextPageBtn').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; doSearch(); } });

// ============================================================
// 页面初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadTags();
    fetchResources();
});
