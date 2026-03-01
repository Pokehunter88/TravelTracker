document.addEventListener("DOMContentLoaded", async () => {
    // --- DOM Elements ---
    const slider2 = document.getElementById('type-tab-slider');
    const visitContent = document.getElementById('visit-content');
    const wishlistContent = document.getElementById('wishlist-content');
    const searchInput = document.getElementById('search-input');
    const visitedOnlyCheckbox = document.getElementById('visited-countries-checkbox');
    const wishlistedOnlyCheckbox = document.getElementById('wishlisted-countries-checkbox');
    const countryNameEl = document.getElementById('country-name');
    const countryCapitalEl = document.getElementById('country-capital');
    const countryCapital2El = document.getElementById('country-capital2');
    const regionCountryEl = document.getElementById('region-country');
    const countryPopulationEl = document.getElementById('country-population');
    const countryCurrencyEl = document.getElementById('country-currency');
    const aboutCapitalEl = document.getElementById('about-capital');
    const aboutCountryEl = document.getElementById('about-country');
    const aboutPopulationEl = document.getElementById('about-population');
    const checkmarkEl = document.getElementById('checkmark');
    const modal = document.getElementById('country-modal');
    const modalCountryName = document.getElementById('modal-country-name');
    const visitsList = document.getElementById('visits-list');
    const fromButton = document.getElementById('from-button');
    const toButton = document.getElementById('to-button');

    // --- State Variables ---
    let countryToOpen = null;
    let countryInfoMap = new Map();
    let currentTab = "countries";
    let map;
    let currentCountry = "";
    let layer;
    let layerRegion;
    let lastTimeout = null;
    let visitedCountries = [];
    let wishlistedCountries = [];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // --- Data Loading ---
    async function loadData() {
        try {
            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.search);
          
            const tab = params.get("tab");
            const id = params.get("id");

            const countryInfoResponse = await fetch('datasets/countryInfo.txt', { cache: "force-cache" });
            const countryInfoText = await countryInfoResponse.text();
            countryInfoText.split('\n').forEach(line => {
                if (line.startsWith('#') || line.trim() === '') return;
                const columns = line.split('\t');
                if (columns.length > 4) {
                    const countryCode = columns[0].toLowerCase();
                    const countryName = columns[4];
                    countryInfoMap.set(countryCode, {
                        capital: columns[5],
                        population: columns[7],
                        currency: columns[11],
                        name: countryName
                    });
                    createItem(countryName, countryCode, columns[8].toLowerCase(), visitedCountries.includes(countryCode), wishlistedCountries.includes(countryCode));
                    if (tab === "countries" && id === countryCode.toLowerCase() && layer) {
                        setTimeout(() => {
                            openCountry(countryName, countryCode);

                            document.getElementById("country-" + countryCode.toLowerCase()).scrollIntoView();
                        }, 100);
                    } else if (tab === "countries" && id === countryCode.toLowerCase()) {
                        countryToOpen = [countryName, countryCode];
                    }
                }
            });
          
            const cities15000Response = await fetch('cities15000.txt', { cache: "force-cache" });
            const cities15000Text = await cities15000Response.text();
            cities15000Text.split('\n').forEach(line => {
                if (line.startsWith('#') || line.trim() === '') return;
                const columns = line.split('\t');
                if (columns.length > 4) {
                    const cityName = columns[2];
                    const cityName2 = columns[1];
                    const countryCode = columns[8];
                    if (countryCode === "FR") {
                        createItemCity(cityName, cityName2, countryCode, false);
                    }
                }
            });

            const regionsResponse = await fetch('ne_50m_admin_1_states_provinces.geojson', { cache: "force-cache" });
            const regionsData = await regionsResponse.json();

            layerRegion = L.geoJSON(regionsData, {
                style: () => {
                    return {
                        fillColor: '#FFFFFF00',
                        weight: 3,
                        color: '#FFFFFF00',
                        fillOpacity: 1
                    };
                }
            }).addTo(map);

            regionsData.features.forEach(feature => {
                const visited = false;

                const regionName = feature.properties.name;
                const countryCode = feature.properties.iso_a2;
                createItemRegion(regionName, feature.properties.code_hasc, countryInfoMap.get(countryCode.toLowerCase()).currency, countryInfoMap.get(countryCode.toLowerCase()).name, visited);

                if (tab === "regions") {
                    switchTab("regions");

                    if (id.toLowerCase() === feature.properties.code_hasc.toLowerCase() && layer) {
                        setTimeout(() => openRegion(regionName, feature.properties.code_hasc, countryInfoMap.get(countryCode.toLowerCase()).currency, countryInfoMap.get(countryCode.toLowerCase()).name, visited), 100);
                    } else if (id === countryCode.toLowerCase()) {
                        countryToOpen = [countryName, countryCode];
                    }
                }
            });
        } catch (error) { console.error('Error loading data:', error); }
    }

    // --- UI & Tab Management ---
    function switchTab(tab) {
        const tabActions = {
            'visit': () => {
                slider2.style.transform = 'translateX(0)';
                visitContent.classList.remove('hidden');
                wishlistContent.classList.add('hidden');

                createVisitList(modalCountryName.textContent, modalCountryName.name);
            },
            'wishlist': () => {
                slider2.style.transform = 'translateX(100%)';
                visitContent.classList.add('hidden');
                wishlistContent.classList.remove('hidden');

                createWishlistList(modalCountryName.textContent, modalCountryName.name);
            }
        };

        if (tabActions[tab]) {
            tabActions[tab]();
            if (['countries', 'cities', 'regions'].includes(tab)) {
                currentTab = tab;
                searchInput.value = "";
                search();
            }
        }
    }
    window.switchTab = switchTab;

    // --- Search ---
    function search() {
        const filter = searchInput.value.toUpperCase();
        const visitedOnly = visitedOnlyCheckbox.checked;
        const wishlistedOnly = wishlistedOnlyCheckbox.checked;

        if (currentTab === "countries") {
            const lists = document.querySelectorAll('#af, #an, #as, #eu, #na, #oc, #sa');
            lists.forEach(list => {
                const items = list.getElementsByTagName('label');
                let visibleItems = 0;
                for (let i = 0; i < items.length; i++) {
                    const p = items[i].getElementsByTagName('p')[0];
                    const txtValue = p.textContent || p.innerText;
                    const isVisited = visitedCountries.includes(items[i].id.replace("country-", ""));
                    const isWishlisted = wishlistedCountries.includes(items[i].id.replace("country-", ""));
                    if (txtValue.toUpperCase().indexOf(filter) > -1 && (visitedOnly ? (wishlistedOnly ? isVisited || isWishlisted : isVisited) : (wishlistedOnly ? isWishlisted : true))) {
                        items[i].style.display = "";
                        visibleItems++;
                    } else {
                        items[i].style.display = "none";
                    }
                }
                const title = list.previousElementSibling;
                if (title && title.tagName === 'H3') {
                    title.style.display = visibleItems > 0 ? "" : "none";
                }
            });
        }
    }
    window.search = search;

    // --- Item Creation ---
    function createItem(name, flag, continent, visited, wishlisted) {
        const newNode = document.createElement("label");
        newNode.className = `flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors ${visited ? (wishlisted ? 'bg-[var(--mix-color)] hover:bg-[var(--mix-hover-color)]' : 'bg-[var(--visit-color)] hover:bg-[var(--visit-hover-color)]') : (wishlisted ? 'bg-[var(--wishlist-color)] hover:bg-[var(--wishlist-hover-color)]' : 'hover:bg-[#2e363e]')}`;
        newNode.id = "country-" + flag;

        const leftContainer = document.createElement("div");
        leftContainer.className = "flex items-center gap-x-3";

        const img = document.createElement("img");
        img.className = "w-8 rounded";
        img.src = `https://flagcdn.com/${flag}.svg`;

        const text = document.createElement("p");
        text.className = "text-white text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text.textContent = name;

        leftContainer.append(img, text);
        newNode.append(leftContainer);
        newNode.addEventListener('click', () => openCountry(name, flag));
        document.getElementById(continent).append(newNode);
    }

    function createItemCity(name, secondName, country, visited) {
        const newNode = document.createElement("label");
        newNode.className = `flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors ${visited ? 'bg-[#00FF0036] hover:bg-[#00FF0083]' : 'hover:bg-[#2e363e]'}`;
        newNode.id = "city-" + name;
        newNode.classList.add("city-" + country);

        const leftContainer = document.createElement("div");
        leftContainer.className = "flex flex-row items-center gap-x-3";

        const text = document.createElement("p");
        text.className = "text-white text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text.textContent = name;

        const text2 = document.createElement("p");
        text2.className = "text-gray-500 text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text2.textContent = secondName;

        leftContainer.append(text);
        newNode.append(leftContainer, text2);
        newNode.addEventListener('click', () => { /* openModal(name, flag); openCountry(name, flag); */ });
        document.getElementById("cities").append(newNode);
    }

    function createItemRegion(name, id, currency, country, visited) {
        const newNode = document.createElement("label");
        newNode.className = `flex justify-between items-center cursor-pointer rounded-lg p-2 transition-colors ${visited ? 'bg-[#00FF0036] hover:bg-[#00FF0083]' : 'hover:bg-[#2e363e]'}`;
        newNode.id = "region-" + name;
        newNode.classList.add("region-" + country.replaceAll(" ", "-"));

        const leftContainer = document.createElement("div");
        leftContainer.className = "flex flex-row items-center gap-x-3";

        const text = document.createElement("p");
        text.className = "text-white text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text.textContent = name;

        const text2 = document.createElement("p");
        text2.className = "text-gray-500 text-base font-normal leading-normal peer-checked:text-[#dbe5ef] hover:bg-[#FFFFFF10] underline py-1 px-3 transition rounded";
        text2.name = "Country";
        text2.textContent = country;

        leftContainer.append(text);
        newNode.append(leftContainer, text2);
        newNode.addEventListener('click', (e) => {
            if (e.target.name === "Country") {
                searchInput.value = country + ": ";
                search();
            } else {
                openRegion(name, id, currency, country, visited);
            }
        });
        document.getElementById("regions").append(newNode);
    }

    // --- Map Logic ---
    function initializeMap() {
        map = L.map('map', {
            zoomControl: false, dragging: false, touchZoom: false, doubleClickZoom: false,
            scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false, attributionControl: false
        }).setView([0, 0], 5);
        loadCountries();
    }

    function countryStyle(feature) {
        const isoCode = feature.properties["ISO_A2_EH"];
        const isCurrent = currentCountry === isoCode.toLowerCase();
        return {
            fillColor: isCurrent ? '#FFFFFF' : '#2e363e',
            weight: 3,
            color: isCurrent ? '#FFFFFF' : '#2e363e',
            fillOpacity: 1
        };
    }

    function loadCountries() {
        fetch('ne_50m_admin_0_countries.geojson', { cache: "force-cache" })
            .then(res => res.json())
            .then(data => {
                if (layer) map.removeLayer(layer);
                layer = L.geoJSON(data, { style: countryStyle }).addTo(map);
                const element = document.querySelector('.map-start');
                element.classList.remove("map-start");
                setTimeout(() => {
                    element.style.transition = "max-width 0.5s ease-in-out, left 0.5s ease-in-out";
                }, 1);
                if (countryToOpen) {
                    setTimeout(() => {
                        openCountry(countryToOpen[0], countryToOpen[1])

                        document.getElementById("country-" + countryToOpen[1]).scrollIntoView();
                    }, 100);
                }
            });
    }

    function openCountry(name, flag) {
        if (countryNameEl.textContent === name && document.querySelector(':root').style.getPropertyValue('--container-width') === "960px") {
            closeCountry();
        } else {
            document.querySelector(':root').style.setProperty('--container-width', '960px');

            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.search);

            params.set('tab', 'countries');
            params.set('id', flag);

            url.search = params.toString();
            window.history.pushState({}, '', url);

            countryNameEl.textContent = name;
            countryNameEl.name = flag;
            updateCheckmark(flag);
            currentCountry = flag;

            const countryData = countryInfoMap.get(flag);
            countryCapitalEl.textContent = countryData.capital;
            countryCapital2El.textContent = countryData.capital;
            countryPopulationEl.textContent = Number(countryData.population).toLocaleString();
            countryCurrencyEl.textContent = countryData.currency;

            aboutCapitalEl.classList.remove("hidden");
            aboutPopulationEl.classList.remove("hidden");
            aboutCountryEl.classList.add("hidden");

            if (layerRegion) {
                layerRegion.eachLayer(function (currentLayer) {
                    currentLayer.setStyle({
                        fillColor: '#2e363e',
                        weight: 3,
                        color: '#2e363e',
                        fillOpacity: 1
                    });
                });
            }

            let layerBounds = null;
            layer.eachLayer(function (currentLayer) {
                const options = countryStyle(currentLayer.feature);
                currentLayer.options.fillColor = options.fillColor;
                currentLayer.options.color = options.color;
                currentLayer.setStyle(undefined);
                if (currentLayer.feature.properties.ISO_A2_EH === flag.toUpperCase()) {
                    layerBounds = currentLayer.getBounds();

                    map.fitBounds(layerBounds, true);
                }
            });

            if (lastTimeout) clearTimeout(lastTimeout);
            lastTimeout = setTimeout(() => {
                map.invalidateSize();
                if (layerBounds) map.fitBounds(layerBounds, true);
            }, 500);
        }
    }

    function openRegion(name, id, currency, country, visited) {
        if (countryNameEl.textContent === name && document.querySelector(':root').style.getPropertyValue('--container-width') === "960px") {
            closeCountry();
        } else {
            document.querySelector(':root').style.setProperty('--container-width', '960px');

            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.search);

            params.set('tab', 'regions');
            params.set('id', id);

            url.search = params.toString();
            window.history.pushState({}, '', url);


            countryNameEl.textContent = name;
            countryCapitalEl.textContent = country;

            regionCountryEl.textContent = country;
            countryCurrencyEl.textContent = currency;

            aboutCapitalEl.classList.add("hidden");
            aboutPopulationEl.classList.add("hidden");
            aboutCountryEl.classList.remove("hidden");

            checkmarkEl.classList.toggle("opacity-100", visited);
            checkmarkEl.classList.toggle("opacity-0", !visited);

            layer.eachLayer(function (currentLayer) {
                currentLayer.setStyle({
                    fillColor: '#2e363e',
                    weight: 3,
                    color: '#2e363e',
                    fillOpacity: 1
                });
            });

            let layerBounds = null;
            layerRegion.eachLayer(function (currentLayer) {
                if (currentLayer.feature.properties.name === name) {
                    currentLayer.setStyle({
                        fillColor: '#FFFFFF',
                        weight: 3,
                        color: '#FFFFFF',
                        fillOpacity: 1
                    });

                    layerBounds = currentLayer.getBounds();
                    map.fitBounds(layerBounds, true);
                } else {
                    currentLayer.setStyle({
                        fillColor: '#FFFFFF00',
                        weight: 3,
                        color: '#FFFFFF00',
                        fillOpacity: 1
                    });
                }
            });

            if (lastTimeout) clearTimeout(lastTimeout);
            lastTimeout = setTimeout(() => {
                map.invalidateSize();
                if (layerBounds) map.fitBounds(layerBounds, true);
            }, 500);
        }
    }

    function closeCountry() {
        document.querySelector(':root').style.setProperty('--container-width', '0px');
        window.location.hash = "";
    }
    window.closeCountry = closeCountry;

    function updateCheckmark(country) {
        const saveData = getSaveData();
        const isVisited = saveData.countryVisits.some(visit => visit.country === country);
        checkmarkEl.classList.toggle("opacity-100", isVisited);
        checkmarkEl.classList.toggle("opacity-0", !isVisited);
    }

    function createVisitList(countryName, countryCode) {
        visitsList.innerHTML = '';

        const saveData = getSaveData();
        const countryVisits = saveData.countryVisits.filter(visit => visit.country === countryCode);
        const countryWishlists = saveData.countryWishlists.filter(visit => visit.country === countryCode);

        countryVisits.forEach(visit => {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center p-2 border-b border-gray-700 font-bold';
            let textLabel;
            if (visit.from && visit.to) {
                const from = new Date(visit.from);
                const to = new Date(visit.to);

                let fromYear = from.getFullYear();
                let toYear = to.getFullYear();

                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const fromDay = from.getDate();
                const fromMonth = months[from.getMonth()];
                const toDay = to.getDate();
                const toMonth = months[to.getMonth()];

                if (visit.from === visit.to) {
                    textLabel = `${fromDay} ${fromMonth}, ${toYear}`;
                } else if (fromMonth === toMonth && fromYear === toYear) {
                    textLabel = `${fromDay} - ${toDay} ${fromMonth}, ${fromYear}`;
                } else if (fromYear === toYear) {
                    textLabel = `${fromDay} ${fromMonth} - ${toDay} ${toMonth}, ${toYear}`;
                } else {
                    textLabel = `${fromDay} ${fromMonth}, ${fromYear} - ${toDay} ${toMonth}, ${toYear}`;
                }
            } else {
                textLabel = "Visited";
            }
            listItem.appendChild(document.createTextNode(textLabel));

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition-all duration-300 ease-in-out transform hover:scale-105';
            removeButton.onclick = () => {
                saveData.countryVisits.splice(saveData.countryVisits.indexOf(visit), 1);
                if (saveData.countryVisits.filter(v => v.country === countryCode).length === 0) {
                    document.getElementById(`country-${countryCode}`).className = `flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors ${countryWishlists.length > 0 ? "bg-[var(--wishlist-color)] hover:bg-[var(--wishlist-hover-color)]" : "hover:bg-[#2e363e]"}`;
                }
                localStorage.setItem('saveData', JSON.stringify(saveData));
                openModal(countryName, countryCode);
                updateCheckmark(countryCode);
            };
            listItem.appendChild(removeButton);
            visitsList.appendChild(listItem);
        });
    }

    function createWishlistList(countryName, countryCode) {
        visitsList.innerHTML = '';

        const saveData = getSaveData();
        const countryVisits = saveData.countryVisits.filter(visit => visit.country === countryCode);
        const countryWishlists = saveData.countryWishlists.filter(visit => visit.country === countryCode);

        countryWishlists.forEach(visit => {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center p-2 border-b border-gray-700 font-bold';
            let textLabel;
            if (visit.from && visit.to) {
                const from = new Date(visit.from);
                const to = new Date(visit.to);

                let fromYear = from.getFullYear();
                let toYear = to.getFullYear();

                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const fromDay = from.getDate();
                const fromMonth = months[from.getMonth()];
                const toDay = to.getDate();
                const toMonth = months[to.getMonth()];

                if (visit.from === visit.to) {
                    textLabel = `${fromDay} ${fromMonth}, ${toYear}`;
                } else if (fromMonth === toMonth && fromYear === toYear) {
                    textLabel = `${fromDay} - ${toDay} ${fromMonth}, ${fromYear}`;
                } else if (fromYear === toYear) {
                    textLabel = `${fromDay} ${fromMonth} - ${toDay} ${toMonth}, ${toYear}`;
                } else {
                    textLabel = `${fromDay} ${fromMonth}, ${fromYear} - ${toDay} ${toMonth}, ${toYear}`;
                }
            } else {
                textLabel = "Wishlisted";
            }
            listItem.appendChild(document.createTextNode(textLabel));

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition-all duration-300 ease-in-out transform hover:scale-105';
            removeButton.onclick = () => {
                saveData.countryWishlists.splice(saveData.countryWishlists.indexOf(visit), 1);
                if (saveData.countryWishlists.filter(v => v.country === countryCode).length === 0) {
                    document.getElementById(`country-${countryCode}`).className = `flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors ${countryVisits.length > 0 ? "bg-[var(--visit-color)] hover:bg-[var(--visit-hover-color)]" : "hover:bg-[#2e363e]"}`;
                }
                localStorage.setItem('saveData', JSON.stringify(saveData));

                createWishlistList(countryName, countryCode);
            };
            listItem.appendChild(removeButton);
            visitsList.appendChild(listItem);
        });
    }

    // --- Modal Logic ---
    function openModal(countryName, countryCode) {
        switchTab('visit');
        modalCountryName.textContent = countryName;
        modalCountryName.name = countryCode;

        createVisitList(countryName, countryCode);

        fromButton.textContent = "From";
        toButton.textContent = "To";
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    // --- Data Persistence ---
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

    function getCountries() {
        const saveData = getSaveData();
        visitedCountries = saveData.countryVisits.map(visit => visit.country);
        wishlistedCountries = saveData.countryWishlists.map(visit => visit.country);
    }

    function dateFromText(text) {
        const [day, month, year] = text.split(" ");
        return new Date(parseInt(year), months.indexOf(month), parseInt(day));
    }

    // --- Event Listeners ---
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('add-to-visited').addEventListener('click', () => {
        const saveData = getSaveData();
        const from = fromButton.textContent;
        const to = toButton.textContent;
        let fromValue = null;
        let toValue = null;

        if (from !== "From" && to !== "To") {
            fromValue = dateFromText(from).getTime();
            toValue = dateFromText(to).getTime();
        }

        saveData.countryVisits.push({ country: modalCountryName.name, from: fromValue, to: toValue });
        localStorage.setItem("saveData", JSON.stringify(saveData));

        const countryWishlists = saveData.countryWishlists.filter(visit => visit.country === modalCountryName.name);

        document.getElementById(`country-${modalCountryName.name}`).className = `flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors ${countryWishlists.length > 0 ? "bg-[var(--mix-color)] hover:bg-[var(--mix-hover-color)]" : "bg-[var(--visit-color)] hover:bg-[var(--visit-hover-color)]"}`;
        openModal(modalCountryName.textContent, modalCountryName.name);
        getCountries();
        updateCheckmark(modalCountryName.name);
    });

    document.getElementById('visit-button').addEventListener('click', () => {
        openModal(countryNameEl.textContent, countryNameEl.name);
    });

    document.getElementById('add-to-wishlist').addEventListener('click', () => {
        const saveData = getSaveData();
        const from = fromButton.textContent;
        const to = toButton.textContent;
        let fromValue = null;
        let toValue = null;

        if (from !== "From" && to !== "To") {
            fromValue = dateFromText(from).getTime();
            toValue = dateFromText(to).getTime();
        }

        saveData.countryWishlists.push({ country: modalCountryName.name, from: fromValue, to: toValue });
        localStorage.setItem("saveData", JSON.stringify(saveData));

        const countryVisits = saveData.countryVisits.filter(visit => visit.country === modalCountryName.name);

        document.getElementById(`country-${modalCountryName.name}`).className = `flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors ${countryVisits.length > 0 ? "bg-[var(--mix-color)] hover:bg-[var(--mix-hover-color)]" : "bg-[var(--wishlist-color)] hover:bg-[var(--wishlist-hover-color)]"}`;

        fromButton.textContent = "From";
        toButton.textContent = "To";
        createWishlistList(modalCountryName.textContent, modalCountryName.name);
        getCountries();
    });

    visitedOnlyCheckbox.addEventListener('change', () => {
        wishlistedOnlyCheckbox.checked = false;
        search();
    });
    wishlistedOnlyCheckbox.addEventListener('change', () => {
        visitedOnlyCheckbox.checked = false;
        search();
    });

    // --- Initialization ---
    initializeMap();
    getCountries();
    await loadData();
});