// ============================================================
// ZCode AI 生成 - Search 模块前端
// 搜索 + 标签筛选 + 时间区间 + 时间轴分组 + 分页
// ============================================================
(function () {
    'use strict';

    const searchInput = document.getElementById('searchInput'),
          searchBtn   = document.getElementById('searchBtn'),
          startDateEl = document.getElementById('startDate'),
          endDateEl   = document.getElementById('endDate'),
          clearTimeBtn= document.getElementById('clearTimeBtn'),
          tagList     = document.getElementById('tagList'),
          tagFilterBar= document.getElementById('tagFilterBar'),
          searchStatus= document.getElementById('searchStatus'),
          timeline    = document.getElementById('timeline'),
          prevPageBtn = document.getElementById('prevPageBtn'),
          nextPageBtn = document.getElementById('nextPageBtn'),
          pageInfo    = document.getElementById('pageInfo'),
          paginationBar=document.getElementById('paginationBar');

    let allTags=[], selectedTags=[], currentPage=1, totalPages=1, isLoading=false;
    const COLORS=['#4a90d9','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#3498db','#e84393','#00cec9','#6c5ce7','#fd79a8','#00b894','#fdcb6e','#636e72'];

    function color(n){let h=0;for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return COLORS[Math.abs(h)%COLORS.length];}
    function pad(n){return n<10?'0'+n:''+n;}
    function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
    function show(msg){searchStatus.textContent=msg;searchStatus.style.display=msg?'block':'none';}

    function groupKey(d){
        if(!d)return'earlier';
        var t=new Date(d),n=new Date(),
            ts=new Date(n.getFullYear(),n.getMonth(),n.getDate()),
            ys=new Date(ts.getTime()-86400000),
            dw=n.getDay(),mo=dw===0?6:dw-1,
            ws=new Date(ts.getTime()-mo*86400000),
            ms=new Date(n.getFullYear(),n.getMonth(),1);
        if(t>=ts)return'today';
        if(t>=ys)return'yesterday';
        if(t>=ws)return'week';
        if(t>=ms)return'month';
        return'earlier';
    }
    function glabel(k){return{today:'今天',yesterday:'昨天',week:'本周',month:'本月',earlier:'更早'}[k]||k;}

    function timeStr(d){
        if(!d)return'';var t=new Date(d),n=new Date(),df=n-t;
        if(df<6e4)return'刚刚';if(df<36e5)return Math.floor(df/6e4)+' 分钟前';
        if(df<864e5)return Math.floor(df/36e5)+' 小时前';
        if(df<1728e5)return'昨天 '+pad(t.getHours())+':'+pad(t.getMinutes());
        return t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate())+' '+pad(t.getHours())+':'+pad(t.getMinutes());
    }

    // -------- 标签筛选栏 ----------
    function renderTags(){
        tagList.innerHTML='';
        if(!allTags.length){tagFilterBar.style.display='none';return;}
        tagFilterBar.style.display='flex';
        allTags.forEach(function(t){
            var b=document.createElement('button');b.className='tag-chip';b.textContent=t;
            if(selectedTags.indexOf(t)!==-1){
                b.classList.add('tag-chip--active');
                b.style.borderColor=color(t);b.style.backgroundColor=color(t)+'18';b.style.color=color(t);
            }
            b.onclick=function(){var i=selectedTags.indexOf(t);i===-1?selectedTags.push(t):selectedTags.splice(i,1);renderTags();currentPage=1;search();};
            tagList.appendChild(b);
        });
    }

    // -------- 卡片 ----------
    function card(item){
        var c=document.createElement('div');c.className='timeline-item';
        var th='';
        if(item.tags&&item.tags.length){th='<div class="timeline-item-tags">';item.tags.forEach(function(t){th+='<span class="tag-dot" style="background:'+color(t.name)+'">'+esc(t.name)+'</span>';});th+='</div>';}
        c.innerHTML='<div class="timeline-item-dot"></div><div class="timeline-item-card">'+
            '<div class="timeline-item-header"><h3 class="timeline-item-title">'+esc(item.title)+'</h3><span class="timeline-item-time">'+timeStr(item.created_at)+'</span></div>'+
            '<p class="timeline-item-summary">'+esc(item.content_summary)+'</p>'+th+'</div>';
        return c;
    }

    // -------- 分组渲染 ----------
    function renderGrouped(data){
        timeline.innerHTML='';
        if(!data||!data.length){timeline.innerHTML='<div class="timeline-empty">没有找到匹配的资料</div>';return;}
        var g={};data.forEach(function(it){var k=groupKey(it.created_at);if(!g[k])g[k]=[];g[k].push(it);});
        ['today','yesterday','week','month','earlier'].forEach(function(k){
            if(!g[k]||!g[k].length)return;
            var h=document.createElement('div');h.className='timeline-section-header';
            h.innerHTML='<span class="timeline-section-label">'+glabel(k)+'</span><span class="timeline-section-count">'+g[k].length+' 条</span>';
            timeline.appendChild(h);
            g[k].forEach(function(it){timeline.appendChild(card(it));});
        });
    }

    function renderTimeline(groups){
        timeline.innerHTML='';
        if(!groups||!groups.length){timeline.innerHTML='<div class="timeline-empty">暂无资料</div>';return;}
        groups.forEach(function(g){
            var h=document.createElement('div');h.className='timeline-section-header';
            h.innerHTML='<span class="timeline-section-label">'+g.label+'</span><span class="timeline-section-count">'+g.count+' 条</span>';
            timeline.appendChild(h);
            g.items.forEach(function(it){timeline.appendChild(card(it));});
        });
    }

    function setPage(){
        if(totalPages<=1){paginationBar.style.display='none';return;}
        paginationBar.style.display='flex';pageInfo.textContent='第 '+currentPage+' / '+totalPages+' 页';
        prevPageBtn.disabled=currentPage<=1;nextPageBtn.disabled=currentPage>=totalPages;
    }

    // -------- 搜索 ----------
    function search(){
        if(isLoading)return;
        var kw=searchInput.value.trim();
        if(!kw&&!selectedTags.length&&!startDateEl.value&&!endDateEl.value){loadTimeline();return;}

        var p=['page='+currentPage,'page_size=20'];
        if(kw)p.push('keyword='+encodeURIComponent(kw));
        if(selectedTags.length)p.push('tags='+encodeURIComponent(selectedTags.join(',')));
        if(startDateEl.value)p.push('start_date='+encodeURIComponent(startDateEl.value));
        if(endDateEl.value)p.push('end_date='+encodeURIComponent(endDateEl.value));

        isLoading=true;show('搜索中...');
        fetch('/api/search?'+p.join('&')).then(function(r){return r.json();}).then(function(res){
            isLoading=false;show('');
            if(res.code===0){totalPages=res.pagination?res.pagination.total_pages:1;setPage();renderGrouped(res.data);}
            else{show(res.message||'搜索失败');renderGrouped([]);paginationBar.style.display='none';}
        }).catch(function(e){isLoading=false;show('网络错误');console.error(e);});
    }

    function loadTimeline(){
        isLoading=true;show('加载中...');paginationBar.style.display='none';
        fetch('/api/search/timeline').then(function(r){return r.json();}).then(function(res){
            isLoading=false;show('');if(res.code===0)renderTimeline(res.data);else timeline.innerHTML='<div class="timeline-empty">加载失败</div>';
        }).catch(function(e){isLoading=false;show('网络错误');console.error(e);});
    }

    function loadTags(){
        fetch('/api/search/tags').then(function(r){return r.json();}).then(function(res){
            if(res.code===0&&Array.isArray(res.data))allTags=res.data.map(function(t){return t.name;});renderTags();
        }).catch(function(){tagFilterBar.style.display='none';});
    }

    // -------- 事件 ----------
    searchBtn.onclick=function(){currentPage=1;search();};
    searchInput.onkeydown=function(e){if(e.key==='Enter'){currentPage=1;search();}};
    searchInput.oninput=function(){if(!this.value.trim()&&!selectedTags.length&&!startDateEl.value&&!endDateEl.value){currentPage=1;loadTimeline();}};
    startDateEl.onchange=function(){currentPage=1;search();};
    endDateEl.onchange=function(){currentPage=1;search();};
    clearTimeBtn.onclick=function(){startDateEl.value='';endDateEl.value='';currentPage=1;search();};
    prevPageBtn.onclick=function(){if(currentPage>1){currentPage--;search();}};
    nextPageBtn.onclick=function(){if(currentPage<totalPages){currentPage++;search();}};

    loadTags();loadTimeline();
})();
