document.addEventListener("DOMContentLoaded", async () => {
    // --- DOM Elements ---
    const slider = document.getElementById('main-tab-slider');
    const countriesContent = document.getElementById('countries-content');
    const citiesContent = document.getElementById('cities-content');
    const regionsContent = document.getElementById('regions-content');
    const slider2 = document.getElementById('type-tab-slider');
    const visitContent = document.getElementById('visit-content');
    const wishlistContent = document.getElementById('wishlist-content');
    const searchInput = document.getElementById('search-input');
    const visitedOnlyCheckbox = document.getElementById('visited-countries-checkbox');
    const countryNameEl = document.getElementById('country-name');
    const countryCapitalEl = document.getElementById('country-capital');
    const countryCapital2El = document.getElementById('country-capital2');
    const countryPopulationEl = document.getElementById('country-population');
    const countryCurrencyEl = document.getElementById('country-currency');
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
    let lastTimeout = null;
    let visitedCountries = [];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // --- Data Loading ---
    async function loadData() {
        try {
            const url = new URL(window.location.href);
            const id = url.hash.replace(/^#/, '');

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
                    createItem(countryName, countryCode, columns[8].toLowerCase(), visitedCountries.includes(countryCode));
                    if (id === countryCode.toLowerCase() && layer) {
                        console.log("test")
                        setTimeout(() => {
                            openCountry(countryName, countryCode);

                            document.getElementById("country-" + countryCode.toLowerCase()).scrollIntoView();
                        }, 100);
                    } else if (id === countryCode.toLowerCase()) {
                        console.log("test2")
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
            regionsData.features.forEach(feature => {
                const regionName = feature.properties.name;
                const countryCode = feature.properties.iso_a2;
                createItemRegion(regionName, countryInfoMap.get(countryCode.toLowerCase()).name, false);
            });
        } catch (error) { console.error('Error loading data:', error); }
    }

    // --- UI & Tab Management ---
    function switchTab(tab) {
        const tabActions = {
            'countries': () => {
                slider.style.transform = 'translateX(0)';
                countriesContent.classList.remove('hidden');
                citiesContent.classList.add('hidden');
                regionsContent.classList.add('hidden');
            },
            'cities': () => {
                slider.style.transform = 'translateX(100%)';
                countriesContent.classList.add('hidden');
                citiesContent.classList.remove('hidden');
                regionsContent.classList.add('hidden');
            },
            'regions': () => {
                slider.style.transform = 'translateX(200%)';
                countriesContent.classList.add('hidden');
                citiesContent.classList.add('hidden');
                regionsContent.classList.remove('hidden');
            },
            'visit': () => {
                slider2.style.transform = 'translateX(0)';
                visitContent.classList.remove('hidden');
                wishlistContent.classList.add('hidden');
            },
            'wishlist': () => {
                slider2.style.transform = 'translateX(100%)';
                visitContent.classList.add('hidden');
                wishlistContent.classList.remove('hidden');
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

        if (currentTab === "countries") {
            const lists = document.querySelectorAll('#af, #an, #as, #eu, #na, #oc, #sa');
            lists.forEach(list => {
                const items = list.getElementsByTagName('label');
                let visibleItems = 0;
                for (let i = 0; i < items.length; i++) {
                    const p = items[i].getElementsByTagName('p')[0];
                    const txtValue = p.textContent || p.innerText;
                    const isVisited = visitedCountries.includes(items[i].id.replace("country-", ""));
                    if (txtValue.toUpperCase().indexOf(filter) > -1 && (!visitedOnly || isVisited)) {
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
        } else if (currentTab === "cities") {
            const list = document.getElementById('cities');
            const items = list.getElementsByTagName('label');
            for (let i = 0; i < items.length; i++) {
                const p = items[i].getElementsByTagName('p')[0];
                const txtValue = p.textContent || p.innerText;
                items[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
            }
        } else if (currentTab === "regions") {
            const list = document.getElementById('regions');
            const items = list.getElementsByTagName('label');
            for (let i = 0; i < items.length; i++) {
                const elements = items[i].getElementsByTagName('p');
                const p = elements[0];
                const p2 = elements[1];
                const txtValue = p.textContent || p.innerText;
                const txtValue2 = p2.textContent || p2.innerText;

                if (filter.includes(":")) {
                    const split = filter.split(":");
                    const part1 = split[0];
                    const part2 = split[1][0] === " " ? split[1].substring(1) : split[1];

                    items[i].style.display = txtValue.toUpperCase().indexOf(part2) > -1 & txtValue2.toUpperCase().indexOf(part1) > -1 ? "" : "none";
                } else {
                    items[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 || txtValue2.toUpperCase().indexOf(filter) > -1 ? "" : "none";
                }
            }
        }
    }
    window.search = search;

    // --- Item Creation ---
    function createItem(name, flag, continent, visited) {
        const newNode = document.createElement("label");
        newNode.className = `flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors ${visited ? 'bg-[#2b7fff4f] hover:bg-[#1447e64f]' : 'hover:bg-[#2e363e]'}`;
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

    function createItemRegion(name, country, visited) {
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
            /* openModal(name, flag); openCountry(name, flag); */

            if (e.target.name === "Country") {
                searchInput.value = country + ": ";
                search();
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
        fetch('/ne_50m_admin_0_countries.geojson', { cache: "force-cache" })
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
            window.location.hash = flag;
            countryNameEl.textContent = name;
            countryNameEl.name = flag;
            updateCheckmark(flag);
            currentCountry = flag;

            const countryData = countryInfoMap.get(flag);
            countryCapitalEl.textContent = countryData.capital;
            countryCapital2El.textContent = countryData.capital;
            countryPopulationEl.textContent = Number(countryData.population).toLocaleString();
            countryCurrencyEl.textContent = countryData.currency;

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

    // --- Modal Logic ---
    function openModal(countryName, countryCode) {
        switchTab('visit');
        modalCountryName.textContent = countryName;
        modalCountryName.name = countryCode;
        visitsList.innerHTML = '';

        const saveData = getSaveData();
        const countryVisits = saveData.countryVisits.filter(visit => visit.country === countryCode);

        countryVisits.forEach(visit => {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center p-2 border-b border-gray-700 font-bold';
            let textLabel;
            if (visit.from && visit.to) {
                const from = new Date(visit.from);
                const to = new Date(visit.to);
                textLabel = `${months[from.getMonth()]} ${from.getFullYear() === to.getFullYear() ? '' : from.getFullYear()} > ${months[to.getMonth()]} ${to.getFullYear()}`;
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
                    document.getElementById(`country-${countryCode}`).className = "flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#2e363e]";
                }
                localStorage.setItem('saveData', JSON.stringify(saveData));
                openModal(countryName, countryCode);
                updateCheckmark(countryCode);
            };
            listItem.appendChild(removeButton);
            visitsList.appendChild(listItem);
        });

        fromButton.textContent = "From";
        toButton.textContent = "To";
        modal.classList.remove('hidden');

        const addToWishlistButton = document.getElementById('add-to-wishlist');
        if (saveData.countryWishlist && saveData.countryWishlist[countryCode]) {
            addToWishlistButton.textContent = "Added to Wishlist";
            addToWishlistButton.classList.remove("bg-blue-500", "hover:bg-blue-700");
            addToWishlistButton.classList.add("bg-green-500");
        } else {
            addToWishlistButton.textContent = "Add to Wishlist";
            addToWishlistButton.classList.remove("bg-green-500");
            addToWishlistButton.classList.add("bg-blue-500", "hover:bg-blue-700");
        }
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    // --- Data Persistence ---
    function getSaveData() {
        try {
            return JSON.parse(localStorage.getItem("saveData")) || { countryVisits: [], countryWishlist: {} };
        } catch (e) {
            return { countryVisits: [], countryWishlist: {} };
        }
    }

    function getCountries() {
        const saveData = getSaveData();
        visitedCountries = saveData.countryVisits.map(visit => visit.country);
    }

    function dateFromText(text) {
        const [month, year] = text.split(" ");
        return new Date(parseInt(year), months.indexOf(month));
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
        document.getElementById(`country-${modalCountryName.name}`).className = "flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors bg-[#2b7fff4f] hover:bg-[#1447e64f]";
        openModal(modalCountryName.textContent, modalCountryName.name);
        getCountries();
        updateCheckmark(modalCountryName.name);
    });

    document.getElementById('visit-button').addEventListener('click', () => {
        openModal(countryNameEl.textContent, countryNameEl.name);
    });

    document.getElementById('add-to-wishlist').addEventListener('click', () => {
        const saveData = getSaveData();
        const countryCode = modalCountryName.name;
        if (!saveData.countryWishlist) {
            saveData.countryWishlist = {};
        }
        saveData.countryWishlist[countryCode] = true;
        localStorage.setItem("saveData", JSON.stringify(saveData));

        const addToWishlistButton = document.getElementById('add-to-wishlist');
        addToWishlistButton.textContent = "Added to Wishlist";
        addToWishlistButton.classList.remove("bg-blue-500", "hover:bg-blue-700");
        addToWishlistButton.classList.add("bg-green-500");
    });



    visitedOnlyCheckbox.addEventListener('change', search);

    // --- Initialization ---
    initializeMap();
    getCountries();
    await loadData();
});