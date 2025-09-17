const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const exportDataEl = document.getElementById('export-data');
const importDataEl = document.getElementById('import-data');
const exportMessageEl = document.getElementById('export-message');
const importMessageEl = document.getElementById('import-message');
const importConfirmModal = document.getElementById('import-confirm-modal');
const cancelImportBtn = document.getElementById('cancel-import-btn');
const overwriteImportBtn = document.getElementById('overwrite-import-btn');
const mergeImportBtn = document.getElementById('merge-import-btn');

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.className = isError ? 'text-red-500' : 'text-green-500';
    setTimeout(() => {
        element.textContent = '';
    }, 3000);
}

exportBtn.addEventListener('click', () => {
    const data = localStorage.getItem('saveData');
    if (data) {
        exportDataEl.value = data;
        exportDataEl.select();

        navigator.clipboard.writeText(data).then(() => {
            showMessage(exportMessageEl, 'Data copied to clipboard!');
        }, () => {
            console.error('Failed to copy');
        });
    } else {
        showMessage(exportMessageEl, 'No data to export.', true);
    }
});

importBtn.addEventListener('click', () => {
    const importData = importDataEl.value;
    if (importData) {
        try {
            // Test if the imported data is valid JSON
            JSON.parse(importData);
            importConfirmModal.classList.remove('hidden');
        } catch (error) {
            showMessage(importMessageEl, 'Error importing data. Please make sure the data is a valid JSON string.', true);
        }
    }
});

cancelImportBtn.addEventListener('click', () => {
    importConfirmModal.classList.add('hidden');
});

overwriteImportBtn.addEventListener('click', () => {
    const importData = importDataEl.value;
    try {
        const json = JSON.parse(importData);
        if (json.countryVisits === undefined || json.countryWishlists === undefined) {
            showMessage(importMessageEl, 'Error importing data. Please make sure the data has valid country data.', true);
            return;
        }
        localStorage.setItem('saveData', importData);
        showMessage(importMessageEl, 'Data imported successfully!');
        importConfirmModal.classList.add('hidden');
    } catch (error) {
        showMessage(importMessageEl, 'Error importing data. Please make sure the data is a valid JSON string.', true);
    }
});

mergeImportBtn.addEventListener('click', () => {
    const importDataRaw = importDataEl.value;
    try {
        const importData = JSON.parse(importDataRaw);
        if (importData.countryVisits === undefined || importData.countryWishlists === undefined) {
            showMessage(importMessageEl, 'Error importing data. Please make sure the data has valid country data.', true);
            return;
        }

        const existingDataRaw = localStorage.getItem('saveData');
        if (!existingDataRaw) {
            // If no existing data, merge is the same as overwrite
            localStorage.setItem('saveData', importDataRaw);
            showMessage(importMessageEl, 'Data imported successfully!');
            importConfirmModal.classList.add('hidden');
            return;
        }

        const existingData = JSON.parse(existingDataRaw);

        const merger = (arr) => {
            const unique = new Map();
            for (const item of arr) {
                const key = JSON.stringify(item);
                if (!unique.has(key)) {
                    unique.set(key, item);
                }
            }
            return Array.from(unique.values());
        }

        // Merge countryVisits
        existingData.countryVisits = merger([...existingData.countryVisits, ...importData.countryVisits]);

        // Merge countryWishlists
        existingData.countryWishlists = merger([...existingData.countryWishlists, ...importData.countryWishlists]);

        localStorage.setItem('saveData', JSON.stringify(existingData));
        showMessage(importMessageEl, 'Data merged successfully!');
        importConfirmModal.classList.add('hidden');

    } catch (error) {
        showMessage(importMessageEl, 'Error merging data. Please make sure the data is a valid JSON string.', true);
    }
});