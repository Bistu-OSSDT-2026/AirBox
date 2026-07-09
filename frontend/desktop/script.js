// ===== E模块：资料管理功能 =====
console.log('AirBox Desktop loaded - 资料管理模块');

let currentResourceId = null;
const API_BASE = 'http://localhost:3000/api';

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

function editTitle(id) {
    const newTitle = prompt('请输入新的标题：');
    if (newTitle === null) return;
    if (!newTitle.trim()) { alert('标题不能为空'); return; }
    updateResource(id, { title: newTitle.trim() });
}

function editRemark(id) {
    const newRemark = prompt('请输入备注内容：');
    if (newRemark === null) return;
    updateResource(id, { remark: newRemark.trim() || '' });
}

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

function toggleFavorite(id) {
    (async () => {
        try {
            const resGet = await fetch(`${API_BASE}/resources/${id}`);
            if (!resGet.ok) throw new Error('获取资料状态失败');
            const r = await resGet.json();
            const newStatus = r.favorite ? 0 : 1;
            const resPut = await fetch(`${API_BASE}/manage/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favorite: newStatus })
            });
            if (!resPut.ok) throw new Error('收藏状态更新失败');
            loadResourceList();
            if (currentResourceId === id) showDetail(id);
        } catch (err) {
            alert('操作失败：' + err.message);
            console.error(err);
        }
    })();
}

document.addEventListener('DOMContentLoaded', loadResourceList);