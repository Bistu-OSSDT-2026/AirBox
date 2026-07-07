const form = document.getElementById('uploadForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const fileInput = document.getElementById('file');
const tagsInput = document.getElementById('tags');
const messageBox = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = 'message ' + type;
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message';
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tags = tagsInput.value.trim();
    const file = fileInput.files[0];

    if (!content && !file) {
        showMessage('请填写文字内容或选择文件', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', tags);

    if (file) {
        formData.append('file', file);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '上传中...';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showMessage(result.message || '上传成功', 'success');
            form.reset();
        } else {
            showMessage(result.message || '上传失败，请稍后重试', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请稍后重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '上传资料';
    }
});
