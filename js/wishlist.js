document.addEventListener("DOMContentLoaded", async () => {
    const wishlistContainer = document.getElementById('wishlist-countries');
    let countryInfoMap = new Map();
    let map;
    let geoJsonLayer;
    let currentCountry = null;
    let visitedCountries = [];

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

        for (let i = 0; i < saveData.countryVisits.length; i++) {
            if (!visitedCountries.includes(saveData.countryVisits[i].country.toUpperCase())) {
                visitedCountries.push(saveData.countryVisits[i].country.toUpperCase());
            }
        }
    }

    function highlightCountry(countryCode) {
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
        newNode.addEventListener('click', () => highlightCountry(flag));
        wishlistContainer.append(newNode);
    }

    async function loadWishlist() {
        const saveData = getSaveData();
        const wishlist = saveData.countryWishlists.map(visit => visit.country).reduce(function (a, b) {
            if (a.indexOf(b) < 0) a.push(b);
            return a;
        }, []);

        if (wishlist.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "text-white text-center text-lg";
            emptyMessage.textContent = "Your wishlist is empty.";
            wishlistContainer.append(emptyMessage);
            return;
        }

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
                    name: countryName,
                    continent: columns[8].toLowerCase()
                });
            }
        });

        for (const countryCode in wishlist) {
            const countryData = countryInfoMap.get(wishlist[countryCode]);
            if (countryData) {
                createItem(countryData.name, wishlist[countryCode], countryData.continent, saveData.countryVisits.filter(visit => visit.country === wishlist[countryCode].toLowerCase()).length > 0);
            }
        }
    }

    function countryStyle(feature) {
        const isoCode = feature.properties["ISO_A2_EH"];
        const isVisited = visitedCountries.includes(isoCode.toUpperCase());
        const isCurrent = currentCountry === isoCode.toLowerCase();
        const isWishlisted = getSaveData().countryWishlists.map(visit => visit.country).includes(isoCode.toLowerCase());

        let color = '#2e363e';
        let weight = 1;

        // if (isVisited) {
        //     color = '#0ea5e9'; // visited
        //     weight = 2;
        // }
        if (isWishlisted) {
            color = '#FFFFFF'; // selected
            weight = 2;
        }
        if (isCurrent) {
            color = '#00c951'; // wishlisted
            weight = 3;
        }

        return {
            fillColor: color,
            weight: weight,
            color: color,
            fillOpacity: 1
        };
    }

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
                }).addTo(map);
            });
    }

    getCountries();
    loadWishlist();
    initMap();
});