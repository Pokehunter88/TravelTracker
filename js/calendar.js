
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const monthWheel = document.getElementById("month-wheel");
const yearWheel = document.getElementById("year-wheel");
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

// snap configuration via CSS custom property
// (Tailwind doesn't yet have scroll-snap-y in CDN default so use attributes)
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
let currentMonthIndex = null;
let currentYearValue = null;

function refreshSelection() {
    const centeredMonth = getCenteredOption(monthWheel);
    const centeredYear = getCenteredOption(yearWheel);
    if (centeredMonth) {
        const newIdx = parseInt(centeredMonth.dataset.value, 10);
        if (newIdx !== currentMonthIndex) {
            currentMonthIndex = newIdx;
            displayMonth.textContent = months[newIdx];
        }
    }
    if (centeredYear) {
        const newYear = parseInt(centeredYear.dataset.value, 10);
        if (newYear !== currentYearValue) {
            currentYearValue = newYear;
            displayYear.textContent = newYear;
        }
    }
}

// Throttle with requestAnimationFrame
let tickScheduled = false;
function onScroll() {
    if (!tickScheduled) {
        tickScheduled = true;
        requestAnimationFrame(() => {
            adjustWheelVisuals(monthWheel);
            adjustWheelVisuals(yearWheel);
            refreshSelection();
            tickScheduled = false;
        });
    }
}

monthWheel.addEventListener("scroll", onScroll);
yearWheel.addEventListener("scroll", onScroll);

// Initialize to current date (fallback if beyond range)
let now = new Date();
// scroll them into view after a short delay so layout settled
function onLoad() {
    const mEl = monthWheel.querySelector(`.option[data-value="${now.getMonth()}"]`);
    const yVal = Math.min(3000, Math.max(0, now.getFullYear()));
    const yEl = yearWheel.querySelector(`.option[data-value="${yVal}"]`);
    if (mEl) mEl.scrollIntoView({ block: "center" });
    if (yEl) yEl.scrollIntoView({ block: "center" });
    // initial visual adjustment
    adjustWheelVisuals(monthWheel);
    adjustWheelVisuals(yearWheel);
    refreshSelection();
}
window.addEventListener("load", onLoad);

// Click outside to allow focus on wheel for keyboard nav
[monthWheel, yearWheel].forEach(w => {
    w.setAttribute("tabindex", "0");
    w.addEventListener("focus", () => {
        // do nothing but allow arrow keys to work
    });
});

// Ensure the "selector-overlay" centers properly: nothing additional needed since it's absolute inside container with padding.

const speedFactor = 0.5; // 1 = normal speed; lower = slower

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

const calendarEl = document.querySelector('.calendar');
const fromButton = document.getElementById('from-button');
const toButton = document.getElementById('to-button');

let currentDate = "from";

document.getElementById('country-modal').addEventListener("click", () => {
    calendarEl.classList.add("hidden");
});

document.getElementById('confirm-calendar').addEventListener("click", () => {
    calendarEl.classList.add("hidden");

    if (currentDate === "from") {
        fromButton.textContent = displayMonth.textContent + " " + displayYear.textContent;

        if (toButton.textContent === "To") {
            toButton.textContent = fromButton.textContent;
        } else {
            const d1 = new Date(fromButton.textContent);
            const d2 = new Date(toButton.textContent);

            if (d1.getTime() > d2.getTime()) {
                toButton.textContent = fromButton.textContent;
            }
        }
    } else {
        toButton.textContent = displayMonth.textContent + " " + displayYear.textContent;

        if (fromButton.textContent === "From") {
            fromButton.textContent = toButton.textContent;
        } else {
            const d1 = new Date(fromButton.textContent);
            const d2 = new Date(toButton.textContent);

            if (d1.getTime() > d2.getTime()) {
                fromButton.textContent = toButton.textContent;
            }
        }
    }
});

fromButton.addEventListener("click", () => {
    setTimeout(() => {
        calendarEl.classList.remove("hidden");

        if (fromButton.textContent === "From") {
            now = new Date();
        } else {
            now = new Date(fromButton.textContent);
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
            now = new Date(toButton.textContent);
        }

        onLoad();
        currentDate = "to";
    }, 1)
});