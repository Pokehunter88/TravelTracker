document.addEventListener("DOMContentLoaded", async () => {
    const timelineContainer = document.querySelector(".timeline-container");
    let countryInfoMap = new Map();
    let map;
    let geoJsonLayer;
    let currentCountry = null;
    let visitedCountries = [];
    let countryList = [];
    let unknownCountryList = [];
    let currentCountryAnimation = 0;
    let lastTimeout = null;
    let speed = 1;

    function getSaveData() {
        try {
            const saveData = JSON.parse(localStorage.getItem("saveData") ?? { countryVisits: [], countryWishlists: [] });

            if (saveData.countryVisits === undefined) {
                saveData.countryVisits = [];
            }
            if (saveData.countryWishlists === undefined) {
                saveData.countryWishlists = [];
            }

            return saveData;
        } catch (e) {
            return { countryVisits: [], countryWishlists: [] };
        }
    }

    function populateVisitedCountries() {
        const saveData = getSaveData();
        visitedCountries = [];
        for (let i = 0; i < saveData.countryVisits.length; i++) {
            if (!visitedCountries.includes(saveData.countryVisits[i].country.toUpperCase())) {
                visitedCountries.push(saveData.countryVisits[i].country.toUpperCase());
            }
        }
    }

    async function loadCountryData() {
        try {
            const countryInfoResponse = await fetch('datasets/countryInfo.txt');
            const countryInfoText = await countryInfoResponse.text();
            countryInfoText.split('\n').forEach(line => {
                if (line.startsWith('#') || line.trim() === '') {
                    return;
                }
                const columns = line.split('\t');
                if (columns.length > 4) {
                    const countryCode = columns[0].toLowerCase();
                    const countryName = columns[4];
                    countryInfoMap.set(countryCode, { name: countryName });
                }
            });
        } catch (error) {
            console.error('Error loading country data:', error);
        }
    }

    function highlightCountry(countryCode) {
        // if (currentCountry === countryCode) {
        //     currentCountry = null; // deselect
        // } else {
        //     currentCountry = countryCode;
        // }
        currentCountry = countryCode;

        if (geoJsonLayer) {
            geoJsonLayer.eachLayer(function (layer) {
                layer.setStyle(countryStyle(layer.feature));
                if (currentCountry && layer.feature.properties.ISO_A2_EH.toLowerCase() === currentCountry) {
                    map.fitBounds(layer.getBounds());
                }
            });
        }

        if (!currentCountry) {
            map.setView([0, 0], 1);
        }
    }

    function highlightCountryText(country) {
        for (let i = 0; i < countryList.length; i++) {
            countryList[i][1].className = 'text-lg font-medium text-white text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
        }
        for (let i = 0; i < unknownCountryList.length; i++) {
            unknownCountryList[i].className = 'text-lg font-medium text-white text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
        }

        countryList[country][1].className = 'text-lg font-medium text-[#0ea5e9] text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
    }

    function highlightCountryTextUnknown(country) {
        for (let i = 0; i < countryList.length; i++) {
            countryList[i][1].className = 'text-lg font-medium text-white text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
        }
        for (let i = 0; i < unknownCountryList.length; i++) {
            unknownCountryList[i].className = 'text-lg font-medium text-white text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
        }

        unknownCountryList[country].className = 'text-lg font-medium text-[#0ea5e9] text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
    }

    function animationLoop() {
        highlightCountry(countryList[currentCountryAnimation][0]);

        highlightCountryText(currentCountryAnimation);
        countryList[currentCountryAnimation][1].scrollIntoView();

        if (currentCountryAnimation < countryList.length - 1) {
            currentCountryAnimation++;
            lastTimeout = setTimeout(animationLoop, 1000 / speed);
        } else {
            currentCountryAnimation = 0;
            lastTimeout = null;
            playButton.textContent = "Play";
        }
    }

    const playButton = document.getElementById('play-button');
    const speedButton = document.getElementById('speed-button');
    const restartButton = document.getElementById('restart-button');

    playButton.addEventListener("click", () => {
        if (lastTimeout === null) {
            if (currentCountryAnimation >= countryList.length - 1) {
                currentCountryAnimation = 0;
            }

            animationLoop();

            playButton.textContent = "Pause";
        } else {
            clearTimeout(lastTimeout);
            lastTimeout = null;

            playButton.textContent = "Play";
        }
    });

    speedButton.addEventListener("click", () => {
        if (speed === 0.5) {
            speed = 1
            speedButton.textContent = "x1.0";
        } else if (speed === 1) {
            speed = 1.5
            speedButton.textContent = "x1.5";
        } else if (speed === 1.5) {
            speed = 2
            speedButton.textContent = "x2.0";
        } else if (speed === 2) {
            speed = 0.5
            speedButton.textContent = "x0.5";
        }
    });

    restartButton.addEventListener("click", () => {
        // if (lastTimeout !== null) {
        //     clearTimeout(lastTimeout);
        //     lastTimeout = null;
        // }

        currentCountryAnimation = 0;
        highlightCountryText(0);
        highlightCountry(countryList[0][0]);
        countryList[0][1].scrollIntoView();

        // animationLoop();

        // playButton.textContent = "Pause";
    });

    function createTimelineItem(visit, unknown) {
        const countryData = countryInfoMap.get(visit.country);
        const countryName = countryData ? countryData.name : visit.country;

        const item = document.createElement('button');
        item.className = 'flex items-start relative timeline-item hover:bg-[#FFFFFF20] text-left rounded w-full p-2';

        const count = unknown ? unknownCountryList.length : countryList.length;

        item.addEventListener('click', (e) => {
            if (e.target.nodeName === 'I') {
                window.location = "/list.html#" + visit.country;
            } else {
                highlightCountry(visit.country);

                if (unknown) {
                    highlightCountryTextUnknown(count);
                } else {
                    highlightCountryText((countryList.length - 1) - count);
                }

                currentCountryAnimation = unknown ? 0 : (countryList.length - 1) - count;
            }

        });

        const dot = document.createElement('div');
        dot.className = 'absolute left-[-28px] top-4 w-4 h-4 bg-sky-500 rounded-full';
        item.appendChild(dot);

        const content = document.createElement('div');
        content.className = 'ml-4 flex-grow';
        item.appendChild(content);

        const innerContent = document.createElement('div');
        innerContent.className = 'flex items-center justify-between';
        content.appendChild(innerContent);

        const details = document.createElement('div');
        innerContent.appendChild(details);

        const countryInfo = document.createElement('div');
        countryInfo.className = 'flex items-center space-x-2';
        details.appendChild(countryInfo);

        const flag = document.createElement('img');
        flag.className = 'w-7 h-auto rounded';
        flag.src = `https://flagcdn.com/${visit.country}.svg`;
        countryInfo.appendChild(flag);

        const name = document.createElement('span');
        name.className = 'text-lg font-medium text-white text-balance scroll-m-[15dvh] md:scroll-m-[35dvh]';
        name.textContent = countryName;
        countryInfo.appendChild(name);

        if (!unknown) {
            countryList.push([visit.country, name]);
        } else {
            unknownCountryList.push(name);
        }

        const date = document.createElement('p');
        date.className = 'text-sm text-gray-400';
        if (visit.from && visit.to) {
            const from = new Date(visit.from);
            const to = new Date(visit.to);
            const fromMonth = from.toLocaleString('default', { month: 'short' });
            const toMonth = to.toLocaleString('default', { month: 'short' });
            const fromYear = from.getFullYear();
            const toYear = to.getFullYear();

            if (fromYear === toYear) {
                if (fromMonth === toMonth) {
                    date.textContent = `${fromMonth}, ${toYear}`;
                } else {
                    date.textContent = `${fromMonth} - ${toMonth}, ${toYear}`;
                }
            } else {
                date.textContent = `${fromMonth} ${fromYear} - ${toMonth} ${toYear}`;
            }
        } else {
            date.textContent = 'Visited';
        }
        details.appendChild(date);

        const moreButton = document.createElement('button');
        moreButton.innerHTML = '<i class="material-icons text-gray-400 text-3xl hover:bg-[#FFFFFF20] w-10 rounded-full">more_horiz</i>';
        innerContent.appendChild(moreButton);

        return item;
    }

    function createYearSection(year, visits) {
        const yearSection = document.createElement('div');
        yearSection.className = 'relative timeline-year mt-4';

        const yearTitle = document.createElement('h2');
        yearTitle.className = 'text-xl font-bold py-4 pl-8 text-gray-400';
        yearTitle.textContent = year;
        yearSection.appendChild(yearTitle);

        const yearContent = document.createElement('div');
        yearContent.className = 'pl-8 space-y-6';
        yearSection.appendChild(yearContent);

        visits.forEach(visit => {
            yearContent.appendChild(createTimelineItem(visit, year === "Unknown"));
        });

        return yearSection;
    }

    async function renderTimeline() {
        await loadCountryData();
        const saveData = getSaveData();
        const visits = saveData.countryVisits;

        if (visits.length === 0) {
            const noVisitsMessage = document.createElement('p');
            noVisitsMessage.className = 'text-white text-center';
            noVisitsMessage.textContent = 'No visits recorded yet.';
            timelineContainer.appendChild(noVisitsMessage);
            return;
        }

        const noDate = [];

        const visitsByYear = visits.reduce((acc, visit) => {
            if (visit.from === null) {
                noDate.push(visit);
                return acc;
            }

            const year = visit.from ? new Date(visit.from).getFullYear() : new Date(visit.to).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(visit);
            return acc;
        }, {});

        const sortedYears = Object.keys(visitsByYear).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const yearVisits = visitsByYear[year];
            yearVisits.sort((a, b) => (b.from === a.from ? b.to - a.to : b.from - a.from));
            timelineContainer.appendChild(createYearSection(year, yearVisits));
        });

        noDate.sort((a, b) => a.country.localeCompare(b.country));
        if (noDate.length > 0) {
            timelineContainer.appendChild(createYearSection("Unknown", noDate));
        }

        countryList = countryList.reverse();
    }

    function countryStyle(feature) {
        const isoCode = feature.properties["ISO_A2_EH"];
        const isVisited = visitedCountries.includes(isoCode);
        const isCurrent = currentCountry === isoCode.toLowerCase();

        let color = '#2e363e';
        // let color = '#' + Math.round((Math.random() * 9)) + Math.round((Math.random() * 9)) + Math.round((Math.random() * 9)) + Math.round((Math.random() * 9)) + Math.round((Math.random() * 9)) + Math.round((Math.random() * 9));
        let weight = 1;

        if (isVisited) {
            color = '#FFFFFF'; // visited
            weight = 2;
        }
        if (isCurrent) {
            color = '#0ea5e9'; // selected
            weight = 3;
        }

        return {
            fillColor: color,
            weight: weight,
            color: color,
            fillOpacity: 1
        };
    }

    // function onEachCountry(feature, layer) {
    //     layer.on({
    //         mouseover: (e) => {
    //             const layer = e.target;
    //             layer.setStyle({
    //                 fillColor: '#3f474f',
    //                 color: '#3f474f',
    //             });
    //             // You now know which country is hovered:
    //             console.log('Hovering over:', feature.properties.ADMIN);
    //         },
    //         mouseout: (e) => {
    //             const isoCode = feature.properties["ISO_A2_EH"];
    //             const layer = e.target;
    //             layer.setStyle({
    //                 fillColor: currentCountry == isoCode.toLowerCase() ? '#0ea5e9' : visitedCountries.includes(isoCode) ? '#FFFFFF' : '#2e363e',
    //                 color: currentCountry == isoCode.toLowerCase() ? '#0ea5e9' : visitedCountries.includes(isoCode) ? '#FFFFFF' : '#2e363e',
    //             });
    //         },
    //         click: (e) => {
    //             const isoCode = feature.properties["ISO_A2_EH"];
    //             currentCountry = isoCode.toLowerCase();
    //             highlightCountry(currentCountry);
    //         }
    //     });
    // }

    function initMap() {
        map = L.map('map', {
            zoomControl: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false,
            attributionControl: false
        }).setView([0, 0], 1);

        fetch('ne_50m_admin_0_countries.geojson', { cache: "force-cache" })
            .then(res => res.json())
            .then(data => {
                geoJsonLayer = L.geoJSON(data, {
                    style: countryStyle,
                    // onEachFeature: onEachCountry
                }).addTo(map);
            });
    }

    // Main execution
    populateVisitedCountries();
    await renderTimeline();
    initMap();
});