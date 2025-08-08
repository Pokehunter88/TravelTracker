document.addEventListener("DOMContentLoaded", async () => {
    const slider = document.getElementById('main-tab-slider');
    const countriesContent = document.getElementById('countries-content');
    const citiesContent = document.getElementById('cities-content');
    const regionsContent = document.getElementById('regions-content');

    const slider2 = document.getElementById('type-tab-slider');
    const visitContent = document.getElementById('visit-content');
    const wishlistContent = document.getElementById('wishlist-content');

    let countryToOpen = null;

    let countryInfoMap = new Map();
    // let cities15000Map = new Map();

    async function loadData() {
        try {
            const url = new URL(window.location.href);
            const id = url.hash.replace(/^#/, '');

            const countryInfoResponse = await fetch('countryInfo.txt', { cache: "force-cache" });
            const countryInfoText = await countryInfoResponse.text();
            countryInfoText.split('\n').forEach(line => {
                if (line.startsWith('#') || line.trim() === '') {
                    return;
                }
                const columns = line.split('\t');
                if (columns.length > 4) {
                    const countryCode = columns[0].toLowerCase();
                    const countryName = columns[4];
                    const capital = columns[5];
                    countryInfoMap.set(countryCode, { capital: capital, population: columns[7], currency: columns[11] });

                    createItem(countryName, countryCode, columns[8].toLowerCase(), visitedCountries.includes(countryCode));

                    if (id === countryCode.toLowerCase() && layer) {
                        setTimeout(() => {
                            openCountry(countryName, countryCode);
                        }, 100);
                    } else if (id === countryCode.toLowerCase()) {
                        countryToOpen = [countryName, countryCode];
                    }
                }
            });

            const cities15000Response = await fetch('cities15000.txt', { cache: "force-cache" });
            const cities15000Text = await cities15000Response.text();
            cities15000Text.split('\n').forEach(line => {
                if (line.startsWith('#') || line.trim() === '') {
                    return;
                }
                const columns = line.split('\t');
                if (columns.length > 4) {
                    const cityName = columns[2];
                    const cityName2 = columns[1];
                    const countryCode = columns[8];
                    const latitude = parseFloat(columns[4]);
                    const longitude = parseFloat(columns[5]);
                    // cities15000Map.set(cityName + columns[8], { latitude: latitude, longitude: longitude });

                    if (countryCode === "FR")
                        createItemCity(cityName, cityName2, countryCode, false);
                }
            });
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    let currentTab = "countries";

    function switchTab(tab) {
        if (tab === 'countries') {
            slider.style.transform = 'translateX(0)';
            countriesContent.classList.remove('hidden');
            citiesContent.classList.add('hidden');
            regionsContent.classList.add('hidden');
            currentTab = tab;
            document.getElementById('search-input').value = "";
            search();
        } else if (tab === 'cities') {
            slider.style.transform = 'translateX(100%)';
            countriesContent.classList.add('hidden');
            citiesContent.classList.remove('hidden');
            regionsContent.classList.add('hidden');
            currentTab = tab;
            document.getElementById('search-input').value = "";
            search();
        } else if (tab === 'regions') {
            slider.style.transform = 'translateX(200%)';
            countriesContent.classList.add('hidden');
            citiesContent.classList.add('hidden');
            regionsContent.classList.remove('hidden');
            currentTab = tab;
            document.getElementById('search-input').value = "";
            search();
        } else if (tab === 'visit') {
            slider2.style.transform = 'translateX(0)';
            visitContent.classList.remove('hidden');
            wishlistContent.classList.add('hidden');
        } else if (tab === 'wishlist') {
            slider2.style.transform = 'translateX(100%)';
            visitContent.classList.add('hidden');
            wishlistContent.classList.remove('hidden');
        }
    }

    window.switchTab = switchTab;

    function search() {
        const input = document.getElementById('search-input');
        const visitedOnly = document.getElementById('visited-countries-checkbox').checked;

        if (currentTab === "countries") {
            const filter = input.value.toUpperCase();
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
            const filter = input.value.toUpperCase();
            const list = document.getElementById('cities');

            const items = list.getElementsByTagName('label');
            let visibleItems = 0;
            for (let i = 0; i < items.length; i++) {
                const p = items[i].getElementsByTagName('p')[0];
                const txtValue = p.textContent || p.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    items[i].style.display = "";
                    visibleItems++;
                } else {
                    items[i].style.display = "none";
                }
            }
        }
    }

    window.search = search;

    function createItemCity(name, secondName, country, visited) {
        const newNode = document.createElement("label");

        if (visited) {
            newNode.className = "flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors hover:bg-[#00FF0083] bg-[#00FF0036]";
        }
        else {
            newNode.className = "flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors hover:bg-[#2e363e]";
        }

        newNode.id = "city-" + name;

        newNode.classList.add("city-" + country);

        const leftContainer = document.createElement("div");
        leftContainer.className = "flex flex-row items-center gap-x-3";

        const text = document.createElement("p");

        text.className = "text-white text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text.textContent = name;

        leftContainer.append(text);

        const text2 = document.createElement("p");

        text2.className = "text-gray-500 text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text2.textContent = secondName;

        // const img = document.createElement("img");

        // img.className = "w-8 rounded"
        // img.src = `https://flagcdn.com/${flag}.svg`

        // leftContainer.append(img);

        // const arrow = document.createElement("p");
        // arrow.className = "text-white text-base font-bold text-[20px] leading-normal hover:bg-[#4c5967] p-2 w-10 text-center rounded-full";
        // arrow.innerHTML = "&gt;";

        newNode.append(leftContainer);

        newNode.append(text2);
        // newNode.append(arrow);

        newNode.addEventListener('click', () => {
            // openModal(name, flag);

            // openCountry(name, flag);
        });

        document.getElementById("cities").append(newNode);
    }

    function createItem(name, flag, continent, visited) {
        const newNode = document.createElement("label");

        if (visited) {
            newNode.className = "flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors bg-[#2b7fff4f] hover:bg-[#1447e64f]";
        }
        else {
            newNode.className = "flex justify-between items-center cursor-pointer rounded-lg px-3 py-3 transition-colors hover:bg-[#2e363e]";
        }

        newNode.id = "country-" + flag;

        const leftContainer = document.createElement("div");
        leftContainer.className = "flex items-center gap-x-3";

        const text = document.createElement("p");

        text.className = "text-white text-base font-normal leading-normal peer-checked:text-[#dbe5ef]";
        text.textContent = name;

        const img = document.createElement("img");

        img.className = "w-8 rounded"
        img.src = `https://flagcdn.com/${flag}.svg`

        leftContainer.append(img);
        leftContainer.append(text);

        // const arrow = document.createElement("p");
        // arrow.className = "text-white text-base font-bold text-[20px] leading-normal hover:bg-[#4c5967] p-2 w-10 text-center rounded-full";
        // arrow.innerHTML = "&gt;";

        newNode.append(leftContainer);
        // newNode.append(arrow);

        newNode.addEventListener('click', () => {
            // openModal(name, flag);

            openCountry(name, flag);
        });

        document.getElementById(continent).append(newNode);
    }

    let map;
    let currentCountry = "";
    let layer;

    function countryStyle(feature) {
        // console.log(feature.properties);
        const isoCode = feature.properties["ISO_A2_EH"];
        return {
            fillColor: currentCountry === isoCode.toLowerCase() ? '#FFFFFF' : '#2e363e',
            weight: 3,
            color: currentCountry === isoCode.toLowerCase() ? '#FFFFFF' : '#2e363e',
            fillOpacity: 1
        };
    }

    map = L.map('map', {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        attributionControl: false
    }).setView([0, 0], 5);

    // helper to (re)load and draw the countries
    function loadCountries() {
        // fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        // fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/refs/heads/master/geojson/ne_50m_populated_places_simple.geojson')
        // fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/refs/heads/master/geojson/ne_50m_admin_0_countries.geojson')
        fetch('/ne_50m_admin_0_countries.geojson', { cache: "force-cache" })
            .then(res => res.json())
            .then(data => {
                if (layer) {
                    map.removeLayer(layer);
                }

                layer = L.geoJSON(data, {
                    style: countryStyle,
                }).addTo(map);

                const element = document.querySelector('.map-start');
                element.classList.remove("map-start");
                setTimeout(() => {
                    element.style.transition = "max-width 0.5s ease-in-out, left 0.5s ease-in-out";
                }, 1);

                if (countryToOpen !== null) {
                    setTimeout(() => {
                        openCountry(countryToOpen[0], countryToOpen[1]);
                    }, 100);
                }
            });
    }

    loadCountries();

    function updateCheckmark(country) {
        const saveData = getSaveData();
        const countryVisits = saveData.countryVisits.filter(visit => visit.country === country);

        if (countryVisits.length > 0) {
            document.getElementById('checkmark').classList.remove("opacity-0");
            document.getElementById('checkmark').classList.add("opacity-100");
        } else {
            document.getElementById('checkmark').classList.remove("opacity-100");
            document.getElementById('checkmark').classList.add("opacity-0");
        }
    }

    function closeCountry() {
        document.querySelector(':root').style.setProperty('--container-width', '0px');
        window.location.hash = "";
    }

    window.closeCountry = closeCountry;

    let lastTimeout = null;

    function openCountry(name, flag) {
        if (document.getElementById('country-name').textContent === name && document.querySelector(':root').style.getPropertyValue('--container-width') === "960px") {
            closeCountry()
        } else {
            document.querySelector(':root').style.setProperty('--container-width', '960px');

            window.location.hash = flag;

            document.getElementById('country-name').textContent = name;
            document.getElementById('country-name').name = flag;

            updateCheckmark(flag);

            currentCountry = flag;
            // loadCountries()

            const countryData = countryInfoMap.get(flag);
            document.getElementById('country-capital').textContent = countryData.capital;


            document.getElementById('country-capital2').textContent = countryData.capital;

            const population = countryData.population.split("");

            let populationString = "";

            for (let i = 0; i < population.length; i++) {
                populationString += population[i];
                if ((i + 1) % 3 == 0 && population.length > i + 1) {
                    populationString += ",";
                }
            }

            document.getElementById('country-population').textContent = populationString;
            document.getElementById('country-currency').textContent = countryData.currency;

            // if (countryData && countryData.capital) {
            //   document.getElementById('country-capital').textContent = countryData.capital;
            //   const cityData = cities15000Map.get(countryData.capital + flag.toUpperCase());
            //   if (cityData) {
            //     // console.log(`Capital city ${countryData.capital} ${cityData.latitude} ${cityData.longitude} found in cities15000.txt`);
            //     // map.setView([cityData.latitude, cityData.longitude], 2);
            //   } else {
            //     console.error(`Capital city ${countryData.capital} not found in cities15000.txt`);
            //     map.setView([0, 0], 1);
            //   }
            // } else {
            //   console.warn(`Country data for ${flag} not found in countryInfo.txt`);
            //   map.setView([0, 0], 0);
            // }


            (async () => {
                let layerBounds = null;

                layer.eachLayer(function (currentLayer) {
                    const options = countryStyle(currentLayer.feature);

                    currentLayer.options.fillColor = options.fillColor;
                    currentLayer.options.color = options.color;

                    currentLayer.setStyle(undefined);
                    if (currentLayer.feature.properties.ISO_A2_EH === flag.toUpperCase()) {
                        map.fitBounds(currentLayer.getBounds(), true);

                        layerBounds = currentLayer.getBounds();
                    }
                });

                if (lastTimeout !== null) {
                    clearTimeout(lastTimeout);
                }

                lastTimeout = setTimeout(() => {
                    map.invalidateSize();

                    if (layerBounds !== null) {
                        map.fitBounds(layerBounds, true);
                    }
                }, 500);
            })()
        }
    }

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    // const months = [
    //     "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    //     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    // ];

    function openModal(countryName, countryCode) {
        slider2.style.transform = 'translateX(0)';
        visitContent.classList.remove('hidden');
        wishlistContent.classList.add('hidden');

        const modal = document.getElementById('country-modal');
        const modalCountryName = document.getElementById('modal-country-name');
        const visitsList = document.getElementById('visits-list');
        modalCountryName.textContent = countryName;
        modalCountryName.name = countryCode;

        visitsList.innerHTML = '';

        const saveData = getSaveData();
        const countryVisits = saveData.countryVisits.filter(visit => visit.country === countryCode);

        countryVisits.forEach((visit, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center p-2 border-b border-gray-700 font-bold';
            // const textNode = document.createTextNode(`From: ${visit.from || 'N/A'}, To: ${visit.to || 'N/A'}`);

            let textLabel;

            if (visit.from != null && visit.to != null) {
                const from = new Date(visit.from);
                const to = new Date(visit.to);

                textLabel = months[from.getMonth()] + " " + (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear() ? "" : (from.getFullYear() === to.getFullYear() ? "" : from.getFullYear()) + " > " + months[to.getMonth()] + " ") + to.getFullYear();
            } else {
                textLabel = "Visited";
            }

            const textNode = document.createTextNode(textLabel);
            textNode.className = "font-bold text-black";
            listItem.appendChild(textNode);

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition-all duration-300 ease-in-out transform hover:scale-105';
            removeButton.onclick = () => {
                saveData.countryVisits.splice(saveData.countryVisits.indexOf(visit), 1);

                if (saveData.countryVisits.filter(visit => visit.country === countryCode).length == 0) {
                    document.getElementById("country-" + document.getElementById('modal-country-name').name).className = "flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#2e363e]";
                }

                localStorage.setItem('saveData', JSON.stringify(saveData));
                openModal(countryName, countryCode);
                updateCheckmark(countryCode);
            };

            listItem.appendChild(removeButton);
            visitsList.appendChild(listItem);
        });

        document.getElementById('from-button').textContent = "From";
        document.getElementById('to-button').textContent = "To";

        modal.classList.remove('hidden');
    }

    function closeModal() {
        const modal = document.getElementById('country-modal');
        modal.classList.add('hidden');
    }

    function getSaveData() {
        try {
            return JSON.parse(localStorage.getItem("saveData") ?? "invalid");
        } catch (e) {
            return { countryVisits: [], countryWishlist: {} };
        }
    }

    let visitedCountries = [];

    function getCountries() {
        const saveData = getSaveData();

        visitedCountries = [];

        for (let i = 0; i < saveData.countryVisits.length; i++) {
            visitedCountries.push(saveData.countryVisits[i].country);
        }
    }

    getCountries();
    await loadData();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function dateFromText(text) {
        const split = text.split(" ");
        const monthIndex = monthNames.indexOf(split[0]);
        return new Date(parseInt(split[1]), monthIndex);
    }

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('add-to-visited').addEventListener('click', () => {
        const saveData = getSaveData();

        console.log(saveData);

        const from = document.getElementById('from-button').textContent;
        const to = document.getElementById('to-button').textContent;

        let fromValue = null;
        let toValue = null;

        if (from !== "From" && to !== "To") {
            fromValue = dateFromText(from).getTime();
            toValue = dateFromText(to).getTime();
        }

        saveData.countryVisits.push({ country: document.getElementById('modal-country-name').name, from: fromValue, to: toValue })

        localStorage.setItem("saveData", JSON.stringify(saveData));

        document.getElementById("country-" + document.getElementById('modal-country-name').name).className = "flex cursor-pointer items-center gap-x-3 rounded-lg px-3 py-3 transition-colors bg-[#2b7fff4f] hover:bg-[#1447e64f]";

        openModal(document.getElementById('modal-country-name').textContent, document.getElementById('modal-country-name').name);

        getCountries();

        document.getElementById('checkmark').classList.remove("opacity-0");
        document.getElementById('checkmark').classList.add("opacity-100");
    });

    document.getElementById('visit-button').addEventListener('click', () => {
        openModal(document.getElementById('country-name').textContent, document.getElementById('country-name').name);
    });

    document.getElementById('visited-countries-checkbox').addEventListener('change', search);

    // addCountries();

    // openCountry("France", "fr");
});