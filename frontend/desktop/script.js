// ======================== DOM 元素引用 ========================

const searchInput = document.getElementById('searchInput');
const activeFilterHint = document.getElementById('activeFilterHint');
const clearBtn = document.getElementById('clearBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const tagSidebar = document.getElementById('tagSidebar');
const tagInput = document.getElementById('tagInput');
const addTagBtn = document.getElementById('addTagBtn');
const tagListEl = document.getElementById('tagList');
const totalCountEl = document.getElementById('totalCount');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const timelineEl = document.getElementById('timeline');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// ======================== 状态变量 ========================

let currentKeyword = '';
let currentTag = null;
let currentPage = 1;
let selectedResourceId = null;
let totalInDb = 0;
const PAGE_SIZE = 20;

// ======================== 工具函数 ========================

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';

    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    const h = ('0' + date.getHours()).slice(-2);
    const min = ('0' + date.getMinutes()).slice(-2);

    if (y === now.getFullYear()) {
        return m + '-' + d + ' ' + h + ':' + min;
    }
    return y + '-' + m + '-' + d;
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function getTypeLabel(type) {
    const labels = { text: '文字', image: '图片', file: '文件' };
    return labels[type] || '其他';
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText =
        'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
        'padding:10px 24px;border-radius:8px;font-size:14px;z-index:999;' +
        (type === 'error'
            ? 'background:#fdecea;color:#b3261e;'
            : 'background:#e8f7ed;color:#1f7a3a;');
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ======================== API 请求 ========================

/**
 * 获取全部标签
 */
async function fetchTags() {
    try {
        const response = await fetch('/api/manage/tags');
        const result = await response.json();
        if (result.code === 200) {
            renderTags(result.data);
        }
    } catch (error) {
        console.error('获取标签失败:', error);
    }
}

/**
 * 新增标签（添加到选中的资料）
 */
async function addTag(name) {
    if (!name) return;

    if (!selectedResourceId) {
        showToast('请先点击选中一个资料卡片', 'error');
        return;
    }

    try {
        const response = await fetch('/api/manage/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resource_id: selectedResourceId, name: name })
        });
        const result = await response.json();

        if (result.code === 200) {
            showToast(result.msg, 'success');
            tagInput.value = '';
            fetchTags();
            fetchResources();
        } else {
            showToast(result.msg || '添加标签失败', 'error');
        }
    } catch (error) {
        console.error('添加标签失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

/**
 * 删除标签（从所有资料中移除）
 */
async function deleteTag(name) {
    if (!confirm('确定要删除标签「' + name + '」吗？将从所有资料中移除。')) return;

    try {
        const response = await fetch('/api/manage/tags/' + encodeURIComponent(name), {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.code === 200) {
            showToast('标签已删除', 'success');
            // 如果删除的是当前筛选标签，清除筛选
            if (currentTag === name) {
                currentTag = null;
                updateFilterUI();
            }
            fetchTags();
            fetchResources();
        } else {
            showToast(result.msg || '删除标签失败', 'error');
        }
    } catch (error) {
        console.error('删除标签失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

/**
 * 多条件搜索资料（关键词 + 标签 + 时间倒序 + 分页）
 */
async function fetchResources(append) {
    if (!append) {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        loadMoreWrap.style.display = 'none';
        timelineEl.innerHTML = '';
    }

    const params = new URLSearchParams();
    if (currentKeyword) params.append('keyword', currentKeyword);
    if (currentTag) params.append('tags', currentTag);
    params.append('sort', 'newest');
    params.append('page', currentPage);
    params.append('limit', PAGE_SIZE);

    try {
        const response = await fetch('/api/search?' + params.toString());
        const result = await response.json();

        loadingState.style.display = 'none';

        if (result.code === 200) {
            const total = result.data.total;
            const list = result.data.list;
            totalInDb = total;
            totalCountEl.textContent = total > 0 ? ('共 ' + total + ' 条') : '';

            if (list.length > 0) {
                renderTimeline(list, append);
                loadMoreWrap.style.display = list.length >= PAGE_SIZE ? 'block' : 'none';
            } else {
                if (!append) {
                    emptyState.style.display = 'block';
                }
                loadMoreWrap.style.display = 'none';
            }
        }
    } catch (error) {
        loadingState.style.display = 'none';
        console.error('获取资料失败:', error);
    }
}

// ======================== 渲染函数 ========================

/**
 * 渲染标签侧边栏列表
 */
function renderTags(tags) {
    tagListEl.innerHTML = '';

    // "全部"选项
    const allItem = document.createElement('li');
    allItem.className = 'tag-item' + (currentTag === null ? ' active' : '');
    allItem.innerHTML =
        '<span class="tag-name">全部</span>' +
        '<span class="tag-count">' + totalInDb + '</span>';
    allItem.addEventListener('click', () => {
        currentTag = null;
        currentPage = 1;
        updateFilterUI();
        highlightActiveTag();
        fetchResources();
    });
    tagListEl.appendChild(allItem);

    if (!tags || tags.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'tag-empty';
        emptyItem.textContent = '暂无标签';
        tagListEl.appendChild(emptyItem);
        return;
    }

    tags.forEach(tag => {
        const li = document.createElement('li');
        li.className = 'tag-item' + (currentTag === tag.name ? ' active' : '');
        li.setAttribute('data-tag', tag.name);
        li.innerHTML =
            '<span class="tag-name">' + escapeHtml(tag.name) + '</span>' +
            '<span class="tag-count">' + tag.count + '</span>' +
            '<button class="tag-del" title="删除标签">&times;</button>';

        // 点击标签名 → 筛选
        li.querySelector('.tag-name').addEventListener('click', () => {
            onTagClick(tag.name);
        });

        // 点击删除 → 删除标签
        li.querySelector('.tag-del').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTag(tag.name);
        });

        tagListEl.appendChild(li);
    });
}

/**
 * 渲染资料时间轴列表
 */
function renderTimeline(list, append) {
    if (!append) {
        timelineEl.innerHTML = '';
    }

    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.setAttribute('data-id', item.id);

        // 文件链接
        let fileHtml = '';
        if (item.file_url) {
            const fileName = item.file_url.split('/').pop();
            const fileSize = formatFileSize(item.file_size);
            fileHtml =
                '<div class="card-file">' +
                    '<a href="' + item.file_url + '" target="_blank">' + escapeHtml(fileName) + '</a>' +
                    (fileSize ? ' <span class="file-size">' + fileSize + '</span>' : '') +
                '</div>';
        }

        // 标签
        let tagsHtml = '';
        if (item.tags) {
            const tagArr = item.tags.split(',').filter(Boolean);
            tagsHtml =
                '<div class="card-tags">' +
                tagArr.map(t => '<span class="card-tag">' + escapeHtml(t.trim()) + '</span>').join('') +
                '</div>';
        }

        const typeClass = item.type ? ' type-' + item.type : '';

        div.innerHTML =
            '<div class="card">' +
                '<div class="card-title">' + escapeHtml(item.title || '未命名资料') + '</div>' +
                (item.content ? '<div class="card-content">' + escapeHtml(item.content) + '</div>' : '') +
                fileHtml +
                '<div class="card-meta">' +
                    '<span class="card-type' + typeClass + '">' + getTypeLabel(item.type) + '</span>' +
                    '<span>' + formatTime(item.created_at) + '</span>' +
                '</div>' +
                tagsHtml +
            '</div>';

        // 点击卡片 → 选中/取消选中
        div.addEventListener('click', () => selectResource(item.id));

        timelineEl.appendChild(div);
    });
}

// ======================== 交互逻辑 ========================

/**
 * 更新筛选提示和清空按钮的显示状态
 */
function updateFilterUI() {
    const parts = [];
    if (currentKeyword) parts.push('关键词: ' + currentKeyword);
    if (currentTag) parts.push('标签: ' + currentTag);

    if (parts.length > 0) {
        activeFilterHint.textContent = parts.join(' | ');
        activeFilterHint.style.display = 'inline';
        clearBtn.style.display = 'inline-block';
    } else {
        activeFilterHint.style.display = 'none';
        clearBtn.style.display = 'none';
    }
}

/**
 * 高亮当前激活的标签项
 */
function highlightActiveTag() {
    const items = tagListEl.querySelectorAll('.tag-item');
    items.forEach(el => {
        const tagName = el.getAttribute('data-tag');
        if (!tagName && currentTag === null) {
            el.classList.add('active');
        } else if (tagName === currentTag) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

/**
 * 点击标签筛选
 */
function onTagClick(name) {
    if (currentTag === name) {
        // 再次点击 → 取消筛选
        currentTag = null;
    } else {
        currentTag = name;
    }
    currentPage = 1;
    updateFilterUI();
    highlightActiveTag();
    fetchResources();
}

/**
 * 选中/取消选中资料卡片（用于添加标签时的目标资源）
 */
function selectResource(id) {
    if (selectedResourceId === id) {
        selectedResourceId = null;
    } else {
        selectedResourceId = id;
    }

    const items = timelineEl.querySelectorAll('.timeline-item');
    items.forEach(el => {
        const card = el.querySelector('.card');
        const elId = parseInt(el.getAttribute('data-id'));
        if (elId === selectedResourceId) {
            card.style.outline = '2px solid #4a90d9';
            card.style.outlineOffset = '2px';
        } else {
            card.style.outline = 'none';
        }
    });
}

/**
 * 清空所有筛选条件
 */
function clearFilters() {
    currentKeyword = '';
    currentTag = null;
    currentPage = 1;
    searchInput.value = '';
    updateFilterUI();
    highlightActiveTag();
    fetchResources();
}

// ======================== 事件绑定 ========================

// 关键词实时搜索（300ms 防抖）
let searchTimer = null;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentKeyword = searchInput.value.trim();
        currentPage = 1;
        updateFilterUI();
        fetchResources();
    }, 300);
});

// 新增标签按钮
addTagBtn.addEventListener('click', () => {
    const name = tagInput.value.trim();
    if (!name) return;
    addTag(name);
});

// 标签输入框回车
tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const name = tagInput.value.trim();
        if (name) addTag(name);
    }
});

// 清空筛选条件
clearBtn.addEventListener('click', clearFilters);

// 切换侧边栏显示/隐藏
toggleSidebarBtn.addEventListener('click', () => {
    tagSidebar.classList.toggle('collapsed');
});

// 加载更多
loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchResources(true);
});

// ======================== 初始化 ========================

fetchTags();
fetchResources();
