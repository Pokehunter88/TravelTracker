const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const exportDataEl = document.getElementById('export-data');
const importDataEl = document.getElementById('import-data');
const exportMessageEl = document.getElementById('export-message');
const importMessageEl = document.getElementById('import-message');

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
            const json = JSON.parse(importData);

            if (json.countryVisits === undefined || json.countryWishlists === undefined) {
                showMessage(importMessageEl, 'Error importing data. Please make sure the data is has valid country data.', true);
                return;
            }

            localStorage.setItem('saveData', importData);
            showMessage(importMessageEl, 'Data imported successfully!');
        } catch (error) {
            showMessage(importMessageEl, 'Error importing data. Please make sure the data is a valid JSON string.', true);
        }
    }
});