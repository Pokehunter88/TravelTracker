
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const dayWheel = document.getElementById("day-wheel");
const monthWheel = document.getElementById("month-wheel");
const yearWheel = document.getElementById("year-wheel");
const displayDay = document.getElementById("sel-day");
const displayMonth = document.getElementById("sel-month");
const displayYear = document.getElementById("sel-year");

// helper to build option elements
function createOption(text, type, value) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option w-full text-center py-2 text-lg font-medium leading-none scroll-snap-align-center focus:outline-none snap-center";
    btn.setAttribute("role", "option");
    btn.dataset.value = value;
    btn.dataset.type = type;
    btn.innerText = text;
    btn.addEventListener("click", () => {
        // scroll into center
        btn.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return btn;
}

// populate months
months.forEach((m, i) => {
    const el = createOption(m, "month", i);
    monthWheel.appendChild(el);
});

// populate years 0..3000
for (let y = 1800; y <= 2200; y++) {
    const el = createOption(String(y), "year", y);
    yearWheel.appendChild(el);
}

function populateDays(year, month) {
    dayWheel.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const el = createOption(String(d), "day", d);
        dayWheel.appendChild(el);
    }
}

// snap configuration via CSS custom property
// (Tailwind doesn't yet have scroll-snap-y in CDN default so use attributes)
dayWheel.style.scrollSnapType = "y mandatory";
dayWheel.style.scrollSnapAlign = "center";
monthWheel.style.scrollSnapType = "y mandatory";
monthWheel.style.scrollSnapAlign = "center";
yearWheel.style.scrollSnapType = "y mandatory";
yearWheel.style.scrollSnapAlign = "center";

// Utility: find the centered child in a wheel
function getCenteredOption(container) {
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;
    let closest = null;
    let closestDistance = Infinity;
    container.querySelectorAll(".option").forEach(opt => {
        const r = opt.getBoundingClientRect();
        const itemCenterY = r.top + r.height / 2;
        const dist = Math.abs(centerY - itemCenterY);
        if (dist < closestDistance) {
            closestDistance = dist;
            closest = opt;
        }
    });
    return closest;
}

// Apply dynamic scaling/opacity for wheel effect
function adjustWheelVisuals(container) {
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;
    container.querySelectorAll(".option").forEach(opt => {
        const r = opt.getBoundingClientRect();
        const itemCenterY = r.top + r.height / 2;
        const distance = Math.abs(centerY - itemCenterY);
        const maxDistance = containerRect.height / 2; // beyond this, minimal
        let ratio = Math.min(distance / maxDistance, 1); // 0 at center, 1 at far
        // scale from 1 to 0.8
        const scale = 1 - 0.2 * ratio;
        // opacity from 1 to 0.3
        const opacity = 1 - 0.7 * ratio;
        opt.style.transform = `scale(${scale})`;
        opt.style.opacity = opacity;
    });
}

// Update selection state, aria-selected, display
let currentDayValue = null;
let currentMonthIndex = null;
let currentYearValue = null;

function refreshSelection() {
    const centeredDay = getCenteredOption(dayWheel);
    const centeredMonth = getCenteredOption(monthWheel);
    const centeredYear = getCenteredOption(yearWheel);

    let yearChanged = false;
    let monthChanged = false;

    if (centeredYear) {
        const newYear = parseInt(centeredYear.dataset.value, 10);
        if (newYear !== currentYearValue) {
            currentYearValue = newYear;
            displayYear.textContent = newYear;
            yearChanged = true;
        }
    }

    if (centeredMonth) {
        const newIdx = parseInt(centeredMonth.dataset.value, 10);
        if (newIdx !== currentMonthIndex) {
            currentMonthIndex = newIdx;
            displayMonth.textContent = months[newIdx];
            monthChanged = true;
        }
    }

    if (yearChanged || monthChanged) {
        const currentDay = currentDayValue ? parseInt(currentDayValue, 10) : new Date().getDate();
        populateDays(currentYearValue, currentMonthIndex);
        const dEl = dayWheel.querySelector(`.option[data-value="${currentDay}"]`);
        if (dEl) dEl.scrollIntoView({ block: "center" });
    }

    if (centeredDay) {
        const newDay = parseInt(centeredDay.dataset.value, 10);
        if (newDay !== currentDayValue) {
            currentDayValue = newDay;
            displayDay.textContent = newDay;
        }
    }
}

// Throttle with requestAnimationFrame
let tickScheduled = false;
function onScroll() {
    if (!tickScheduled) {
        tickScheduled = true;
        requestAnimationFrame(() => {
            adjustWheelVisuals(dayWheel);
            adjustWheelVisuals(monthWheel);
            adjustWheelVisuals(yearWheel);
            refreshSelection();
            tickScheduled = false;
        });
    }
}

dayWheel.addEventListener("scroll", onScroll);
monthWheel.addEventListener("scroll", onScroll);
yearWheel.addEventListener("scroll", onScroll);

// Initialize to current date (fallback if beyond range)
let now = new Date();
// scroll them into view after a short delay so layout settled
function onLoad() {
    const yVal = Math.min(3000, Math.max(0, now.getFullYear()));
    populateDays(yVal, now.getMonth());

    const dEl = dayWheel.querySelector(`.option[data-value="${now.getDate()}"]`);
    const mEl = monthWheel.querySelector(`.option[data-value="${now.getMonth()}"]`);
    const yEl = yearWheel.querySelector(`.option[data-value="${yVal}"]`);
    if (dEl) dEl.scrollIntoView({ block: "center" });
    if (mEl) mEl.scrollIntoView({ block: "center" });
    if (yEl) yEl.scrollIntoView({ block: "center" });
    // initial visual adjustment
    adjustWheelVisuals(dayWheel);
    adjustWheelVisuals(monthWheel);
    adjustWheelVisuals(yearWheel);
    refreshSelection();
}
window.addEventListener("load", onLoad);

// Click outside to allow focus on wheel for keyboard nav
[dayWheel, monthWheel, yearWheel].forEach(w => {
    w.setAttribute("tabindex", "0");
    w.addEventListener("focus", () => {
        // do nothing but allow arrow keys to work
    });
});

// Ensure the "selector-overlay" centers properly: nothing additional needed since it's absolute inside container with padding.

const speedFactor = 0.5; // 1 = normal speed; lower = slower

dayWheel.addEventListener('wheel', function (e) {
    // needed so we can call preventDefault()
    e.preventDefault();

    // Normalize delta to pixels
    let delta = e.deltaY;
    if (e.deltaMode === 1) { // DOM_DELTA_LINE
        const lineHeight = parseFloat(getComputedStyle(dayWheel).lineHeight) || 16;
        delta *= lineHeight;
    } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
        delta *= dayWheel.clientHeight;
    }

    // Apply slowed scroll
    dayWheel.scrollTo({
        top: dayWheel.scrollTop + (delta * speedFactor),
        left: 0,
        behavior: "smooth",
    });

}, { passive: false });

monthWheel.addEventListener('wheel', function (e) {
    // needed so we can call preventDefault()
    e.preventDefault();

    // Normalize delta to pixels
    let delta = e.deltaY;
    if (e.deltaMode === 1) { // DOM_DELTA_LINE
        const lineHeight = parseFloat(getComputedStyle(monthWheel).lineHeight) || 16;
        delta *= lineHeight;
    } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
        delta *= monthWheel.clientHeight;
    }

    // Apply slowed scroll
    monthWheel.scrollTo({
        top: monthWheel.scrollTop + (delta * speedFactor),
        left: 0,
        behavior: "smooth",
    });

}, { passive: false });

yearWheel.addEventListener('wheel', function (e) {
    // needed so we can call preventDefault()
    e.preventDefault();

    // Normalize delta to pixels
    let delta = e.deltaY;
    if (e.deltaMode === 1) { // DOM_DELTA_LINE
        const lineHeight = parseFloat(getComputedStyle(yearWheel).lineHeight) || 16;
        delta *= lineHeight;
    } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
        delta *= yearWheel.clientHeight;
    }

    // Apply slowed scroll
    yearWheel.scrollTo({
        top: yearWheel.scrollTop + (delta * speedFactor),
        left: 0,
        behavior: "smooth",
    });
}, { passive: false });

function dateFromText(text) {
    const split = text.split(" ");
    const monthIndex = months.indexOf(split[1]);
    return new Date(parseInt(split[2]), monthIndex, parseInt(split[0]));
}

const calendarEl = document.querySelector('.calendar');
const fromButton = document.getElementById('from-button');
const toButton = document.getElementById('to-button');

let currentDate = "from";

const modal = document.getElementById('country-modal');

modal.addEventListener("click", (e) => {
    if (!calendarEl.classList.contains("hidden")) {
        calendarEl.classList.add("hidden");
    } else if (e.target.id === "country-modal"){
        modal.classList.add('hidden');
    }
});

document.getElementById('confirm-calendar').addEventListener("click", () => {
    calendarEl.classList.add("hidden");

    if (currentDate === "from") {
        fromButton.textContent = displayDay.textContent + " " + displayMonth.textContent + " " + displayYear.textContent;

        if (toButton.textContent === "To") {
            toButton.textContent = fromButton.textContent;
        } else {
            const d1 = dateFromText(fromButton.textContent);
            const d2 = dateFromText(toButton.textContent);

            if (d1.getTime() > d2.getTime()) {
                toButton.textContent = fromButton.textContent;
            }
        }
    } else {
        toButton.textContent = displayDay.textContent + " " + displayMonth.textContent + " " + displayYear.textContent;

        if (fromButton.textContent === "From") {
            fromButton.textContent = toButton.textContent;
        } else {
            const d1 = dateFromText(fromButton.textContent);
            const d2 = dateFromText(toButton.textContent);

            if (d1.getTime() > d2.getTime()) {
                fromButton.textContent = toButton.textContent;
            }
        }
    }
});

document.getElementById('cancel-calendar').addEventListener("click", () => {
    calendarEl.classList.add("hidden");
});

fromButton.addEventListener("click", () => {
    setTimeout(() => {
        calendarEl.classList.remove("hidden");

        if (fromButton.textContent === "From") {
            now = new Date();
        } else {
            now = dateFromText(fromButton.textContent);
        }

        onLoad();
        currentDate = "from";
    }, 1)
});

toButton.addEventListener("click", () => {
    setTimeout(() => {
        calendarEl.classList.remove("hidden");

        if (toButton.textContent === "To") {
            now = new Date();
        } else {
            now = dateFromText(toButton.textContent);
        }

        onLoad();
        currentDate = "to";
    }, 1)
});