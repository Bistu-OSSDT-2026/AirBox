// ===== E模块：资料管理功能 =====
console.log('AirBox Desktop loaded - 资料管理模块');

let currentResourceId = null;
const API_BASE = 'http://localhost:3000/api';

// ===== 1. 获取并渲染资料列表 =====
async function loadResourceList() {
    const listEl = document.getElementById('resourceList');
    try {
        const res = await fetch(`${API_BASE}/resources`);
        if (!res.ok) throw new Error('获取列表失败');
        const data = await res.json();
        const resources = Array.isArray(data) ? data : data.resources || [];
        if (resources.length === 0) {
            listEl.innerHTML = `<div class="empty-state">暂无资料，试试上传吧</div>`;
            return;
        }
        listEl.innerHTML = resources.map(r => `
            <div class="resource-card" data-id="${r.id}" onclick="showDetail(${r.id})">
                <div class="resource-title">
                    <span>${r.title || '无标题'}</span>
                    <span style="font-size:12px;background:#e5e7eb;padding:2px 10px;border-radius:20px;">${r.type || '未知'}</span>
                </div>
                <div class="resource-meta">
                    📅 ${r.created_at ? new Date(r.created_at).toLocaleString() : '未知时间'} &nbsp;|&nbsp; 
                    ${r.favorite ? '⭐ 已收藏' : '☆ 未收藏'}
                </div>
                ${r.remark ? `<div class="resource-remark">📝 ${r.remark}</div>` : ''}
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); editTitle(${r.id})">✏️ 改标题</button>
                    <button class="btn btn-success" onclick="event.stopPropagation(); editRemark(${r.id})">💬 备注</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteResource(${r.id})">🗑️ 删除</button>
                    <button class="btn ${r.favorite ? 'btn-fav active' : 'btn-fav'}" onclick="event.stopPropagation(); toggleFavorite(${r.id})">
                        ${r.favorite ? '⭐ 已收藏' : '☆ 收藏'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = `<div class="empty-state">加载失败：${err.message}</div>`;
        console.error(err);
    }
}

// ===== 2. 显示资料详情 =====
async function showDetail(id) {
    currentResourceId = id;
    const panel = document.getElementById('detailPanel');
    const content = document.getElementById('detailContent');
    panel.style.display = 'block';
    content.innerHTML = '<div class="loading">加载详情...</div>';
    try {
        const res = await fetch(`${API_BASE}/resources/${id}`);
        if (!res.ok) throw new Error('获取详情失败');
        const r = await res.json();
        content.innerHTML = `
            <div style="background:#f8fafc;padding:16px;border-radius:8px;">
                <p><strong>标题：</strong>${r.title || '无'}</p >
                <p><strong>类型：</strong>${r.type || '未知'}</p >
                <p><strong>内容：</strong>${r.content || '无'}</p >
                <p><strong>备注：</strong>${r.remark || '无'}</p >
                <p><strong>收藏状态：</strong>${r.favorite ? '⭐ 已收藏' : '☆ 未收藏'}</p >
                <p><strong>创建时间：</strong>${r.created_at ? new Date(r.created_at).toLocaleString() : '未知'}</p >
                ${r.file_url ? `<p><strong>文件：</strong><a href=" " target="_blank">查看文件</a ></p >` : ''}
            </div>
        `;
    } catch (err) {
        content.innerHTML = `<div class="empty-state">加载失败：${err.message}</div>`;
    }
}

// ===== 3. 修改标题 =====
function editTitle(id) {
    const newTitle = prompt('请输入新的标题：');
    if (newTitle === null) return;
    if (!newTitle.trim()) { alert('标题不能为空'); return; }
    updateResource(id, { title: newTitle.trim() });
}

// ===== 4. 添加/修改备注 =====
function editRemark(id) {
    const newRemark = prompt('请输入备注内容：');
    if (newRemark === null) return;
    updateResource(id, { remark: newRemark.trim() || '' });
}

// ===== 5. 更新资源 =====
async function updateResource(id, fields) {
    try {
        const res = await fetch(`${API_BASE}/manage/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || '更新失败');
        }
        alert('更新成功！');
        loadResourceList();
        if (currentResourceId === id) showDetail(id);
    } catch (err) {
        alert('更新失败：' + err.message);
        console.error(err);
    }
}

// ===== 6. 删除资料 =====
function deleteResource(id) {
    if (!confirm('确定要删除该资料吗？此操作不可恢复！')) return;
    (async () => {
        try {
            const res = await fetch(`${API_BASE}/manage/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || '删除失败');
            }
            alert('删除成功！');
            if (currentResourceId === id) {
                document.getElementById('detailPanel').style.display = 'none';
                currentResourceId = null;
            }
            loadResourceList();
        } catch (err) {
            alert('删除失败：' + err.message);
            console.error(err);
        }
    })();
}

// ===== 7. 切换收藏（修复竞态条件） =====
function toggleFavorite(id) {
    // 直接从卡片上取当前状态（本地翻转，避免竞态）
    const card = document.querySelector(`.resource-card[data-id="${id}"]`);
    if (!card) {
        alert('卡片不存在，请刷新页面重试');
        return;
    }
    const favBtn = card.querySelector('.btn-fav');
    const isFav = favBtn.textContent.includes('已收藏');
    const newStatus = isFav ? 0 : 1;

    // 立即更新 UI（乐观更新）
    favBtn.textContent = newStatus ? '⭐ 已收藏' : '☆ 收藏';
    favBtn.classList.toggle('active', newStatus);

    // 发送请求
    fetch(`${API_BASE}/manage/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: newStatus })
    })
    .then(res => {
        if (!res.ok) throw new Error('收藏状态更新失败');
        // 刷新列表（从后端获取最新状态）
        loadResourceList();
        if (currentResourceId === id) showDetail(id);
    })
    .catch(err => {
        alert('操作失败：' + err.message);
        // 如果失败，还原 UI（重新加载列表）
        loadResourceList();
    });
}

// ===== 页面加载时执行 =====
document.addEventListener('DOMContentLoaded', loadResourceList);