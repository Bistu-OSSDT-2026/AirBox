/**
 * C板块 - 资料展示模块
 * 负责：资料列表展示、查看详情
 * 不要实现：修改、删除、收藏、搜索、上传
 */

const API_BASE = 'http://localhost:3000/api';
let allResources = [];

// ============================================================
// 获取所有资料列表
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
                <p>手机端上传资料后，这里会显示</p >
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
    thumbnailHtml = `
        <img
            src="${item.file_url}"
            style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:10px;"
        />
    `;
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
    bodyHtml = `
        <img
            src="${data.file_url}"
            style="max-width:100%;border-radius:8px;"
        />
    `;
} else if (
    data.file_url &&
    (
        data.file_url.endsWith('.pdf') ||
        data.file_url.endsWith('.doc') ||
        data.file_url.endsWith('.docx') ||
        data.file_url.endsWith('.ppt') ||
        data.file_url.endsWith('.pptx')
    )
) {
    bodyHtml = `
        <p>📎 文件已上传</p>
        <a href="${data.file_url}" target="_blank" class="file-link">
            📄 查看文件
        </a>
    `;
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
            <p>${message}</p >
        </div>
    `;
}

// ============================================================
// 页面初始化
// ============================================================
document.addEventListener('DOMContentLoaded', fetchResources);