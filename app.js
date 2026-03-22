(function () {
    'use strict';

    // ===== Constants =====
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const CENTER = 200;
    const RADIUS = 170; // Must match clock-bg radius
    const TOTAL_HOURS = 24;
    const DEG_PER_HOUR = 360 / TOTAL_HOURS; // 15°

    const TASK_COLORS = [
        '#5E5CE6', // purple
        '#FF9F0A', // orange
        '#30D158', // green
        '#FF375F', // red
        '#64D2FF', // light blue
        '#FFD60A', // yellow
        '#BF5AF2', // violet
        '#AC8E68', // tan
    ];

    const PRESET_COLORS = [
        '#5E5CE6', '#FF9F0A', '#30D158', '#FF375F',
        '#64D2FF', '#FFD60A', '#BF5AF2', '#AC8E68',
        '#FF6482', '#00C7BE', '#5AC8FA', '#FF2D55',
    ];

    // ===== State =====
    let startAngle = 270; // 12:00 AM (top of circle)
    let endAngle = 0;     // 6:00 AM
    let dragging = null;  // 'start' | 'end' | null
    let tasks = [];
    let colorIndex = 0;
    let colorMode = 'auto'; // 'auto' | 'preset' | 'custom'
    let selectedPresetColor = PRESET_COLORS[0];

    // ===== DOM Elements =====
    const svg = document.getElementById('clock-svg');
    const ticksGroup = document.getElementById('clock-ticks');
    const taskArcsGroup = document.getElementById('task-arcs');
    const selectionArc = document.getElementById('selection-arc');
    const handleStart = document.getElementById('handle-start');
    const handleEnd = document.getElementById('handle-end');
    const timeDisplayStart = document.getElementById('time-display-start');
    const timeDisplayEnd = document.getElementById('time-display-end');
    const durationDisplay = document.getElementById('duration-display');
    const taskNameInput = document.getElementById('task-name');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksContainer = document.getElementById('tasks-container');
    const timeInputStart = document.getElementById('time-start');
    const timeInputEnd = document.getElementById('time-end');
    const remainingValue = document.getElementById('remaining-value');
    const remainingBarFill = document.getElementById('remaining-bar-fill');
    const colorPresetsContainer = document.getElementById('color-presets');
    const colorCustomContainer = document.getElementById('color-custom');
    const customColorInput = document.getElementById('custom-color-input');

    // ===== Utility Functions =====

    function degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    function polarToCartesian(angleDeg) {
        const rad = degToRad(angleDeg - 90); // -90 so 0° = top (12 o'clock)
        return {
            x: CENTER + RADIUS * Math.cos(rad),
            y: CENTER + RADIUS * Math.sin(rad),
        };
    }

    function cartesianToAngle(x, y) {
        const dx = x - CENTER;
        const dy = y - CENTER;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;
        return angle;
    }

    function angleToHours(angleDeg) {
        const totalMinutes = (angleDeg / 360) * TOTAL_HOURS * 60;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = Math.round(totalMinutes % 60);
        return { hours, minutes: minutes === 60 ? 0 : minutes };
    }

    function hoursToAngle(hours, minutes) {
        return ((hours * 60 + minutes) / (TOTAL_HOURS * 60)) * 360;
    }

    function formatTime(hours, minutes) {
        const period = hours < 12 ? 'ص' : 'م';
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMin = String(minutes).padStart(2, '0');
        return `${displayHour}:${displayMin} ${period}`;
    }

    function snapToFiveMinutes(angleDeg) {
        const fiveMinAngle = (5 / (TOTAL_HOURS * 60)) * 360; // angle per 5 minutes
        return Math.round(angleDeg / fiveMinAngle) * fiveMinAngle;
    }

    function normalizeAngle(a) {
        return ((a % 360) + 360) % 360;
    }

    function angleDifference(from, to) {
        let diff = normalizeAngle(to - from);
        if (diff === 0) diff = 360;
        return diff;
    }

    function calculateDuration(fromAngle, toAngle) {
        const diff = angleDifference(fromAngle, toAngle);
        const totalMinutes = (diff / 360) * TOTAL_HOURS * 60;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return { hours, minutes };
    }

    function formatDuration(dur) {
        let parts = [];
        if (dur.hours > 0) parts.push(`${dur.hours} ساعة`);
        if (dur.minutes > 0) parts.push(`${dur.minutes} دقيقة`);
        return parts.join(' و ') || '0 دقيقة';
    }

    // ===== SVG Arc Path =====

    function describeArc(startAng, endAng, radius) {
        const start = polarToCartesianRaw(startAng, radius);
        const end = polarToCartesianRaw(endAng, radius);
        const diff = angleDifference(startAng, endAng);
        const largeArc = diff > 180 ? 1 : 0;

        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    }

    function polarToCartesianRaw(angleDeg, radius) {
        const rad = degToRad(angleDeg - 90);
        return {
            x: CENTER + radius * Math.cos(rad),
            y: CENTER + radius * Math.sin(rad),
        };
    }

    // ===== Draw Clock =====

    function drawClock() {
        ticksGroup.innerHTML = '';

        for (let i = 0; i < 24; i++) {
            const angle = i * DEG_PER_HOUR;
            const isMajor = i % 6 === 0; // 0, 6, 12, 18
            const innerR = isMajor ? 128 : 133;
            const outerR = 140;

            const inner = polarToCartesianRaw(angle, innerR);
            const outer = polarToCartesianRaw(angle, outerR);

            const tick = document.createElementNS(SVG_NS, 'line');
            tick.setAttribute('x1', inner.x);
            tick.setAttribute('y1', inner.y);
            tick.setAttribute('x2', outer.x);
            tick.setAttribute('y2', outer.y);
            tick.setAttribute('class', isMajor ? 'tick-mark major' : 'tick-mark');
            ticksGroup.appendChild(tick);

            // Hour labels
            if (i % 3 === 0) {
                const labelPos = polarToCartesianRaw(angle, 115);
                const label = document.createElementNS(SVG_NS, 'text');
                label.setAttribute('x', labelPos.x);
                label.setAttribute('y', labelPos.y);
                label.setAttribute('class', 'hour-label');
                label.textContent = i === 0 ? '12' : i > 12 ? i - 12 : String(i);
                ticksGroup.appendChild(label);

                // AM/PM indicator for key hours
                if (i === 0 || i === 6 || i === 12 || i === 18) {
                    const iconPos = polarToCartesianRaw(angle, 100);
                    const icon = document.createElementNS(SVG_NS, 'text');
                    icon.setAttribute('x', iconPos.x);
                    icon.setAttribute('y', iconPos.y);
                    icon.setAttribute('class', 'period-icon');
                    icon.setAttribute('text-anchor', 'middle');
                    icon.setAttribute('dominant-baseline', 'central');
                    if (i === 0) icon.textContent = 'ص';
                    else if (i === 6) icon.textContent = '🌅';
                    else if (i === 12) icon.textContent = 'م';
                    else if (i === 18) icon.textContent = '🌙';
                    ticksGroup.appendChild(icon);
                }
            }

            // Small ticks for each hour
            if (!isMajor && i % 3 !== 0) {
                // Already drawn above
            }
        }
    }

    // ===== Update UI =====

    function updateSelectionArc() {
        const path = describeArc(startAngle, endAngle, RADIUS);
        selectionArc.setAttribute('d', path);
    }

    function updateHandles() {
        const startPos = polarToCartesian(startAngle);
        const endPos = polarToCartesian(endAngle);
        handleStart.setAttribute('cx', startPos.x);
        handleStart.setAttribute('cy', startPos.y);
        handleEnd.setAttribute('cx', endPos.x);
        handleEnd.setAttribute('cy', endPos.y);
    }

    function updateTimeDisplay() {
        const startTime = angleToHours(startAngle);
        const endTime = angleToHours(endAngle);
        const duration = calculateDuration(startAngle, endAngle);

        timeDisplayStart.textContent = formatTime(startTime.hours, startTime.minutes);
        timeDisplayEnd.textContent = formatTime(endTime.hours, endTime.minutes);
        durationDisplay.textContent = formatDuration(duration);

        // Sync time inputs
        timeInputStart.value = String(startTime.hours).padStart(2, '0') + ':' + String(startTime.minutes).padStart(2, '0');
        timeInputEnd.value = String(endTime.hours).padStart(2, '0') + ':' + String(endTime.minutes).padStart(2, '0');
    }

    function updateAll() {
        updateSelectionArc();
        updateHandles();
        updateTimeDisplay();
    }

    // ===== Task Arc Overlap Detection =====

    function isOverlapping(newStart, newEnd, excludeIndex) {
        const newDiff = angleDifference(newStart, newEnd);

        for (let i = 0; i < tasks.length; i++) {
            if (i === excludeIndex) continue;
            const task = tasks[i];
            const taskDiff = angleDifference(task.startAngle, task.endAngle);

            // Check if any point of new range falls within existing task range
            const d1 = angleDifference(task.startAngle, newStart);
            const d2 = angleDifference(task.startAngle, newEnd);

            // New start is inside existing task
            if (d1 < taskDiff && d1 > 0) return true;
            // New end is inside existing task
            if (d2 < taskDiff && d2 > 0) return true;

            // Existing task is inside new range
            const d3 = angleDifference(newStart, task.startAngle);
            if (d3 < newDiff && d3 > 0) return true;
        }
        return false;
    }

    // ===== Draw Task Arcs =====

    function renderTaskArcs() {
        taskArcsGroup.innerHTML = '';

        tasks.forEach((task) => {
            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', describeArc(task.startAngle, task.endAngle, RADIUS));
            path.setAttribute('class', 'task-arc');
            path.setAttribute('stroke', task.color);
            taskArcsGroup.appendChild(path);

            // Task label on the arc
            const midAngle = normalizeAngle(
                task.startAngle + angleDifference(task.startAngle, task.endAngle) / 2
            );
            const labelPos = polarToCartesianRaw(midAngle, RADIUS);
            const label = document.createElementNS(SVG_NS, 'text');
            label.setAttribute('x', labelPos.x);
            label.setAttribute('y', labelPos.y);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'central');
            label.setAttribute('fill', '#fff');
            label.setAttribute('font-size', '10');
            label.setAttribute('font-weight', '600');
            label.setAttribute('pointer-events', 'none');
            // Truncate long names
            label.textContent = task.name.length > 6 ? task.name.slice(0, 5) + '..' : task.name;
            taskArcsGroup.appendChild(label);
        });
    }

    function renderTaskList() {
        tasksContainer.innerHTML = '';

        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p style="color:#636366;text-align:center;padding:16px;">لا توجد مهام بعد. حدد وقت من الساعة وأضف مهمة.</p>';
            return;
        }

        tasks.forEach((task, index) => {
            const startTime = angleToHours(task.startAngle);
            const endTime = angleToHours(task.endAngle);
            const duration = calculateDuration(task.startAngle, task.endAngle);

            const item = document.createElement('div');
            item.className = 'task-item';
            item.innerHTML = `
                <div class="task-color-dot" style="background:${task.color}"></div>
                <div class="task-info">
                    <span class="task-item-name">${escapeHtml(task.name)}</span>
                    <span class="task-item-time">${formatTime(startTime.hours, startTime.minutes)} - ${formatTime(endTime.hours, endTime.minutes)} (${formatDuration(duration)})</span>
                </div>
                <button class="task-delete-btn" data-index="${index}">&times;</button>
            `;
            tasksContainer.appendChild(item);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== Event Handlers =====

    function getSVGPoint(e) {
        const point = svg.createSVGPoint();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        point.x = clientX;
        point.y = clientY;
        const ctm = svg.getScreenCTM().inverse();
        return point.matrixTransform(ctm);
    }

    function onPointerDown(e) {
        const point = getSVGPoint(e);
        const angle = cartesianToAngle(point.x, point.y);

        const distToStart = Math.abs(angleDifference(angle, startAngle));
        const distToEnd = Math.abs(angleDifference(angle, endAngle));
        const distToStartRev = Math.abs(angleDifference(startAngle, angle));
        const distToEndRev = Math.abs(angleDifference(endAngle, angle));

        const minDistStart = Math.min(distToStart, distToStartRev);
        const minDistEnd = Math.min(distToEnd, distToEndRev);

        const threshold = 20; // degrees

        if (minDistStart < threshold && minDistStart <= minDistEnd) {
            dragging = 'start';
            handleStart.classList.add('dragging');
        } else if (minDistEnd < threshold) {
            dragging = 'end';
            handleEnd.classList.add('dragging');
        }

        if (dragging) {
            e.preventDefault();
        }
    }

    function onPointerMove(e) {
        if (!dragging) return;
        e.preventDefault();

        const point = getSVGPoint(e);
        let angle = cartesianToAngle(point.x, point.y);
        angle = snapToFiveMinutes(angle);
        angle = normalizeAngle(angle);

        if (dragging === 'start') {
            startAngle = angle;
        } else {
            endAngle = angle;
        }

        updateAll();
    }

    function onPointerUp() {
        if (dragging) {
            handleStart.classList.remove('dragging');
            handleEnd.classList.remove('dragging');
            dragging = null;
        }
    }

    function addTask() {
        const name = taskNameInput.value.trim();
        if (!name) {
            taskNameInput.focus();
            taskNameInput.style.outline = '2px solid #ff453a';
            setTimeout(() => { taskNameInput.style.outline = ''; }, 1500);
            return;
        }

        // Check overlap
        if (isOverlapping(startAngle, endAngle, -1)) {
            showWarning('هذا الوقت يتداخل مع مهمة أخرى! عدّل الوقت.');
            return;
        }

        const color = getTaskColor();

        tasks.push({
            name,
            startAngle: normalizeAngle(startAngle),
            endAngle: normalizeAngle(endAngle),
            color,
        });

        taskNameInput.value = '';
        removeWarning();
        renderTaskArcs();
        renderTaskList();
        updateRemainingTime();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        renderTaskArcs();
        renderTaskList();
        updateRemainingTime();
    }

    function showWarning(msg) {
        removeWarning();
        const warning = document.createElement('div');
        warning.className = 'overlap-warning';
        warning.id = 'overlap-warning';
        warning.textContent = msg;
        document.querySelector('.controls').appendChild(warning);
        setTimeout(removeWarning, 3000);
    }

    function removeWarning() {
        const existing = document.getElementById('overlap-warning');
        if (existing) existing.remove();
    }

    // ===== Remaining Time =====

    function updateRemainingTime() {
        let usedMinutes = 0;
        tasks.forEach(function (task) {
            const dur = calculateDuration(task.startAngle, task.endAngle);
            usedMinutes += dur.hours * 60 + dur.minutes;
        });
        const totalMinutes = 24 * 60;
        const remainMinutes = Math.max(0, totalMinutes - usedMinutes);
        const rHours = Math.floor(remainMinutes / 60);
        const rMins = remainMinutes % 60;

        let text = '';
        if (rHours > 0) text += rHours + ' ساعة';
        if (rMins > 0) text += (text ? ' و ' : '') + rMins + ' دقيقة';
        if (!text) text = '0 دقيقة';

        remainingValue.textContent = text;

        const pct = (remainMinutes / totalMinutes) * 100;
        remainingBarFill.style.width = pct + '%';

        // Color coding
        remainingValue.classList.remove('warning', 'critical');
        remainingBarFill.classList.remove('warning', 'critical');
        if (pct <= 15) {
            remainingValue.classList.add('critical');
            remainingBarFill.classList.add('critical');
        } else if (pct <= 40) {
            remainingValue.classList.add('warning');
            remainingBarFill.classList.add('warning');
        }
    }

    // ===== Color Picker =====

    function initColorPicker() {
        // Populate preset colors
        PRESET_COLORS.forEach(function (color) {
            const dot = document.createElement('div');
            dot.className = 'color-preset-dot';
            dot.style.background = color;
            if (color === selectedPresetColor) dot.classList.add('selected');
            dot.addEventListener('click', function () {
                selectedPresetColor = color;
                colorPresetsContainer.querySelectorAll('.color-preset-dot').forEach(function (d) {
                    d.classList.remove('selected');
                });
                dot.classList.add('selected');
            });
            colorPresetsContainer.appendChild(dot);
        });

        // Mode toggle
        document.querySelectorAll('.color-mode-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.color-mode-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                colorMode = btn.dataset.mode;

                colorPresetsContainer.style.display = colorMode === 'preset' ? 'flex' : 'none';
                colorCustomContainer.style.display = colorMode === 'custom' ? 'flex' : 'none';
            });
        });
    }

    function getTaskColor() {
        if (colorMode === 'preset') {
            return selectedPresetColor;
        }
        if (colorMode === 'custom') {
            return customColorInput.value;
        }
        // auto
        var color = TASK_COLORS[colorIndex % TASK_COLORS.length];
        colorIndex++;
        return color;
    }

    // ===== Initialize =====

    function init() {
        drawClock();
        updateAll();
        renderTaskList();
        updateRemainingTime();
        initColorPicker();

        // Time input listeners
        timeInputStart.addEventListener('change', function () {
            var parts = timeInputStart.value.split(':');
            var h = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10);
            startAngle = normalizeAngle(hoursToAngle(h, m));
            updateAll();
        });
        timeInputEnd.addEventListener('change', function () {
            var parts = timeInputEnd.value.split(':');
            var h = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10);
            endAngle = normalizeAngle(hoursToAngle(h, m));
            updateAll();
        });

        // Mouse events on SVG
        svg.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        // Touch events
        svg.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);

        // Handle clicks on start/end handles directly
        handleStart.addEventListener('mousedown', (e) => {
            dragging = 'start';
            handleStart.classList.add('dragging');
            e.stopPropagation();
        });
        handleEnd.addEventListener('mousedown', (e) => {
            dragging = 'end';
            handleEnd.classList.add('dragging');
            e.stopPropagation();
        });
        handleStart.addEventListener('touchstart', (e) => {
            dragging = 'start';
            handleStart.classList.add('dragging');
            e.stopPropagation();
        }, { passive: true });
        handleEnd.addEventListener('touchstart', (e) => {
            dragging = 'end';
            handleEnd.classList.add('dragging');
            e.stopPropagation();
        }, { passive: true });

        // Add task button
        addTaskBtn.addEventListener('click', addTask);
        taskNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Delete task delegation
        tasksContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.task-delete-btn');
            if (btn) {
                const index = parseInt(btn.dataset.index, 10);
                deleteTask(index);
            }
        });
    }

    init();
})();
